package com.hiprof.core.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.hiprof.common.annotation.Excel;
import com.hiprof.common.core.domain.BaseEntity;

/**
 * 课程文件对象 cl_files
 * 
 * @author emiya
 * @date 2025-08-07
 */
@Schema(title = "课程文件对象")
public class ClFiles extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 文件ID */
    @Schema(title = "文件ID")
    private Long id;

    /** 所属课程 */
    @Schema(title = "所属课程")
    @Excel(name = "所属课程")
    private Long courseId;

    /** 文件地址 */
    @Schema(title = "文件地址")
    @Excel(name = "文件地址")
    private String fileUrl;

    /** 文件类型 */
    @Schema(title = "文件mime类型",
    description = "如：image/apng ，application/pdf，text/plain")
    @Excel(name = "文件类型"
    )
    private String fileType;

    /** 文件大小 */
    @Schema(title = "文件大小,单位字节")
    @Excel(name = "文件大小")
    private Long fileSize;

    @Schema(title = "文件在阿里云Oss上对应的Key")
    private String fileKey;

    @Schema(title = "文件显示名称")
    private  String fileName;

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileKey() {
        return fileKey;
    }

    public void setFileKey(String fileKey) {
        this.fileKey = fileKey;
    }

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

    public void setFileUrl(String fileUrl) 
    {
        this.fileUrl = fileUrl;
    }

    public String getFileUrl() 
    {
        return fileUrl;
    }

    public void setFileType(String fileType) 
    {
        this.fileType = fileType;
    }

    public String getFileType() 
    {
        return fileType;
    }

    public void setFileSize(Long fileSize) 
    {
        this.fileSize = fileSize;
    }

    public Long getFileSize() 
    {
        return fileSize;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("courseId", getCourseId())
            .append("fileUrl", getFileUrl())
            .append("fileType", getFileType())
            .append("fileSize", getFileSize())
            .append("createBy", getCreateBy())
            .append("createTime", getCreateTime())
            .append("updateTime", getUpdateTime())
            .toString();
    }
}
