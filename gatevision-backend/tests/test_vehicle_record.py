from unittest.mock import MagicMock, patch

from app.models.vehicle_record import VehicleFingerprint


@patch("app.models.vehicle_record.VehicleFingerprint.get_settings")
def test_vehicle_fingerprint_creation(mock_settings):
    mock_settings.return_value = MagicMock()
    record = VehicleFingerprint(
        plate_text="ABC-1234",
        embedding=[0.1, 0.2, 0.3],
        dimension=3,
    )
    assert record.plate_text == "ABC-1234"
    assert len(record.embedding) == 3
    assert record.dimension == 3
    assert record.created_at is not None
    assert record.updated_at is not None


@patch("app.models.vehicle_record.VehicleFingerprint.get_settings")
def test_vehicle_fingerprint_repr(mock_settings):
    mock_settings.return_value = MagicMock()
    record = VehicleFingerprint(
        plate_text="XYZ-5678",
        embedding=[0.5] * 2048,
    )
    assert "XYZ-5678" in repr(record)
    assert "2048" in repr(record)
