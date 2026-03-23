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
import com.hiprof.core.domain.ChatMessages;
import com.hiprof.core.service.IChatMessagesService;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.common.core.page.TableDataInfo;

/**
 * 会话消息管理Controller
 * 
 * @author emiya
 * @date 2025-07-20
 */
@Tag(name = "会话消息管理")
@RestController
@RequestMapping("/core/message")
public class ChatMessagesController extends BaseController
{
    @Autowired
    private IChatMessagesService chatMessagesService;

    /**
     * 查询会话消息管理列表
     */
    @Operation(summary = "查询会话消息管理列表")
    @PreAuthorize("@ss.hasPermi('core:message:list')")
    @GetMapping("/list")
    public TableDataInfo list(ChatMessages chatMessages)
    {
        startPage();
        List<ChatMessages> list = chatMessagesService.selectChatMessagesList(chatMessages);
        return getDataTable(list);
    }

//    /**
//     * 导出会话消息管理列表
//     */
//    @PreAuthorize("@ss.hasPermi('core:message:export')")
//    @Log(title = "会话消息管理", businessType = BusinessType.EXPORT)
//    @PostMapping("/export")
//    public void export(HttpServletResponse response, ChatMessages chatMessages)
//    {
//        List<ChatMessages> list = chatMessagesService.selectChatMessagesList(chatMessages);
//        ExcelUtil<ChatMessages> util = new ExcelUtil<ChatMessages>(ChatMessages.class);
//        util.exportExcel(response, list, "会话消息管理数据");
//    }

    /**
     * 获取会话消息管理详细信息
     */
    @Operation( summary = "获取会话消息管理详细信息")
    @PreAuthorize("@ss.hasPermi('core:message:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(chatMessagesService.selectChatMessagesById(id));
    }

//    /**
//     * 新增会话消息管理
//     */
//    @Operation(summary = "新增会话消息")
//    @PreAuthorize("@ss.hasPermi('core:message:add')")
//    @Log(title = "会话消息管理", businessType = BusinessType.INSERT)
//    @PostMapping
//    public AjaxResult add(@RequestBody ChatMessages chatMessages)
//    {
//        return toAjax(chatMessagesService.insertChatMessages(chatMessages));
//    }

//    /**
//     * 修改会话消息管理
//     */
//    @Operation(summary = "修改会话消息管理")
//    @PreAuthorize("@ss.hasPermi('core:message:edit')")
//    @Log(title = "会话消息管理", businessType = BusinessType.UPDATE)
//    @PutMapping
//    public AjaxResult edit(@RequestBody ChatMessages chatMessages)
//    {
//        return toAjax(chatMessagesService.updateChatMessages(chatMessages));
//    }

//    /**
//     * 删除会话消息
//     */
//    @PreAuthorize("@ss.hasPermi('core:message:remove')")
//    @Log(title = "会话消息管理", businessType = BusinessType.DELETE)
//	@DeleteMapping("/{ids}")
//    public AjaxResult remove(@PathVariable Long[] ids)
//    {
//        return toAjax(chatMessagesService.deleteChatMessagesByIds(ids));
//    }
}
