import re


class TextCleaner:
    @staticmethod
    def clean(raw: str) -> str:
        if not raw:
            return ""

        text = raw.upper()

        text = re.sub(r"[^A-Z0-9\s\-]", "", text)

        text = re.sub(r"\s+", " ", text).strip()

        text = re.sub(r"\s*-\s*", "-", text)

        text = re.sub(r"-+", "-", text)

        text = text.replace("-", "")

        text = re.sub(r"\s+", "", text)

        return text

    @staticmethod
    def normalize_confidence(confidence: float) -> float:
        if confidence < 0.0:
            return 0.0
        if confidence > 1.0:
            return 1.0
        return round(confidence, 4)

    @staticmethod
    def is_meaningful(text: str, min_length: int = 2) -> bool:
        cleaned = TextCleaner.clean(text)
        return len(cleaned) >= min_length

    @staticmethod
    def extract_alphanumeric(text: str) -> str:
        return re.sub(r"[^A-Za-z0-9]", "", text).upper()
