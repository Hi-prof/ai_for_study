# Knowledge Agent

This directory contains a standalone knowledge graph generation agent service.

## What it does

- accepts course requirements, plain text, optional PDF files, and backend document parsing uploads
- generates a staged knowledge graph pipeline
- builds top-level nodes first, expands lower levels by topic batch, then generates lightweight cards
- exposes HTTP APIs for task submission and task status query

## Run

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 18081
```

## Environment variables

- `KNOWLEDGE_AGENT_API_KEY`: API key for an OpenAI compatible service
- `KNOWLEDGE_AGENT_API_BASE`: defaults to `https://api.openai.com/v1`
- `KNOWLEDGE_AGENT_MODEL`: defaults to `gpt-4o-mini`
- `KNOWLEDGE_AGENT_STORAGE_DIR`: task storage directory, defaults to `./data`
- `KNOWLEDGE_AGENT_TIMEOUT_SECONDS`: request timeout, defaults to `120`
- `KNOWLEDGE_AGENT_LLM_MAX_RETRIES`: retries for invalid JSON or request failures, defaults to `2`
- `KNOWLEDGE_AGENT_MAX_SOURCE_CHARS`: maximum source summary length sent to the model, defaults to `18000`
- `KNOWLEDGE_AGENT_MAX_INITIAL_NODES`: maximum nodes generated during the first graph pass, defaults to `48`
- `KNOWLEDGE_AGENT_COURSE_TOPIC_BATCH_SIZE`: top-level topics per lower-level expansion request, defaults to `2`
- `KNOWLEDGE_AGENT_LIGHT_CARD_BATCH_SIZE`: nodes per lightweight-card request, defaults to `12`
- `KNOWLEDGE_AGENT_LIGHT_CARD_CONCURRENCY`: concurrent lightweight-card requests, defaults to `2`
- `KNOWLEDGE_AGENT_PDF_OCR_ENABLED`: enable OCR for scanned PDF pages, defaults to `true`
- `KNOWLEDGE_AGENT_PDF_OCR_LANGUAGE`: Tesseract OCR language, defaults to `chi_sim+eng`
- `KNOWLEDGE_AGENT_PDF_OCR_TESSDATA`: optional Tesseract `tessdata` directory path
- `KNOWLEDGE_AGENT_PDF_OCR_DPI`: OCR render DPI, defaults to `200`
- `KNOWLEDGE_AGENT_PDF_MIN_TEXT_CHARS`: minimum text-layer characters before OCR is skipped, defaults to `20`
- `KNOWLEDGE_AGENT_PDF_EXTRACT_TABLES`: extract PDF tables as Markdown, defaults to `true`

`KNOWLEDGE_AGENT_API_KEY` is required for graph and card generation.

Scanned PDFs require a local Tesseract installation and the configured language data. If OCR is needed but unavailable, document parsing fails with a page-level error instead of silently returning empty content.

## API

- `GET /health`
- `POST /api/v1/knowledge-agent/sources/parse`
- `POST /api/v1/knowledge-agent/tasks`
- `GET /api/v1/knowledge-agent/tasks/{task_id}`

## Example request

```json
{
  "courseName": "Data Structures",
  "teacherRequirements": "Focus on tree, graph, and algorithm analysis.",
  "sourceText": "Chapter 1 Linear Lists\nChapter 2 Stacks and Queues\nChapter 3 Trees\nChapter 4 Graphs",
  "focusNodes": ["Trees", "Graphs"]
}
```
