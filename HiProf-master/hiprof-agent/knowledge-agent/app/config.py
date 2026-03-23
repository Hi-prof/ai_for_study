from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    api_key: str = os.getenv("KNOWLEDGE_AGENT_API_KEY", "")
    api_base: str = os.getenv("KNOWLEDGE_AGENT_API_BASE", "https://api.openai.com/v1")
    model: str = os.getenv("KNOWLEDGE_AGENT_MODEL", "gpt-4o-mini")
    timeout_seconds: int = int(os.getenv("KNOWLEDGE_AGENT_TIMEOUT_SECONDS", "120"))
    storage_dir: Path = Path(
        os.getenv(
            "KNOWLEDGE_AGENT_STORAGE_DIR", Path(__file__).resolve().parents[1] / "data"
        )
    )


settings = Settings()
