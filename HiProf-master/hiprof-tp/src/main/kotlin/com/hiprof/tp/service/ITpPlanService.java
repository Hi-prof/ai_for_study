package com.hiprof.tp.service;

import java.util.List;
import com.hiprof.tp.domain.TpPlan;

/**
 * 教案管理Service接口
 * 
 * @author emiya
 * @date 2025-07-02
 */
public interface ITpPlanService 
{
    /**
     * 查询教案管理
     * 
     * @param id 教案管理主键
     * @return 教案管理
     */
    public TpPlan selectTpPlanById(Long id);
//    public TpPlanVo selectTpPlanVoById(Long id);

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
    public long insertTpPlan(TpPlan tpPlan);

    /**
     * 修改教案管理
     * 
     * @param tpPlan 教案管理
     * @return 结果
     */
    public int updateTpPlan(TpPlan tpPlan);

    /**
     * 批量删除教案管理
     * 
     * @param ids 需要删除的教案管理主键集合
     * @return 结果
     */
    public int deleteTpPlanByIds(Long[] ids);

    /**
     * 删除教案管理信息
     * 
     * @param id 教案管理主键
     * @return 结果
     */
    public int deleteTpPlanById(Long id);
}
