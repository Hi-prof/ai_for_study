package com.hiprof.core.service.impl;

import java.util.ArrayList;
import java.util.List;
import com.hiprof.common.utils.DateUtils;
import com.hiprof.core.domain.ChatMembers;
import com.hiprof.core.domain.vo.ChatSessionVo;
import com.hiprof.core.mapper.ChatMembersMapper;
import com.hiprof.core.mapper.ChatMessagesMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.hiprof.core.mapper.ChatSessionMapper;
import com.hiprof.core.domain.ChatSession;
import com.hiprof.core.service.IChatSessionService;
import org.springframework.transaction.annotation.Transactional;

/**
 * 会话Service业务层处理
 * 
 * @author emiya
 * @date 2025-07-20
 */
@Service
public class ChatSessionServiceImpl implements IChatSessionService 
{
    @Autowired
    private ChatSessionMapper chatSessionMapper;

    @Autowired
    private ChatMembersMapper chatMembersMapper;

    @Autowired
    private ChatMessagesMapper chatMessagesMapper;


    /**
     * 查询会话
     * 
     * @param id 会话主键
     * @return 会话
     */
    @Override
    public ChatSession selectChatSessionById(Long id)
    {
        return chatSessionMapper.selectChatSessionById(id);
    }

    /**
     * 查询会话列表
     * 
     * @param chatSession 会话
     * @return 会话
     */
    @Override
    public List<ChatSession> selectChatSessionList(ChatSession chatSession)
    {
        return chatSessionMapper.selectChatSessionList(chatSession);
    }
    /**
     * 新增会话
     * 
     * @param chatSessionVo 会话
     * @return 结果
     */
    @Transactional
    @Override
    public Long insertChatSession(ChatSessionVo chatSessionVo)
    {
        //创建会话
        chatSessionVo.setCreateTime(DateUtils.getNowDate());
        chatSessionMapper.insertChatSession(chatSessionVo);

        Long chatSessionId = chatSessionVo.getId();

        ArrayList<ChatMembers> chatMembers = new ArrayList<>();
        for (Long id : chatSessionVo.getMemberIds()) {
            ChatMembers chatMembersA = new ChatMembers();
            chatMembersA.setRole("member");
            if (id.toString().equals(chatSessionVo.getCreateBy())){
                chatMembersA.setRole("admin");
            }
            chatMembersA.setSessionId(chatSessionId);
            chatMembersA.setUserId(id);
            chatMembers.add(chatMembersA);
        }
        //插入多条成员
        chatMembersMapper.batchInsertChatMembers(chatMembers);
        return chatSessionId;
    }

    /**
     * 修改会话
     * 
     * @param chatSession 会话
     * @return 结果
     */
    @Override
    public int updateChatSession(ChatSession chatSession)
    {
        chatSession.setUpdateTime(DateUtils.getNowDate());
        return chatSessionMapper.updateChatSession(chatSession);
    }

    /**
     * 批量删除会话
     * 
     * @param ids 需要删除的会话主键
     * @return 结果
     */
    @Transactional
    @Override
    public int deleteChatSessionByIds(Long[] ids)
    {
        //删除关联成员数据
        chatMembersMapper.deleteChatMembersBySessionIds(ids);
        //删除关联消息数据
        chatMessagesMapper.deleteChatMessagesBySessionIds(ids);


        return chatSessionMapper.deleteChatSessionByIds(ids);
    }

    /**
     * 删除会话信息
     * 
     * @param id 会话主键
     * @return 结果
     */
    @Override
    public int deleteChatSessionById(Long id)
    {
        return chatSessionMapper.deleteChatSessionById(id);
    }

    @Override
    public long isExistSession(Long toId, Long fromId) {
        return chatSessionMapper.selectPrivateSession(toId,fromId);
    }
}
