package com.hiprof.core.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.hiprof.core.domain.dto.KnowledgeGraphGenerateRequest;
import org.springframework.web.multipart.MultipartFile;

import java.io.OutputStream;
import java.util.Map;

public interface IKnowledgeAgentService
{
    JsonNode generateDeepCard(JsonNode request);

    JsonNode parseGenerationSource(MultipartFile file);

    Map<String, Object> createGenerationTask(KnowledgeGraphGenerateRequest request);

    JsonNode getGenerationTask(String taskId);

    void streamGenerationTask(String taskId, OutputStream outputStream);

    Map<String, Object> persistGenerationTask(String taskId, String createBy);

    Map<String, Object> generateAndPersistGraph(KnowledgeGraphGenerateRequest request, String createBy);
}
