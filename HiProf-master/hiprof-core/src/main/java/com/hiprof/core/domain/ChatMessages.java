package com.hiprof.core.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.hiprof.common.annotation.Excel;
import com.hiprof.common.core.domain.BaseEntity;

/**
 * 会话消息管理对象 chat_messages
 * 
 * @author emiya
 * @date 2025-07-20
 */
@Schema(title = "会话消息管理对象")
public class ChatMessages extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 消息ID */
    @Schema(title = "消息ID")
    private Long id;

    /** 会话ID */
    @Schema(title = "所在会话ID")
    @Excel(name = "会话ID")
    private Long sessionId;

    /** $column.columnComment */
    @Schema(title = "消息内容")
    private String content;

    /** $column.columnComment */
    @Schema(title = "消息类型",
    description = "enum('text','image','video','other','audio')")
    private String contentType;

    /** $column.columnComment */
    @Schema(title = "消息文件")
    private String fileUrl;

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setSessionId(Long sessionId) 
    {
        this.sessionId = sessionId;
    }

    public Long getSessionId() 
    {
        return sessionId;
    }

    public void setContent(String content) 
    {
        this.content = content;
    }

    public String getContent() 
    {
        return content;
    }

    public void setContentType(String contentType) 
    {
        this.contentType = contentType;
    }

    public String getContentType() 
    {
        return contentType;
    }

    public void setFileUrl(String fileUrl) 
    {
        this.fileUrl = fileUrl;
    }

    public String getFileUrl() 
    {
        return fileUrl;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("sessionId", getSessionId())
            .append("createBy", getCreateBy())
            .append("content", getContent())
            .append("contentType", getContentType())
            .append("fileUrl", getFileUrl())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
