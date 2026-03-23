package com.hiprof.core.service.impl;

import java.util.List;
import com.hiprof.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.hiprof.core.mapper.ClCourseMembersMapper;
import com.hiprof.core.domain.ClCourseMembers;
import com.hiprof.core.service.IClCourseMembersService;

/**
 * 课程成员管理Service业务层处理
 * 
 * @author emiya
 * @date 2025-08-10
 */
@Service
public class ClCourseMembersServiceImpl implements IClCourseMembersService 
{
    @Autowired
    private ClCourseMembersMapper clCourseMembersMapper;

    /**
     * 查询课程成员管理
     * 
     * @param id 课程成员管理主键
     * @return 课程成员管理
     */
    @Override
    public ClCourseMembers selectClCourseMembersById(Long id)
    {
        return clCourseMembersMapper.selectClCourseMembersById(id);
    }

    /**
     * 查询课程成员管理列表
     * 
     * @param clCourseMembers 课程成员管理
     * @return 课程成员管理
     */
    @Override
    public List<ClCourseMembers> selectClCourseMembersList(ClCourseMembers clCourseMembers)
    {
        return clCourseMembersMapper.selectClCourseMembersList(clCourseMembers);
    }

    /**
     * 新增课程成员管理
     * 
     * @param clCourseMembers 课程成员管理
     * @return 结果
     */
    @Override
    public int insertClCourseMembers(ClCourseMembers clCourseMembers)
    {
        clCourseMembers.setCreateTime(DateUtils.getNowDate());
        return clCourseMembersMapper.insertClCourseMembers(clCourseMembers);
    }

    /**
     * 修改课程成员管理
     * 
     * @param clCourseMembers 课程成员管理
     * @return 结果
     */
    @Override
    public int updateClCourseMembers(ClCourseMembers clCourseMembers)
    {
        clCourseMembers.setUpdateTime(DateUtils.getNowDate());
        return clCourseMembersMapper.updateClCourseMembers(clCourseMembers);
    }

    /**
     * 批量删除课程成员管理
     * 
     * @param ids 需要删除的课程成员管理主键
     * @return 结果
     */
    @Override
    public int deleteClCourseMembersByIds(Long[] ids)
    {
        return clCourseMembersMapper.deleteClCourseMembersByIds(ids);
    }

    /**
     * 删除课程成员管理信息
     * 
     * @param id 课程成员管理主键
     * @return 结果
     */
    @Override
    public int deleteClCourseMembersById(Long id)
    {
        return clCourseMembersMapper.deleteClCourseMembersById(id);
    }
}
