package com.hiprof.core.controller;

import java.util.List;

import com.hiprof.common.core.domain.model.LoginUser;
import com.hiprof.core.domain.dto.KnowledgeGraphGenerateRequest;
import com.hiprof.core.domain.vo.ZstpGraphVo;
import com.hiprof.core.service.IKnowledgeAgentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.hiprof.common.annotation.Log;
import com.hiprof.common.core.controller.BaseController;
import com.hiprof.common.core.domain.AjaxResult;
import com.hiprof.common.enums.BusinessType;
import com.hiprof.core.domain.ZstpGraph;
import com.hiprof.core.service.IZstpGraphService;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.common.core.page.TableDataInfo;

/**
 * 知识图谱Controller
 * 
 * @author ruoyi
 * @date 2025-06-22
 */


@Tag(name="知识图谱管理")
@RestController
@RequestMapping("/core/zstp")
public class ZstpGraphController extends BaseController
{
    @Autowired
    private IZstpGraphService zstpGraphService;

    @Autowired
    private IKnowledgeAgentService knowledgeAgentService;

    /**
     * 查询知识图谱列表
     */
    @Operation(summary = "获取知识图谱列表")
    @GetMapping("/list")
    public TableDataInfo list(ZstpGraph zstpGraph)
    {
        startPage();
        List<ZstpGraphVo> list = zstpGraphService.selectZstpGraphList(zstpGraph);
        return getDataTable(list);
    }

    /**
     * 导出知识图谱列表
     */
//    @Log(title = "知识图谱", businessType = BusinessType.EXPORT)
//    @PostMapping("/export")
//    public void export(HttpServletResponse response, ZstpGraph zstpGraph)
//    {
//        List<ZstpGraph> list = zstpGraphService.selectZstpGraphList(zstpGraph);
//        ExcelUtil<ZstpGraph> util = new ExcelUtil<ZstpGraph>(ZstpGraph.class);
//        util.exportExcel(response, list, "知识图谱数据");
//    }

    /**
     * 获取知识图谱详细信息
     */
    @Operation(summary = "获取知识图谱详细信息")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(zstpGraphService.selectZstpGraphById(id));
    }

    /**
     * 新增知识图谱
     */
    @Operation(summary = "新增知识图谱")
    @Log(title = "知识图谱", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(
            @RequestBody
            ZstpGraph zstpGraph,
            @AuthenticationPrincipal
            LoginUser loginUser
    ) {
        zstpGraph.setCreateBy(loginUser.getUserId().toString());
        return toAjax(zstpGraphService.insertZstpGraph(zstpGraph));
    }

    @Operation(summary = "提交知识图谱智能体生成任务")
    @PostMapping("/agent/tasks")
    public AjaxResult createAgentTask(@RequestBody KnowledgeGraphGenerateRequest request)
    {
        return success(knowledgeAgentService.createTask(request));
    }

    @Operation(summary = "查询知识图谱智能体任务状态")
    @GetMapping("/agent/tasks/{taskId}")
    public AjaxResult getAgentTask(@PathVariable("taskId") String taskId)
    {
        return success(knowledgeAgentService.getTask(taskId));
    }

    @Operation(summary = "保存知识图谱智能体生成结果")
    @PostMapping("/agent/tasks/{taskId}/persist")
    public AjaxResult persistAgentTask(
            @PathVariable("taskId") String taskId,
            @AuthenticationPrincipal LoginUser loginUser
    )
    {
        Long graphId = knowledgeAgentService.persistTaskResult(taskId, loginUser.getUserId().toString());
        return AjaxResult.success("知识图谱保存成功", graphId);
    }

    /**
     * 修改知识图谱
     */
    @Operation(summary = "修改知识图谱")
    @Log(title = "知识图谱", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ZstpGraph zstpGraph)
    {
        return toAjax(zstpGraphService.updateZstpGraph(zstpGraph));
    }

    /**
     * 删除知识图谱
     */
    @Operation(summary = "删除知识图谱")
    @Log(title = "知识图谱", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        zstpGraphService.deleteZstpGraphByIds(ids);
        return toAjax(true);
    }
}
