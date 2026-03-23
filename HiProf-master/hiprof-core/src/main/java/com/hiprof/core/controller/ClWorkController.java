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
import com.hiprof.core.domain.ClWork;
import com.hiprof.core.service.IClWorkService;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.common.core.page.TableDataInfo;

/**
 * 作业管理Controller
 * 
 * @author emiya
 * @date 2025-07-20
 */
@Tag(name = "作业管理")
@RestController
@RequestMapping("/core/work")
public class ClWorkController extends BaseController
{
    @Autowired
    private IClWorkService clWorkService;

    /**
     * 查询作业管理列表
     */
    @Operation(summary = "查询作业管理列表")
    @PreAuthorize("@ss.hasPermi('core:work:list')")
    @GetMapping("/list")
    public TableDataInfo list(ClWork clWork)
    {
        startPage();
        List<ClWork> list = clWorkService.selectClWorkList(clWork);
        return getDataTable(list);
    }

//    /**
//     * 导出作业管理列表
//     */
//    @PreAuthorize("@ss.hasPermi('core:work:export')")
//    @Log(title = "作业管理", businessType = BusinessType.EXPORT)
//    @PostMapping("/export")
//    public void export(HttpServletResponse response, ClWork clWork)
//    {
//        List<ClWork> list = clWorkService.selectClWorkList(clWork);
//        ExcelUtil<ClWork> util = new ExcelUtil<ClWork>(ClWork.class);
//        util.exportExcel(response, list, "作业管理数据");
//    }

    /**
     * 获取作业管理详细信息
     */
    @Operation(summary = "获取作业详情")
    @PreAuthorize("@ss.hasPermi('core:work:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(clWorkService.selectClWorkById(id));
    }

    /**
     * 新增作业管理
     */
    @Operation(summary = "新增作业")
    @PreAuthorize("@ss.hasPermi('core:work:add')")
    @Log(title = "作业管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody ClWork clWork)
    {
        return toAjax(clWorkService.insertClWork(clWork));
    }

    /**
     * 修改作业管理
     */
    @Operation(summary = "修改作业")
    @PreAuthorize("@ss.hasPermi('core:work:edit')")
    @Log(title = "作业管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ClWork clWork)
    {
        return toAjax(clWorkService.updateClWork(clWork));
    }

    /**
     * 删除作业管理
     */
    @Operation(summary = "删除作业")
    @PreAuthorize("@ss.hasPermi('core:work:remove')")
    @Log(title = "作业管理", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(clWorkService.deleteClWorkByIds(ids));
    }
}
