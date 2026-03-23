package com.hiprof.core.mapper;

import com.hiprof.core.domain.ClStudentClassBinding;

import java.util.List;

/**
 * 学生班级绑定Mapper接口
 *
 * @author codex
 */
public interface ClStudentClassBindingMapper
{
    /**
     * 按学生ID查询班级绑定
     *
     * @param studentId 学生ID
     * @return 学生班级绑定
     */
    public ClStudentClassBinding selectClStudentClassBindingByStudentId(Long studentId);

    /**
     * 查询学生班级绑定列表
     *
     * @param clStudentClassBinding 查询条件
     * @return 绑定列表
     */
    public List<ClStudentClassBinding> selectClStudentClassBindingList(ClStudentClassBinding clStudentClassBinding);

    /**
     * 新增学生班级绑定
     *
     * @param clStudentClassBinding 绑定信息
     * @return 结果
     */
    public int insertClStudentClassBinding(ClStudentClassBinding clStudentClassBinding);

    /**
     * 修改学生班级绑定
     *
     * @param clStudentClassBinding 绑定信息
     * @return 结果
     */
    public int updateClStudentClassBinding(ClStudentClassBinding clStudentClassBinding);

    /**
     * 按学生ID删除班级绑定
     *
     * @param studentId 学生ID
     * @return 结果
     */
    public int deleteClStudentClassBindingByStudentId(Long studentId);

    /**
     * 批量按学生ID删除班级绑定
     *
     * @param studentIds 学生ID数组
     * @return 结果
     */
    public int deleteClStudentClassBindingByStudentIds(Long[] studentIds);
}
