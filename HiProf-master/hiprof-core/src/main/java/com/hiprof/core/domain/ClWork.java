package com.hiprof.core.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.hiprof.common.annotation.Excel;
import com.hiprof.common.core.domain.BaseEntity;

import java.util.Date;

/**
 * 作业管理对象 cl_work
 * 
 * @author emiya
 * @date 2025-07-20
 */
@Schema(title = "作业对象")
public class ClWork extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 作业名称 */
    @Schema(title = "作业名称")
    @Excel(name = "作业名称")
    private String name;

    /** 教师上传文件 */
    @Schema(title = "教师上传文件")
    private String tFile;

    /** 教师上传内容 */
    @Schema(title = "教师上传内容")
    private String tContent;

    /** 学生上传文件 */
    @Schema(title = "学生上传文件")
    private String sFile;

    /** 学生上传内容 */
    @Schema(title = "学生上传内容")
    private String sContent;

    /** 课程ID */
    @Schema(title = "所属课程ID")
    @Excel(name = "课程ID")
    private Long courseId;

    @Schema(title = "作业截止时间")
    private Date overTime;

    public Date getOverTime() {
        return overTime;
    }

    public void setOverTime(Date overTime) {
        this.overTime = overTime;
    }

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

    public void settFile(String tFile) 
    {
        this.tFile = tFile;
    }

    public String gettFile() 
    {
        return tFile;
    }

    public void settContent(String tContent) 
    {
        this.tContent = tContent;
    }

    public String gettContent() 
    {
        return tContent;
    }

    public void setsFile(String sFile) 
    {
        this.sFile = sFile;
    }

    public String getsFile() 
    {
        return sFile;
    }

    public void setsContent(String sContent) 
    {
        this.sContent = sContent;
    }

    public String getsContent() 
    {
        return sContent;
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
            .append("tFile", gettFile())
            .append("tContent", gettContent())
            .append("sFile", getsFile())
            .append("sContent", getsContent())
            .append("courseId", getCourseId())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .append("overTime", getOverTime())
            .toString();
    }
}
