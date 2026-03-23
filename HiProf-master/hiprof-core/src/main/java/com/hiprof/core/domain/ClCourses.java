package com.hiprof.core.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.hiprof.common.annotation.Excel;
import com.hiprof.common.core.domain.BaseEntity;

/**
 * 课程管理对象 cl_courses
 * 
 * @author emiya
 * @date 2025-07-20
 */
@Schema(title = "课程对象")
public class ClCourses extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 课程名称 */
    @Schema(title = "课程名称")
    @Excel(name = "课程名称")
    private String name;

    /** 课程描述 */
    @Schema(title = "课程描述")
    private String description;

    /** 专业ID */
    @Schema(title = "所属专业")
    @Excel(name = "专业ID")
    private Long majorId;

    /** 班级名称 */
    @Schema(title = "班级名称")
    @Excel(name = "班级名称")
    private String className;

    /** 教师ID */
    @Schema(title = "所属教师")
    @Excel(name = "教师ID")
    private Long teacherId;

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

    public void setDescription(String title) 
    {
        this.description = title;
    }

    public String getDescription() 
    {
        return description;
    }

    public void setMajorId(Long majorId)
    {
        this.majorId = majorId;
    }

    public Long getMajorId()
    {
        return majorId;
    }

    public void setClassName(String className)
    {
        this.className = className;
    }

    public String getClassName()
    {
        return className;
    }

    public void setTeacherId(Long teacherId)
    {
        this.teacherId = teacherId;
    }

    public Long getTeacherId() 
    {
        return teacherId;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("name", getName())
            .append("description", getDescription())
            .append("majorId", getMajorId())
            .append("className", getClassName())
            .append("teacherId", getTeacherId())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
