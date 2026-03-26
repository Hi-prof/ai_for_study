package com.hiprof.core.controller;

import java.util.List;

import com.hiprof.common.core.domain.model.LoginUser;
import com.hiprof.core.domain.vo.ChatSessionVo;
import com.hiprof.framework.web.service.TokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.hiprof.common.annotation.Log;
import com.hiprof.common.core.controller.BaseController;
import com.hiprof.common.core.domain.AjaxResult;
import com.hiprof.common.enums.BusinessType;
import com.hiprof.core.domain.ChatSession;
import com.hiprof.core.service.IChatSessionService;
import com.hiprof.common.utils.poi.ExcelUtil;
import com.hiprof.common.core.page.TableDataInfo;

/**
 * 会话Controller
 * 
 * @author emiya
 * @date 2025-07-20
 */
@Tag(name = "会话管理")
@RestController
@RequestMapping("/core/session")
public class ChatSessionController extends BaseController
{
    @Autowired
    private IChatSessionService chatSessionService;


    /**
     * 查询会话列表
     */
    @Operation(summary = "查询会话列表")
    @PreAuthorize("@ss.hasPermi('core:session:list')")
    @GetMapping("/list")
    public TableDataInfo list(ChatSession chatSession)
    {
        startPage();
        List<ChatSession> list = chatSessionService.selectChatSessionList(chatSession);
        return getDataTable(list);
    }

//    /**
//     * 导出会话列表
//     */
//    @PreAuthorize("@ss.hasPermi('core:session:export')")
//    @Log(title = "会话", businessType = BusinessType.EXPORT)
//    @PostMapping("/export")
//    public void export(HttpServletResponse response, ChatSession chatSession)
//    {
//        List<ChatSession> list = chatSessionService.selectChatSessionList(chatSession);
//        ExcelUtil<ChatSession> util = new ExcelUtil<ChatSession>(ChatSession.class);
//        util.exportExcel(response, list, "会话数据");
//    }
    /**
     * 获取会话详细信息
     */
    @Operation(summary = "根据ID查询相关会话信息")
    @PreAuthorize("@ss.hasPermi('core:session:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(chatSessionService.selectChatSessionById(id));
    }

    //查询是否存在私聊会话
    @Operation(summary = "查询和传入的用户是否存在私聊会话")
    @GetMapping(value = "/isExist/{id}")
    public AjaxResult isExistSession(
            @PathVariable("id") Long toId,
            @RequestParam(value = "courseId", required = false) Long courseId,
            @AuthenticationPrincipal LoginUser loginUser) {
        return success(chatSessionService.isExistSession(toId, loginUser.getUserId(), courseId));
    }
    /**
     * 新增会话
     */
    @Operation(summary = "新增会话")
    @PreAuthorize("@ss.hasPermi('core:session:add')")
    @Log(title = "会话", businessType = BusinessType.INSERT)
    @PostMapping()
    public AjaxResult add(
            @RequestBody ChatSessionVo chatSession,
            @AuthenticationPrincipal LoginUser loginUser
    ) {
        chatSession.setCreateBy(loginUser.getUserId().toString());
        return toAjax(chatSessionService.insertChatSession(chatSession));
    }

    /**
     * 修改会话
     */
    @Operation(summary = "修改会话")
    @PreAuthorize("@ss.hasPermi('core:session:edit')")
    @Log(title = "会话", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody ChatSession chatSession)
    {
        return toAjax(chatSessionService.updateChatSession(chatSession));
    }

    /**
     * 删除会话
     */
    @Operation(summary = "删除会话")
    @PreAuthorize("@ss.hasPermi('core:session:remove')")
    @Log(title = "会话", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(chatSessionService.deleteChatSessionByIds(ids));
    }
}
