package com.hiprof.core.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hiprof.common.exception.ServiceException;
import com.hiprof.common.utils.StringUtils;
import com.hiprof.core.config.KnowledgeAgentProperties;
import com.hiprof.core.domain.ZstpGraph;
import com.hiprof.core.domain.ZstpNode;
import com.hiprof.core.domain.dto.KnowledgeGraphGenerateRequest;
import com.hiprof.core.service.IKnowledgeAgentService;
import com.hiprof.core.service.IZstpGraphService;
import com.hiprof.core.service.IZstpNodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class KnowledgeAgentServiceImpl implements IKnowledgeAgentService
{
    @Autowired
    private KnowledgeAgentProperties knowledgeAgentProperties;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private IZstpGraphService zstpGraphService;

    @Autowired
    private IZstpNodeService zstpNodeService;

    @Override
    public JsonNode createTask(KnowledgeGraphGenerateRequest request)
    {
        if (!knowledgeAgentProperties.isEnabled())
        {
            throw new ServiceException("知识图谱智能体服务未启用");
        }
        if (request == null || StringUtils.isBlank(request.getCourseName()))
        {
            throw new ServiceException("课程名称不能为空");
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("courseName", request.getCourseName());
        payload.put("teacherRequirements", StringUtils.defaultString(request.getTeacherRequirements()));
        payload.put("sourceText", StringUtils.defaultString(request.getSourceText()));
        payload.put("pdfPaths", request.getPdfPaths() == null ? List.of() : request.getPdfPaths());
        payload.put("focusNodes", request.getFocusNodes() == null ? List.of() : request.getFocusNodes());
        payload.put("graphType", StringUtils.defaultIfBlank(request.getGraphType(), "0"));

        Map<String, Object> metadata = new LinkedHashMap<>();
        if (request.getCourseId() != null)
        {
            metadata.put("courseId", request.getCourseId());
        }
        payload.put("metadata", metadata);
        return executeJsonRequest(HttpMethod.POST, buildTaskUrl(null), payload);
    }

    @Override
    public JsonNode getTask(String taskId)
    {
        if (StringUtils.isBlank(taskId))
        {
            throw new ServiceException("任务ID不能为空");
        }
        return executeJsonRequest(HttpMethod.GET, buildTaskUrl(taskId), null);
    }

    @Transactional
    @Override
    public Long persistTaskResult(String taskId, String createBy)
    {
        JsonNode taskNode = getTask(taskId);
        String status = taskNode.path("status").asText();
        if (!"completed".equalsIgnoreCase(status))
        {
            throw new ServiceException("任务尚未完成，当前状态为: " + status);
        }

        JsonNode resultNode = taskNode.path("result");
        if (resultNode.isMissingNode() || resultNode.isNull())
        {
            throw new ServiceException("任务结果为空，无法保存知识图谱");
        }

        JsonNode requestNode = taskNode.path("request");
        Long courseId = extractLong(requestNode.path("metadata").path("courseId"));
        if (courseId == null)
        {
            courseId = extractLong(requestNode.path("courseId"));
        }

        ZstpGraph zstpGraph = new ZstpGraph();
        zstpGraph.setName(defaultText(resultNode.path("graphTitle"), defaultText(requestNode.path("courseName"), "未命名知识图谱")));
        zstpGraph.setCourseId(courseId);
        zstpGraph.setGraphType(defaultText(requestNode.path("graphType"), "0"));
        zstpGraph.setContent(writeJson(resultNode));
        zstpGraph.setCreateBy(createBy);

        Long graphId = zstpGraphService.insertZstpGraph(zstpGraph);
        saveNodes(graphId, resultNode.path("nodes"));
        return graphId;
    }

    private void saveNodes(Long graphId, JsonNode nodesNode)
    {
        if (!nodesNode.isArray() || nodesNode.isEmpty())
        {
            return;
        }

        List<JsonNode> orderedNodes = new ArrayList<>();
        nodesNode.forEach(orderedNodes::add);
        orderedNodes.sort(Comparator.comparingInt(item -> item.path("level").asInt(99)));

        Map<String, Long> nodeIdMapping = new HashMap<>();
        for (JsonNode item : orderedNodes)
        {
            String agentNodeId = defaultText(item.path("id"), null);
            if (StringUtils.isBlank(agentNodeId))
            {
                continue;
            }

            String parentAgentId = defaultText(item.path("parentId"), null);
            Long parentDbId = StringUtils.isBlank(parentAgentId) ? null : nodeIdMapping.get(parentAgentId);

            ZstpNode zstpNode = new ZstpNode();
            zstpNode.setGraphId(graphId);
            zstpNode.setParentId(parentDbId);
            zstpNode.setName(defaultText(item.path("title"), "未命名节点"));
            zstpNode.setContent(writeJson(item));

            long createdNodeId = zstpNodeService.insertZstpNode(zstpNode);
            nodeIdMapping.put(agentNodeId, createdNodeId);
        }
    }

    private JsonNode executeJsonRequest(HttpMethod method, String url, Object payload)
    {
        HttpURLConnection connection = null;
        try
        {
            connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setRequestMethod(method.name());
            connection.setConnectTimeout(knowledgeAgentProperties.getConnectTimeout());
            connection.setReadTimeout(knowledgeAgentProperties.getReadTimeout());
            connection.setRequestProperty("Accept", "application/json");

            if (payload != null)
            {
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json;charset=UTF-8");
                try (OutputStream outputStream = connection.getOutputStream())
                {
                    outputStream.write(objectMapper.writeValueAsBytes(payload));
                }
            }

            int responseCode = connection.getResponseCode();
            String body = readBody(responseCode >= 200 && responseCode < 300 ? connection.getInputStream() : connection.getErrorStream());
            if (responseCode < 200 || responseCode >= 300)
            {
                throw new ServiceException("知识图谱智能体服务调用失败: " + responseCode + " " + body);
            }
            if (StringUtils.isBlank(body))
            {
                throw new ServiceException("知识图谱智能体服务返回为空");
            }
            return objectMapper.readTree(body);
        }
        catch (IOException e)
        {
            throw new ServiceException("知识图谱智能体服务调用异常: " + e.getMessage());
        }
        finally
        {
            if (connection != null)
            {
                connection.disconnect();
            }
        }
    }

    private String readBody(InputStream inputStream) throws IOException
    {
        if (inputStream == null)
        {
            return "";
        }
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8)))
        {
            StringBuilder builder = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null)
            {
                builder.append(line);
            }
            return builder.toString();
        }
    }

    private String buildTaskUrl(String taskId)
    {
        String baseUrl = StringUtils.stripEnd(knowledgeAgentProperties.getBaseUrl(), "/");
        String taskPath = knowledgeAgentProperties.getTaskPath();
        String url = baseUrl + (taskPath.startsWith("/") ? taskPath : "/" + taskPath);
        if (StringUtils.isNotBlank(taskId))
        {
            url = url + "/" + taskId;
        }
        return url;
    }

    private String defaultText(JsonNode node, String defaultValue)
    {
        if (node == null || node.isMissingNode() || node.isNull())
        {
            return defaultValue;
        }
        String text = node.asText();
        return StringUtils.isBlank(text) ? defaultValue : text;
    }

    private Long extractLong(JsonNode node)
    {
        if (node == null || node.isMissingNode() || node.isNull())
        {
            return null;
        }
        if (node.isNumber())
        {
            return node.asLong();
        }
        String text = node.asText();
        if (StringUtils.isBlank(text))
        {
            return null;
        }
        return Long.parseLong(text);
    }

    private String writeJson(JsonNode node)
    {
        try
        {
            return objectMapper.writeValueAsString(node);
        }
        catch (IOException e)
        {
            throw new ServiceException("知识图谱结果序列化失败");
        }
    }
}
