package com.hiprof.core.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.hiprof.core.domain.dto.KnowledgeGraphGenerateRequest;

import java.util.Map;

public interface IKnowledgeAgentService
{
    JsonNode generateDeepCard(JsonNode request);

    Map<String, Object> generateAndPersistGraph(KnowledgeGraphGenerateRequest request, String createBy);
}
