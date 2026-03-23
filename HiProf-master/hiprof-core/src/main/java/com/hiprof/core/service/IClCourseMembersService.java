package com.hiprof.core.service;

import java.util.List;
import com.hiprof.core.domain.ClCourseMembers;

/**
 * 课程成员管理Service接口
 * 
 * @author emiya
 * @date 2025-08-10
 */
public interface IClCourseMembersService 
{
    /**
     * 查询课程成员管理
     * 
     * @param id 课程成员管理主键
     * @return 课程成员管理
     */
    public ClCourseMembers selectClCourseMembersById(Long id);

    /**
     * 查询课程成员管理列表
     * 
     * @param clCourseMembers 课程成员管理
     * @return 课程成员管理集合
     */
    public List<ClCourseMembers> selectClCourseMembersList(ClCourseMembers clCourseMembers);

    /**
     * 新增课程成员管理
     * 
     * @param clCourseMembers 课程成员管理
     * @return 结果
     */
    public int insertClCourseMembers(ClCourseMembers clCourseMembers);

    /**
     * 修改课程成员管理
     * 
     * @param clCourseMembers 课程成员管理
     * @return 结果
     */
    public int updateClCourseMembers(ClCourseMembers clCourseMembers);

    /**
     * 批量删除课程成员管理
     * 
     * @param ids 需要删除的课程成员管理主键集合
     * @return 结果
     */
    public int deleteClCourseMembersByIds(Long[] ids);

    /**
     * 删除课程成员管理信息
     * 
     * @param id 课程成员管理主键
     * @return 结果
     */
    public int deleteClCourseMembersById(Long id);
}
