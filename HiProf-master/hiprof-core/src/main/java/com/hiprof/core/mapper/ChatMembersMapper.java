package com.hiprof.core.mapper;

import java.util.List;
import com.hiprof.core.domain.ChatMembers;

/**
 * 会话成员管理Mapper接口
 * 
 * @author emiya
 * @date 2025-07-20
 */
public interface ChatMembersMapper 
{
    /**
     * 查询会话成员管理
     * 
     * @param id 会话成员管理主键
     * @return 会话成员管理
     */
    public ChatMembers selectChatMembersById(Long id);
    public ChatMembers selectChatMembers(Long sessionId, Long userId);

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


    /*
    批量新增成员

     */

    public int batchInsertChatMembers(List<ChatMembers> membersList);


    /**
     * 修改会话成员管理
     * 
     * @param chatMembers 会话成员管理
     * @return 结果
     */
    public int updateChatMembers(ChatMembers chatMembers);

    /**
     * 删除会话成员管理
     * 
     * @param id 会话成员管理主键
     * @return 结果
     */
    public int deleteChatMembersById(Long id);

    /**
     * 批量删除会话成员管理
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteChatMembersByIds(Long[] ids);
    public int deleteChatMembersBySessionIds(Long[] ids);
}
