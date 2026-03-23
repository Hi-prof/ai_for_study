package com.hiprof.core.controller;

import java.util.List;

import com.hiprof.common.core.domain.model.LoginUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.prepost.PreAuthorize;
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
import com.hiprof.core.domain.ClFiles;
import com.hiprof.core.service.IClFilesService;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.common.core.page.TableDataInfo;

/**
 * 课程文件Controller
 * 
 * @author emiya
 * @date 2025-08-07
 */
@Tag(name="课程文件接口")
@RestController
@RequestMapping("/core/files")
public class ClFilesController extends BaseController
{
    @Autowired
    private IClFilesService clFilesService;

    /**
     * 查询课程文件列表
     */
    @Operation(summary = "查询课程文件列表")
    @PreAuthorize("@ss.hasPermi('core:files:list')")
    @GetMapping("/list")
    public TableDataInfo list(ClFiles clFiles)
    {
        startPage();
        List<ClFiles> list = clFilesService.selectClFilesList(clFiles);
        return getDataTable(list);
    }

//    /**
//     * 导出课程文件列表
//     */
//    @PreAuthorize("@ss.hasPermi('core:files:export')")
//    @Log(title = "课程文件", businessType = BusinessType.EXPORT)
//    @PostMapping("/export")
//    public void export(HttpServletResponse response, ClFiles clFiles)
//    {
//        List<ClFiles> list = clFilesService.selectClFilesList(clFiles);
//        ExcelUtil<ClFiles> util = new ExcelUtil<ClFiles>(ClFiles.class);
//        util.exportExcel(response, list, "课程文件数据");
//    }

    /**
     * 获取课程文件详细信息
     */
    @Operation(summary = "获取课程文件详情")
    @PreAuthorize("@ss.hasPermi('core:files:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(clFilesService.selectClFilesById(id));
    }

    /**
     * 新增课程文件
     */
    @Operation(summary = "新增课程文件")
    @PreAuthorize("@ss.hasPermi('core:files:add')")
    @Log(title = "课程文件", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(
            @RequestBody ClFiles clFiles,
            @AuthenticationPrincipal LoginUser loginUser
    ) {
        clFiles.setCreateBy(loginUser.getUserId().toString());
        return toAjax(clFilesService.insertClFiles(clFiles));
    }

    /**
     * 修改课程文件
     */
    @Operation(summary = "修改课程文件")
    @PreAuthorize("@ss.hasPermi('core:files:edit')")
    @Log(title = "课程文件", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ClFiles clFiles)
    {
        return toAjax(clFilesService.updateClFiles(clFiles));
    }

    /**
     * 删除课程文件
     */
    @Operation(summary = "删除课程文件")
    @PreAuthorize("@ss.hasPermi('core:files:remove')")
    @Log(title = "课程文件", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(clFilesService.deleteClFilesByIds(ids));
    }
}
