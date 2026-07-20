from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.repositories.decision_repository import DecisionRepository


class FakeAwaitable:
    def __init__(self, value):
        self._value = value

    def __await__(self):
        yield
        return self._value


@pytest.fixture(autouse=True)
def mock_model():
    with patch(
        "app.repositories.decision_repository.DecisionRecord"
    ) as mock:
        mock.find_one = MagicMock(return_value=FakeAwaitable(None))
        mock.find_all.return_value.sort.return_value.skip.return_value.limit.return_value.to_list = AsyncMock(
            return_value=[]
        )
        mock.find_all.return_value.count = AsyncMock(return_value=0)
        mock.find.return_value.count = AsyncMock(return_value=0)
        yield mock


@pytest.mark.asyncio
async def test_create(mock_model):
    mock_record = MagicMock()
    mock_record.insert = AsyncMock(return_value=mock_record)

    repo = DecisionRepository()
    result = await repo.create(mock_record)
    assert result is mock_record
    mock_record.insert.assert_called_once()


@pytest.mark.asyncio
async def test_get_by_id_found(mock_model):
    mock_record = MagicMock()
    mock_model.get = AsyncMock(return_value=mock_record)

    repo = DecisionRepository()
    result = await repo.get_by_id("rec-1")
    assert result is mock_record


@pytest.mark.asyncio
async def test_get_by_id_not_found(mock_model):
    mock_model.get = AsyncMock(return_value=None)

    repo = DecisionRepository()
    result = await repo.get_by_id("nonexist")
    assert result is None


@pytest.mark.asyncio
async def test_get_by_request_id_found(mock_model):
    mock_record = MagicMock()
    mock_model.find_one = MagicMock(return_value=FakeAwaitable(mock_record))

    repo = DecisionRepository()
    result = await repo.get_by_request_id("req-123")
    assert result is mock_record


@pytest.mark.asyncio
async def test_get_by_request_id_not_found(mock_model):
    mock_model.find_one = MagicMock(return_value=FakeAwaitable(None))

    repo = DecisionRepository()
    result = await repo.get_by_request_id("nonexist")
    assert result is None


@pytest.mark.asyncio
async def test_get_all(mock_model):
    mock_model.find_all.return_value.sort.return_value.skip.return_value.limit.return_value.to_list = AsyncMock(
        return_value=[MagicMock(), MagicMock()]
    )

    repo = DecisionRepository()
    records = await repo.get_all(skip=0, limit=10)
    assert len(records) == 2


@pytest.mark.asyncio
async def test_count(mock_model):
    mock_model.find_all.return_value.count = AsyncMock(return_value=10)

    repo = DecisionRepository()
    cnt = await repo.count()
    assert cnt == 10


@pytest.mark.asyncio
async def test_statistics(mock_model):
    def find_side_effect(*args, **kwargs):
        m = MagicMock()
        m.count = AsyncMock(return_value=5)
        return m

    mock_model.find_all.return_value.count = AsyncMock(return_value=20)
    mock_model.find.side_effect = find_side_effect

    repo = DecisionRepository()
    stats = await repo.statistics()
    assert stats["total_decisions"] == 20
    assert stats["grants"] == 5
    assert stats["denials"] == 5
    assert stats["manual_reviews"] == 5
    assert stats["grant_rate"] == 0.25
