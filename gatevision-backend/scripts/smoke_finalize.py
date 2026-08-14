"""Live smoke test for the two-phase Live Gate `finalize` contract.

Verifies against a running backend (default port 8001) that:
  1. Phase A (vehicle-only, finalize=false) returns a decision but creates NO
     gate workflow result and NO decision record / session / transaction.
  2. Phase B (combined vehicle+face, finalize=true) returns a gate workflow
     result and exactly ONE persisted decision record (+1 session/txn when
     the decision is GRANT).
  3. The API response leaks no 512-dim face embeddings (face_recognitions
     entries and decision evidence metadata carry no `detections`/`embedding`).

Usage:
    venv\\Scripts\\python.exe scripts\\smoke_finalize.py [port]
"""

import sys
import time
from pathlib import Path

import requests

BASE_DIR = Path(__file__).resolve().parent.parent

FAILURES: list[str] = []
BASE = ""


def main(port: int | None = None) -> int:
    global BASE
    port = port if port is not None else (int(sys.argv[1]) if len(sys.argv) > 1 else 8001)
    BASE = f"http://127.0.0.1:{port}/api/v1"
    run()
    if FAILURES:
        print(f"SMOKE FAILED: {len(FAILURES)} check(s): {FAILURES}")
        return 1
    print("SMOKE PASSED: two-phase finalize contract verified")
    return 0


def check(name: str, cond: bool, detail: str = "") -> None:
    tag = "PASS" if cond else "FAIL"
    print(f"  [{tag}] {name}" + (f"  ({detail})" if detail else ""))
    if not cond:
        FAILURES.append(name)


def wait_healthy(timeout: float = 180.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            r = requests.get(f"{BASE}/system/health", timeout=5)
            if r.status_code == 200:
                print(f"backend healthy after {timeout - (deadline - time.time()):.0f}s")
                return
        except requests.RequestException:
            pass
        time.sleep(2)
    raise SystemExit("backend never became healthy")


def run_phase(name: str, files: list[tuple[str, Path]], query: dict) -> dict:
    payload = []
    for key, path in files:
        payload.append((key, (path.name, path.open("rb"), "image/jpeg")))
    t0 = time.time()
    r = requests.post(f"{BASE}/pipeline/process/upload", files=payload, params=query, timeout=300)
    dt = time.time() - t0
    body = r.json()
    data = body.get("data", {}) or {}
    stages = [s.get("stage_name") for s in (data.get("stage_results") or [])]
    print(
        f"[{name}] http={r.status_code} in {dt:.1f}s "
        f"success={body.get('success')} decision={data.get('decision')} "
        f"gate_wf={'yes' if data.get('gate_workflow_result') else 'NO'} "
        f"faces={len(data.get('face_recognitions') or [])} stages={stages}"
    )
    return data


def assert_no_embedding_leak(data: dict, name: str) -> None:
    leaked = []
    for i, f in enumerate(data.get("face_recognitions") or []):
        if "detections" in f or "embedding" in f:
            leaked.append(f"face_recognitions[{i}]")
    for i, ev in enumerate(data.get("decision", {}).get("evidence") or []):
        if isinstance(ev, dict) and ev.get("module_name") == "face_recognition":
            meta = ev.get("metadata") or {}
            if "detections" in meta or "embedding" in meta:
                leaked.append(f"decision.evidence[{i}].metadata")
    check(f"{name}: no embedding leak", not leaked, ", ".join(leaked))


def make_plate_frame(plate_text: str = "APP971KS", path: Path | None = None) -> Path:
    """Synthetic road + parked-car + plate frame (mirrors benchmark_pipeline)."""
    import cv2
    import numpy as np

    width, height = 640, 480
    img = np.full((height, width, 3), 170, np.uint8)
    img[int(height * 0.6):, :] = 120
    img[: int(height * 0.6), :] = 150
    body_w, body_h = int(width * 0.7), int(height * 0.3)
    body_x, body_y = int((width - body_w) / 2), int(height * 0.32)
    cv2.rectangle(img, (body_x, body_y), (body_x + body_w, body_y + body_h), (30, 30, 30), -1)
    pw, ph = int(width * 0.32), int(height * 0.13)
    px = body_x + 10
    py = body_y + int(body_h * 0.72)
    cv2.rectangle(img, (px, py), (px + pw, py + ph), (15, 20, 40), -1)
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = max(0.5, ph / 46.0)
    text_w = cv2.getTextSize(plate_text, font, font_scale, 2)[0][0]
    tx = px + int((pw - text_w) / 2)
    ty = py + int(ph / 2) + 12
    cv2.putText(img, plate_text, (tx, ty), font, font_scale, (255, 255, 255), 2, cv2.LINE_AA)
    out = path or (BASE_DIR / "scripts" / "smoke_vehicle.jpg")
    cv2.imwrite(str(out), img)
    return out


def run() -> None:
    bus = make_plate_frame()
    astronaut = BASE_DIR / "venv" / "Lib" / "site-packages" / "skimage" / "data" / "astronaut.png"
    zidane = BASE_DIR / "venv" / "Lib" / "site-packages" / "ultralytics" / "assets" / "zidane.jpg"

    wait_healthy()
    from pymongo import MongoClient

    mongo = MongoClient("mongodb://localhost:27017")
    db = mongo["gatevision_smoke"]
    for coll in ("decision_records", "gate_sessions", "gate_transactions"):
        db[coll].delete_many({})

    def counts() -> dict:
        return {c: db[c].count_documents({}) for c in ("decision_records", "gate_sessions", "gate_transactions")}

    before = counts()
    print("baseline counts:", before)

    # Phase A: vehicle-only pre-check, finalize=false
    phase_a = run_phase(
        "phase A finalize=false",
        [("file", bus)],
        {"camera_id": "smoke_cam", "direction": "entry", "require_face": "false", "finalize": "false"},
    )
    check("phase A returns a decision", bool(phase_a.get("decision")))
    check("phase A has NO gate workflow result", phase_a.get("gate_workflow_result") is None)
    check("phase A persists nothing", counts() == before, counts())
    assert_no_embedding_leak(phase_a, "phase A")

    # Phase B: combined vehicle+face, finalize=true
    phase_b = run_phase(
        "phase B finalize=true (car+face)",
        [("file", bus), ("face_file", astronaut)],
        {"camera_id": "smoke_cam", "direction": "entry", "require_face": "true", "finalize": "true"},
    )
    check("phase B returns a decision", bool(phase_b.get("decision")))
    check("phase B has a gate workflow result", phase_b.get("gate_workflow_result") is not None)
    after = counts()
    check("phase B persists exactly ONE decision", after["decision_records"] == before["decision_records"] + 1, after)
    if phase_b.get("decision") == "GRANT":
        check("phase B GRANT creates exactly ONE session", after["gate_sessions"] == before["gate_sessions"] + 1, after)
        check("phase B GRANT creates exactly ONE transaction", after["gate_transactions"] == before["gate_transactions"] + 1, after)
    else:
        print(f"  (note) phase B decision={phase_b.get('decision')} -> sessions/transactions not asserted, counts: {after}")
    assert_no_embedding_leak(phase_b, "phase B")

    # Repeated finalize=false pre-check must remain side-effect-free
    run_phase(
        "phase A repeat finalize=false",
        [("file", bus)],
        {"camera_id": "smoke_cam", "direction": "entry", "require_face": "false", "finalize": "false"},
    )
    check("repeat pre-check persists nothing", counts() == after, counts())

    def active_count() -> int:
        return db["gate_sessions"].count_documents({"current_state": "INSIDE"})

    # Phase C: exit the same car with a DIFFERENT face -> must be rejected and
    # the entry session must stay open (the bug the user reported).
    phase_c = run_phase(
        "phase C exit different face (finalize=true)",
        [("file", bus), ("face_file", zidane)],
        {"camera_id": "smoke_cam", "direction": "exit", "require_face": "true", "finalize": "true"},
    )
    wf_c = phase_c.get("gate_workflow_result") or {}
    check("phase C returns a decision", bool(phase_c.get("decision")))
    check("phase C gate workflow REJECTED", wf_c.get("success") is False, str(wf_c.get("error")))
    check("phase C error mentions face mismatch", "Face" in str(wf_c.get("error", "")), str(wf_c.get("error")))
    check("phase C keeps the entry session open", active_count() == 1, active_count())
    assert_no_embedding_leak(phase_c, "phase C")

    # Phase D: exit the same car with the SAME face -> session closes.
    phase_d = run_phase(
        "phase D exit same face (finalize=true)",
        [("file", bus), ("face_file", astronaut)],
        {"camera_id": "smoke_cam", "direction": "exit", "require_face": "true", "finalize": "true"},
    )
    wf_d = phase_d.get("gate_workflow_result") or {}
    check("phase D gate workflow SUCCEEDS", wf_d.get("success") is True, str(wf_d.get("message")))
    check("phase D closes the entry session", active_count() == 0, active_count())
    assert_no_embedding_leak(phase_d, "phase D")


if __name__ == "__main__":
    raise SystemExit(main())
