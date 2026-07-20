from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.repositories.vehicle_repository import VehicleRepository


class FakeAwaitable:
    def __init__(self, value):
        self._value = value

    def __await__(self):
        yield
        return self._value


@pytest.fixture(autouse=True)
def mock_model():
    from unittest.mock import AsyncMock, MagicMock, patch

    with patch(
        "app.repositories.vehicle_repository.VehicleFingerprint"
    ) as mock:
        mock.find_all.return_value.to_list = AsyncMock(return_value=[])
        mock.find_all.return_value.count = AsyncMock(return_value=0)
        yield mock


@pytest.mark.asyncio
async def test_create(mock_model):
    mock_model.return_value = MagicMock()
    mock_model.return_value.insert = AsyncMock(return_value=mock_model.return_value)
    mock_model.find_one = MagicMock(return_value=FakeAwaitable(None))

    repo = VehicleRepository()
    record = await repo.create("ABC-1234", [0.1, 0.2])
    assert record is not None
    mock_model.assert_called_once_with(
        plate_text="ABC-1234", embedding=[0.1, 0.2], dimension=2
    )


@pytest.mark.asyncio
async def test_find_by_plate_found(mock_model):
    mock_record = MagicMock()
    mock_record.plate_text = "ABC-1234"
    mock_model.find_one = MagicMock(return_value=FakeAwaitable(mock_record))

    repo = VehicleRepository()
    record = await repo.find_by_plate("ABC-1234")
    assert record is not None
    assert record.plate_text == "ABC-1234"


@pytest.mark.asyncio
async def test_find_by_plate_not_found(mock_model):
    mock_model.find_one = MagicMock(return_value=FakeAwaitable(None))

    repo = VehicleRepository()
    record = await repo.find_by_plate("NONEXIST")
    assert record is None


@pytest.mark.asyncio
async def test_get_all(mock_model):
    mock_model.find_all.return_value.to_list = AsyncMock(
        return_value=[MagicMock(), MagicMock()]
    )

    repo = VehicleRepository()
    records = await repo.get_all()
    assert len(records) == 2


@pytest.mark.asyncio
async def test_get_all_empty(mock_model):
    mock_model.find_all.return_value.to_list = AsyncMock(return_value=[])

    repo = VehicleRepository()
    records = await repo.get_all()
    assert records == []


@pytest.mark.asyncio
async def test_delete_by_plate_found(mock_model):
    rec = MagicMock()
    rec.delete = AsyncMock()
    mock_model.find_one = MagicMock(return_value=FakeAwaitable(rec))

    repo = VehicleRepository()
    result = await repo.delete_by_plate("ABC-1234")
    assert result is True


@pytest.mark.asyncio
async def test_delete_by_plate_not_found(mock_model):
    mock_model.find_one = MagicMock(return_value=FakeAwaitable(None))

    repo = VehicleRepository()
    result = await repo.delete_by_plate("NONEXIST")
    assert result is False


@pytest.mark.asyncio
async def test_count(mock_model):
    mock_model.find_all.return_value.count = AsyncMock(return_value=5)

    repo = VehicleRepository()
    cnt = await repo.count()
    assert cnt == 5
