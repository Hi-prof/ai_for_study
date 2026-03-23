package com.hiprof.tp.service.impl;

import java.util.List;
import com.hiprof.common.utils.DateUtils;
import com.hiprof.tp.domain.TpContent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import com.hiprof.common.utils.StringUtils;
import org.springframework.transaction.annotation.Transactional;
import com.hiprof.tp.domain.TpModule;
import com.hiprof.tp.mapper.TpPlanMapper;
import com.hiprof.tp.domain.TpPlan;
import com.hiprof.tp.service.ITpPlanService;

/**
 * 教案管理Service业务层处理
 * 
 * @author emiya
 * @date 2025-07-02
 */
@Service
public class TpPlanServiceImpl implements ITpPlanService {
    @Autowired
    private TpPlanMapper tpPlanMapper;

    /**
     * 查询教案管理
     * 
     * @param id 教案管理主键
     * @return 教案管理
     */
    @Override
    public TpPlan selectTpPlanById(Long id)
    {
        return tpPlanMapper.selectTpPlanById(id);
    }

    /**
     * 查询教案管理列表
     * 
     * @param tpPlan 教案管理
     * @return 教案管理
     */
    @Override
    public List<TpPlan> selectTpPlanList(TpPlan tpPlan)
    {
        return tpPlanMapper.selectTpPlanList(tpPlan);
    }

    /**
     * 新增教案管理
     * 
     * @param tpPlan 教案管理
     * @return 结果
     */
    @Transactional
    @Override
    public long insertTpPlan(TpPlan tpPlan)
    {
        tpPlan.setCreateTime(DateUtils.getNowDate());
        tpPlanMapper.insertTpPlan(tpPlan);
        insertTpModule(tpPlan);
        if(tpPlan.getId()!=null){
            return tpPlan.getId();
        }else throw new RuntimeException("新增教案失败");
    }

    /**
     * 修改教案管理
     * 
     * @param tpPlan 教案管理
     * @return 结果
     */
    @Transactional
    @Override
    public int updateTpPlan(TpPlan tpPlan)
    {
        tpPlan.setUpdateTime(DateUtils.getNowDate());
        tpPlanMapper.deleteTpModuleByPlanId(tpPlan.getId());
        insertTpModule(tpPlan);
        return tpPlanMapper.updateTpPlan(tpPlan);
    }

    /**
     * 批量删除教案管理
     * 
     * @param ids 需要删除的教案管理主键
     * @return 结果
     */
    @Transactional
    @Override
    public int deleteTpPlanByIds(Long[] ids)
    {
        tpPlanMapper.deleteTpModuleByPlanIds(ids);
        return tpPlanMapper.deleteTpPlanByIds(ids);
    }

    /**
     * 删除教案管理信息
     * 
     * @param id 教案管理主键
     * @return 结果
     */
    @Transactional
    @Override
    public int deleteTpPlanById(Long id)
    {
        tpPlanMapper.deleteTpModuleByPlanId(id);
        return tpPlanMapper.deleteTpPlanById(id);
    }

    /**
     * 新增教案模块信息
     * 
     * @param tpPlan 教案管理对象
     */
    private void insertTpModule(TpPlan tpPlan){
        List<TpModule> tpModuleList = tpPlan.getTpModuleList();
        Long id = tpPlan.getId();
        if (StringUtils.isNotNull(tpModuleList)) {
            List<TpModule> list = new ArrayList<TpModule>();
            for (TpModule tpModule : tpModuleList) {
                tpModule.setPlanId(id);
                list.add(tpModule);
            }
            if (list.size() > 0) {
                tpPlanMapper.batchTpModule(list);

                ArrayList<TpContent> tpContents = new ArrayList<>();

                for (TpModule tpModule : list) {
                    Long moduleId = tpModule.getId();
                    System.out.println("插入的模块ID为"+moduleId);
                    TpContent tpContent = tpModule.getContent();
                    tpContent.setModuleId(moduleId);
                    tpContents.add(tpContent);
                }

                if (tpContents.size() > 0) {
                    tpPlanMapper.batchTpContent(tpContents);
                }

            }
        }
    }







}
