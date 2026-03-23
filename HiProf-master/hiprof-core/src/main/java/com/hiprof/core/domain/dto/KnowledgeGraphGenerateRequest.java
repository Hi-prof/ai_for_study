package com.hiprof.core.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.ArrayList;
import java.util.List;

@Schema(description = "知识图谱智能体生成请求")
public class KnowledgeGraphGenerateRequest
{
    @Schema(title = "课程ID")
    private Long courseId;

    @Schema(title = "课程名称")
    private String courseName;

    @Schema(title = "教师要求")
    private String teacherRequirements;

    @Schema(title = "资料文本")
    private String sourceText;

    @Schema(title = "PDF 文件路径列表")
    private List<String> pdfPaths = new ArrayList<>();

    @Schema(title = "重点知识点")
    private List<String> focusNodes = new ArrayList<>();

    @Schema(title = "图谱类型", description = "0为图谱,1为章节")
    private String graphType = "0";

    public Long getCourseId()
    {
        return courseId;
    }

    public void setCourseId(Long courseId)
    {
        this.courseId = courseId;
    }

    public String getCourseName()
    {
        return courseName;
    }

    public void setCourseName(String courseName)
    {
        this.courseName = courseName;
    }

    public String getTeacherRequirements()
    {
        return teacherRequirements;
    }

    public void setTeacherRequirements(String teacherRequirements)
    {
        this.teacherRequirements = teacherRequirements;
    }

    public String getSourceText()
    {
        return sourceText;
    }

    public void setSourceText(String sourceText)
    {
        this.sourceText = sourceText;
    }

    public List<String> getPdfPaths()
    {
        return pdfPaths;
    }

    public void setPdfPaths(List<String> pdfPaths)
    {
        this.pdfPaths = pdfPaths;
    }

    public List<String> getFocusNodes()
    {
        return focusNodes;
    }

    public void setFocusNodes(List<String> focusNodes)
    {
        this.focusNodes = focusNodes;
    }

    public String getGraphType()
    {
        return graphType;
    }

    public void setGraphType(String graphType)
    {
        this.graphType = graphType;
    }
}
