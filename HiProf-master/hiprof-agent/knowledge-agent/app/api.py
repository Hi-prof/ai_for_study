from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse

from .agent import knowledge_graph_agent
from .models import (
    CreateTaskResponse,
    DeepCardResponse,
    GenerationRequest,
    ManualDeepCardRequest,
    TaskRecord,
)
from .store import task_store


router = APIRouter(prefix="/api/v1/knowledge-agent", tags=["knowledge-agent"])


@router.post("/tasks", response_model=CreateTaskResponse)
def create_task(
    request: GenerationRequest, background_tasks: BackgroundTasks
) -> CreateTaskResponse:
    task = TaskRecord(request=request)
    task_store.save(task)
    background_tasks.add_task(knowledge_graph_agent.run_task, task.taskId)
    return CreateTaskResponse(taskId=task.taskId, status=task.status, stage=task.stage)


@router.post("/deep-card", response_model=DeepCardResponse)
def generate_deep_card(request: ManualDeepCardRequest) -> DeepCardResponse:
    return knowledge_graph_agent.generate_manual_deep_card(request)


@router.get("/tasks/{task_id}", response_model=TaskRecord)
def get_task(task_id: str) -> TaskRecord:
    task = task_store.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def _to_sse(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


@router.get("/tasks/{task_id}/stream")
async def stream_task(task_id: str) -> StreamingResponse:
    task = task_store.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    async def event_stream():
        last_updated = None
        idle_ticks = 0

        while True:
            current = task_store.get(task_id)
            if current is None:
                yield _to_sse("error", {"taskId": task_id, "error": "Task not found"})
                break

            if current.updatedAt != last_updated:
                last_updated = current.updatedAt
                idle_ticks = 0
                payload = current.model_dump(mode="json")
                event_name = "task"
                if current.status.value == "completed":
                    event_name = "completed"
                elif current.status.value == "failed":
                    event_name = "failed"
                yield _to_sse(event_name, payload)

                if current.status.value in {"completed", "failed"}:
                    break
            else:
                idle_ticks += 1
                if idle_ticks >= 10:
                    idle_ticks = 0
                    yield ": keep-alive\n\n"

            await asyncio.sleep(1)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
