from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from app.services.ai.face_recognition.recognition_service import (
    FaceRecognitionService,
)


@pytest.fixture
def sample_frame():
    return np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)


@pytest.fixture
def mock_detector():
    det = MagicMock()
    det.detect.return_value = [
        {
            "bbox": [10, 10, 60, 60],
            "confidence": 0.95,
            "landmarks": [[15, 20], [55, 20], [35, 30], [20, 45], [50, 45]],
            "cropped_face_path": "/tmp/face.jpg",
        }
    ]
    return det


@pytest.fixture
def mock_aligner():
    alg = MagicMock()
    alg.align.return_value = np.random.randint(0, 255, (112, 112, 3), dtype=np.uint8)
    return alg


@pytest.fixture
def mock_embedding_svc():
    emb = MagicMock()
    emb.extract.return_value = {
        "embedding": [0.1] * 512,
        "dimension": 512,
        "inference_time_ms": 25.0,
        "detection_confidence": 0.95,
    }
    emb.dimension = 512
    return emb


@pytest.fixture
def mock_repo():
    repo = MagicMock()
    repo.create = AsyncMock()
    repo.create.return_value = MagicMock()
    repo.get_recent = AsyncMock()
    repo.get_recent.return_value = []
    return repo


@pytest.mark.asyncio
async def test_recognize_no_face(mock_detector, mock_aligner, mock_embedding_svc, mock_repo):
    mock_detector.detect.return_value = []
    svc = FaceRecognitionService(
        detector=mock_detector,
        aligner=mock_aligner,
        embedding_service=mock_embedding_svc,
        repository=mock_repo,
    )
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    result = await svc.recognize_from_image(frame)
    assert result["face_detected"] is False
    assert result["face_count"] == 0


@pytest.mark.asyncio
async def test_recognize_success(
    mock_detector, mock_aligner, mock_embedding_svc, mock_repo, sample_frame,
):
    svc = FaceRecognitionService(
        detector=mock_detector,
        aligner=mock_aligner,
        embedding_service=mock_embedding_svc,
        repository=mock_repo,
    )
    result = await svc.recognize_from_image(sample_frame)
    assert result["face_detected"] is True
    assert result["face_count"] == 1
    assert len(result["detections"]) == 1
    assert result["detections"][0]["confidence"] == 0.95
    assert result["detections"][0]["bbox"] == [10, 10, 60, 60]
    assert result["detections"][0]["landmarks"] == [
        [15, 20], [55, 20], [35, 30], [20, 45], [50, 45],
    ]


@pytest.mark.asyncio
async def test_recognize_with_reference(
    mock_detector, mock_aligner, mock_embedding_svc, mock_repo, sample_frame,
):
    svc = FaceRecognitionService(
        detector=mock_detector,
        aligner=mock_aligner,
        embedding_service=mock_embedding_svc,
        repository=mock_repo,
    )
    ref_emb = [0.1] * 512
    result = await svc.recognize_from_image(sample_frame, reference_embedding=ref_emb)
    assert result["matched"] is True  # identical embeddings → 1.0 similarity ≥ 0.65


@pytest.mark.asyncio
async def test_recognize_from_bytes(
    mock_detector, mock_aligner, mock_embedding_svc, mock_repo, sample_frame,
):
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        svc = FaceRecognitionService(
            detector=mock_detector,
            aligner=mock_aligner,
            embedding_service=mock_embedding_svc,
            repository=mock_repo,
        )
        result = await svc.recognize_from_bytes(b"fake_image")
        assert result["face_detected"] is True


@pytest.mark.asyncio
async def test_recognize_from_bytes_invalid(
    mock_detector, mock_aligner, mock_embedding_svc, mock_repo,
):
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=None,
    ):
        svc = FaceRecognitionService(
            detector=mock_detector,
            aligner=mock_aligner,
            embedding_service=mock_embedding_svc,
            repository=mock_repo,
        )
        result = await svc.recognize_from_bytes(b"bad")
        assert result["face_detected"] is False


@pytest.mark.asyncio
async def test_compare_embeddings_cosine(
    mock_detector, mock_aligner, mock_embedding_svc, mock_repo,
):
    svc = FaceRecognitionService(
        detector=mock_detector,
        aligner=mock_aligner,
        embedding_service=mock_embedding_svc,
        repository=mock_repo,
    )
    emb_a = [0.5, 0.3, 0.7]
    emb_b = [0.5, 0.3, 0.7]
    result = await svc.compare_embeddings(emb_a, emb_b, metric="cosine")
    assert result["is_match"] is True
    assert pytest.approx(result["similarity_score"], 0.001) == 1.0


@pytest.mark.asyncio
async def test_compare_embeddings_euclidean(
    mock_detector, mock_aligner, mock_embedding_svc, mock_repo,
):
    svc = FaceRecognitionService(
        detector=mock_detector,
        aligner=mock_aligner,
        embedding_service=mock_embedding_svc,
        repository=mock_repo,
    )
    emb_a = [1.0, 0.0]
    emb_b = [1.0, 0.0]
    result = await svc.compare_embeddings(emb_a, emb_b, metric="euclidean")
    assert result["is_match"] is True


@pytest.mark.asyncio
async def test_compare_embeddings_invalid_metric(
    mock_detector, mock_aligner, mock_embedding_svc, mock_repo,
):
    svc = FaceRecognitionService(
        detector=mock_detector,
        aligner=mock_aligner,
        embedding_service=mock_embedding_svc,
        repository=mock_repo,
    )
    with pytest.raises(ValueError):
        await svc.compare_embeddings([0.1], [0.2], metric="unknown")


@pytest.mark.asyncio
async def test_get_history(mock_detector, mock_aligner, mock_embedding_svc, mock_repo):
    from datetime import datetime, timezone
    mock_record = MagicMock()
    mock_record.id = "rec1"
    mock_record.detection_confidence = 0.95
    mock_record.similarity_score = 0.85
    mock_record.matched = True
    mock_record.inference_time = 25.0
    mock_record.created_at = datetime.now(timezone.utc)
    mock_repo.get_recent.return_value = [mock_record]

    svc = FaceRecognitionService(
        detector=mock_detector,
        aligner=mock_aligner,
        embedding_service=mock_embedding_svc,
        repository=mock_repo,
    )
    history = await svc.get_history()
    assert len(history) == 1
    assert history[0]["id"] == "rec1"
