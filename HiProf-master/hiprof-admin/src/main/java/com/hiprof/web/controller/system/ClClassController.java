package com.hiprof.web.controller.system;

import com.hiprof.common.annotation.Log;
import com.hiprof.common.core.controller.BaseController;
import com.hiprof.common.core.domain.AjaxResult;
import com.hiprof.common.core.domain.entity.SysDept;
import com.hiprof.common.core.page.TableDataInfo;
import com.hiprof.common.enums.BusinessType;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.core.domain.ClClass;
import com.hiprof.core.service.IClClassService;
import com.hiprof.system.service.ISysDeptService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 班级管理操作处理
 */
@RestController
@RequestMapping("/system/class")
public class ClClassController extends BaseController
{
    @Autowired
    private IClClassService clClassService;

    @Autowired
    private ISysDeptService deptService;

    /**
     * 获取班级列表
     */
    @PreAuthorize("@ss.hasPermi('system:class:list')")
    @GetMapping("/list")
    public TableDataInfo list(ClClass clClass)
    {
        startPage();
        List<ClClass> list = clClassService.selectClClassList(clClass);
        return getDataTable(list);
    }

    @Log(title = "班级管理", businessType = BusinessType.EXPORT)
    @PreAuthorize("@ss.hasPermi('system:class:export')")
    @PostMapping("/export")
    public void export(HttpServletResponse response, ClClass clClass)
    {
        List<ClClass> list = clClassService.selectClClassList(clClass);
        ExcelUtil<ClClass> util = new ExcelUtil<ClClass>(ClClass.class);
        util.exportExcel(response, list, "班级数据");
    }

    /**
     * 获取班级详情
     */
    @PreAuthorize("@ss.hasPermi('system:class:query')")
    @GetMapping("/{classId}")
    public AjaxResult getInfo(@PathVariable Long classId)
    {
        return success(clClassService.selectClClassById(classId));
    }

    /**
     * 获取专业树
     */
    @PreAuthorize("@ss.hasPermi('system:class:list')")
    @GetMapping("/majorOptions")
    public AjaxResult majorOptions(SysDept dept)
    {
        return success(deptService.selectDeptTreeList(dept));
    }

    /**
     * 新增班级
     */
    @PreAuthorize("@ss.hasPermi('system:class:add')")
    @Log(title = "班级管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody ClClass clClass)
    {
        clClass.setCreateBy(getUsername());
        return toAjax(clClassService.insertClClass(clClass));
    }

    /**
     * 修改班级
     */
    @PreAuthorize("@ss.hasPermi('system:class:edit')")
    @Log(title = "班级管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ClClass clClass)
    {
        clClass.setUpdateBy(getUsername());
        return toAjax(clClassService.updateClClass(clClass));
    }

    /**
     * 删除班级
     */
    @PreAuthorize("@ss.hasPermi('system:class:remove')")
    @Log(title = "班级管理", businessType = BusinessType.DELETE)
    @DeleteMapping("/{classIds}")
    public AjaxResult remove(@PathVariable Long[] classIds)
    {
        return toAjax(clClassService.deleteClClassByIds(classIds));
    }
}
