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
import com.hiprof.core.domain.ClCourseMembers;
import com.hiprof.core.service.IClCourseMembersService;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.common.core.page.TableDataInfo;

/**
 * 课程成员管理Controller
 * 
 * @author emiya
 * @date 2025-08-10
 */
@Tag(name = "课程成员管理")
@RestController
@RequestMapping("/core/coursemembers")
public class ClCourseMembersController extends BaseController
{
    @Autowired
    private IClCourseMembersService clCourseMembersService;

    /**
     * 查询课程成员管理列表
     */
    @Operation(summary="获取课程成员列表")
    @PreAuthorize("@ss.hasPermi('core:coursemembers:list')")
    @GetMapping("/list")
    public TableDataInfo list(ClCourseMembers clCourseMembers)
    {
        startPage();
        List<ClCourseMembers> list = clCourseMembersService.selectClCourseMembersList(clCourseMembers);
        return getDataTable(list);
    }

//    /**
//     * 导出课程成员管理列表
//     */
//    @PreAuthorize("@ss.hasPermi('core:coursemembers:export')")
//    @Log(title = "课程成员管理", businessType = BusinessType.EXPORT)
//    @PostMapping("/export")
//    public void export(HttpServletResponse response, ClCourseMembers clCourseMembers)
//    {
//        List<ClCourseMembers> list = clCourseMembersService.selectClCourseMembersList(clCourseMembers);
//        ExcelUtil<ClCourseMembers> util = new ExcelUtil<ClCourseMembers>(ClCourseMembers.class);
//        util.exportExcel(response, list, "课程成员管理数据");
//    }

    /**
     * 获取课程成员管理详细信息
     */
    @Operation(summary="获取课程成员详细")
    @PreAuthorize("@ss.hasPermi('core:coursemembers:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(clCourseMembersService.selectClCourseMembersById(id));
    }

    /**
     * 新增课程成员管理
     */
    @Operation(summary="新增课程成员")
    @PreAuthorize("@ss.hasPermi('core:coursemembers:add')")
    @Log(title = "课程成员管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody ClCourseMembers clCourseMembers)
    {
        return toAjax(clCourseMembersService.insertClCourseMembers(clCourseMembers));
    }

    /**
     * 修改课程成员管理
     */
    @Operation(summary="修改课程成员")
    @PreAuthorize("@ss.hasPermi('core:coursemembers:edit')")
    @Log(title = "课程成员管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ClCourseMembers clCourseMembers)
    {
        return toAjax(clCourseMembersService.updateClCourseMembers(clCourseMembers));
    }

    /**
     * 删除课程成员管理
     */
    @Operation(summary="删除课程成员")
    @PreAuthorize("@ss.hasPermi('core:coursemembers:remove')")
    @Log(title = "课程成员管理", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(clCourseMembersService.deleteClCourseMembersByIds(ids));
    }
}
