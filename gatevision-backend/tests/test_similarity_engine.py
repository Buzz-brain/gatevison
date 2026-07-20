import pytest

from app.services.ai.embedding.similarity_engine import SimilarityEngine


def test_cosine_identical():
    score = SimilarityEngine.cosine_similarity([0.5, 0.3, 0.7], [0.5, 0.3, 0.7])
    assert pytest.approx(score, 0.001) == 1.0


def test_cosine_orthogonal():
    score = SimilarityEngine.cosine_similarity([1.0, 0.0], [0.0, 1.0])
    assert pytest.approx(score, 0.001) == 0.0


def test_cosine_zero_norm():
    score = SimilarityEngine.cosine_similarity([0.0, 0.0], [1.0, 0.0])
    assert score == 0.0


def test_euclidean():
    dist = SimilarityEngine.euclidean_distance([0.0, 0.0], [3.0, 4.0])
    assert pytest.approx(dist, 0.001) == 5.0


def test_is_match_default():
    engine = SimilarityEngine()
    assert engine.is_match(0.5) is True


def test_is_match_threshold():
    engine = SimilarityEngine(threshold=0.7)
    assert engine.is_match(0.8) is True
    assert engine.is_match(0.6) is False


def test_threshold_setter():
    engine = SimilarityEngine(threshold=0.5)
    assert engine.threshold == 0.5
    engine.threshold = 0.8
    assert engine.threshold == 0.8


def test_top_k_cosine():
    engine = SimilarityEngine()
    query = [1.0, 0.0]
    candidates = [
        ("a", [1.0, 0.0]),
        ("b", [0.0, 1.0]),
        ("c", [0.707, 0.707]),
    ]
    results = engine.top_k(query, candidates, k=2, metric="cosine")
    assert len(results) == 2
    assert results[0]["id"] == "a"
    assert pytest.approx(results[0]["score"], 0.01) == 1.0


def test_top_k_euclidean():
    engine = SimilarityEngine()
    query = [0.0, 0.0]
    candidates = [
        ("a", [1.0, 1.0]),
        ("b", [10.0, 10.0]),
        ("c", [0.5, 0.5]),
    ]
    results = engine.top_k(query, candidates, k=2, metric="euclidean")
    assert len(results) == 2
    assert results[0]["id"] == "c"


def test_top_k_invalid_metric():
    engine = SimilarityEngine()
    with pytest.raises(ValueError):
        engine.top_k([0.0], [("a", [0.0])], metric="invalid")
