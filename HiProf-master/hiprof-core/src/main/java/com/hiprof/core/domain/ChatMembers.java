package com.hiprof.core.domain;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.hiprof.common.annotation.Excel;
import com.hiprof.common.core.domain.BaseEntity;

/**
 * 会话成员管理对象 chat_members
 * 
 * @author emiya
 * @date 2025-07-20
 */

@Schema(title = "会话成员管理对象")
public class ChatMembers extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 成员ID */
    @Schema(title = "会话成员ID",
    requiredMode =  Schema.RequiredMode.NOT_REQUIRED)
    private Long id;

    /** 会话ID */
    @Schema(title = "所在会话ID")
    @Excel(name = "会话ID")
    private Long sessionId;

    /** 用户ID */
    @Schema(title = "会话成员用户ID",
            description = "",
            requiredMode = Schema.RequiredMode.REQUIRED)
    @Excel(name = "用户ID")
    private Long userId;

    /** 会话权限 */
    @Schema(title = "会话成员权限",
            description = "admin-群主 ,member-成员,owner-管理 ",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @Excel(name = "会话权限")
    private String role;

    /** 未读数量 */
    @Excel(name = "未读数量")
    @Schema(title = "未读消息数量")
    private Long unreadCount;

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

    public void setUserId(Long userId) 
    {
        this.userId = userId;
    }

    public Long getUserId() 
    {
        return userId;
    }

    public void setRole(String role) 
    {
        this.role = role;
    }

    public String getRole() 
    {
        return role;
    }

    public void setUnreadCount(Long unreadCount) 
    {
        this.unreadCount = unreadCount;
    }

    public Long getUnreadCount() 
    {
        return unreadCount;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("sessionId", getSessionId())
            .append("userId", getUserId())
            .append("role", getRole())
            .append("unreadCount", getUnreadCount())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
