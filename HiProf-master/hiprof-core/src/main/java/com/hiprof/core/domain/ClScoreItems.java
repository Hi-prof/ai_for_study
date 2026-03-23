package com.hiprof.core.domain;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.hiprof.common.annotation.Excel;
import com.hiprof.common.core.domain.BaseEntity;

/**
 * 分值变更项目对象 cl_score_items
 * 
 * @author emiya
 * @date 2025-08-09
 */
@Schema(title = "分值变更项目对象")
public class ClScoreItems extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** 所属课程ID */
    @Schema(title = "所属课程ID")
    @Excel(name = "所属课程ID")
    private Long courseId;

    /** 如:课堂表现、作业 */
    @Schema(title = "项目名称",description = "如:课堂表现、作业")
    @Excel(name = "如:课堂表现、作业")
    private String itemName;

    /** 变动类型 */
    @Schema(title = "变动类型",description = "regular:常规（带小数点）,extra:额外(不带小数点),penalty:扣分（不带小数点）")
    @Excel(name = "变动类型")
    private String itemType;

    /** 权重系数 */
    @Schema(title = "权重系数")
    private BigDecimal itemWeight;

    /** 该项目最高分 */
    @Schema(title = "该项目最高分")
    private Long maxScore;

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

    public void setItemName(String itemName) 
    {
        this.itemName = itemName;
    }

    public String getItemName() 
    {
        return itemName;
    }

    public void setItemType(String itemType) 
    {
        this.itemType = itemType;
    }

    public String getItemType() 
    {
        return itemType;
    }

    public void setItemWeight(BigDecimal itemWeight) 
    {
        this.itemWeight = itemWeight;
    }

    public BigDecimal getItemWeight() 
    {
        return itemWeight;
    }

    public void setMaxScore(Long maxScore) 
    {
        this.maxScore = maxScore;
    }

    public Long getMaxScore() 
    {
        return maxScore;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("courseId", getCourseId())
            .append("itemName", getItemName())
            .append("itemType", getItemType())
            .append("itemWeight", getItemWeight())
            .append("maxScore", getMaxScore())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
