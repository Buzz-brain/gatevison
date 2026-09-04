import re
from typing import Optional


class ValidationResult:
    def __init__(self, valid: bool, message: str = ""):
        self.valid = valid
        self.message = message

    def to_dict(self) -> dict:
        return {
            "valid": self.valid,
            "message": self.message,
        }


class BasePlateValidator:
    def validate(self, plate_text: str) -> ValidationResult:
        raise NotImplementedError


class NigeriaPlateValidator(BasePlateValidator):
    FORMATS = [
        re.compile(r"^[A-Z]{3}\d{3}[A-Z]{2}$"),   # ABC123AA
        re.compile(r"^[A-Z]{2}\d{3}[A-Z]{3}$"),   # AB123CDE
        re.compile(r"^[A-Z]{1}\d{4}[A-Z]{2}$"),   # A1234BC
        re.compile(r"^[A-Z]{3}\d{4}[A-Z]{2}$"),   # ABC1234AB
        re.compile(r"^[A-Z]{2}\d{4}[A-Z]{2}$"),   # AB1234CD
        re.compile(r"^[A-Z]{3}\d{2}[A-Z]{3}$"),   # ABC12DEF
        re.compile(r"^[A-Z]{3}\d{3}[A-Z]{1}$"),   # ABC123D (7-char)
        re.compile(r"^[A-Z]{2}\d{3}[A-Z]{2}$"),   # AB123CD (7-char)
        re.compile(r"^[A-Z]{1}\d{3}[A-Z]{3}$"),   # A123BCD (7-char)
        re.compile(r"^[A-Z]{3}\d{4}$"),           # ABC1234 (7-char)
    ]

    FORMAT_DESCRIPTIONS = [
        "ABC123AA (standard 3 letters, 3 digits, 2 letters)",
        "AB123CDE (2 letters, 3 digits, 3 letters)",
        "A1234BC (1 letter, 4 digits, 2 letters)",
        "ABC1234AB (3 letters, 4 digits, 2 letters)",
        "AB1234CD (2 letters, 4 digits, 2 letters)",
        "ABC12DEF (3 letters, 2 digits, 3 letters)",
        "ABC123D (3 letters, 3 digits, 1 letter)",
        "AB123CD (2 letters, 3 digits, 2 letters)",
        "A123BCD (1 letter, 3 digits, 3 letters)",
        "ABC1234 (3 letters, 4 digits)",
    ]

    def validate(self, plate_text: str) -> ValidationResult:
        if not plate_text:
            return ValidationResult(False, "Empty plate text")

        cleaned = plate_text.upper().strip()
        cleaned = re.sub(r"[^A-Z0-9]", "", cleaned)

        if len(cleaned) < 5:
            return ValidationResult(
                False, f"Plate too short ({len(cleaned)} chars, minimum 5)"
            )

        if len(cleaned) > 10:
            return ValidationResult(
                False, f"Plate too long ({len(cleaned)} chars, maximum 10)"
            )

        for i, pattern in enumerate(self.FORMATS):
            if pattern.match(cleaned):
                return ValidationResult(
                    True, f"Valid format: {self.FORMAT_DESCRIPTIONS[i]}"
                )

        # Nigerian plates commonly have 7 characters with varied letter/digit
        # layouts (e.g. ABJZ5RD). Accept any 7-char alphanumeric plate that
        # contains at least one letter and one digit.
        if len(cleaned) == 7 and re.search(r"[A-Z]", cleaned) and re.search(
            r"\d", cleaned
        ):
            return ValidationResult(
                True,
                "Valid format: 7-character Nigerian plate "
                "(letters and digits)",
            )

        return ValidationResult(
            False,
            f"'{cleaned}' does not match any known Nigerian plate format",
        )


class PlateValidatorFactory:
    _validators: dict[str, BasePlateValidator] = {
        "nigeria": NigeriaPlateValidator(),
    }

    @classmethod
    def get_validator(cls, country: str = "nigeria") -> BasePlateValidator:
        validator = cls._validators.get(country.lower())
        if validator is None:
            raise ValueError(f"Unknown country: {country}")
        return validator

    @classmethod
    def register_validator(
        cls, country: str, validator: BasePlateValidator
    ) -> None:
        cls._validators[country.lower()] = validator
