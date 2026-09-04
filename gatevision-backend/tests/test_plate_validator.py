from app.services.ai.ocr.plate_validator import (
    BasePlateValidator,
    NigeriaPlateValidator,
    PlateValidatorFactory,
    ValidationResult,
)


def test_validation_result():
    r = ValidationResult(True, "All good")
    assert r.valid is True
    assert r.message == "All good"
    d = r.to_dict()
    assert d["valid"] is True


def test_empty_plate():
    validator = NigeriaPlateValidator()
    result = validator.validate("")
    assert result.valid is False
    assert "Empty" in result.message


def test_none_plate():
    validator = NigeriaPlateValidator()
    result = validator.validate(None)
    assert result.valid is False


def test_too_short():
    validator = NigeriaPlateValidator()
    result = validator.validate("AB")
    assert result.valid is False


def test_too_long():
    validator = NigeriaPlateValidator()
    result = validator.validate("ABCDEFGHIJK")
    assert result.valid is False


def test_valid_abc123aa():
    validator = NigeriaPlateValidator()
    result = validator.validate("ABC123AA")
    assert result.valid is True


def test_valid_kja123ab():
    validator = NigeriaPlateValidator()
    result = validator.validate("KJA123AB")
    assert result.valid is True


def test_valid_fst456cd():
    validator = NigeriaPlateValidator()
    result = validator.validate("FST456CD")
    assert result.valid is True


def test_valid_ab123cde():
    validator = NigeriaPlateValidator()
    result = validator.validate("AB123CDE")
    assert result.valid is True


def test_valid_a1234bc():
    validator = NigeriaPlateValidator()
    result = validator.validate("A1234BC")
    assert result.valid is True


def test_valid_abc1234ab():
    validator = NigeriaPlateValidator()
    result = validator.validate("ABC1234AB")
    assert result.valid is True


def test_valid_abc123d_7char():
    validator = NigeriaPlateValidator()
    result = validator.validate("ABC123D")
    assert result.valid is True


def test_valid_ab123cd_7char():
    validator = NigeriaPlateValidator()
    result = validator.validate("AB123CD")
    assert result.valid is True


def test_valid_a123bcd_7char():
    validator = NigeriaPlateValidator()
    result = validator.validate("A123BCD")
    assert result.valid is True


def test_valid_abc1234_7char():
    validator = NigeriaPlateValidator()
    result = validator.validate("ABC1234")
    assert result.valid is True


def test_valid_abjz5rd_7char():
    validator = NigeriaPlateValidator()
    result = validator.validate("ABJZ5RD")
    assert result.valid is True


def test_valid_7char_only_letters_and_digits():
    validator = NigeriaPlateValidator()
    assert validator.validate("AB12CD3").valid is True
    assert validator.validate("A1B2C3D").valid is True


def test_valid_lowercase_input():
    validator = NigeriaPlateValidator()
    result = validator.validate("abc123aa")
    assert result.valid is True


def test_invalid_format():
    validator = NigeriaPlateValidator()
    result = validator.validate("12345")
    assert result.valid is False


def test_invalid_mixed():
    validator = NigeriaPlateValidator()
    result = validator.validate("A1B2C3D4")
    assert result.valid is False


def test_factory_default():
    validator = PlateValidatorFactory.get_validator()
    assert isinstance(validator, NigeriaPlateValidator)


def test_factory_nigeria():
    validator = PlateValidatorFactory.get_validator("nigeria")
    assert isinstance(validator, NigeriaPlateValidator)


def test_factory_unknown():
    try:
        PlateValidatorFactory.get_validator("unknown")
        assert False, "Should have raised ValueError"
    except ValueError:
        pass


def test_factory_register_custom():
    class MockValidator(BasePlateValidator):
        def validate(self, text):
            return ValidationResult(True, "mock")

    PlateValidatorFactory.register_validator("mock_country", MockValidator())
    validator = PlateValidatorFactory.get_validator("mock_country")
    assert isinstance(validator, MockValidator)


def test_plate_with_spaces():
    validator = NigeriaPlateValidator()
    result = validator.validate("ABC 123 AA")
    assert result.valid is True


def test_plate_with_hyphen():
    validator = NigeriaPlateValidator()
    result = validator.validate("ABC-123-AA")
    assert result.valid is True
