package com.hiprof.tp.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.hiprof.common.annotation.Excel;
import com.hiprof.common.core.domain.BaseEntity;

/**
 * 模块内容对象 tp_content
 * 
 * @author ruoyi
 * @date 2025-07-02
 */
@Schema(title = "教案模块内容对象")
public class TpContent extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** $column.columnComment */
    @Schema(title = "所属教案模块ID")
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private Long moduleId;

    /** $column.columnComment */
    @Schema(title = "教案模块内容")
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private String content;

    /** $column.columnComment */
    @Schema(title = "教案模块内容链接")
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private String fileUrl;


    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }
    public void setModuleId(Long moduleId) 
    {
        this.moduleId = moduleId;
    }

    public Long getModuleId() 
    {
        return moduleId;
    }
    public void setContent(String content) 
    {
        this.content = content;
    }

    public String getContent() 
    {
        return content;
    }
    public void setFileUrl(String fileUrl) 
    {
        this.fileUrl = fileUrl;
    }

    public String getFileUrl() 
    {
        return fileUrl;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("moduleId", getModuleId())
            .append("content", getContent())
            .append("fileUrl", getFileUrl())
            .toString();
    }
}
