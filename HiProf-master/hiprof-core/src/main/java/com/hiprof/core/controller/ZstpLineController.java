package com.hiprof.core.controller;

import com.hiprof.common.annotation.Log;
import com.hiprof.common.core.controller.BaseController;
import com.hiprof.common.core.domain.AjaxResult;
import com.hiprof.common.core.page.TableDataInfo;
import com.hiprof.common.enums.BusinessType;
import com.hiprof.core.domain.ZstpLine;
import com.hiprof.core.service.IZstpLineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 线段关系Controller
 * 
 * @author ruoyi
 * @date 2025-06-22
 */
@Tag(name = "节点线段连接关系管理")
@RestController
@RequestMapping("/core/line")
public class ZstpLineController extends BaseController
{
    @Autowired
    private IZstpLineService zstpLineService;

    /**
     * 查询线段关系列表
     */

    @Operation( summary = "获取线段关系列表")
    @GetMapping("/list")
    public TableDataInfo list(ZstpLine zstpLine) {
        startPage();
        List<ZstpLine> list = zstpLineService.selectZstpLineList(zstpLine);
        return getDataTable(list);
    }

    /**
     *
     * 导出线段关系列表
     */
//    @Log(title = "线段关系", businessType = BusinessType.EXPORT)
//    @PostMapping("/export")
//    public void export(HttpServletResponse response, ZstpLine zstpLine)
//    {
//        List<ZstpLine> list = zstpLineService.selectZstpLineList(zstpLine);
//        ExcelUtil<ZstpLine> util = new ExcelUtil<ZstpLine>(ZstpLine.class);
//        util.exportExcel(response, list, "线段关系数据");
//    }

    /**
     * 获取线段关系详细信息
     */
    @Operation(summary = "获取线段关系详细信息")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(zstpLineService.selectZstpLineById(id));
    }

    /**
     * 新增线段关系
     */
    @Operation(summary = "新增线段关系")
    @Log(title = "线段关系", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody ZstpLine zstpLine)
    {
        return toAjax(zstpLineService.insertZstpLine(zstpLine));
    }

    /**
     * 修改线段关系
     */
    @Operation(summary = "修改线段关系")
    @Log(title = "线段关系", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ZstpLine zstpLine)
    {
        return toAjax(zstpLineService.updateZstpLine(zstpLine));
    }

    /**
     * 删除线段关系
     */
    @Operation(summary = "删除线段关系")
    @Log(title = "线段关系", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(zstpLineService.deleteZstpLineByIds(ids));
    }
}
