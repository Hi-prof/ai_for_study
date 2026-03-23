package com.hiprof.tp.service;

import java.util.List;
import com.hiprof.tp.domain.TpModule;

/**
 * 教案模块Service接口
 * 
 * @author ruoyi
 * @date 2025-07-02
 */
public interface ITpModuleService 
{
    /**
     * 查询教案模块
     * 
     * @param id 教案模块主键
     * @return 教案模块
     */
    public TpModule selectTpModuleById(Long id);

    /**
     * 查询教案模块列表
     * 
     * @param tpModule 教案模块
     * @return 教案模块集合
     */
    public List<TpModule> selectTpModuleList(TpModule tpModule);

    /**
     * 新增教案模块
     * 
     * @param tpModule 教案模块
     * @return 结果
     */
    public long insertTpModule(TpModule tpModule);

    /**
     * 修改教案模块
     * 
     * @param tpModule 教案模块
     * @return 结果
     */
    public int updateTpModule(TpModule tpModule);

    /**
     * 批量删除教案模块
     * 
     * @param ids 需要删除的教案模块主键集合
     * @return 结果
     */
    public int deleteTpModuleByIds(Long[] ids);

    /**
     * 删除教案模块信息
     * 
     * @param id 教案模块主键
     * @return 结果
     */
    public int deleteTpModuleById(Long id);
}
