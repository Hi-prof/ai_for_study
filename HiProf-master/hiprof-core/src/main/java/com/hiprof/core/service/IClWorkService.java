package com.hiprof.core.service;

import java.util.List;
import com.hiprof.core.domain.ClWork;

/**
 * 作业管理Service接口
 * 
 * @author emiya
 * @date 2025-07-20
 */
public interface IClWorkService 
{
    /**
     * 查询作业管理
     * 
     * @param id 作业管理主键
     * @return 作业管理
     */
    public ClWork selectClWorkById(Long id);

    /**
     * 查询作业管理列表
     * 
     * @param clWork 作业管理
     * @return 作业管理集合
     */
    public List<ClWork> selectClWorkList(ClWork clWork);

    /**
     * 新增作业管理
     * 
     * @param clWork 作业管理
     * @return 结果
     */
    public int insertClWork(ClWork clWork);

    /**
     * 修改作业管理
     * 
     * @param clWork 作业管理
     * @return 结果
     */
    public int updateClWork(ClWork clWork);

    /**
     * 批量删除作业管理
     * 
     * @param ids 需要删除的作业管理主键集合
     * @return 结果
     */
    public int deleteClWorkByIds(Long[] ids);

    /**
     * 删除作业管理信息
     * 
     * @param id 作业管理主键
     * @return 结果
     */
    public int deleteClWorkById(Long id);
}
