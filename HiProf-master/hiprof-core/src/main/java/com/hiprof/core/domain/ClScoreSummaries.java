package com.hiprof.core.domain;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.hiprof.common.annotation.Excel;
import com.hiprof.common.core.domain.BaseEntity;

/**
 * 分值统计表对象 cl_score_summaries
 * 
 * @author emiya
 * @date 2025-08-09
 */
@Schema(title = "分值统计表对象")
public class ClScoreSummaries extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 所属学生Id */
    @Schema(title = "所属学生Id")
    @Excel(name = "所属学生Id")
    private Long studentId;

    /** 所属课程ID */
    @Schema(title = "所属课程Id"  )
    @Excel(name = "所属课程ID")
    private Long courseId;

    /** 常规分 */
    @Schema(title = "常规分值")
    @Excel(name = "常规分")
    private BigDecimal regularScore;

    /** 附加分 */
    @Schema(title = "附加分")
    @Excel(name = "附加分")
    private BigDecimal extraScore;

    /** 扣分 */
    @Schema(title = "扣分")
    @Excel(name = "扣分")
    private BigDecimal penaltyScore;

    /** 总分 */
    @Schema(title = "总分")
    @Excel(name = "总分")
    private BigDecimal totalScore;

    /** 班级排名 */
    @Schema(title = "班级排名")
    @Excel(name = "班级排名")
    private Long ranking;

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
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

    public void setRegularScore(BigDecimal regularScore) 
    {
        this.regularScore = regularScore;
    }

    public BigDecimal getRegularScore() 
    {
        return regularScore;
    }

    public void setExtraScore(BigDecimal extraScore) 
    {
        this.extraScore = extraScore;
    }

    public BigDecimal getExtraScore() 
    {
        return extraScore;
    }

    public void setPenaltyScore(BigDecimal penaltyScore) 
    {
        this.penaltyScore = penaltyScore;
    }

    public BigDecimal getPenaltyScore() 
    {
        return penaltyScore;
    }

    public void setTotalScore(BigDecimal totalScore) 
    {
        this.totalScore = totalScore;
    }

    public BigDecimal getTotalScore() 
    {
        return totalScore;
    }

    public void setRanking(Long ranking) 
    {
        this.ranking = ranking;
    }

    public Long getRanking() 
    {
        return ranking;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("studentId", getStudentId())
            .append("courseId", getCourseId())
            .append("regularScore", getRegularScore())
            .append("extraScore", getExtraScore())
            .append("penaltyScore", getPenaltyScore())
            .append("totalScore", getTotalScore())
            .append("ranking", getRanking())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
