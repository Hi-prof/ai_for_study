package com.hiprof.web.controller.system;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.apache.commons.lang3.ArrayUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.hiprof.common.annotation.Log;
import com.hiprof.common.constant.UserConstants;
import com.hiprof.common.core.controller.BaseController;
import com.hiprof.common.core.domain.AjaxResult;
import com.hiprof.common.core.domain.entity.SysDept;
import com.hiprof.common.enums.BusinessType;
import com.hiprof.common.utils.StringUtils;
import com.hiprof.system.service.ISysDeptService;

/**
 * 部门信息
 * 
 * @author ruoyi
 */
@Tag( name = "部门管理")
@RestController
@RequestMapping("/system/dept")
public class SysDeptController extends BaseController
{
    private static final String ACADEMIC_ROOT_DEPT_NAME = "武夷学院";
    private static final Long DEFAULT_ROOT_DEPT_ID = 900000L;

    @Autowired
    private ISysDeptService deptService;


    /**
     * 获取部门列表
     */
    @Operation(summary = "获取部门列表")
    @PreAuthorize("@ss.hasPermi('system:dept:list')")
    @GetMapping("/list")
    public AjaxResult list(SysDept dept)
    {
        startPage();
        List<SysDept> depts = deptService.selectDeptList(dept);
        return success(depts);
    }

    /**
     * 查询部门列表（排除节点）
     * 传入deptID,将排除其及其子部门的结果返回
     */
    @Operation(summary = "查询部门列表（排除节点,传入部门ID,将排除其及其子部门的结果返回）")
    @PreAuthorize("@ss.hasPermi('system:dept:list')")
    @GetMapping("/list/exclude/{deptId}")
    public AjaxResult excludeChild(@PathVariable(value = "deptId", required = false) Long deptId)
    {
        List<SysDept> depts = deptService.selectDeptList(new SysDept());
        depts.removeIf(d -> d.getDeptId().intValue() == deptId || ArrayUtils.contains(StringUtils.split(d.getAncestors(), ","), deptId + ""));
        return success(depts);
    }


    /**
     * 查询部门列表（仅保留子部门）
     * 传入deptID,将查询指定DeptID下的子部门
     */
    @Operation(summary = "查询部门列表（传入部门ID,将查询指定部门ID下的子部门）")
    @GetMapping("/list/include/{deptId}")
    public AjaxResult includeChild(@PathVariable(value = "deptId", required = false) Long deptId)
    {
        SysDept query = new SysDept();
        query.setParentId(deptId);
        List<SysDept> depts = deptService.selectDeptList(query);
        return success(depts);
    }

    @Operation(summary = "查询所有的二级部门")
    @GetMapping("/list/second")
    public AjaxResult listSecond(){
        SysDept sysDept = new SysDept();
        sysDept.setParentId(resolveAcademicRootDeptId());
        List<SysDept> sysDepts = deptService.selectDeptList(sysDept);
        return success(sysDepts);
    }

    private Long resolveAcademicRootDeptId()
    {
        SysDept query = new SysDept();
        query.setDeptName(ACADEMIC_ROOT_DEPT_NAME);
        List<SysDept> depts = deptService.selectDeptList(query);
        for (SysDept dept : depts)
        {
            if (dept != null && ACADEMIC_ROOT_DEPT_NAME.equals(dept.getDeptName()))
            {
                return dept.getDeptId();
            }
        }
        return DEFAULT_ROOT_DEPT_ID;
    }



    /**
     * 根据部门编号获取详细信息
     */
    @Operation(summary = "根据部门ID获取详细信息")
    @PreAuthorize("@ss.hasPermi('system:dept:query')")
    @GetMapping(value = "/{deptId}")
    public AjaxResult getInfo(@PathVariable Long deptId)
    {
        deptService.checkDeptDataScope(deptId);
        return success(deptService.selectDeptById(deptId));
    }

    /**
     * 新增部门
     */
    @Operation(summary = "新增部门")
    @PreAuthorize("@ss.hasPermi('system:dept:add')")
    @Log(title = "部门管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@Validated @RequestBody SysDept dept)
    {
        if (!deptService.checkDeptNameUnique(dept))
        {
            return error("新增部门'" + dept.getDeptName() + "'失败，部门名称已存在");
        }
        dept.setCreateBy(getUsername());
        return toAjax(deptService.insertDept(dept));
    }

    /**
     * 修改部门
     */
    @Operation(summary = "修改部门")
    @PreAuthorize("@ss.hasPermi('system:dept:edit')")
    @Log(title = "部门管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@Validated @RequestBody SysDept dept)
    {
        Long deptId = dept.getDeptId();
        deptService.checkDeptDataScope(deptId);
        if (!deptService.checkDeptNameUnique(dept))
        {
            return error("修改部门'" + dept.getDeptName() + "'失败，部门名称已存在");
        }
        else if (dept.getParentId().equals(deptId))
        {
            return error("修改部门'" + dept.getDeptName() + "'失败，上级部门不能是自己");
        }
        else if (StringUtils.equals(UserConstants.DEPT_DISABLE, dept.getStatus()) && deptService.selectNormalChildrenDeptById(deptId) > 0)
        {
            return error("该部门包含未停用的子部门！");
        }
        dept.setUpdateBy(getUsername());
        return toAjax(deptService.updateDept(dept));
    }

    /**
     * 删除部门
     */
    @Operation(summary = "删除部门")
    @PreAuthorize("@ss.hasPermi('system:dept:remove')")
    @Log(title = "部门管理", businessType = BusinessType.DELETE)
    @DeleteMapping("/{deptId}")
    public AjaxResult remove(@PathVariable Long deptId)
    {
        if (deptService.hasChildByDeptId(deptId))
        {
            return warn("存在下级部门,不允许删除");
        }
        if (deptService.checkDeptExistUser(deptId))
        {
            return warn("部门存在用户,不允许删除");
        }

        deptService.checkDeptDataScope(deptId);
        return toAjax(deptService.deleteDeptById(deptId));
    }
}
