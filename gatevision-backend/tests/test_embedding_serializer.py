from app.services.ai.embedding.embedding_serializer import EmbeddingSerializer

ser = EmbeddingSerializer()


def test_to_from_bytes():
    emb = [0.12345678, -0.23456789, 0.34567891]
    data = ser.to_bytes(emb)
    recovered = ser.from_bytes(data)
    assert len(recovered) == len(emb)
    for a, b in zip(emb, recovered):
        assert abs(a - b) < 1e-6


def test_to_db_rounding():
    emb = [0.123456789, 0.987654321]
    db = ser.to_db(emb)
    assert db == [0.12345679, 0.98765432]


def test_from_db_passthrough():
    emb = [0.1, 0.2, 0.3]
    assert ser.from_db(emb) == emb


def test_from_db_none():
    assert ser.from_db(None) is None


def test_dimension():
    assert ser.dimension([1.0, 2.0, 3.0]) == 3
