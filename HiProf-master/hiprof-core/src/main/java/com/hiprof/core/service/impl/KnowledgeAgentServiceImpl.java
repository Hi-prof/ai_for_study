package com.hiprof.core.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hiprof.common.exception.ServiceException;
import com.hiprof.common.utils.StringUtils;
import com.hiprof.core.config.KnowledgeAgentProperties;
import com.hiprof.core.domain.ZstpGraph;
import com.hiprof.core.domain.ZstpNode;
import com.hiprof.core.domain.dto.KnowledgeGraphGenerateRequest;
import com.hiprof.core.domain.vo.ZstpGraphVo;
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
import java.util.HashSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
public class KnowledgeAgentServiceImpl implements IKnowledgeAgentService
{
    private static final int TASK_POLL_INTERVAL_MS = 2000;
    private static final int TASK_MAX_POLL_ATTEMPTS = 300;

    private static class PersistResult
    {
        private final Long primaryGraphId;
        private final List<Long> graphIds;

        private PersistResult(Long primaryGraphId, List<Long> graphIds)
        {
            this.primaryGraphId = primaryGraphId;
            this.graphIds = graphIds;
        }

        private Long getPrimaryGraphId()
        {
            return primaryGraphId;
        }

        private List<Long> getGraphIds()
        {
            return graphIds;
        }

        private int getGraphCount()
        {
            return graphIds == null ? 0 : graphIds.size();
        }
    }

    @Autowired
    private KnowledgeAgentProperties knowledgeAgentProperties;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private IZstpGraphService zstpGraphService;

    @Autowired
    private IZstpNodeService zstpNodeService;

    private JsonNode createTask(KnowledgeGraphGenerateRequest request)
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
    public JsonNode generateDeepCard(JsonNode request)
    {
        if (request == null || request.isNull())
        {
            throw new ServiceException("深卡片生成请求不能为空");
        }
        return executeJsonRequest(HttpMethod.POST, buildDeepCardUrl(), request);
    }

    private JsonNode getTask(String taskId)
    {
        if (StringUtils.isBlank(taskId))
        {
            throw new ServiceException("任务ID不能为空");
        }
        return executeJsonRequest(HttpMethod.GET, buildTaskUrl(taskId), null);
    }

    @Transactional
    @Override
    public Map<String, Object> generateAndPersistGraph(KnowledgeGraphGenerateRequest request, String createBy)
    {
        JsonNode taskResponse = createTask(request);
        String taskId = defaultText(taskResponse.path("taskId"), null);
        if (StringUtils.isBlank(taskId))
        {
            throw new ServiceException("未获取到知识图谱任务ID");
        }

        JsonNode completedTask = waitForTaskCompletion(taskId);
        PersistResult persistResult = persistTaskContent(completedTask, createBy);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("taskId", taskId);
        result.put("graphId", persistResult.getPrimaryGraphId());
        result.put("graphIds", persistResult.getGraphIds());
        result.put("graphCount", persistResult.getGraphCount());
        result.put("graphName", defaultText(completedTask.path("result").path("graphTitle"), request.getCourseName()));
        result.put("result", completedTask.path("result"));
        result.put("task", completedTask);
        return result;
    }

    private JsonNode waitForTaskCompletion(String taskId)
    {
        JsonNode latestTask = null;
        for (int attempt = 0; attempt < TASK_MAX_POLL_ATTEMPTS; attempt++)
        {
            latestTask = getTask(taskId);
            String status = defaultText(latestTask.path("status"), "");
            if ("completed".equalsIgnoreCase(status))
            {
                return latestTask;
            }
            if ("failed".equalsIgnoreCase(status))
            {
                throw new ServiceException(defaultText(latestTask.path("error"), defaultText(latestTask.path("message"), "知识图谱生成失败")));
            }

            sleepQuietly(TASK_POLL_INTERVAL_MS);
        }

        throw new ServiceException("知识图谱生成超时，请稍后重试");
    }

    private PersistResult persistTaskContent(JsonNode taskNode, String createBy)
    {
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
        String graphType = defaultText(requestNode.path("graphType"), "0");

        if ("1".equals(graphType))
        {
            return persistChapterGraphs(resultNode, requestNode, courseId, graphType, createBy);
        }

        Long graphId = saveOrUpdateGraph(resultNode, requestNode, courseId, graphType, createBy);
        String courseRootName = defaultText(requestNode.path("courseName"), defaultText(resultNode.path("graphTitle"), "课程知识图谱"));
        replaceNodes(graphId, resultNode.path("nodes"), courseRootName);
        return new PersistResult(graphId, List.of(graphId));
    }

    private PersistResult persistChapterGraphs(JsonNode resultNode, JsonNode requestNode, Long courseId, String graphType, String operator)
    {
        if (courseId == null)
        {
            throw new ServiceException("课程ID不能为空，无法保存章节结构");
        }

        JsonNode nodesNode = resultNode.path("nodes");
        if (!nodesNode.isArray() || nodesNode.isEmpty())
        {
            throw new ServiceException("章节结果为空，无法保存章节结构");
        }

        List<JsonNode> orderedNodes = new ArrayList<>();
        nodesNode.forEach(orderedNodes::add);
        orderedNodes.sort(Comparator.comparingInt(item -> item.path("level").asInt(99)));

        Map<String, List<JsonNode>> childrenMap = buildChildrenMap(orderedNodes);
        List<JsonNode> rootNodes = childrenMap.getOrDefault("root", List.of());
        if (rootNodes.isEmpty())
        {
            throw new ServiceException("未识别到章节根节点，无法保存章节结构");
        }

        clearGraphs(courseId, graphType);

        List<Long> graphIds = new ArrayList<>();
        for (JsonNode rootNode : rootNodes)
        {
            Long graphId = createChapterGraph(rootNode, requestNode, courseId, graphType, operator);
            graphIds.add(graphId);
            saveChapterNodes(graphId, defaultText(rootNode.path("id"), null), childrenMap);
        }

        Long primaryGraphId = graphIds.isEmpty() ? null : graphIds.get(0);
        return new PersistResult(primaryGraphId, graphIds);
    }

    private Map<String, List<JsonNode>> buildChildrenMap(List<JsonNode> orderedNodes)
    {
        Map<String, List<JsonNode>> childrenMap = new LinkedHashMap<>();
        for (JsonNode node : orderedNodes)
        {
            String parentId = normalizeParentId(defaultText(node.path("parentId"), null));
            childrenMap.computeIfAbsent(parentId, key -> new ArrayList<>()).add(node);
        }
        return childrenMap;
    }

    private Long createChapterGraph(JsonNode rootNode, JsonNode requestNode, Long courseId, String graphType, String operator)
    {
        ZstpGraph chapterGraph = new ZstpGraph();
        chapterGraph.setCourseId(courseId);
        chapterGraph.setGraphType(graphType);
        chapterGraph.setName(defaultText(rootNode.path("title"), defaultText(requestNode.path("courseName"), "未命名章节")));
        chapterGraph.setContent(extractNodeContent(rootNode, defaultText(rootNode.path("title"), "")));
        chapterGraph.setCreateBy(operator);
        return zstpGraphService.insertZstpGraph(chapterGraph);
    }

    private void saveChapterNodes(Long graphId, String rootAgentId, Map<String, List<JsonNode>> childrenMap)
    {
        if (StringUtils.isBlank(rootAgentId))
        {
            return;
        }

        Map<String, Long> nodeIdMapping = new HashMap<>();
        List<JsonNode> firstLevelNodes = childrenMap.getOrDefault(rootAgentId, List.of());
        for (JsonNode childNode : firstLevelNodes)
        {
            saveChapterNodeRecursive(graphId, rootAgentId, childNode, childrenMap, nodeIdMapping);
        }
    }

    private void saveChapterNodeRecursive(Long graphId, String rootAgentId, JsonNode node, Map<String, List<JsonNode>> childrenMap, Map<String, Long> nodeIdMapping)
    {
        String agentNodeId = defaultText(node.path("id"), null);
        if (StringUtils.isBlank(agentNodeId))
        {
            return;
        }

        String parentAgentId = defaultText(node.path("parentId"), null);
        Long parentDbId = rootAgentId.equals(parentAgentId) ? graphId : nodeIdMapping.get(parentAgentId);
        if (parentDbId == null)
        {
            parentDbId = graphId;
        }

        ZstpNode zstpNode = new ZstpNode();
        zstpNode.setGraphId(graphId);
        zstpNode.setParentId(parentDbId);
        zstpNode.setName(defaultText(node.path("title"), "未命名节点"));
        zstpNode.setContent(extractNodeContent(node, defaultText(node.path("title"), "未命名节点")));

        Long createdNodeId = zstpNodeService.insertZstpNode(zstpNode);
        nodeIdMapping.put(agentNodeId, createdNodeId);

        List<JsonNode> childNodes = childrenMap.getOrDefault(agentNodeId, List.of());
        for (JsonNode childNode : childNodes)
        {
            saveChapterNodeRecursive(graphId, rootAgentId, childNode, childrenMap, nodeIdMapping);
        }
    }

    private Long saveOrUpdateGraph(JsonNode resultNode, JsonNode requestNode, Long courseId, String graphType, String operator)
    {
        String graphName = defaultText(resultNode.path("graphTitle"), defaultText(requestNode.path("courseName"), "未命名知识图谱"));
        String graphContent = writeJson(resultNode);
        ZstpGraph existingGraph = findExistingGraph(courseId, graphType);

        if (existingGraph != null)
        {
            existingGraph.setName(graphName);
            existingGraph.setCourseId(courseId);
            existingGraph.setGraphType(graphType);
            existingGraph.setContent(graphContent);
            existingGraph.setUpdateBy(operator);
            zstpGraphService.updateZstpGraph(existingGraph);
            return existingGraph.getId();
        }

        ZstpGraph zstpGraph = new ZstpGraph();
        zstpGraph.setName(graphName);
        zstpGraph.setCourseId(courseId);
        zstpGraph.setGraphType(graphType);
        zstpGraph.setContent(graphContent);
        zstpGraph.setCreateBy(operator);
        return zstpGraphService.insertZstpGraph(zstpGraph);
    }

    private ZstpGraph findExistingGraph(Long courseId, String graphType)
    {
        if (courseId == null)
        {
            return null;
        }

        ZstpGraph query = new ZstpGraph();
        query.setCourseId(courseId);
        query.setGraphType(graphType);
        List<ZstpGraphVo> graphList = zstpGraphService.selectZstpGraphList(query);
        if (graphList == null || graphList.isEmpty())
        {
            return null;
        }
        return graphList.get(0);
    }

    private void replaceNodes(Long graphId, JsonNode nodesNode, String courseRootName)
    {
        clearGraphNodes(graphId);
        saveNodes(graphId, nodesNode, courseRootName);
    }

    private void clearGraphNodes(Long graphId)
    {
        if (graphId == null)
        {
            return;
        }

        ZstpNode query = new ZstpNode();
        query.setGraphId(graphId);
        List<ZstpNode> existingNodes = zstpNodeService.selectZstpNodeList(query);
        if (existingNodes == null || existingNodes.isEmpty())
        {
            return;
        }

        Long[] nodeIds = existingNodes.stream().map(ZstpNode::getId).distinct().toArray(Long[]::new);
        zstpNodeService.deleteZstpNodeByIds(nodeIds);
    }

    private void clearGraphs(Long courseId, String graphType)
    {
        ZstpGraph query = new ZstpGraph();
        query.setCourseId(courseId);
        query.setGraphType(graphType);
        List<ZstpGraphVo> graphList = zstpGraphService.selectZstpGraphList(query);
        if (graphList == null || graphList.isEmpty())
        {
            return;
        }

        Long[] graphIds = graphList.stream().map(ZstpGraph::getId).distinct().toArray(Long[]::new);
        zstpGraphService.deleteZstpGraphByIds(graphIds);
    }

    private String normalizeParentId(String parentId)
    {
        if (StringUtils.isBlank(parentId) || "0".equals(parentId))
        {
            return "root";
        }
        return parentId;
    }

    private String extractNodeContent(JsonNode node, String defaultValue)
    {
        String[] fieldCandidates = { "content", "context", "description", "summary" };
        for (String field : fieldCandidates)
        {
            String value = defaultText(node.path(field), null);
            if (StringUtils.isNotBlank(value))
            {
                return value;
            }
        }
        return defaultValue;
    }

    private void sleepQuietly(long millis)
    {
        try
        {
            TimeUnit.MILLISECONDS.sleep(millis);
        }
        catch (InterruptedException e)
        {
            Thread.currentThread().interrupt();
            throw new ServiceException("等待知识图谱生成结果时被中断");
        }
    }

    private void saveNodes(Long graphId, JsonNode nodesNode, String courseRootName)
    {
        if (!nodesNode.isArray() || nodesNode.isEmpty())
        {
            return;
        }

        List<JsonNode> orderedNodes = new ArrayList<>();
        nodesNode.forEach(orderedNodes::add);
        orderedNodes.sort(Comparator.comparingInt(item -> item.path("level").asInt(99)));

        Map<String, JsonNode> orderedNodesById = new LinkedHashMap<>();
        for (JsonNode item : orderedNodes)
        {
            String agentNodeId = defaultText(item.path("id"), null);
            if (StringUtils.isBlank(agentNodeId))
            {
                continue;
            }
            orderedNodesById.put(agentNodeId, item);
        }

        if (orderedNodesById.isEmpty())
        {
            return;
        }

        Map<String, List<JsonNode>> childrenMap = buildGraphChildrenMap(orderedNodesById);
        List<JsonNode> rootNodes = childrenMap.getOrDefault("root", List.of());

        Map<String, Long> nodeIdMapping = new HashMap<>();
        Set<String> savedAgentIds = new HashSet<>();
        String resolvedCourseRootName = resolveCourseRootName(courseRootName);
        Long entryParentId = null;

        if (rootNodes.size() != 1 || !isCourseRootNode(rootNodes.get(0), resolvedCourseRootName))
        {
            entryParentId = insertSyntheticRootNode(graphId, resolvedCourseRootName);
        }

        for (JsonNode rootNode : rootNodes)
        {
            saveGraphNodeRecursive(graphId, rootNode, entryParentId, childrenMap, nodeIdMapping, savedAgentIds);
        }

        if (entryParentId == null && rootNodes.size() == 1)
        {
            String rootAgentId = defaultText(rootNodes.get(0).path("id"), null);
            if (StringUtils.isNotBlank(rootAgentId))
            {
                entryParentId = nodeIdMapping.get(rootAgentId);
            }
        }

        for (JsonNode node : orderedNodesById.values())
        {
            String agentNodeId = defaultText(node.path("id"), null);
            if (StringUtils.isBlank(agentNodeId) || savedAgentIds.contains(agentNodeId))
            {
                continue;
            }
            saveGraphNodeRecursive(graphId, node, entryParentId, childrenMap, nodeIdMapping, savedAgentIds);
        }
    }

    private Map<String, List<JsonNode>> buildGraphChildrenMap(Map<String, JsonNode> orderedNodesById)
    {
        Map<String, List<JsonNode>> childrenMap = new LinkedHashMap<>();
        for (JsonNode node : orderedNodesById.values())
        {
            String parentAgentId = normalizeParentId(defaultText(node.path("parentId"), null));
            if (!"root".equals(parentAgentId) && !orderedNodesById.containsKey(parentAgentId))
            {
                parentAgentId = "root";
            }
            childrenMap.computeIfAbsent(parentAgentId, key -> new ArrayList<>()).add(node);
        }
        return childrenMap;
    }

    private void saveGraphNodeRecursive(Long graphId, JsonNode node, Long parentDbId, Map<String, List<JsonNode>> childrenMap,
                                        Map<String, Long> nodeIdMapping, Set<String> savedAgentIds)
    {
        String agentNodeId = defaultText(node.path("id"), null);
        if (StringUtils.isBlank(agentNodeId) || savedAgentIds.contains(agentNodeId))
        {
            return;
        }

        Long createdNodeId = insertGraphNode(graphId, node, parentDbId);
        nodeIdMapping.put(agentNodeId, createdNodeId);
        savedAgentIds.add(agentNodeId);

        List<JsonNode> childNodes = childrenMap.getOrDefault(agentNodeId, List.of());
        for (JsonNode childNode : childNodes)
        {
            saveGraphNodeRecursive(graphId, childNode, createdNodeId, childrenMap, nodeIdMapping, savedAgentIds);
        }
    }

    private Long insertGraphNode(Long graphId, JsonNode node, Long parentDbId)
    {
        ZstpNode zstpNode = new ZstpNode();
        zstpNode.setGraphId(graphId);
        zstpNode.setParentId(parentDbId);
        zstpNode.setName(defaultText(node.path("title"), defaultText(node.path("name"), "未命名节点")));
        zstpNode.setContent(writeJson(node));
        return zstpNodeService.insertZstpNode(zstpNode);
    }

    private Long insertSyntheticRootNode(Long graphId, String courseRootName)
    {
        ZstpNode rootNode = new ZstpNode();
        rootNode.setGraphId(graphId);
        rootNode.setParentId(null);
        rootNode.setName(courseRootName);
        rootNode.setContent(courseRootName);
        return zstpNodeService.insertZstpNode(rootNode);
    }

    private boolean isCourseRootNode(JsonNode node, String courseRootName)
    {
        if (node == null || StringUtils.isBlank(courseRootName))
        {
            return false;
        }

        String nodeName = defaultText(node.path("title"), defaultText(node.path("name"), null));
        return StringUtils.equals(StringUtils.trim(nodeName), StringUtils.trim(courseRootName));
    }

    private String resolveCourseRootName(String courseRootName)
    {
        return StringUtils.defaultIfBlank(StringUtils.trim(courseRootName), "课程知识图谱");
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

    private String buildDeepCardUrl()
    {
        String baseUrl = StringUtils.stripEnd(knowledgeAgentProperties.getBaseUrl(), "/");
        return baseUrl + "/api/v1/knowledge-agent/deep-card";
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
