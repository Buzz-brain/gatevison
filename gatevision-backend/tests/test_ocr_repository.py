from app.repositories.ocr_repository import OcrRepository


def test_ocr_repository_init():
    repo = OcrRepository()
    assert repo is not None
    assert hasattr(repo, "model")


def test_ocr_repository_inherits_crud():
    repo = OcrRepository()
    assert hasattr(repo, "create")
    assert hasattr(repo, "get_by_id")
    assert hasattr(repo, "get_all")
    assert hasattr(repo, "update")
    assert hasattr(repo, "delete")
    assert hasattr(repo, "count")


def test_ocr_repository_extra_methods():
    repo = OcrRepository()
    assert hasattr(repo, "create_from_ocr")
    assert hasattr(repo, "get_by_detection_id")
    assert hasattr(repo, "search_by_plate")
    assert hasattr(repo, "get_recent")
    assert hasattr(repo, "count_successful")
    assert hasattr(repo, "count_all")


def test_create_from_ocr_signature():
    repo = OcrRepository()
    import inspect
    sig = inspect.signature(repo.create_from_ocr)
    params = list(sig.parameters.keys())
    assert "raw_text" in params
    assert "cleaned_text" in params
    assert "confidence" in params
    assert "processing_time" in params
    assert "validation_status" in params
    assert "validation_message" in params
    assert "plate_detection_id" in params


def test_get_by_detection_id_signature():
    repo = OcrRepository()
    import inspect
    sig = inspect.signature(repo.get_by_detection_id)
    assert "detection_id" in sig.parameters


def test_search_by_plate_signature():
    repo = OcrRepository()
    import inspect
    sig = inspect.signature(repo.search_by_plate)
    assert "query" in sig.parameters
    assert "limit" in sig.parameters
