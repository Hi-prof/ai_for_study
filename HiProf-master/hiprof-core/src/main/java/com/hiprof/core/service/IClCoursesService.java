package com.hiprof.core.service;

import java.util.List;
import com.hiprof.core.domain.ClCourses;

/**
 * 课程管理Service接口
 * 
 * @author emiya
 * @date 2025-07-20
 */
public interface IClCoursesService 
{
    /**
     * 查询课程管理
     * 
     * @param id 课程管理主键
     * @return 课程管理
     */
    public ClCourses selectClCoursesById(Long id);

    /**
     * 查询课程管理列表
     * 
     * @param clCourses 课程管理
     * @return 课程管理集合
     */
    public List<ClCourses> selectClCoursesList(ClCourses clCourses);

    /**
     * 新增课程管理
     * 
     * @param clCourses 课程管理
     * @return 结果
     */
    public Long insertClCourses(ClCourses clCourses);

    /**
     * 修改课程管理
     * 
     * @param clCourses 课程管理
     * @return 结果
     */
    public int updateClCourses(ClCourses clCourses);

    /**
     * 批量删除课程管理
     * 
     * @param ids 需要删除的课程管理主键集合
     * @return 结果
     */
    public int deleteClCoursesByIds(Long[] ids);

    /**
     * 删除课程管理信息
     * 
     * @param id 课程管理主键
     * @return 结果
     */
    public int deleteClCoursesById(Long id);
}
