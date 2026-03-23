package com.hiprof.core.service;

import java.util.List;
import com.hiprof.core.domain.ChatSession;
import com.hiprof.core.domain.vo.ChatSessionVo;

/**
 * 会话Service接口
 * 
 * @author emiya
 * @date 2025-07-20
 */
public interface IChatSessionService 
{
    /**
     * 查询会话
     * 
     * @param id 会话主键
     * @return 会话
     */
    public ChatSession selectChatSessionById(Long id);

    /**
     * 查询会话列表
     * 
     * @param chatSession 会话
     * @return 会话集合
     */
    public List<ChatSession> selectChatSessionList(ChatSession chatSession);

    /**
     * 新增会话
     * 
     * @param chatSession 会话
     * @return 结果
     */
    public Long insertChatSession(ChatSessionVo chatSessionVo);

    /**
     * 修改会话
     * 
     * @param chatSession 会话
     * @return 结果
     */
    public int updateChatSession(ChatSession chatSession);

    /**
     * 批量删除会话
     * 
     * @param ids 需要删除的会话主键集合
     * @return 结果
     */
    public int deleteChatSessionByIds(Long[] ids);

    /**
     * 删除会话信息
     * 
     * @param id 会话主键
     * @return 结果
     */
    public int deleteChatSessionById(Long id);


    long isExistSession(Long toId, Long fromId);
}
