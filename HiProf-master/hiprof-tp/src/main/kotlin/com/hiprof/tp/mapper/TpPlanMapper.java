package com.hiprof.tp.mapper;

import java.util.List;

import com.hiprof.tp.domain.TpContent;
import com.hiprof.tp.domain.TpPlan;
import com.hiprof.tp.domain.TpModule;

/**
 * 教案管理Mapper接口
 * 
 * @author emiya
 * @date 2025-07-02
 */
public interface TpPlanMapper 
{
    /**
     * 查询教案管理
     * 
     * @param id 教案管理主键
     * @return 教案管理
     */
    public TpPlan selectTpPlanById(Long id);

    /**
     * 查询教案管理列表
     * 
     * @param tpPlan 教案管理
     * @return 教案管理集合
     */
    public List<TpPlan> selectTpPlanList(TpPlan tpPlan);

    /**
     * 新增教案管理
     * 
     * @param tpPlan 教案管理
     * @return 结果
     */
    public int insertTpPlan(TpPlan tpPlan);

    /**
     * 修改教案管理
     * 
     * @param tpPlan 教案管理
     * @return 结果
     */
    public int updateTpPlan(TpPlan tpPlan);

    /**
     * 删除教案管理
     * 
     * @param id 教案管理主键
     * @return 结果
     */
    public int deleteTpPlanById(Long id);

    /**
     * 批量删除教案
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteTpPlanByIds(Long[] ids);

    /**
     * 批量删除教案模块
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteTpModuleByPlanIds(Long[] ids);
    
    /**
     * 批量新增教案模块
     * 
     * @param tpModuleList 教案模块列表
     * @return 结果
     */
    public int batchTpModule(List<TpModule> tpModuleList);
    public int batchTpContent(List<TpContent> tpContentList);


    /**
     * 通过教案管理主键删除教案模块信息
     * 
     * @param id 教案管理ID
     * @return 结果
     */
    public int deleteTpModuleByPlanId(Long id);
}
