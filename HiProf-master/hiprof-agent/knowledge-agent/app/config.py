from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    api_key: str = os.getenv("KNOWLEDGE_AGENT_API_KEY", "")
    api_base: str = os.getenv("KNOWLEDGE_AGENT_API_BASE", "https://api.openai.com/v1")
    skeleton_model: str = os.getenv(
        "KNOWLEDGE_AGENT_SKELETON_MODEL",
        os.getenv("KNOWLEDGE_AGENT_MODEL", "gpt-4o-mini"),
    )
    card_model: str = os.getenv(
        "KNOWLEDGE_AGENT_CARD_MODEL",
        os.getenv("KNOWLEDGE_AGENT_MODEL", "gpt-4o-mini"),
    )
    timeout_seconds: int = int(os.getenv("KNOWLEDGE_AGENT_TIMEOUT_SECONDS", "120"))
    llm_max_retries: int = int(os.getenv("KNOWLEDGE_AGENT_LLM_MAX_RETRIES", "2"))
    max_source_chars: int = int(os.getenv("KNOWLEDGE_AGENT_MAX_SOURCE_CHARS", "18000"))
    max_initial_nodes: int = int(os.getenv("KNOWLEDGE_AGENT_MAX_INITIAL_NODES", "48"))
    course_topic_batch_size: int = int(
        os.getenv("KNOWLEDGE_AGENT_COURSE_TOPIC_BATCH_SIZE", "2")
    )
    light_card_batch_size: int = int(
        os.getenv("KNOWLEDGE_AGENT_LIGHT_CARD_BATCH_SIZE", "12")
    )
    light_card_concurrency: int = int(
        os.getenv("KNOWLEDGE_AGENT_LIGHT_CARD_CONCURRENCY", "2")
    )
    storage_dir: Path = Path(
        os.getenv(
            "KNOWLEDGE_AGENT_STORAGE_DIR", Path(__file__).resolve().parents[1] / "data"
        )
    )
    pdf_ocr_enabled: bool = _env_bool("KNOWLEDGE_AGENT_PDF_OCR_ENABLED", True)
    pdf_ocr_language: str = os.getenv("KNOWLEDGE_AGENT_PDF_OCR_LANGUAGE", "chi_sim+eng")
    pdf_ocr_tessdata: str = os.getenv("KNOWLEDGE_AGENT_PDF_OCR_TESSDATA", "")
    pdf_ocr_dpi: int = int(os.getenv("KNOWLEDGE_AGENT_PDF_OCR_DPI", "200"))
    pdf_min_text_chars: int = int(os.getenv("KNOWLEDGE_AGENT_PDF_MIN_TEXT_CHARS", "20"))
    pdf_extract_tables: bool = _env_bool("KNOWLEDGE_AGENT_PDF_EXTRACT_TABLES", True)


settings = Settings()
