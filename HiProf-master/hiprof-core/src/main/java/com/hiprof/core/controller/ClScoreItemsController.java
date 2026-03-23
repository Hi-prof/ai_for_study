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
import com.hiprof.core.domain.ClScoreItems;
import com.hiprof.core.service.IClScoreItemsService;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.common.core.page.TableDataInfo;

/**
 * 分值变更项目Controller
 * 
 * @author emiya
 * @date 2025-08-09
 */
@Tag(name = "分值变更项目管理", description = "分值变更项目")
@RestController
@RequestMapping("/core/items")
public class ClScoreItemsController extends BaseController
{
    @Autowired
    private IClScoreItemsService clScoreItemsService;

    /**
     * 查询分值变更项目列表
     */
    @Operation(summary = "查询分值变更项目列表")
    @PreAuthorize("@ss.hasPermi('core:items:list')")
    @GetMapping("/list")
    public TableDataInfo list(ClScoreItems clScoreItems)
    {
        startPage();
        List<ClScoreItems> list = clScoreItemsService.selectClScoreItemsList(clScoreItems);
        return getDataTable(list);
    }

    /**
     * 导出分值变更项目列表
     */
    @PreAuthorize("@ss.hasPermi('core:items:export')")
    @Log(title = "分值变更项目", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, ClScoreItems clScoreItems)
    {
        List<ClScoreItems> list = clScoreItemsService.selectClScoreItemsList(clScoreItems);
        ExcelUtil<ClScoreItems> util = new ExcelUtil<ClScoreItems>(ClScoreItems.class);
        util.exportExcel(response, list, "分值变更项目数据");
    }

    /**
     * 获取分值变更项目详细信息
     */
    @Operation(summary = "获取分值变更项目详情")
    @PreAuthorize("@ss.hasPermi('core:items:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(clScoreItemsService.selectClScoreItemsById(id));
    }

    /**
     * 新增分值变更项目
     */
    @Operation(summary = "新增分值变更项目")
    @PreAuthorize("@ss.hasPermi('core:items:add')")
    @Log(title = "分值变更项目", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody ClScoreItems clScoreItems)
    {
        return toAjax(clScoreItemsService.insertClScoreItems(clScoreItems));
    }

    /**
     * 修改分值变更项目
     */
    @Operation(summary = "修改分值变更项目")
    @PreAuthorize("@ss.hasPermi('core:items:edit')")
    @Log(title = "分值变更项目", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ClScoreItems clScoreItems)
    {
        return toAjax(clScoreItemsService.updateClScoreItems(clScoreItems));
    }

    /**
     * 删除分值变更项目
     */
    @Operation(summary = "删除分值变更项目")
    @PreAuthorize("@ss.hasPermi('core:items:remove')")
    @Log(title = "分值变更项目", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(clScoreItemsService.deleteClScoreItemsByIds(ids));
    }
}
