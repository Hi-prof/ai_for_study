package com.hiprof.tp.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.hiprof.common.annotation.Excel;
import com.hiprof.common.core.domain.BaseEntity;

/**
 * 教案模块对象 tp_module
 * 
 * @author emiya
 * @date 2025-07-02
 */
@Schema(title = "教案模块对象")
public class TpModule extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** $column.columnComment */

    @Schema(title = "标题")
    private String title;

   @Schema(title = "所属教案id")
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private Long planId;

    /** $column.columnComment */
    @Schema(title = "排序")
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private Long sort;
    @Schema(title = "模块内容")
    private TpContent content;


    public TpContent getContent() {
		return content;
	}
    public void setContent(TpContent content) {
		this.content = content;
	}

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }
    public void setPlanId(Long planId) 
    {
        this.planId = planId;
    }

    public Long getPlanId() 
    {
        return planId;
    }
    public void setSort(Long sort) 
    {
        this.sort = sort;
    }

    public Long getSort() 
    {
        return sort;
    }


    public String getTitle() {
		return title;
	}

    public void setTitle(String title) {
		this.title = title;
	}



    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("planId", getPlanId())
            .append("sort", getSort())
            .append("title", getSort())
            .toString();
    }
}
