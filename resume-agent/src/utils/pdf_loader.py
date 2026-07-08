"""
PDF text loader using PyMuPDF (fitz).
Extracts raw text page by page preserving order.
"""
from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF


def load_pdf(file_path: str) -> str:
    """
    Extract all text from a PDF file.

    Args:
        file_path: Absolute or relative path to the PDF file.

    Returns:
        Full text content as a single string.

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the file is not a valid PDF.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF file not found: {file_path}")

    text_parts: list[str] = []

    with fitz.open(str(path)) as doc:
        for page_index, page in enumerate(doc):
            page_text = page.get_text()
            if page_text.strip():
                text_parts.append(page_text)

    return "\n".join(text_parts).strip()
