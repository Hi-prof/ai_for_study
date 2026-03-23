package com.hiprof.core.service.impl;

import java.util.List;
import com.hiprof.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.hiprof.core.mapper.ChatMessagesMapper;
import com.hiprof.core.domain.ChatMessages;
import com.hiprof.core.service.IChatMessagesService;

/**
 * 会话消息管理Service业务层处理
 * 
 * @author emiya
 * @date 2025-07-20
 */
@Service
public class ChatMessagesServiceImpl implements IChatMessagesService 
{
    @Autowired
    private ChatMessagesMapper chatMessagesMapper;

    /**
     * 查询会话消息管理
     * 
     * @param id 会话消息管理主键
     * @return 会话消息管理
     */
    @Override
    public ChatMessages selectChatMessagesById(Long id)
    {
        return chatMessagesMapper.selectChatMessagesById(id);
    }

    /**
     * 查询会话消息管理列表
     * 
     * @param chatMessages 会话消息管理
     * @return 会话消息管理
     */
    @Override
    public List<ChatMessages> selectChatMessagesList(ChatMessages chatMessages)
    {
        return chatMessagesMapper.selectChatMessagesList(chatMessages);
    }

    /**
     * 新增会话消息管理
     * 
     * @param chatMessages 会话消息管理
     * @return 结果
     */
    @Override
    public int insertChatMessages(ChatMessages chatMessages)
    {
        chatMessages.setCreateTime(DateUtils.getNowDate());
        return chatMessagesMapper.insertChatMessages(chatMessages);
    }

    /**
     * 修改会话消息管理
     * 
     * @param chatMessages 会话消息管理
     * @return 结果
     */
    @Override
    public int updateChatMessages(ChatMessages chatMessages)
    {
        chatMessages.setUpdateTime(DateUtils.getNowDate());
        return chatMessagesMapper.updateChatMessages(chatMessages);
    }

    /**
     * 批量删除会话消息管理
     * 
     * @param ids 需要删除的会话消息管理主键
     * @return 结果
     */
    @Override
    public int deleteChatMessagesByIds(Long[] ids)
    {
        return chatMessagesMapper.deleteChatMessagesByIds(ids);
    }

    /**
     * 删除会话消息管理信息
     * 
     * @param id 会话消息管理主键
     * @return 结果
     */
    @Override
    public int deleteChatMessagesById(Long id)
    {
        return chatMessagesMapper.deleteChatMessagesById(id);
    }
}
