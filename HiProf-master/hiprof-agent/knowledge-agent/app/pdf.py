from __future__ import annotations

from io import BytesIO
from pathlib import Path
from urllib.request import urlopen


def extract_pdf_text(pdf_path: str) -> str:
    try:
        from pypdf import PdfReader

        if pdf_path.startswith("http://") or pdf_path.startswith("https://"):
            with urlopen(pdf_path, timeout=30) as response:
                reader = PdfReader(BytesIO(response.read()))
        else:
            path = Path(pdf_path)
            if not path.exists() or not path.is_file():
                return ""
            reader = PdfReader(str(path))

        pages = []
        for page in reader.pages:
            pages.append((page.extract_text() or "").strip())
        return "\n".join(part for part in pages if part)
    except Exception:
        return ""
