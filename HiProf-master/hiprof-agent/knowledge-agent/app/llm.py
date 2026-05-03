from __future__ import annotations

import json
import ssl
import urllib.error
import urllib.request

from .config import settings


class LlmClient:
    def __init__(self) -> None:
        self.enabled = bool(settings.api_key)

    def complete_json(
        self, system_prompt: str, user_prompt: str, model: str | None = None
    ) -> dict:
        if not self.enabled:
            raise RuntimeError("Remote LLM is not configured")

        last_error: Exception | None = None
        max_attempts = max(settings.llm_max_retries, 1)
        for attempt in range(1, max_attempts + 1):
            try:
                return self._complete_json_once(
                    system_prompt,
                    user_prompt,
                    model,
                    temperature=0.3 if attempt == 1 else 0.1,
                    retrying=attempt > 1,
                )
            except Exception as exc:
                last_error = exc
                if attempt >= max_attempts:
                    break

        raise RuntimeError(
            f"Remote LLM request or JSON parsing failed after {max_attempts} attempts: {last_error}"
        ) from last_error

    def _complete_json_once(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str | None,
        temperature: float,
        retrying: bool,
    ) -> dict:
        retry_instruction = (
            "\n\nThe previous response was not usable. Return one valid JSON object only, "
            "with all required fields and no markdown fences."
            if retrying
            else ""
        )
        payload = {
            "model": model or settings.card_model,
            "temperature": temperature,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt + retry_instruction},
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
        parsed = self._parse_json(content)
        if not isinstance(parsed, dict):
            raise RuntimeError("Remote LLM returned JSON that is not an object")
        return parsed

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
