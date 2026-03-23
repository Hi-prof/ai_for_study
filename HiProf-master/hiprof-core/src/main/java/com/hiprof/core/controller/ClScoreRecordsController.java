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
import com.hiprof.core.domain.ClScoreRecords;
import com.hiprof.core.service.IClScoreRecordsService;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.common.core.page.TableDataInfo;

/**
 * 分值变更记录Controller
 * 
 * @author emiya
 * @date 2025-08-09
 */
@Tag(name = "分值变更记录管理", description = "分值变更记录")
@RestController
@RequestMapping("/core/records")
public class ClScoreRecordsController extends BaseController
{
    @Autowired
    private IClScoreRecordsService clScoreRecordsService;

    /**
     * 查询分值变更记录列表
     */
    @Operation(summary = "查询分值变更记录列表")
    @PreAuthorize("@ss.hasPermi('core:records:list')")
    @GetMapping("/list")
    public TableDataInfo list(ClScoreRecords clScoreRecords)
    {
        startPage();
        List<ClScoreRecords> list = clScoreRecordsService.selectClScoreRecordsList(clScoreRecords);
        return getDataTable(list);
    }

//    /**
//     * 导出分值变更记录列表
//     */
//    @PreAuthorize("@ss.hasPermi('core:records:export')")
//    @Log(title = "分值变更记录", businessType = BusinessType.EXPORT)
//    @PostMapping("/export")
//    public void export(HttpServletResponse response, ClScoreRecords clScoreRecords)
//    {
//        List<ClScoreRecords> list = clScoreRecordsService.selectClScoreRecordsList(clScoreRecords);
//        ExcelUtil<ClScoreRecords> util = new ExcelUtil<ClScoreRecords>(ClScoreRecords.class);
//        util.exportExcel(response, list, "分值变更记录数据");
//    }

    /**
     * 获取分值变更记录详细信息
     */
    @Operation(summary = "获取分值变更记录详情")
    @PreAuthorize("@ss.hasPermi('core:records:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(clScoreRecordsService.selectClScoreRecordsById(id));
    }

    /**
     * 新增分值变更记录
     */
    @Operation(summary = "新增分值变更记录")
    @PreAuthorize("@ss.hasPermi('core:records:add')")
    @Log(title = "分值变更记录", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody ClScoreRecords clScoreRecords,
                          @AuthenticationPrincipal
                          LoginUser loginUser
    ) {
        clScoreRecords.setGraderId(loginUser.getUserId());
        return toAjax(clScoreRecordsService.insertClScoreRecords(clScoreRecords));
    }

    /**
     * 修改分值变更记录
     */
    @Operation(summary = "修改分值变更记录")
    @PreAuthorize("@ss.hasPermi('core:records:edit')")
    @Log(title = "分值变更记录", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ClScoreRecords clScoreRecords)
    {
        return toAjax(clScoreRecordsService.updateClScoreRecords(clScoreRecords));
    }

    /**
     * 删除分值变更记录
     */
    @Operation(summary = "删除分值变更记录")
    @PreAuthorize("@ss.hasPermi('core:records:remove')")
    @Log(title = "分值变更记录", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(clScoreRecordsService.deleteClScoreRecordsByIds(ids));
    }
}
