package com.hiprof.core.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.hiprof.common.annotation.Excel;
import com.hiprof.common.core.domain.BaseEntity;

/**
 * 课程成员管理对象 cl_course_members
 * 
 * @author emiya
 * @date 2025-08-10
 */
@Schema(title = "课程成员管理对象")
public class ClCourseMembers extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 课程Id */
    @Schema(title = "课程Id")
    @Excel(name = "课程Id")
    private Long courseId;

    /** 用户Id */
    @Schema(title = "用户Id")
    @Excel(name = "用户Id")
    private Long userId;

    /** 0:教师,1:学生 */
    @Schema(title = "成员角色" ,description = "0:教师,1:学生")
    @Excel(name = "0:教师,1:学生")
    private String memberRole;

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setCourseId(Long courseId) 
    {
        this.courseId = courseId;
    }

    public Long getCourseId() 
    {
        return courseId;
    }

    public void setUserId(Long userId) 
    {
        this.userId = userId;
    }

    public Long getUserId() 
    {
        return userId;
    }

    public void setMemberRole(String memberRole) 
    {
        this.memberRole = memberRole;
    }

    public String getMemberRole() 
    {
        return memberRole;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("courseId", getCourseId())
            .append("userId", getUserId())
            .append("memberRole", getMemberRole())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
