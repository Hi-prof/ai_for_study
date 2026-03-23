package com.hiprof.core.mapper;

import java.util.List;
import com.hiprof.core.domain.ClCourses;

/**
 * 课程管理Mapper接口
 * 
 * @author emiya
 * @date 2025-07-20
 */
public interface ClCoursesMapper 
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
    public int insertClCourses(ClCourses clCourses);

    /**
     * 修改课程管理
     * 
     * @param clCourses 课程管理
     * @return 结果
     */
    public int updateClCourses(ClCourses clCourses);

    /**
     * 删除课程管理
     * 
     * @param id 课程管理主键
     * @return 结果
     */
    public int deleteClCoursesById(Long id);

    /**
     * 批量删除课程管理
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteClCoursesByIds(Long[] ids);
}
