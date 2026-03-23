package com.hiprof.core.service;

import java.util.List;
import com.hiprof.core.domain.ChatMembers;

/**
 * 会话成员管理Service接口
 * 
 * @author emiya
 * @date 2025-07-20
 */
public interface IChatMembersService 
{
    /**
     * 查询会话成员管理
     * 
     * @param id 会话成员管理主键
     * @return 会话成员管理
     */
    public ChatMembers selectChatMembersById(Long id);


    /**
     * 查询会话成员管理
     *
     * @param sessionId,userId 构成会话成员唯一键
     * @return 会话成员管理
     */
    public ChatMembers selectChatMembers(Long sessionId,Long userId);




    /**
     * 查询会话成员管理列表
     * 
     * @param chatMembers 会话成员管理
     * @return 会话成员管理集合
     */
    public List<ChatMembers> selectChatMembersList(ChatMembers chatMembers);

    /**
     * 新增会话成员管理
     * 
     * @param chatMembers 会话成员管理
     * @return 结果
     */
    public int insertChatMembers(ChatMembers chatMembers);

    /**
     * 修改会话成员管理
     * 
     * @param chatMembers 会话成员管理
     * @return 结果
     */
    public int updateChatMembers(ChatMembers chatMembers);

    /**
     * 批量删除会话成员管理
     * 
     * @param ids 需要删除的会话成员管理主键集合
     * @return 结果
     */
    public int deleteChatMembersByIds(Long[] ids);

    /**
     * 删除会话成员管理信息
     * 
     * @param id 会话成员管理主键
     * @return 结果
     */
    public int deleteChatMembersById(Long id);
}
