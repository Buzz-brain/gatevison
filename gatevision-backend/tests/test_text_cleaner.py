from app.services.ai.ocr.text_cleaner import TextCleaner


def test_clean_empty():
    assert TextCleaner.clean("") == ""
    assert TextCleaner.clean(None) == ""


def test_clean_uppercase():
    assert TextCleaner.clean("abc123") == "ABC123"


def test_clean_removes_symbols():
    assert TextCleaner.clean("abc-123!@#") == "ABC123"


def test_clean_removes_spaces():
    assert TextCleaner.clean("AB C 1 2 3") == "ABC123"


def test_clean_handles_hyphens():
    assert TextCleaner.clean("ABC-123-AA") == "ABC123AA"


def test_clean_example():
    assert TextCleaner.clean("abc - 123 aa") == "ABC123AA"


def test_clean_already_clean():
    assert TextCleaner.clean("ABC123AA") == "ABC123AA"


def test_clean_lowercase_input():
    assert TextCleaner.clean("kja123ab") == "KJA123AB"


def test_normalize_confidence():
    assert TextCleaner.normalize_confidence(0.95) == 0.95
    assert TextCleaner.normalize_confidence(0.95432) == 0.9543
    assert TextCleaner.normalize_confidence(-0.5) == 0.0
    assert TextCleaner.normalize_confidence(1.5) == 1.0


def test_is_meaningful():
    assert TextCleaner.is_meaningful("AB") is True
    assert TextCleaner.is_meaningful("ABC123") is True
    assert TextCleaner.is_meaningful("") is False
    assert TextCleaner.is_meaningful("A") is False


def test_extract_alphanumeric():
    assert TextCleaner.extract_alphanumeric("ABC-123!@#") == "ABC123"
    assert TextCleaner.extract_alphanumeric("hello world") == "HELLOWORLD"
    assert TextCleaner.extract_alphanumeric("") == ""


def test_clean_preserves_numbers():
    assert TextCleaner.clean("123456") == "123456"


def test_clean_mixed_format():
    assert TextCleaner.clean("  kja  123 ab  ") == "KJA123AB"
