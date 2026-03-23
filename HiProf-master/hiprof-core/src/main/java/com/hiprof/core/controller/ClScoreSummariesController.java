package com.hiprof.core.controller;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Autowired;
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
import com.hiprof.core.domain.ClScoreSummaries;
import com.hiprof.core.service.IClScoreSummariesService;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.common.core.page.TableDataInfo;

/**
 * 分值统计表Controller
 * 
 * @author emiya
 * @date 2025-08-09
 */
@Tag(name = "分值统计表管理", description = "分值统计表")
@RestController
@RequestMapping("/core/summaries")
public class ClScoreSummariesController extends BaseController
{
    @Autowired
    private IClScoreSummariesService clScoreSummariesService;

    /**
     * 查询分值统计表列表
     */
    @Operation(summary = "查询分值统计表列表,必须有课程Id")
    @PreAuthorize("@ss.hasPermi('core:summaries:list')")
    @GetMapping("/list")
    public TableDataInfo list(ClScoreSummaries clScoreSummaries)
    {
        List<ClScoreSummaries> list = clScoreSummariesService.selectClScoreSummariesList(clScoreSummaries);
        return getDataTable(list);
    }

//    /**
//     * 导出分值统计表列表
//     */
//    @PreAuthorize("@ss.hasPermi('core:summaries:export')")
//    @Log(title = "分值统计表", businessType = BusinessType.EXPORT)
//    @PostMapping("/export")
//    public void export(HttpServletResponse response, ClScoreSummaries clScoreSummaries)
//    {
//        List<ClScoreSummaries> list = clScoreSummariesService.selectClScoreSummariesList(clScoreSummaries);
//        ExcelUtil<ClScoreSummaries> util = new ExcelUtil<ClScoreSummaries>(ClScoreSummaries.class);
//        util.exportExcel(response, list, "分值统计表数据");
//    }

    /**
     * 获取分值统计表详细信息
     */
    @Operation(summary = "获取分值统计表详细信息")
    @PreAuthorize("@ss.hasPermi('core:summaries:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(clScoreSummariesService.selectClScoreSummariesById(id));
    }

    /**
     * 新增分值统计表
     */
    @Operation(summary = "新增分值统计表,必须有课程Id")
    @PreAuthorize("@ss.hasPermi('core:summaries:add')")
    @Log(title = "分值统计表", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody ClScoreSummaries clScoreSummaries)
    {
        return toAjax(clScoreSummariesService.insertClScoreSummaries(clScoreSummaries));
    }

    /**
     * 修改分值统计表
     */
//    @PreAuthorize("@ss.hasPermi('core:summaries:edit')")
//    @Log(title = "分值统计表", businessType = BusinessType.UPDATE)
//    @PutMapping
//    public AjaxResult edit(@RequestBody ClScoreSummaries clScoreSummaries)
//    {
//        return toAjax(clScoreSummariesService.updateClScoreSummaries(clScoreSummaries));
//    }

    /**
     * 删除分值统计表
     */
    @Operation(summary = "删除分值统计表")
    @PreAuthorize("@ss.hasPermi('core:summaries:remove')")
    @Log(title = "分值统计表", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(clScoreSummariesService.deleteClScoreSummariesByIds(ids));
    }
}
