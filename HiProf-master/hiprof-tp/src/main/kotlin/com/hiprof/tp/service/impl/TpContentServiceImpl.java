package com.hiprof.tp.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.hiprof.tp.mapper.TpContentMapper;
import com.hiprof.tp.domain.TpContent;
import com.hiprof.tp.service.ITpContentService;

/**
 * 模块内容Service业务层处理
 * 
 * @author ruoyi
 * @date 2025-07-02
 */
@Service
public class TpContentServiceImpl implements ITpContentService 
{
    @Autowired
    private TpContentMapper tpContentMapper;

    /**
     * 查询模块内容
     * 
     * @param id 模块内容主键
     * @return 模块内容
     */
    @Override
    public TpContent selectTpContentById(Long id)
    {
        return tpContentMapper.selectTpContentById(id);
    }

    /**
     * 查询模块内容列表
     * 
     * @param tpContent 模块内容
     * @return 模块内容
     */
    @Override
    public List<TpContent> selectTpContentList(TpContent tpContent)
    {
        return tpContentMapper.selectTpContentList(tpContent);
    }

    /**
     * 新增模块内容
     * 
     * @param tpContent 模块内容
     * @return 结果
     */
    @Override
    public int insertTpContent(TpContent tpContent)
    {
        return tpContentMapper.insertTpContent(tpContent);
    }

    /**
     * 修改模块内容
     * 
     * @param tpContent 模块内容
     * @return 结果
     */
    @Override
    public int updateTpContent(TpContent tpContent)
    {
        return tpContentMapper.updateTpContent(tpContent);
    }

    /**
     * 批量删除模块内容
     * 
     * @param ids 需要删除的模块内容主键
     * @return 结果
     */
    @Override
    public int deleteTpContentByIds(Long[] ids)
    {
        return tpContentMapper.deleteTpContentByIds(ids);
    }

    /**
     * 删除模块内容信息
     * 
     * @param id 模块内容主键
     * @return 结果
     */
    @Override
    public int deleteTpContentById(Long id)
    {
        return tpContentMapper.deleteTpContentById(id);
    }
}
