from __future__ import annotations

import json
import ssl
import urllib.error
import urllib.request

from .config import settings


class LlmClient:
    def __init__(self) -> None:
        self.enabled = bool(settings.api_key)

    def complete_json(self, system_prompt: str, user_prompt: str) -> dict:
        if not self.enabled:
            raise RuntimeError("Remote LLM is not configured")

        payload = {
            "model": settings.model,
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        request = urllib.request.Request(
            url=f"{settings.api_base.rstrip('/')}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.api_key}",
            },
            method="POST",
        )
        try:
            context = ssl.create_default_context()
            with urllib.request.urlopen(
                request, timeout=settings.timeout_seconds, context=context
            ) as response:
                body = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(
                f"Remote LLM request failed: {exc.code} {detail}"
            ) from exc
        except Exception as exc:
            raise RuntimeError(f"Remote LLM request failed: {exc}") from exc

        content = body["choices"][0]["message"]["content"]
        return self._parse_json(content)

    @staticmethod
    def _parse_json(content: str) -> dict:
        text = content.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            if len(lines) >= 3:
                text = "\n".join(lines[1:-1]).strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}")
            if start >= 0 and end > start:
                return json.loads(text[start : end + 1])
            raise


llm_client = LlmClient()
