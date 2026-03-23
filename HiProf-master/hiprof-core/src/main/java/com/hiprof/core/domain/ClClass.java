package com.hiprof.core.domain;

import com.hiprof.common.annotation.Excel;
import com.hiprof.common.core.domain.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

/**
 * 班级管理对象 cl_classes
 */
@Schema(title = "班级管理对象")
public class ClClass extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 班级ID */
    private Long classId;

    /** 专业ID */
    @Excel(name = "专业ID")
    @Schema(title = "专业ID")
    private Long majorId;

    /** 专业名称 */
    @Excel(name = "专业名称")
    @Schema(title = "专业名称")
    private String majorName;

    /** 班级名称 */
    @Excel(name = "班级名称")
    @Schema(title = "班级名称")
    private String className;

    /** 状态 */
    @Excel(name = "状态", readConverterExp = "0=正常,1=停用")
    @Schema(title = "状态")
    private String status;

    /** 备注 */
    @Excel(name = "备注")
    @Schema(title = "备注")
    private String remark;

    public Long getClassId()
    {
        return classId;
    }

    public void setClassId(Long classId)
    {
        this.classId = classId;
    }

    public Long getMajorId()
    {
        return majorId;
    }

    public void setMajorId(Long majorId)
    {
        this.majorId = majorId;
    }

    public String getMajorName()
    {
        return majorName;
    }

    public void setMajorName(String majorName)
    {
        this.majorName = majorName;
    }

    public String getClassName()
    {
        return className;
    }

    public void setClassName(String className)
    {
        this.className = className;
    }

    public String getStatus()
    {
        return status;
    }

    public void setStatus(String status)
    {
        this.status = status;
    }

    public String getRemark()
    {
        return remark;
    }

    public void setRemark(String remark)
    {
        this.remark = remark;
    }

    @Override
    public String toString()
    {
        return new ToStringBuilder(this, ToStringStyle.MULTI_LINE_STYLE)
            .append("classId", getClassId())
            .append("majorId", getMajorId())
            .append("majorName", getMajorName())
            .append("className", getClassName())
            .append("status", getStatus())
            .append("remark", getRemark())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
