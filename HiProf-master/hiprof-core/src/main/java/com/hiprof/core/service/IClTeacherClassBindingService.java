package com.hiprof.core.service;

import com.hiprof.common.core.domain.model.TeacherClassBindingItem;

import java.util.List;

/**
 * 教师班级绑定Service接口
 */
public interface IClTeacherClassBindingService
{
    /**
     * 按教师ID查询绑定列表
     *
     * @param teacherId 教师ID
     * @return 绑定列表
     */
    public List<TeacherClassBindingItem> selectBindingItemsByTeacherId(Long teacherId);

    /**
     * 同步教师班级绑定关系
     *
     * @param teacherId 教师ID
     * @param roleIds 当前角色ID集合
     * @param bindings 班级绑定列表
     */
    public void syncTeacherBindings(Long teacherId, Long[] roleIds, List<TeacherClassBindingItem> bindings);

    /**
     * 按教师ID批量清理绑定关系
     *
     * @param teacherIds 教师ID数组
     */
    public void deleteByTeacherIds(Long[] teacherIds);
}
