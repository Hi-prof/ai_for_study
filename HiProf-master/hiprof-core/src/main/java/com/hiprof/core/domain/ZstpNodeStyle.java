package com.hiprof.core.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.hiprof.common.annotation.Excel;
import com.hiprof.common.core.domain.BaseEntity;

/**
 * 节点样式对象 zstp_node_style
 * 
 * @author ruoyi
 * @date 2025-06-22
 */
@Schema(description = "节点样式实体")
public class ZstpNodeStyle extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** $column.columnComment */
    private Long id;

    /** $column.columnComment */
    @Schema(title = "该样式所属节点")
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private Long nodeId;

    /** $column.columnComment */
    @Schema(title = "该样式所属节点类型")
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private String type;

    /** $column.columnComment */
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private String color;

    /** $column.columnComment */
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private Long nodeShape;

    /** $column.columnComment */
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private Long width;

    /** $column.columnComment */
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private Long height;

    /** $column.columnComment */
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private Long borderWidth;

    /** $column.columnComment */
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private Long borderHeight;

    /** $column.columnComment */
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private String fixed;

    /** $column.columnComment */
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private Long x;

    /** $column.columnComment */
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private Long y;

    /** $column.columnComment */
    @Excel(name = "${comment}", readConverterExp = "$column.readConverterExp()")
    private String fontColor;

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
    }

    public void setNodeId(Long nodeId) 
    {
        this.nodeId = nodeId;
    }

    public Long getNodeId() 
    {
        return nodeId;
    }

    public void setType(String type) 
    {
        this.type = type;
    }

    public String getType() 
    {
        return type;
    }

    public void setColor(String color) 
    {
        this.color = color;
    }

    public String getColor() 
    {
        return color;
    }

    public void setNodeShape(Long nodeShape) 
    {
        this.nodeShape = nodeShape;
    }

    public Long getNodeShape() 
    {
        return nodeShape;
    }

    public void setWidth(Long width) 
    {
        this.width = width;
    }

    public Long getWidth() 
    {
        return width;
    }

    public void setHeight(Long height) 
    {
        this.height = height;
    }

    public Long getHeight() 
    {
        return height;
    }

    public void setBorderWidth(Long borderWidth) 
    {
        this.borderWidth = borderWidth;
    }

    public Long getBorderWidth() 
    {
        return borderWidth;
    }

    public void setBorderHeight(Long borderHeight) 
    {
        this.borderHeight = borderHeight;
    }

    public Long getBorderHeight() 
    {
        return borderHeight;
    }

    public void setFixed(String fixed) 
    {
        this.fixed = fixed;
    }

    public String getFixed() 
    {
        return fixed;
    }

    public void setX(Long x) 
    {
        this.x = x;
    }

    public Long getX() 
    {
        return x;
    }

    public void setY(Long y) 
    {
        this.y = y;
    }

    public Long getY() 
    {
        return y;
    }

    public void setFontColor(String fontColor) 
    {
        this.fontColor = fontColor;
    }

    public String getFontColor() 
    {
        return fontColor;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("nodeId", getNodeId())
            .append("type", getType())
            .append("color", getColor())
            .append("nodeShape", getNodeShape())
            .append("width", getWidth())
            .append("height", getHeight())
            .append("borderWidth", getBorderWidth())
            .append("borderHeight", getBorderHeight())
            .append("fixed", getFixed())
            .append("x", getX())
            .append("y", getY())
            .append("fontColor", getFontColor())
            .toString();
    }
}
