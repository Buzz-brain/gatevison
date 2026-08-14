"""Pipeline benchmark: build a synthetic entry/exit dataset and measure the real pipeline.

Measures, per run: recognition accuracy, decision accuracy, average processing
time and failure rate, then writes a summary report (JSON + Markdown) to
reports/.

Usage (from gatevision-backend):
    venv\\Scripts\\python.exe scripts\\benchmark_pipeline.py                # 100 entry + 100 exit
    venv\\Scripts\\python.exe scripts\\benchmark_pipeline.py --limit 2     # quick smoke run
    venv\\Scripts\\python.exe scripts\\benchmark_pipeline.py --generate-only
    venv\\Scripts\\python.exe scripts\\benchmark_pipeline.py --images-dir uploads/plates

Note: a full 200-image run uses the real YOLO + EasyOCR models on CPU and can
take a long time. Use --limit for a fast check during development.
"""
import argparse
import asyncio
import json
import random
import statistics
import string
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import cv2
import numpy as np

from app.database.connection import init_database, close_database
from app.services.ai.warmup import warm_up_models
from app.services.ai.orchestrator.orchestrator import PipelineOrchestrator

REPORTS_DIR = Path("reports")


def _random_plate(rng: random.Random) -> str:
    letters = "".join(rng.choice(string.ascii_uppercase) for _ in range(3))
    digits = "".join(rng.choice(string.digits) for _ in range(3))
    tail = "".join(rng.choice(string.ascii_uppercase) for _ in range(2))
    return f"{letters}{digits}{tail}"


def _make_plate_image(
    plate_text: str,
    rng: random.Random,
    width: int = 640,
    height: int = 480,
    blur: bool = False,
    no_plate: bool = False,
) -> np.ndarray:
    """Synthetic, plate-like image for benchmarking (road + parked car + plate)."""
    img = np.full((height, width, 3), 170, np.uint8)
    img[int(height * 0.6):, :] = 120  # road below the horizon
    img[: int(height * 0.6), :] = 150  # sky/background

    # Body of the "vehicle": a solid rectangle.
    body_w = int(width * 0.7)
    body_h = int(height * 0.3)
    body_x = int((width - body_w) / 2) + rng.randint(-30, 30)
    body_y = int(height * 0.32)
    color = (
        rng.randint(0, 60),
        rng.randint(0, 60),
        rng.randint(0, 60),
    )
    cv2.rectangle(img, (body_x, body_y), (body_x + body_w, body_y + body_h), color, -1)

    if no_plate:
        return img

    # License plate: dark rectangle with a light frame, white text.
    pw, ph = int(width * 0.32), int(height * 0.13)
    px = body_x + rng.randint(0, max(1, body_w - pw))
    py = body_y + int(body_h * 0.72)
    cv2.rectangle(img, (px, py), (px + pw, py + ph), (230, 230, 230), 2)
    cv2.rectangle(img, (px, py), (px + pw, py + ph), (15, 20, 40), -1)
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = max(0.5, ph / 46.0)
    text_w = cv2.getTextSize(plate_text, font, font_scale, 2)[0][0]
    tx = px + int((pw - text_w) / 2)
    ty = py + int(ph / 2) + 12
    cv2.putText(img, plate_text, (tx, ty), font, font_scale, (255, 255, 255), 2, cv2.LINE_AA)

    # Blur the whole frame to simulate an unreadable capture.
    if blur:
        img = cv2.GaussianBlur(img, (21, 21), 0)
    return img


def generate_dataset(directory: Path, entry: int, exit_: int, seed: int) -> None:
    rng = random.Random(seed)
    directory.mkdir(parents=True, exist_ok=True)
    for direction, count in (("entry", entry), ("exit", exit_)):
        for i in range(count):
            kind = rng.random()
            if kind < 0.08:
                plate_text = ""
                blur, no_plate = False, True
            elif kind < 0.16:
                plate_text = _random_plate(rng)
                blur, no_plate = True, False
            else:
                plate_text = _random_plate(rng)
                blur, no_plate = False, False
            img = _make_plate_image(plate_text, rng, blur=blur, no_plate=no_plate)
            name = f"{direction}_{i:03d}{'_blur' if blur else ''}{'_noplate' if no_plate else ''}.jpg"
            cv2.imwrite(str(directory / name), img)
    print(f"Dataset generated: {directory} ({entry} entry, {exit_} exit images)")


def _normalize(text: str) -> str:
    return "".join(ch for ch in (text or "").upper() if ch.isalnum())


async def benchmark() -> dict:
    parser = argparse.ArgumentParser()
    parser.add_argument("--entry", type=int, default=100)
    parser.add_argument("--exit", type=int, default=100)
    parser.add_argument("--limit", type=int, default=0,
                        help="Cap runs per direction (0 = all)")
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--generate-only", action="store_true")
    parser.add_argument("--images-dir", default=None,
                        help="Use real images instead of a synthetic dataset")
    parser.add_argument("--dataset-dir", default="data/benchmark")
    parser.add_argument("--out", default="reports/pipeline_benchmark")
    args = parser.parse_args()

    await init_database()
    warmup = warm_up_models()

    dataset_dir = Path(args.dataset_dir)
    images_dir = Path(args.images_dir) if args.images_dir else dataset_dir
    ground_truth: dict[str, str] = {}
    if args.images_dir:
        images = sorted(images_dir.glob("*.jpg")) + sorted(images_dir.glob("*.jpeg")) + sorted(images_dir.glob("*.png"))
    else:
        generate_dataset(dataset_dir, args.entry, args.exit, args.seed)
        images = sorted(dataset_dir.glob("*.jpg"))
        for p in images:
            stem = p.stem.replace("_blur", "").replace("_noplate", "")
            parts = stem.split("_")
            ground_truth[p.name] = parts[2] if len(parts) >= 3 and parts[2] != "" else ""

    if args.generate_only:
        print("Dataset generated; run without --generate-only to benchmark.")
        return {}

    if args.limit:
        images = images[: args.limit]

    orch = PipelineOrchestrator()
    runs: list[dict] = []
    stage_accum: dict[str, list[float]] = {}
    failures = 0

    for direction in ("entry", "exit"):
        for img in images:
            data = img.read_bytes()
            gt = ground_truth.get(img.name, "")
            start = time.perf_counter()
            try:
                result = await orch.execute_from_upload(data, direction=direction)
            except Exception as exc:
                failures += 1
                runs.append({
                    "direction": direction,
                    "image": img.name,
                    "exception": type(exc).__name__,
                    "total_ms": None,
                })
                continue
            wall_ms = (time.perf_counter() - start) * 1000
            recognized = [r.get("plate", "") for r in result.recognized_plates]
            run = {
                "direction": direction,
                "image": img.name,
                "ground_truth": gt,
                "success": result.success,
                "total_ms": round(result.total_processing_time, 2),
                "wall_ms": round(wall_ms, 2),
                "plates_detected": len(result.detected_plates),
                "plates_recognized": len(recognized),
                "recognized": recognized,
                "decision": (result.decision or {}).get("decision", "NONE"),
                "gate_success": (result.gate_workflow_result or {}).get("success"),
                "stage_results": {
                    s.stage_name: {"ok": s.success, "ms": round(s.duration_ms, 2), "error": s.error}
                    for s in result.stage_results
                },
            }
            runs.append(run)
            for s in result.stage_results:
                stage_accum.setdefault(s.stage_name, []).append(s.duration_ms)

    # Failure modes: corrupt and empty uploads must fail gracefully (no 500).
    failure_modes = {}
    for name, payload in (("corrupt", b"\x00\x01\x02notanimage"), ("empty", b"")):
        try:
            await orch.execute_from_upload(payload)
            failure_modes[name] = {"graceful": False, "detail": "no error raised"}
        except Exception as exc:
            failure_modes[name] = {"graceful": True, "detail": type(exc).__name__}

    processed = [r for r in runs if "total_ms" in r]
    total_times = [r["total_ms"] for r in processed]
    with_gt = [r for r in processed if r.get("ground_truth")]
    recognition_hits = sum(
        1 for r in with_gt
        if any(_normalize(p) == _normalize(r["ground_truth"]) for p in r.get("recognized", []))
    )
    decision_hits = sum(
        1 for r in processed
        if r.get("plates_recognized", 0) > 0 and r.get("decision") == "GRANT"
    )
    decisionable = sum(1 for r in processed if r.get("plates_recognized", 0) > 0)

    stage_summary = {
        stage: {
            "avg_ms": round(statistics.mean(vals), 2),
            "max_ms": round(max(vals), 2),
            "calls": len(vals),
        }
        for stage, vals in sorted(stage_accum.items())
    }

    report = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "warmup": warmup,
        "dataset": {
            "entry_count": args.entry,
            "exit_count": args.exit,
            "limit": args.limit,
            "images_dir": str(images_dir),
            "seed": args.seed,
        },
        "summary": {
            "run_count": len(processed),
            "avg_total_ms": round(statistics.mean(total_times), 2) if total_times else None,
            "max_total_ms": round(max(total_times), 2) if total_times else None,
            "recognition_accuracy": round(recognition_hits / len(with_gt), 4) if with_gt else None,
            "decision_accuracy": round(decision_hits / decisionable, 4) if decisionable else None,
            "failure_rate": round(failures / (failures + len(processed)), 4) if (failures + len(processed)) else None,
            "success_count": sum(1 for r in processed if r["success"]),
            "stage_averages": stage_summary,
        },
        "failure_modes": failure_modes,
        "runs": runs,
    }

    out_base = Path(args.out)
    out_base.parent.mkdir(exist_ok=True)
    (out_base.with_suffix(".json")).write_text(json.dumps(report, indent=2))
    _write_markdown(report, out_base.with_suffix(".md"))

    print(f"Runs: {len(processed)}  Failures: {failures}")
    if total_times:
        print(f"Avg total: {report['summary']['avg_total_ms']}ms  Max: {report['summary']['max_total_ms']}ms")
    print(f"Recognition accuracy: {report['summary']['recognition_accuracy']}")
    print(f"Decision accuracy:    {report['summary']['decision_accuracy']}")
    print(f"Failure rate:         {report['summary']['failure_rate']}")
    for stage, stats_ in stage_summary.items():
        print(f"  {stage:32s} avg={stats_['avg_ms']:9.2f}ms max={stats_['max_ms']:9.2f}ms n={stats_['calls']}")
    print("Failure modes:", json.dumps(failure_modes))
    print("Reports written to", out_base.with_suffix(".json").resolve(), "+ .md")

    await close_database()
    return report


def _write_markdown(report: dict, out: Path) -> None:
    s = report["summary"]
    lines = [
        "# GateVision Pipeline Benchmark",
        "",
        f"- Generated: {report['generated_at']}",
        f"- Dataset: {report['dataset']['entry_count']} entry / {report['dataset']['exit_count']} exit"
        f" (limit {report['dataset']['limit'] or 'all'})",
        f"- Images: {report['dataset']['images_dir']}",
        "",
        "## Summary",
        "",
        f"| Metric | Value |",
        "| --- | --- |",
        f"| Runs | {s['run_count']} |",
        f"| Avg processing time | {s['avg_total_ms']} ms |",
        f"| Max processing time | {s['max_total_ms']} ms |",
        f"| Recognition accuracy | {s['recognition_accuracy']} |",
        f"| Decision accuracy | {s['decision_accuracy']} |",
        f"| Failure rate | {s['failure_rate']} |",
        f"| Successful runs | {s['success_count']} |",
        "",
        "## Stage Averages",
        "",
        "| Stage | Avg (ms) | Max (ms) | Calls |",
        "| --- | --- | --- | --- |",
    ]
    for stage, st in s["stage_averages"].items():
        lines.append(f"| {stage} | {st['avg_ms']} | {st['max_ms']} | {st['calls']} |")

    lines += ["", "## Failure Modes", "", "| Case | Graceful | Detail |", "| --- | --- | --- |"]
    for name, fm in report["failure_modes"].items():
        lines.append(f"| {name} | {fm['graceful']} | {fm['detail']} |")

    lines += ["", "## Runs", "", "| Direction | Image | GT | Detected | Recognized | Total (ms) | Decision |", "| --- | --- | --- | --- | --- | --- | --- |"]
    for r in report["runs"]:
        if "total_ms" not in r:
            lines.append(f"| {r['direction']} | {r['image']} | - | - | - | EXC {r['exception']} | - |")
            continue
        lines.append(
            f"| {r['direction']} | {r['image']} | {r['ground_truth'] or '-'} | "
            f"{r['plates_detected']} | {','.join(r['recognized']) or '-'} | "
            f"{r['total_ms']} | {r['decision']} |"
        )
    out.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(benchmark())
