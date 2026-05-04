from __future__ import annotations

import re
from html import unescape
from io import BytesIO
from pathlib import Path
from zipfile import BadZipFile, ZipFile

from pypdf import PdfReader


MAX_FILE_SIZE = 50 * 1024 * 1024
ALLOWED_EXTENSIONS = {".txt", ".pdf", ".docx", ".pptx"}


def parse_document(filename: str, content: bytes) -> dict:
    if not content:
        raise ValueError("上传文件为空")
    if len(content) > MAX_FILE_SIZE:
        raise ValueError("文件大小超过限制，最大支持 50MB")

    source_name = Path(filename or "uploaded-file").name
    extension = Path(source_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        supported = "、".join(sorted(ALLOWED_EXTENSIONS))
        raise ValueError(f"不支持的文件类型: {extension}，支持格式: {supported}")

    if extension == ".txt":
        sections = _parse_txt(source_name, content)
    elif extension == ".pdf":
        sections = _parse_pdf(source_name, content)
    elif extension == ".docx":
        sections = _parse_docx(source_name, content)
    else:
        sections = _parse_pptx(source_name, content)

    usable_sections = [section for section in sections if section["text"].strip()]
    if not usable_sections:
        raise ValueError("文档内容为空或无法提取可用文本")

    text = "\n\n".join(_format_section(section) for section in usable_sections)
    return {
        "fileName": source_name,
        "fileType": extension.lstrip("."),
        "text": text,
        "sections": usable_sections,
        "sectionCount": len(usable_sections),
        "charCount": len(text),
    }


def _parse_txt(source_name: str, content: bytes) -> list[dict]:
    return [
        {
            "sourceName": source_name,
            "locator": "全文",
            "text": _decode_text(content),
        }
    ]


def _parse_pdf(source_name: str, content: bytes) -> list[dict]:
    try:
        reader = PdfReader(BytesIO(content))
    except Exception as exc:
        raise ValueError("PDF 文件损坏或格式异常，无法解析") from exc

    if reader.is_encrypted:
        raise ValueError("PDF 文件已加密，暂不支持直接解析")

    sections = []
    for index, page in enumerate(reader.pages, start=1):
        page_text = _clean_text(page.extract_text() or "")
        if page_text:
            sections.append(
                {
                    "sourceName": source_name,
                    "locator": f"第 {index} 页",
                    "text": page_text,
                }
            )
    return sections


def _parse_docx(source_name: str, content: bytes) -> list[dict]:
    try:
        with ZipFile(BytesIO(content)) as archive:
            xml_files = [
                name
                for name in archive.namelist()
                if name == "word/document.xml"
                or re.match(r"word/(header|footer|footnotes|endnotes|comments)\d*\.xml$", name)
            ]
            xml_files.sort(key=lambda name: (name != "word/document.xml", name))
            sections = []
            for name in xml_files:
                xml = archive.read(name).decode("utf-8", errors="ignore")
                text = _extract_word_text(xml)
                if text:
                    sections.append(
                        {
                            "sourceName": source_name,
                            "locator": _docx_locator(name),
                            "text": text,
                        }
                    )
            return sections
    except BadZipFile as exc:
        raise ValueError("Word 文档损坏或不是有效的 .docx 文件") from exc


def _parse_pptx(source_name: str, content: bytes) -> list[dict]:
    try:
        with ZipFile(BytesIO(content)) as archive:
            slide_files = [
                name
                for name in archive.namelist()
                if re.match(r"ppt/slides/slide\d+\.xml$", name)
            ]
            slide_files.sort(key=_slide_number)
            sections = []
            for name in slide_files:
                slide_number = _slide_number(name)
                xml = archive.read(name).decode("utf-8", errors="ignore")
                text = _extract_pptx_text(xml)
                if text:
                    sections.append(
                        {
                            "sourceName": source_name,
                            "locator": f"幻灯片 {slide_number}",
                            "text": text,
                        }
                    )
            return sections
    except BadZipFile as exc:
        raise ValueError("PowerPoint 文档损坏或不是有效的 .pptx 文件") from exc


def _decode_text(content: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-8", "gb18030"):
        try:
            return _clean_text(content.decode(encoding))
        except UnicodeDecodeError:
            continue
    raise ValueError("文本文件编码无法识别，请转换为 UTF-8 后重试")


def _extract_word_text(xml: str) -> str:
    parts = []
    token_pattern = re.compile(
        r"<w:t[^>]*>([\s\S]*?)</w:t>|<w:tab\s*/>|<w:br\s*/>|</w:p>|</w:tc>"
    )
    for match in token_pattern.finditer(xml):
        token = match.group(0)
        if match.group(1) is not None:
            parts.append(unescape(match.group(1)))
        elif token.startswith("<w:tab"):
            parts.append("\t")
        elif token.startswith("<w:br") or token == "</w:p>":
            parts.append("\n")
        elif token == "</w:tc>":
            parts.append("\t")
    return _clean_text("".join(parts))


def _extract_pptx_text(xml: str) -> str:
    parts = [
        unescape(match.group(1))
        for match in re.finditer(r"<a:t[^>]*>([\s\S]*?)</a:t>", xml)
        if match.group(1).strip()
    ]
    return _clean_text("\n".join(parts))


def _clean_text(text: str) -> str:
    return (
        text.replace("\x00", "")
        .replace("\r\n", "\n")
        .replace("\r", "\n")
        .replace("\t", " ")
        .replace("\u3000", " ")
    )


def _format_section(section: dict) -> str:
    heading_text = " ".join(
        part for part in [section["sourceName"], section["locator"]] if part
    )
    heading = f"=== {heading_text} ==="
    return f"{heading}\n{_normalize_lines(section['text'])}"


def _normalize_lines(text: str) -> str:
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    return "\n".join(line for line in lines if line).strip()


def _docx_locator(name: str) -> str:
    if name == "word/document.xml":
        return "正文"
    return Path(name).stem


def _slide_number(name: str) -> int:
    match = re.search(r"slide(\d+)\.xml$", name)
    return int(match.group(1)) if match else 0
