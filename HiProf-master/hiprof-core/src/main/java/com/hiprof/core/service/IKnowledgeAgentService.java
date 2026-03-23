package com.hiprof.core.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.hiprof.core.domain.dto.KnowledgeGraphGenerateRequest;

public interface IKnowledgeAgentService
{
    JsonNode createTask(KnowledgeGraphGenerateRequest request);

    JsonNode getTask(String taskId);

    Long persistTaskResult(String taskId, String createBy);
}
