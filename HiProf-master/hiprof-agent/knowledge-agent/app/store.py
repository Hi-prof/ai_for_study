from __future__ import annotations

import json
import threading
from pathlib import Path

from .config import settings
from .models import TaskRecord, utc_now


class TaskStore:
    def __init__(self, base_dir: Path) -> None:
        self.base_dir = base_dir
        self.task_dir = self.base_dir / "tasks"
        self.task_dir.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    def _file(self, task_id: str) -> Path:
        return self.task_dir / f"{task_id}.json"

    def save(self, task: TaskRecord) -> None:
        task.updatedAt = utc_now()
        with self._lock:
            self._file(task.taskId).write_text(
                task.model_dump_json(indent=2), encoding="utf-8"
            )

    def get(self, task_id: str) -> TaskRecord | None:
        file_path = self._file(task_id)
        if not file_path.exists():
            return None
        with self._lock:
            return TaskRecord.model_validate_json(file_path.read_text(encoding="utf-8"))


task_store = TaskStore(settings.storage_dir)
