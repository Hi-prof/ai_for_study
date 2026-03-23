package com.hiprof.core.service.impl;

import java.util.List;
import com.hiprof.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.hiprof.core.mapper.ChatMembersMapper;
import com.hiprof.core.domain.ChatMembers;
import com.hiprof.core.service.IChatMembersService;

/**
 * 会话成员管理Service业务层处理
 * 
 * @author emiya
 * @date 2025-07-20
 */
@Service
public class ChatMembersServiceImpl implements IChatMembersService 
{
    @Autowired
    private ChatMembersMapper chatMembersMapper;

    /**
     * 查询会话成员管理
     * 
     * @param id 会话成员管理主键
     * @return 会话成员管理
     */
    @Override
    public ChatMembers selectChatMembersById(Long id)
    {
        return chatMembersMapper.selectChatMembersById(id);
    }

    @Override
    public ChatMembers selectChatMembers(Long sessionId, Long userId) {
        return chatMembersMapper.selectChatMembers(sessionId, userId);
    }



    /**
     * 查询会话成员管理列表
     * 
     * @param chatMembers 会话成员管理
     * @return 会话成员管理
     */
    @Override
    public List<ChatMembers> selectChatMembersList(ChatMembers chatMembers)
    {
        return chatMembersMapper.selectChatMembersList(chatMembers);
    }



    /**
     * 新增会话成员管理
     * 
     * @param chatMembers 会话成员管理
     * @return 结果
     */
    @Override
    public int insertChatMembers(ChatMembers chatMembers)
    {
        chatMembers.setCreateTime(DateUtils.getNowDate());
        return chatMembersMapper.insertChatMembers(chatMembers);
    }

    /**
     * 修改会话成员管理
     * 
     * @param chatMembers 会话成员管理
     * @return 结果
     */
    @Override
    public int updateChatMembers(ChatMembers chatMembers)
    {
        chatMembers.setUpdateTime(DateUtils.getNowDate());
        return chatMembersMapper.updateChatMembers(chatMembers);
    }

    /**
     * 批量删除会话成员管理
     * 
     * @param ids 需要删除的会话成员管理主键
     * @return 结果
     */
    @Override
    public int deleteChatMembersByIds(Long[] ids)
    {
        return chatMembersMapper.deleteChatMembersByIds(ids);
    }

    /**
     * 删除会话成员管理信息
     * 
     * @param id 会话成员管理主键
     * @return 结果
     */
    @Override
    public int deleteChatMembersById(Long id)
    {
        return chatMembersMapper.deleteChatMembersById(id);
    }
}
