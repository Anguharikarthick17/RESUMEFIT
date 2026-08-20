"""
ResumeFit — Text Extractor

Handles PDF (via pdfplumber) and DOCX (via python-docx) text extraction.
Returns raw text or raises a structured error for unreadable files.
"""

from __future__ import annotations

import io
import re
from pathlib import Path
from typing import Tuple


# ─── Error sentinel ────────────────────────────────────────────────────────

class ExtractionError(Exception):
    """Raised when a file cannot be extracted."""
    def __init__(self, code: str, detail: str):
        self.code = code
        self.detail = detail
        super().__init__(f"{code}: {detail}")


def _clean_extracted_text(text: str) -> str:
    """Normalize font artifacts like (cid:127) and control characters while preserving words and structure."""
    if not text:
        return ""
    # 1. Clean PDF font cid artifacts like (cid:127), (cid:142), etc.
    text = re.sub(r"\(cid:\d+\)", " ", text)
    # 2. Clean unusual control characters while keeping \n, \t, \r
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    # 3. Clean private-use unicode bullets e.g. \uf0b7, \uf0a7
    text = re.sub(r"[\uf000-\uf8ff]", "•", text)
    return text


# ─── PDF extraction ─────────────────────────────────────────────────────────

def _extract_pdf(data: bytes) -> str:
    try:
        import pdfplumber
    except ImportError:
        raise ExtractionError("MISSING_DEP", "pdfplumber is not installed.")

    text_parts: list[str] = []
    try:
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            if not pdf.pages:
                raise ExtractionError("EMPTY_FILE", "PDF contains no pages.")
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    cleaned_page = _clean_extracted_text(page_text.strip())
                    if cleaned_page:
                        text_parts.append(cleaned_page)
    except ExtractionError:
        raise
    except Exception as exc:
        raise ExtractionError("PARSE_ERROR", f"Could not parse PDF: {exc}") from exc

    combined = "\n\n".join(text_parts).strip()
    if not combined:
        raise ExtractionError(
            "NO_TEXT_LAYER",
            "No text layer detected. OCR is not enabled.",
        )
    return combined


# ─── DOCX extraction ────────────────────────────────────────────────────────

def _extract_docx(data: bytes) -> str:
    try:
        import docx
    except ImportError:
        raise ExtractionError("MISSING_DEP", "python-docx is not installed.")

    try:
        doc = docx.Document(io.BytesIO(data))
    except Exception as exc:
        raise ExtractionError("PARSE_ERROR", f"Could not parse DOCX: {exc}") from exc

    paragraphs = [_clean_extracted_text(p.text.strip()) for p in doc.paragraphs if p.text.strip()]
    paragraphs = [p for p in paragraphs if p]
    if not paragraphs:
        raise ExtractionError("NO_TEXT_LAYER", "DOCX contains no readable text.")
    return "\n".join(paragraphs)


# ─── Public interface ────────────────────────────────────────────────────────

def extract_text(filename: str, data: bytes) -> Tuple[str, str]:
    """
    Extract raw text from a resume file.

    Parameters
    ----------
    filename : str
        Original filename (used to detect type from extension).
    data : bytes
        Raw file bytes.

    Returns
    -------
    (text, file_type) : Tuple[str, str]
        Extracted text and the detected file type ("pdf" or "docx").

    Raises
    ------
    ExtractionError
        On any extraction failure with a structured code and detail.
    """
    if not data:
        raise ExtractionError("EMPTY_FILE", "Uploaded file is empty.")

    suffix = Path(filename).suffix.lower()

    if suffix == ".pdf":
        return _extract_pdf(data), "pdf"
    elif suffix in (".docx", ".doc"):
        return _extract_docx(data), "docx"
    else:
        raise ExtractionError(
            "UNSUPPORTED_TYPE",
            f"Unsupported file type '{suffix}'. Only PDF and DOCX are accepted.",
        )
