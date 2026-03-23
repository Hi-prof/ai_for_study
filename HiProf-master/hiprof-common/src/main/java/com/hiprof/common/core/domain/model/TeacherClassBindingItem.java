package com.hiprof.common.core.domain.model;

import java.io.Serializable;

/**
 * 教师班级绑定表单项
 */
public class TeacherClassBindingItem implements Serializable
{
    private static final long serialVersionUID = 1L;

    /** 专业ID */
    private Long majorId;

    /** 班级名称 */
    private String className;

    public Long getMajorId()
    {
        return majorId;
    }

    public void setMajorId(Long majorId)
    {
        this.majorId = majorId;
    }

    public String getClassName()
    {
        return className;
    }

    public void setClassName(String className)
    {
        this.className = className;
    }
}
