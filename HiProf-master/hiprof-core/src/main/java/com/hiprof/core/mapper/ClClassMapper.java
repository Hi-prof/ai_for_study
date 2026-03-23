package com.hiprof.core.mapper;

import com.hiprof.core.domain.ClClass;

import java.util.List;

/**
 * 班级管理Mapper接口
 */
public interface ClClassMapper
{
    /**
     * 查询班级管理
     *
     * @param classId 班级ID
     * @return 班级管理
     */
    public ClClass selectClClassById(Long classId);

    /**
     * 查询班级管理列表
     *
     * @param clClass 班级管理
     * @return 班级管理集合
     */
    public List<ClClass> selectClClassList(ClClass clClass);

    /**
     * 按专业和班级名称查询班级
     *
     * @param clClass 查询条件
     * @return 班级信息
     */
    public ClClass selectClClassByMajorIdAndClassName(ClClass clClass);

    /**
     * 新增班级管理
     *
     * @param clClass 班级管理
     * @return 结果
     */
    public int insertClClass(ClClass clClass);

    /**
     * 修改班级管理
     *
     * @param clClass 班级管理
     * @return 结果
     */
    public int updateClClass(ClClass clClass);

    /**
     * 批量删除班级管理
     *
     * @param classIds 需要删除的班级ID
     * @return 结果
     */
    public int deleteClClassByIds(Long[] classIds);
}
