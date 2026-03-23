package com.hiprof.core.mapper;

import com.hiprof.core.domain.ClTeacherClassBinding;

import java.util.List;

/**
 * 教师班级绑定Mapper接口
 */
public interface ClTeacherClassBindingMapper
{
    /**
     * 按教师ID查询班级绑定列表
     *
     * @param teacherId 教师ID
     * @return 绑定列表
     */
    public List<ClTeacherClassBinding> selectClTeacherClassBindingListByTeacherId(Long teacherId);

    /**
     * 新增教师班级绑定
     *
     * @param clTeacherClassBinding 绑定信息
     * @return 结果
     */
    public int insertClTeacherClassBinding(ClTeacherClassBinding clTeacherClassBinding);

    /**
     * 按教师ID删除班级绑定
     *
     * @param teacherId 教师ID
     * @return 结果
     */
    public int deleteClTeacherClassBindingByTeacherId(Long teacherId);

    /**
     * 批量按教师ID删除班级绑定
     *
     * @param teacherIds 教师ID数组
     * @return 结果
     */
    public int deleteClTeacherClassBindingByTeacherIds(Long[] teacherIds);
}
