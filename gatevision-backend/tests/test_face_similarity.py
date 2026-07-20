import pytest

from app.services.ai.face_recognition.similarity import SimilarityService


@pytest.fixture
def svc():
    return SimilarityService(threshold=0.65)


def test_cosine_similarity_identical(svc):
    emb = [0.5, 0.3, 0.7, 0.1]
    score = svc.cosine_similarity(emb, emb)
    assert pytest.approx(score, 0.001) == 1.0


def test_cosine_similarity_orthogonal(svc):
    a = [1.0, 0.0]
    b = [0.0, 1.0]
    score = svc.cosine_similarity(a, b)
    assert pytest.approx(score, 0.001) == 0.0


def test_cosine_similarity_partial(svc):
    a = [1.0, 0.0]
    b = [1.0, 1.0]
    score = svc.cosine_similarity(a, b)
    expected = 1.0 / (1.0 * (2.0 ** 0.5))
    assert pytest.approx(score, 0.001) == expected


def test_cosine_similarity_zero_vector(svc):
    a = [0.0, 0.0]
    b = [1.0, 0.0]
    score = svc.cosine_similarity(a, b)
    assert score == 0.0


def test_euclidean_distance_identical(svc):
    emb = [0.5, 0.3, 0.7]
    dist = svc.euclidean_distance(emb, emb)
    assert pytest.approx(dist, 0.001) == 0.0


def test_euclidean_distance_different(svc):
    a = [0.0, 0.0]
    b = [3.0, 4.0]
    dist = svc.euclidean_distance(a, b)
    assert pytest.approx(dist, 0.001) == 5.0


def test_is_match_above_threshold(svc):
    assert svc.is_match(0.80) is True


def test_is_match_below_threshold(svc):
    assert svc.is_match(0.50) is False


def test_is_match_at_threshold(svc):
    assert svc.is_match(0.65) is True


def test_custom_threshold():
    svc = SimilarityService(threshold=0.90)
    assert svc.is_match(0.85) is False
    assert svc.is_match(0.95) is True
