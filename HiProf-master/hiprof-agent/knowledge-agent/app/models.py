from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class TaskStatus(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class TaskStage(str, Enum):
    submitted = "submitted"
    loading_sources = "loading_sources"
    generating_skeleton = "generating_skeleton"
    generating_light_cards = "generating_light_cards"
    generating_deep_cards = "generating_deep_cards"
    validating = "validating"
    completed = "completed"
    failed = "failed"


class LightweightCard(BaseModel):
    definition: str = ""
    keywords: list[str] = Field(default_factory=list)
    example: str = ""
    relatedKnowledge: list[str] = Field(default_factory=list)


class DeepCard(BaseModel):
    detailedDefinition: str = ""
    coreFeatures: list[str] = Field(default_factory=list)
    applicationScenarios: list[str] = Field(default_factory=list)
    commonQuestions: list[str] = Field(default_factory=list)
    relatedExplanation: str = ""
    references: list[str] = Field(default_factory=list)


class GraphNode(BaseModel):
    id: str
    title: str
    parentId: str | None = None
    level: int = 1
    lightweightCard: LightweightCard = Field(default_factory=LightweightCard)
    deepCard: DeepCard | None = None
    isFocus: bool = False


class ValidationResult(BaseModel):
    isValid: bool = True
    warnings: list[str] = Field(default_factory=list)
    stats: dict[str, Any] = Field(default_factory=dict)


class KnowledgeGraphResult(BaseModel):
    graphTitle: str
    nodes: list[GraphNode] = Field(default_factory=list)
    validation: ValidationResult = Field(default_factory=ValidationResult)
    sourceSummary: str = ""


class GenerationRequest(BaseModel):
    courseName: str = Field(min_length=1)
    teacherRequirements: str = ""
    sourceText: str = ""
    pdfPaths: list[str] = Field(default_factory=list)
    focusNodes: list[str] = Field(default_factory=list)
    graphType: str = "0"
    metadata: dict[str, Any] = Field(default_factory=dict)


class TaskRecord(BaseModel):
    taskId: str = Field(default_factory=lambda: str(uuid4()))
    status: TaskStatus = TaskStatus.pending
    stage: TaskStage = TaskStage.submitted
    message: str = "Task created"
    createdAt: str = Field(default_factory=utc_now)
    updatedAt: str = Field(default_factory=utc_now)
    request: GenerationRequest
    result: KnowledgeGraphResult | None = None
    error: str | None = None


class CreateTaskResponse(BaseModel):
    taskId: str
    status: TaskStatus
    stage: TaskStage
