from __future__ import annotations

import re
from contextlib import redirect_stderr, redirect_stdout
from dataclasses import dataclass
from io import StringIO
from pathlib import Path
from urllib.request import urlopen

from .config import settings


@dataclass
class PdfPageParseResult:
    page_number: int
    text: str
    method: str
    ocr_used: bool
    tables: list[dict]
    warnings: list[str]


def parse_pdf_document(source_name: str, content: bytes) -> dict:
    fitz = _load_fitz()

    try:
        document = fitz.open(stream=content, filetype="pdf")
    except Exception as exc:
        raise ValueError("PDF 文件损坏或格式异常，无法解析") from exc

    try:
        if document.needs_pass:
            raise ValueError("PDF 文件已加密，暂不支持直接解析")

        sections = []
        warnings = []
        ocr_page_count = 0
        table_count = 0

        for page_index in range(document.page_count):
            page = document.load_page(page_index)
            page_result = _parse_page(page, page_index + 1)
            warnings.extend(page_result.warnings)
            if page_result.ocr_used:
                ocr_page_count += 1
            table_count += len(page_result.tables)

            if page_result.text.strip():
                sections.append(
                    {
                        "sourceName": source_name,
                        "locator": f"第 {page_result.page_number} 页",
                        "text": page_result.text,
                        "method": page_result.method,
                        "ocrUsed": page_result.ocr_used,
                        "tables": page_result.tables,
                        "warnings": page_result.warnings,
                    }
                )

        if not sections:
            detail = f"：{'；'.join(warnings)}" if warnings else ""
            raise ValueError(f"PDF 内容无法提取{detail}")

        return {
            "sections": sections,
            "pageCount": document.page_count,
            "ocrPageCount": ocr_page_count,
            "tableCount": table_count,
            "warnings": warnings,
        }
    finally:
        document.close()


def extract_pdf_text(pdf_path: str) -> str:
    content, source_name = _read_pdf_source(pdf_path)
    parsed = parse_pdf_document(source_name, content)
    return "\n\n".join(_format_section(section) for section in parsed["sections"])


def _parse_page(page, page_number: int) -> PdfPageParseResult:
    warnings = []
    text = _extract_text_layer(page)
    method = "text_layer"
    ocr_used = False

    if _page_needs_ocr(page, text):
        if settings.pdf_ocr_enabled:
            try:
                ocr_text = _extract_ocr_text(page)
            except Exception as exc:
                warnings.append(
                    f"第 {page_number} 页疑似扫描页或图片页，OCR 失败: {_clean_exception_message(exc)}"
                )
            else:
                if _meaningful_length(ocr_text) > _meaningful_length(text):
                    text = ocr_text
                    method = "ocr"
                    ocr_used = True
                elif not text.strip():
                    warnings.append(f"第 {page_number} 页 OCR 未识别出可用文字")
        else:
            warnings.append(f"第 {page_number} 页疑似扫描页或图片页，但 OCR 未启用")

    table_results, table_warnings = _extract_tables(page, page_number)
    warnings.extend(table_warnings)
    combined_text = _combine_page_text(text, table_results)
    if table_results and method == "text_layer":
        method = "hybrid"

    return PdfPageParseResult(
        page_number=page_number,
        text=combined_text,
        method=method,
        ocr_used=ocr_used,
        tables=table_results,
        warnings=warnings,
    )


def _extract_text_layer(page) -> str:
    blocks = page.get_text("blocks", sort=True)
    parts = [block[4] for block in blocks if len(block) >= 5 and block[4].strip()]
    return _clean_text("\n".join(parts))


def _page_needs_ocr(page, text: str) -> bool:
    if _meaningful_length(text) >= settings.pdf_min_text_chars:
        return False
    return len(page.get_images(full=True)) > 0


def _extract_ocr_text(page) -> str:
    text_page = page.get_textpage_ocr(
        language=settings.pdf_ocr_language,
        dpi=settings.pdf_ocr_dpi,
        full=True,
        tessdata=settings.pdf_ocr_tessdata or None,
    )
    return _clean_text(page.get_text("text", sort=True, textpage=text_page))


def _extract_tables(page, page_number: int) -> tuple[list[dict], list[str]]:
    if not settings.pdf_extract_tables:
        return [], []

    try:
        with redirect_stdout(StringIO()), redirect_stderr(StringIO()):
            table_finder = page.find_tables()
    except Exception as exc:
        return [], [f"第 {page_number} 页表格解析失败: {_clean_exception_message(exc)}"]

    tables = []
    for table_index, table in enumerate(getattr(table_finder, "tables", []) or [], start=1):
        markdown = _clean_table_markdown(table.to_markdown(clean=True))
        if not markdown:
            continue
        tables.append(
            {
                "index": table_index,
                "rowCount": table.row_count,
                "columnCount": table.col_count,
                "markdown": markdown,
            }
        )
    return tables, []


def _combine_page_text(text: str, tables: list[dict]) -> str:
    parts = []
    cleaned_text = _normalize_lines(text)
    if cleaned_text:
        parts.append(cleaned_text)

    for table in tables:
        markdown = table.get("markdown", "").strip()
        if markdown:
            parts.append(f"表格 {table['index']}\n{markdown}")

    return "\n\n".join(parts).strip()


def _read_pdf_source(pdf_path: str) -> tuple[bytes, str]:
    if not pdf_path or not pdf_path.strip():
        raise ValueError("PDF 文件路径不能为空")

    if pdf_path.startswith("http://") or pdf_path.startswith("https://"):
        with urlopen(pdf_path, timeout=30) as response:
            return response.read(), Path(response.url).name or "remote.pdf"

    path = Path(pdf_path)
    if not path.exists() or not path.is_file():
        raise ValueError(f"PDF 文件不存在: {pdf_path}")
    return path.read_bytes(), path.name


def _load_fitz():
    try:
        import fitz
    except ImportError as exc:
        raise ValueError("PDF 解析依赖 PyMuPDF 未安装，请先安装 requirements.txt") from exc
    return fitz


def _format_section(section: dict) -> str:
    heading = f"=== {section['sourceName']} {section['locator']} ==="
    return f"{heading}\n{section['text']}".strip()


def _clean_text(text: str) -> str:
    return (
        text.replace("\x00", "")
        .replace("\r\n", "\n")
        .replace("\r", "\n")
        .replace("\t", " ")
        .replace("\u3000", " ")
    )


def _normalize_lines(text: str) -> str:
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    return "\n".join(line for line in lines if line).strip()


def _meaningful_length(text: str) -> int:
    return len(re.sub(r"\s+", "", text or ""))


def _clean_table_markdown(markdown: str) -> str:
    lines = [line.rstrip() for line in markdown.splitlines() if line.strip()]
    if len(lines) < 3:
        return ""
    return "\n".join(lines)


def _clean_exception_message(exc: Exception) -> str:
    message = str(exc).strip().replace("\n", " ")
    return message or exc.__class__.__name__
