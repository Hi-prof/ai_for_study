package com.hiprof.tp.controller;

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
import com.hiprof.tp.domain.TpContent;
import com.hiprof.tp.service.ITpContentService;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.common.core.page.TableDataInfo;

/**
 * 模块内容Controller
 * 
 * @author ruoyi
 * @date 2025-07-02
 */


@Tag(name="模块内容管理")
@RestController
@RequestMapping("/tp/content")
public class TpContentController extends BaseController
{
    @Autowired
    private ITpContentService tpContentService;

    /**
     * 查询模块内容列表
     */
//    @Operation(summary = "获取模块列表")
//    @PreAuthorize("@ss.hasPermi('tp:content:list')")
//    @GetMapping("/list")
//    public TableDataInfo list(TpContent tpContent)
//    {
//        startPage();
//        List<TpContent> list = tpContentService.selectTpContentList(tpContent);
//        return getDataTable(list);
//    }

    /**
     * 导出模块内容列表
     */
//    @PreAuthorize("@ss.hasPermi('tp:content:export')")
//    @Log(title = "模块内容", businessType = BusinessType.EXPORT)
//    @PostMapping("/export")
//    public void export(HttpServletResponse response, TpContent tpContent)
//    {
//        List<TpContent> list = tpContentService.selectTpContentList(tpContent);
//        ExcelUtil<TpContent> util = new ExcelUtil<TpContent>(TpContent.class);
//        util.exportExcel(response, list, "模块内容数据");
//    }

    /**
     * 获取模块内容详细信息
     */
    @Operation(summary = "获取模块内容详细信息")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(tpContentService.selectTpContentById(id));
    }

    /**
     * 新增模块内容
     */
    @Operation(summary = "新增模块内容")
    @Log(title = "模块内容", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody TpContent tpContent)
    {
        return toAjax(tpContentService.insertTpContent(tpContent));
    }

    /**
     * 修改模块内容
     */
    @Operation(summary = "修改模块内容")
    @Log(title = "模块内容", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody TpContent tpContent)
    {
        return toAjax(tpContentService.updateTpContent(tpContent));
    }

    /**
     * 删除模块内容
     */
    @Operation(summary = "删除模块内容")
    @Log(title = "模块内容", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(tpContentService.deleteTpContentByIds(ids));
    }
}
