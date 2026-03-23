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
import com.hiprof.tp.domain.TpModule;
import com.hiprof.tp.service.ITpModuleService;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.common.core.page.TableDataInfo;

/**
 * 教案模块Controller
 * 
 * @author ruoyi
 * @date 2025-07-02
 */
@Tag(name="教案模块管理")
@RestController
@RequestMapping("/tp/module")
public class TpModuleController extends BaseController
{
    @Autowired
    private ITpModuleService tpModuleService;

    /**
     * 查询教案模块列表
     */
    @Operation(summary="获取教案模块列表")
    @PreAuthorize("@ss.hasPermi('tp:module:list')")
    @GetMapping("/list")
    public TableDataInfo list(TpModule tpModule)
    {
        startPage();
        List<TpModule> list = tpModuleService.selectTpModuleList(tpModule);
        return getDataTable(list);
    }

//    /**
//     * 导出教案模块列表
//     */
//    @PreAuthorize("@ss.hasPermi('tp:module:export')")
//    @Log(title = "教案模块", businessType = BusinessType.EXPORT)
//    @PostMapping("/export")
//    public void export(HttpServletResponse response, TpModule tpModule)
//    {
//        List<TpModule> list = tpModuleService.selectTpModuleList(tpModule);
//        ExcelUtil<TpModule> util = new ExcelUtil<TpModule>(TpModule.class);
//        util.exportExcel(response, list, "教案模块数据");
//    }

    /**
     * 获取教案模块详细信息
     */
    @Operation(summary = "获取教案模块详细信息")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(tpModuleService.selectTpModuleById(id));
    }

    /**
     * 新增教案模块
     */
    @Operation(summary = "添加教案模块")
    @Log(title = "教案模块", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody TpModule tpModule)
    {
        return toAjax(tpModuleService.insertTpModule(tpModule));
    }

    /**
     * 修改教案模块
     */
    @Operation(summary = "修改教案模块")
    @Log(title = "教案模块", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody TpModule tpModule)
    {
        return toAjax(tpModuleService.updateTpModule(tpModule));
    }

    /**
     * 删除教案模块
     */
    @Operation(summary = "删除教案模块")
    @Log(title = "教案模块", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(tpModuleService.deleteTpModuleByIds(ids));
    }
}
