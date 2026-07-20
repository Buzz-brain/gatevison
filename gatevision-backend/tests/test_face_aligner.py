import numpy as np
import pytest

from app.services.ai.face_recognition.aligner import FaceAligner, FaceAlignmentError


def test_align_empty_image():
    aligner = FaceAligner()
    with pytest.raises(FaceAlignmentError):
        aligner.align(None, [[0, 0], [10, 0]])


def test_align_insufficient_landmarks():
    aligner = FaceAligner()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    with pytest.raises(FaceAlignmentError):
        aligner.align(frame, [[0, 0]])


def test_align_success():
    aligner = FaceAligner()
    frame = np.random.randint(0, 255, (200, 200, 3), dtype=np.uint8)
    landmarks = [[60, 100], [140, 100], [100, 130], [70, 150], [130, 150]]
    aligned = aligner.align(frame, landmarks)
    assert aligned.shape == (112, 112, 3)


def test_align_already_frontal():
    aligner = FaceAligner()
    frame = np.random.randint(0, 255, (200, 200, 3), dtype=np.uint8)
    landmarks = [[76, 96], [124, 96], [100, 120], [84, 136], [116, 136]]
    aligned = aligner.align(frame, landmarks)
    assert aligned.shape == (112, 112, 3)


def test_align_rotated_face():
    aligner = FaceAligner()
    frame = np.random.randint(0, 255, (200, 200, 3), dtype=np.uint8)
    landmarks = [[70, 110], [130, 90], [100, 120], [80, 140], [120, 130]]
    aligned = aligner.align(frame, landmarks)
    assert aligned.shape == (112, 112, 3)
