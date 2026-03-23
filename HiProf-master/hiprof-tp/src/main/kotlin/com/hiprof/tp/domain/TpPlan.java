package com.hiprof.tp.domain;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.hiprof.common.annotation.Excel;
import com.hiprof.common.core.domain.BaseEntity;

/**
 * 教案管理对象 tp_plan
 * 
 * @author emiya
 * @date 2025-07-02
 */
@Schema(title = "教案对象")
public class TpPlan extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    @Schema(title = "教案id")
    private Long id;

    /** $column.columnComment */
    @Schema(title = "教案标题")
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private String title;

    /** 教案模块信息 */
    @Schema(title = "教案子模块列表")
    private List<TpModule> tpModuleList;

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getTitle() {
        return title;
    }


    public List<TpModule> getTpModuleList() {
        return tpModuleList;
    }

    public void setTpModuleList(List<TpModule> tpModuleList) {
        this.tpModuleList = tpModuleList;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("title", getTitle())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .append("tpModuleList", getTpModuleList())
            .toString();
    }
}
