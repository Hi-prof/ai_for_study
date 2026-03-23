package com.hiprof.core.service;

import com.hiprof.core.domain.ClStudentClassBinding;

import java.util.List;

/**
 * 学生班级绑定Service接口
 *
 * @author codex
 */
public interface IClStudentClassBindingService
{
    /**
     * 按学生ID查询绑定
     *
     * @param studentId 学生ID
     * @return 绑定信息
     */
    public ClStudentClassBinding selectByStudentId(Long studentId);

    /**
     * 查询专业下已存在的班级名称选项
     *
     * @param majorId 专业ID
     * @return 班级名称列表
     */
    public List<String> selectClassNamesByMajorId(Long majorId);

    /**
     * 同步学生班级绑定与课程成员关系
     *
     * @param studentId 学生ID
     * @param roleIds 当前角色ID集合
     * @param majorId 绑定专业ID
     * @param className 绑定班级名称
     */
    public void syncStudentBinding(Long studentId, Long[] roleIds, Long majorId, String className);

    /**
     * 将已绑定到指定班级的学生同步到课程成员中
     *
     * @param courseId 课程ID
     * @param majorId 专业ID
     * @param className 班级名称
     */
    public void syncBoundStudentsToCourse(Long courseId, Long majorId, String className);

    /**
     * 按学生ID批量清理绑定关系
     *
     * @param studentIds 学生ID数组
     */
    public void deleteByStudentIds(Long[] studentIds);
}
