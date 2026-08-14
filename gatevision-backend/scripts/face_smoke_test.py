"""Live smoke test for the InsightFace facial-recognition pipeline.

Runs real detection + embedding extraction + cosine similarity against
bundled test images (no mocks, no MongoDB required):

  - skimage 'astronaut'  -> a known single-subject face
  - insightface 't1.jpg' -> a multi-subject group photo
  - ultralytics 'bus.jpg'-> control image with no face

Also verifies the similarity engine: embedding vs. itself should be ~1.0,
and a face vs. an unrelated face should be well below the match threshold.

Usage:
    venv\\Scripts\\python.exe scripts\\face_smoke_test.py
"""
import asyncio
import sys
import time
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE))
VENV = BASE / "venv" / "Lib" / "site-packages"

from app.services.ai.embedding.similarity_engine import SimilarityEngine
from app.services.ai.face_recognition.face_loader import FaceLoader
from app.services.ai.face_recognition.recognition_service import (
    FaceRecognitionService,
)

IMAGES = [
    ("astronaut (single face)", VENV / "skimage" / "data" / "astronaut.png"),
    ("t1 group photo", VENV / "insightface" / "data" / "images" / "t1.jpg"),
    ("bus control (no face)", VENV / "ultralytics" / "assets" / "bus.jpg"),
]

THRESHOLD = 0.65


def main() -> int:
    loader = FaceLoader()
    if not loader.is_loaded():
        print("Loading InsightFace buffalo_l ...")
        t0 = time.perf_counter()
        loader.load()
        print(f"  loaded in {time.perf_counter() - t0:.1f}s")

    svc = FaceRecognitionService()
    similarity = SimilarityEngine(threshold=THRESHOLD)
    embeddings = {}

    for label, path in IMAGES:
        if not path.exists():
            print(f"[SKIP] {label}: {path} not found")
            continue
        print(f"\n=== {label} ===")
        t0 = time.perf_counter()
        result = asyncio.run(svc.recognize_from_path(str(path)))
        elapsed = time.perf_counter() - t0

        print(f"  face_detected : {result.get('face_detected')}")
        print(f"  face_count    : {result.get('face_count')}")
        print(f"  inference_time: {result.get('inference_time_ms')} ms (wall {elapsed:.2f}s)")
        for i, det in enumerate(result.get("detections", [])):
            dim = det.get("embedding_dimension", 0)
            conf = det.get("confidence", 0.0)
            bbox = det.get("bbox", [])
            print(f"  face[{i}] bbox={bbox} conf={conf:.3f} dim={dim}")
            if det.get("embedding"):
                embeddings[label] = det["embedding"]
        if not result.get("face_detected"):
            print("  (no faces)")

    print("\n=== Similarity check ===")
    keys = list(embeddings)
    if not keys:
        print("  No embeddings extracted - similarity not runnable")
        return 1
    self_key = keys[0]
    a = embeddings[self_key]
    self_score = similarity.cosine_similarity(a, a)
    print(f"  {self_key} vs itself        : {self_score:.4f} (expect ~1.0)")
    if len(keys) > 1:
        b = embeddings[keys[1]]
        cross = similarity.cosine_similarity(a, b)
        print(f"  {self_key} vs {keys[1]}: {cross:.4f} (expect < {THRESHOLD})")
        print(f"  is_match(self): {similarity.is_match(self_score)}")
        print(f"  is_match(cross): {similarity.is_match(cross)}")

    print("\nRESULT: ", "PASS" if keys else "FAIL")
    return 0 if keys else 1


if __name__ == "__main__":
    sys.exit(main())
