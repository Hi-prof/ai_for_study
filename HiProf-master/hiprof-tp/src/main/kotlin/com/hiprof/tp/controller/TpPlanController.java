package com.hiprof.tp.controller;

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
import com.hiprof.tp.domain.TpPlan;
import com.hiprof.tp.service.ITpPlanService;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.common.core.page.TableDataInfo;

/**
 * 教案管理Controller
 * 
 * @author emiya
 * @date 2025-07-02
 */
@Tag(name="教案管理")
@RestController
@RequestMapping("/tp/plan")
public class TpPlanController extends BaseController
{
    @Autowired
    private ITpPlanService tpPlanService;

    /**
     * 查询教案管理列表
     */
    @Operation(summary = "获取教案列表")
    @PreAuthorize("@ss.hasPermi('tp:plan:list')")
    @GetMapping("/list")
    public TableDataInfo list(TpPlan tpPlan)
    {
        startPage();
        List<TpPlan> list = tpPlanService.selectTpPlanList(tpPlan);
        return getDataTable(list);
    }
    /**
     * 获取教案管理详细信息
     */
    @Operation(summary = "获取教案详情信息")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(tpPlanService.selectTpPlanById(id));
    }

    /**
     * 新增教案管理
     */
    @Operation(summary = "新增教案")
    @Log(title = "教案管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(
            @RequestBody TpPlan tpPlan,
            @AuthenticationPrincipal LoginUser loginUser
    ) {
        tpPlan.setCreateBy(loginUser.getUserId().toString());
        return toAjax(tpPlanService.insertTpPlan(tpPlan));
    }

    /**
     * 修改教案管理
     */
    @Operation(summary = "修改教案")
    @Log(title = "教案管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody TpPlan tpPlan)
    {
        return toAjax(tpPlanService.updateTpPlan(tpPlan));
    }

    /**
     * 删除教案管理
     */
    @Operation(summary = "删除教案")
    @Log(title = "教案管理", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(tpPlanService.deleteTpPlanByIds(ids));
    }
}
