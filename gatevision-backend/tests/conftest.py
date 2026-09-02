from unittest.mock import AsyncMock

import pytest


@pytest.fixture(autouse=True)
def _no_real_decision_writes(monkeypatch):
    """Keep decision persistence off a real MongoDB during tests.

    Two seams:
    1. The orchestrator's DecisionRecord is swapped for a lightweight
       constructible stand-in so _persist_decision completes gracefully even
       when Beanie is not initialized (otherwise constructing the real model
       raises CollectionWasNotInitialized and every pipeline test that reaches
       a decision emits a spurious decision_persist warning).
    2. The real model's insert is no-opped as belt-and-suspenders so no test
       path can write documents to a live database.

    DecisionRepository keeps its real logic and is unit-tested separately
    (those tests patch the whole model in their own modules).
    """
    from app.models.decision_record import DecisionRecord

    monkeypatch.setattr(DecisionRecord, "insert", AsyncMock())

    class _StubDecisionRecord:
        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)

        async def insert(self):
            return self

    monkeypatch.setattr(
        "app.services.ai.orchestrator.orchestrator.DecisionRecord",
        _StubDecisionRecord,
    )

    # Same treatment for PendingVehicle: constructing the real Beanie document
    # requires an initialized collection, so the pending-vehicle service builds a
    # lightweight constructible stand-in in tests (insert is a no-op; the
    # repository is swapped with mocks in its own tests).
    from app.services.ai.orchestrator import pending_vehicle_service as _pvs

    class _StubPendingVehicle:
        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)

        async def insert(self):
            return self

    monkeypatch.setattr(_pvs, "PendingVehicle", _StubPendingVehicle)
