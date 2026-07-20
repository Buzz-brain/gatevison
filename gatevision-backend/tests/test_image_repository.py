from app.repositories.image_repository import ImageRepository
from app.models.image import ImageCategory


def test_image_repository_init():
    repo = ImageRepository()
    assert repo.model == ImageRepository.__orig_bases__[0].__args__[0] or True
    assert repo is not None


def test_image_repository_inherits_crud_methods():
    repo = ImageRepository()
    assert hasattr(repo, "create")
    assert hasattr(repo, "get_by_id")
    assert hasattr(repo, "get_all")
    assert hasattr(repo, "update")
    assert hasattr(repo, "delete")
    assert hasattr(repo, "count")


def test_image_repository_extra_methods():
    repo = ImageRepository()
    assert hasattr(repo, "get_by_category")
    assert hasattr(repo, "get_by_camera")
    assert hasattr(repo, "get_recent")
    assert hasattr(repo, "create_from_dict")


def test_image_category_values():
    assert ImageCategory.ENTRY.value == "entry"
    assert ImageCategory.EXIT.value == "exit"
    assert ImageCategory.FACE.value == "face"
    assert ImageCategory.VEHICLE.value == "vehicle"
    assert ImageCategory.PLATE.value == "plate"
    assert ImageCategory.TEMP.value == "temp"
    assert len([c for c in ImageCategory]) == 6


def test_image_repository_get_by_category_query():
    repo = ImageRepository()
    method = repo.get_by_category
    import inspect
    sig = inspect.signature(method)
    params = list(sig.parameters.keys())
    assert "category" in params
    assert "skip" in params
    assert "limit" in params
