from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, HTTPException

from .agent import knowledge_graph_agent
from .models import CreateTaskResponse, GenerationRequest, TaskRecord
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


@router.get("/tasks/{task_id}", response_model=TaskRecord)
def get_task(task_id: str) -> TaskRecord:
    task = task_store.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
