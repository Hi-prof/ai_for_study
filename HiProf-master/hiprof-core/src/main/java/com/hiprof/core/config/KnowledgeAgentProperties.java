package com.hiprof.core.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "knowledge-agent")
public class KnowledgeAgentProperties
{
    private boolean enabled = true;

    private String baseUrl = "http://127.0.0.1:18081";

    private String taskPath = "/api/v1/knowledge-agent/tasks";

    private int connectTimeout = 5000;

    private int readTimeout = 120000;

    public boolean isEnabled()
    {
        return enabled;
    }

    public void setEnabled(boolean enabled)
    {
        this.enabled = enabled;
    }

    public String getBaseUrl()
    {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl)
    {
        this.baseUrl = baseUrl;
    }

    public String getTaskPath()
    {
        return taskPath;
    }

    public void setTaskPath(String taskPath)
    {
        this.taskPath = taskPath;
    }

    public int getConnectTimeout()
    {
        return connectTimeout;
    }

    public void setConnectTimeout(int connectTimeout)
    {
        this.connectTimeout = connectTimeout;
    }

    public int getReadTimeout()
    {
        return readTimeout;
    }

    public void setReadTimeout(int readTimeout)
    {
        this.readTimeout = readTimeout;
    }
}
