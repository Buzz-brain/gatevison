from app.repositories.plate_detection_repository import PlateDetectionRepository


def test_plate_detection_repository_init():
    repo = PlateDetectionRepository()
    assert repo is not None
    assert hasattr(repo, "model")


def test_plate_detection_repository_inherits_crud():
    repo = PlateDetectionRepository()
    assert hasattr(repo, "create")
    assert hasattr(repo, "get_by_id")
    assert hasattr(repo, "get_all")
    assert hasattr(repo, "update")
    assert hasattr(repo, "delete")
    assert hasattr(repo, "count")


def test_plate_detection_repository_extra_methods():
    repo = PlateDetectionRepository()
    assert hasattr(repo, "create_from_result")
    assert hasattr(repo, "get_recent")
    assert hasattr(repo, "get_by_confidence")
    assert hasattr(repo, "count_detections")


def test_create_from_result_signature():
    repo = PlateDetectionRepository()
    import inspect
    sig = inspect.signature(repo.create_from_result)
    params = list(sig.parameters.keys())
    assert "image_id" in params
    assert "confidence" in params
    assert "bbox" in params
    assert "cropped_path" in params
    assert "inference_time_ms" in params
    assert "model_version" in params


def test_get_recent_signature():
    repo = PlateDetectionRepository()
    import inspect
    sig = inspect.signature(repo.get_recent)
    params = list(sig.parameters.keys())
    assert "limit" in params


def test_get_by_confidence_signature():
    repo = PlateDetectionRepository()
    import inspect
    sig = inspect.signature(repo.get_by_confidence)
    params = list(sig.parameters.keys())
    assert "min_conf" in params
    assert "skip" in params
    assert "limit" in params
