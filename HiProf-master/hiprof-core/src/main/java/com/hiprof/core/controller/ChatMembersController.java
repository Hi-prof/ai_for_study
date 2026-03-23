package com.hiprof.core.controller;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
import com.hiprof.core.domain.ChatMembers;
import com.hiprof.core.service.IChatMembersService;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.common.core.page.TableDataInfo;

/**
 * 会话成员管理Controller
 * 
 * @author emiya
 * @date 2025-07-20
 */
@Tag(name = "会话成员管理")
@RestController
@RequestMapping("/core/member")
public class ChatMembersController extends BaseController
{
    @Autowired
    private IChatMembersService chatMembersService;
    /**
     * 查询会话成员管理列表
     */
    @Operation(summary = "查询会话成员管理列表",description = "",tags = "会话成员管理")
    @Parameter(name = "chatMembers", description = "会话成员对象" ,required = true)
    @PreAuthorize("@ss.hasPermi('core:member:list')")
    @GetMapping("/list")
    public TableDataInfo list(ChatMembers chatMembers)
    {
        startPage();
        List<ChatMembers> list = chatMembersService.selectChatMembersList(chatMembers);
        return getDataTable(list);
    }

//    /**
//     * 导出会话成员管理列表
//     */
//    @PreAuthorize("@ss.hasPermi('core:member:export')")
//    @Log(title = "会话成员管理", businessType = BusinessType.EXPORT)
//    @PostMapping("/export")
//    public void export(HttpServletResponse response, ChatMembers chatMembers)
//    {
//        List<ChatMembers> list = chatMembersService.selectChatMembersList(chatMembers);
//        ExcelUtil<ChatMembers> util = new ExcelUtil<ChatMembers>(ChatMembers.class);
//        util.exportExcel(response, list, "会话成员管理数据");
//    }

    /**
     * 获取会话成员管理详细信息
     */
    @Operation(summary = "根据ID查询会话成员信息")
    @PreAuthorize("@ss.hasPermi('core:member:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(chatMembersService.selectChatMembersById(id));
    }

    /**
     * 新增会话成员管理
     */
    @Operation(summary = "新增会话成员")
    @PreAuthorize("@ss.hasPermi('core:member:add')")
    @Log(title = "会话成员管理", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody ChatMembers chatMembers)
    {
        return toAjax(chatMembersService.insertChatMembers(chatMembers));
    }

    /**
     * 修改会话成员管理
     */
    @Operation(summary = "修改会话成员")
    @PreAuthorize("@ss.hasPermi('core:member:edit')")
    @Log(title = "会话成员管理", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ChatMembers chatMembers)
    {
        return toAjax(chatMembersService.updateChatMembers(chatMembers));
    }

    /**
     * 删除会话成员管理
     */
    @Operation(summary = "删除会话成员")
    @PreAuthorize("@ss.hasPermi('core:member:remove')")
    @Log(title = "会话成员管理", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(chatMembersService.deleteChatMembersByIds(ids));
    }
}
