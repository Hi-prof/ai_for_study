package com.hiprof.tp.service.impl;

import java.util.List;

import com.hiprof.tp.mapper.TpContentMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import com.hiprof.common.utils.StringUtils;
import org.springframework.transaction.annotation.Transactional;
import com.hiprof.tp.domain.TpContent;
import com.hiprof.tp.mapper.TpModuleMapper;
import com.hiprof.tp.domain.TpModule;
import com.hiprof.tp.service.ITpModuleService;

/**
 * 教案模块Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-07-02
 */
@Service
public class TpModuleServiceImpl implements ITpModuleService 
{
    @Autowired
    private TpModuleMapper tpModuleMapper;

    @Autowired
    TpContentMapper tpContentMapper;

    /**
     * 查询教案模块
     * 
     * @param id 教案模块主键
     * @return 教案模块
     */
    @Override
    public TpModule selectTpModuleById(Long id)
    {
        return tpModuleMapper.selectTpModuleById(id);
    }

    /**
     * 查询教案模块列表
     * 
     * @param tpModule 教案模块
     * @return 教案模块
     */
    @Override
    public List<TpModule> selectTpModuleList(TpModule tpModule)
    {
        return tpModuleMapper.selectTpModuleList(tpModule);
    }


    /**
     * 新增教案模块
     * 
     * @param tpModule 教案模块
     * @return 结果
     */
    @Transactional
    @Override
    public long insertTpModule(TpModule tpModule)
    {
        tpModuleMapper.insertTpModule(tpModule);
        var tpContent=new TpContent();
        tpContent.setModuleId(tpModule.getId());
        tpContent.setContent(tpModule.getContent().getContent());
        tpContent.setFileUrl(tpModule.getContent().getFileUrl());
        tpContentMapper.insertTpContent(tpContent);

        if (tpModule.getId() == null) throw new RuntimeException("新增教案模块失败");
        return tpModule.getId();
    }

    /**
     * 修改教案模块
     * 
     * @param tpModule 教案模块
     * @return 结果
     */
    @Transactional
    @Override
    public int updateTpModule(TpModule tpModule)
    {
        tpModuleMapper.deleteTpContentByModuleId(tpModule.getId());

        return tpModuleMapper.updateTpModule(tpModule);
    }

    /**
     * 批量删除教案模块
     * 
     * @param ids 需要删除的教案模块主键
     * @return 结果
     */
    @Transactional
    @Override
    public int deleteTpModuleByIds(Long[] ids)
    {
        tpModuleMapper.deleteTpContentByModuleIds(ids);
        return tpModuleMapper.deleteTpModuleByIds(ids);
    }

    /**
     * 删除教案模块信息
     * 
     * @param id 教案模块主键
     * @return 结果
     */
    @Transactional
    @Override
    public int deleteTpModuleById(Long id)
    {
        tpModuleMapper.deleteTpContentByModuleId(id);
        return tpModuleMapper.deleteTpModuleById(id);
    }


}
