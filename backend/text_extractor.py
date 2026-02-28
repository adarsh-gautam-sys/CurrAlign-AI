"""
text_extractor.py
─────────────────
Utility functions for extracting raw text from uploaded documents.
Supports: PDF (via pdfplumber), DOCX (via python-docx), TXT (direct read).
"""

from pathlib import Path
import pdfplumber
from docx import Document


def extract_text_from_file(file_path: Path) -> str:
    """
    Extract text from a single file based on its extension.
    Returns the full text content as a string.
    Raises ValueError for unsupported formats.
    """
    ext = file_path.suffix.lower()

    if ext == ".pdf":
        return _extract_pdf(file_path)
    elif ext == ".docx":
        return _extract_docx(file_path)
    elif ext == ".txt":
        return _extract_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def _extract_pdf(file_path: Path) -> str:
    """Extract all text from a PDF using pdfplumber."""
    text_parts = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n\n".join(text_parts)


def _extract_docx(file_path: Path) -> str:
    """Extract all paragraph text from a DOCX file."""
    doc = Document(str(file_path))
    return "\n\n".join(para.text for para in doc.paragraphs if para.text.strip())


def _extract_txt(file_path: Path) -> str:
    """Read a plain text file."""
    return file_path.read_text(encoding="utf-8", errors="replace")
