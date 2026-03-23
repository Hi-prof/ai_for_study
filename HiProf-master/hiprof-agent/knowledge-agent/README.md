# Knowledge Agent

This directory contains a standalone knowledge graph generation agent service.

## What it does

- accepts course requirements, plain text, and optional PDF files
- generates a staged knowledge graph pipeline
- builds skeleton nodes first, then lightweight cards, then deep cards for focus nodes
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

If no API key is provided, the service falls back to a deterministic local strategy so the whole pipeline can still run during integration.

## API

- `GET /health`
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
