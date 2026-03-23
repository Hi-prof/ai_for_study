package com.hiprof.core.domain;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.hiprof.common.annotation.Excel;
import com.hiprof.common.core.domain.BaseEntity;

/**
 * 分值变更记录对象 cl_score_records
 * 
 * @author emiya
 * @date 2025-08-09
 */
@Schema(title = "分值变更记录对象")
public class ClScoreRecords extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 所属分值变更项目ID */
    @Schema(title = "所属分值变更项目ID")
    @Excel(name = "所属分值变更项目ID")
    private Long itemId;

    /** 所属学生ID */
    @Schema(title = "所属学生ID")
    private Long studentId;

    /** 所属课程ID */
    @Schema(title = "所属课程ID")
    private Long courseId;

    /** 得分值 */
    @Schema(title = "得分值")
    private BigDecimal score;

    /** 评分人 */

    @Schema(title = "评分人")
    private Long graderId;

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setItemId(Long itemId) 
    {
        this.itemId = itemId;
    }

    public Long getItemId() 
    {
        return itemId;
    }

    public void setStudentId(Long studentId) 
    {
        this.studentId = studentId;
    }

    public Long getStudentId() 
    {
        return studentId;
    }

    public void setCourseId(Long courseId) 
    {
        this.courseId = courseId;
    }

    public Long getCourseId() 
    {
        return courseId;
    }

    public void setScore(BigDecimal score) 
    {
        this.score = score;
    }

    public BigDecimal getScore() 
    {
        return score;
    }

    public void setGraderId(Long graderId) 
    {
        this.graderId = graderId;
    }

    public Long getGraderId() 
    {
        return graderId;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("itemId", getItemId())
            .append("studentId", getStudentId())
            .append("courseId", getCourseId())
            .append("score", getScore())
            .append("remark", getRemark())
            .append("graderId", getGraderId())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
