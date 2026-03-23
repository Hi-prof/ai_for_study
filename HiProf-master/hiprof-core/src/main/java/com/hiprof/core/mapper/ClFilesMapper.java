package com.hiprof.core.mapper;

import java.util.List;
import com.hiprof.core.domain.ClFiles;

/**
 * 课程文件Mapper接口
 * 
 * @author emiya
 * @date 2025-08-07
 */
public interface ClFilesMapper 
{
    /**
     * 查询课程文件
     * 
     * @param id 课程文件主键
     * @return 课程文件
     */
    public ClFiles selectClFilesById(Long id);

    /**
     * 查询课程文件列表
     * 
     * @param clFiles 课程文件
     * @return 课程文件集合
     */
    public List<ClFiles> selectClFilesList(ClFiles clFiles);


    public List<ClFiles> selectClFilesListByIds(Long[] ids);

    /**
     * 新增课程文件
     * 
     * @param clFiles 课程文件
     * @return 结果
     */
    public int insertClFiles(ClFiles clFiles);

    /**
     * 修改课程文件
     * 
     * @param clFiles 课程文件
     * @return 结果
     */
    public int updateClFiles(ClFiles clFiles);

    /**
     * 删除课程文件
     * 
     * @param id 课程文件主键
     * @return 结果
     */
    public int deleteClFilesById(Long id);

    /**
     * 批量删除课程文件
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteClFilesByIds(Long[] ids);
}
