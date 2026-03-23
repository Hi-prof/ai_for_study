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
import com.hiprof.core.domain.ZstpNode;
import com.hiprof.core.service.IZstpNodeService;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.common.core.page.TableDataInfo;

/**
 * 节点表Controller
 * 
 * @author ruoyi
 * @date 2025-06-22
 */

@Tag(name="节点管理")
@RestController
@RequestMapping("/core/node")
public class ZstpNodeController extends BaseController {
    @Autowired
    private IZstpNodeService zstpNodeService;

    /**
     * 查询节点表列表
     */
    @Operation( summary = "获取节点表列表")
    @GetMapping("/list")
    public TableDataInfo list(ZstpNode zstpNode)
    {
        startPage();
        List<ZstpNode> list = zstpNodeService.selectZstpNodeList(zstpNode);
        return getDataTable(list);
    }
    /**
     * 导出节点表列表
     */
//    @Log(title = "节点表", businessType = BusinessType.EXPORT)
//    @PostMapping("/export")
//    public void export(HttpServletResponse response, ZstpNode zstpNode)
//    {
//        List<ZstpNode> list = zstpNodeService.selectZstpNodeList(zstpNode);
//        ExcelUtil<ZstpNode> util = new ExcelUtil<ZstpNode>(ZstpNode.class);
//        util.exportExcel(response, list, "节点表数据");
//    }

    /**
     * 获取节点表详细信息(其下节点信息）
     */
    @Operation(summary = "获取节点详细信息")
    @GetMapping(value = "/{id}")
    public TableDataInfo getInfo(@PathVariable("id") Long id) {
        startPage();
        List<ZstpNode> zstpNodes = zstpNodeService.selectZstpNodeById(id);
        return getDataTable(zstpNodes);
    }

    /**
     * 新增节点表
     */
    @Operation(summary = "新增节点")
    @Log(title = "节点表", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody ZstpNode zstpNode)
    {
        return toAjax(zstpNodeService.insertZstpNode(zstpNode));
    }

    /**
     * 修改节点表
     */
    @Operation(summary = "修改节点")
    @Log(title = "节点表", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ZstpNode zstpNode)
    {
        return toAjax(zstpNodeService.updateZstpNode(zstpNode));
    }

    /**
     * 删除节点表
     */
    @Operation(summary = "删除节点")
    @Log(title = "节点表", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(zstpNodeService.deleteZstpNodeByIds(ids));
    }

}
