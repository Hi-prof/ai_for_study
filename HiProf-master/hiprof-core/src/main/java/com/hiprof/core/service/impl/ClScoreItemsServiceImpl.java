package com.hiprof.core.service.impl;

import java.util.List;
import com.hiprof.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.hiprof.core.mapper.ClScoreItemsMapper;
import com.hiprof.core.domain.ClScoreItems;
import com.hiprof.core.service.IClScoreItemsService;

/**
 * 分值变更项目Service业务层处理
 * 
 * @author emiya
 * @date 2025-08-09
 */
@Service
public class ClScoreItemsServiceImpl implements IClScoreItemsService 
{
    @Autowired
    private ClScoreItemsMapper clScoreItemsMapper;

    /**
     * 查询分值变更项目
     * 
     * @param id 分值变更项目主键
     * @return 分值变更项目
     */
    @Override
    public ClScoreItems selectClScoreItemsById(Long id)
    {
        return clScoreItemsMapper.selectClScoreItemsById(id);
    }

    /**
     * 查询分值变更项目列表
     * 
     * @param clScoreItems 分值变更项目
     * @return 分值变更项目
     */
    @Override
    public List<ClScoreItems> selectClScoreItemsList(ClScoreItems clScoreItems)
    {
        return clScoreItemsMapper.selectClScoreItemsList(clScoreItems);
    }

    /**
     * 新增分值变更项目
     * 
     * @param clScoreItems 分值变更项目
     * @return 结果
     */
    @Override
    public int insertClScoreItems(ClScoreItems clScoreItems)
    {
        clScoreItems.setCreateTime(DateUtils.getNowDate());
        return clScoreItemsMapper.insertClScoreItems(clScoreItems);
    }

    /**
     * 修改分值变更项目
     * 
     * @param clScoreItems 分值变更项目
     * @return 结果
     */
    @Override
    public int updateClScoreItems(ClScoreItems clScoreItems)
    {
        clScoreItems.setUpdateTime(DateUtils.getNowDate());
        return clScoreItemsMapper.updateClScoreItems(clScoreItems);
    }

    /**
     * 批量删除分值变更项目
     * 
     * @param ids 需要删除的分值变更项目主键
     * @return 结果
     */
    @Override
    public int deleteClScoreItemsByIds(Long[] ids)
    {
        return clScoreItemsMapper.deleteClScoreItemsByIds(ids);
    }

    /**
     * 删除分值变更项目信息
     * 
     * @param id 分值变更项目主键
     * @return 结果
     */
    @Override
    public int deleteClScoreItemsById(Long id)
    {
        return clScoreItemsMapper.deleteClScoreItemsById(id);
    }
}
