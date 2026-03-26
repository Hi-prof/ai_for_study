package com.hiprof.core.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.hiprof.common.annotation.Excel;
import com.hiprof.common.core.domain.BaseEntity;

/**
 * 会话对象 chat_session
 * 
 * @author emiya
 * @date 2025-07-20
 */
@Schema(title = "会话对象")
public class ChatSession extends BaseEntity {
    private static final long serialVersionUID = 1L;

    /** 会话ID */
    @Schema(title = "会话ID")
    private Long id;

    /** 会话名，私聊无需名字 */
    @Schema(title = "会话名", description = "私聊无需名字,也是判断是否群聊的标志")
    @Excel(name = "会话名，私聊无需名字")
    private String name;

    /** 所属课程ID */
    @Schema(title = "所属课程ID")
    @Excel(name = "所属课程ID")
    private Long courseId;

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setName(String name) 
    {
        this.name = name;
    }

    public String getName() 
    {
        return name;
    }

    public void setCourseId(Long courseId)
    {
        this.courseId = courseId;
    }

    public Long getCourseId()
    {
        return courseId;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("name", getName())
            .append("courseId", getCourseId())
            .append("createBy", getCreateBy())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
