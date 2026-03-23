package com.hiprof.core.service;

import java.util.List;
import com.hiprof.core.domain.ChatMessages;

/**
 * 会话消息管理Service接口
 * 
 * @author emiya
 * @date 2025-07-20
 */
public interface IChatMessagesService 
{
    /**
     * 查询会话消息管理
     * 
     * @param id 会话消息管理主键
     * @return 会话消息管理
     */
    public ChatMessages selectChatMessagesById(Long id);

    /**
     * 查询会话消息管理列表
     * 
     * @param chatMessages 会话消息管理
     * @return 会话消息管理集合
     */
    public List<ChatMessages> selectChatMessagesList(ChatMessages chatMessages);

    /**
     * 新增会话消息管理
     * 
     * @param chatMessages 会话消息管理
     * @return 结果
     */
    public int insertChatMessages(ChatMessages chatMessages);

    /**
     * 修改会话消息管理
     * 
     * @param chatMessages 会话消息管理
     * @return 结果
     */
    public int updateChatMessages(ChatMessages chatMessages);

    /**
     * 批量删除会话消息管理
     * 
     * @param ids 需要删除的会话消息管理主键集合
     * @return 结果
     */
    public int deleteChatMessagesByIds(Long[] ids);

    /**
     * 删除会话消息管理信息
     * 
     * @param id 会话消息管理主键
     * @return 结果
     */
    public int deleteChatMessagesById(Long id);
}
