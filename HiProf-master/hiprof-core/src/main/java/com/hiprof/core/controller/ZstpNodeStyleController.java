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
import com.hiprof.core.domain.ZstpNodeStyle;
import com.hiprof.core.service.IZstpNodeStyleService;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.common.core.page.TableDataInfo;

/**
 * 节点样式Controller
 * 
 * @author ruoyi
 * @date 2025-06-22
 */
@Tag( name="节点样式管理")
@RestController
@RequestMapping("/core/style")
public class ZstpNodeStyleController extends BaseController
{
    @Autowired
    private IZstpNodeStyleService zstpNodeStyleService;

    /**
     * 查询节点样式列表
     */
    @Operation(summary = "查询节点样式列表")
    @GetMapping("/list")
    public TableDataInfo list(ZstpNodeStyle zstpNodeStyle)
    {
        startPage();
        List<ZstpNodeStyle> list = zstpNodeStyleService.selectZstpNodeStyleList(zstpNodeStyle);
        return getDataTable(list);
    }

//    /**
//     * 导出节点样式列表
//     */
//    @Log(title = "节点样式", businessType = BusinessType.EXPORT)
//    @PostMapping("/export")
//    public void export(HttpServletResponse response, ZstpNodeStyle zstpNodeStyle)
//    {
//        List<ZstpNodeStyle> list = zstpNodeStyleService.selectZstpNodeStyleList(zstpNodeStyle);
//        ExcelUtil<ZstpNodeStyle> util = new ExcelUtil<ZstpNodeStyle>(ZstpNodeStyle.class);
//        util.exportExcel(response, list, "节点样式数据");
//    }

    /**
     * 获取节点样式详细信息
     */
    @Operation(summary = "获取节点样式详细信息")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(zstpNodeStyleService.selectZstpNodeStyleById(id));
    }

    /**
     * 新增节点样式
     */
    @Operation(summary = "新增节点样式")
    @Log(title = "节点样式", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody ZstpNodeStyle zstpNodeStyle)
    {
        return toAjax(zstpNodeStyleService.insertZstpNodeStyle(zstpNodeStyle));
    }

    /**
     * 修改节点样式
     */
    @Operation(summary = "修改节点样式")
    @Log(title = "节点样式", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ZstpNodeStyle zstpNodeStyle)
    {
        return toAjax(zstpNodeStyleService.updateZstpNodeStyle(zstpNodeStyle));
    }

    /**
     * 删除节点样式
     */
    @Operation(summary = "删除节点样式")
    @Log(title = "节点样式", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(zstpNodeStyleService.deleteZstpNodeStyleByIds(ids));
    }
}
