package com.hiprof.core.service;

import java.util.List;
import com.hiprof.core.domain.ClScoreItems;

/**
 * 分值变更项目Service接口
 * 
 * @author emiya
 * @date 2025-08-09
 */
public interface IClScoreItemsService 
{
    /**
     * 查询分值变更项目
     * 
     * @param id 分值变更项目主键
     * @return 分值变更项目
     */
    public ClScoreItems selectClScoreItemsById(Long id);

    /**
     * 查询分值变更项目列表
     * 
     * @param clScoreItems 分值变更项目
     * @return 分值变更项目集合
     */
    public List<ClScoreItems> selectClScoreItemsList(ClScoreItems clScoreItems);

    /**
     * 新增分值变更项目
     * 
     * @param clScoreItems 分值变更项目
     * @return 结果
     */
    public int insertClScoreItems(ClScoreItems clScoreItems);

    /**
     * 修改分值变更项目
     * 
     * @param clScoreItems 分值变更项目
     * @return 结果
     */
    public int updateClScoreItems(ClScoreItems clScoreItems);

    /**
     * 批量删除分值变更项目
     * 
     * @param ids 需要删除的分值变更项目主键集合
     * @return 结果
     */
    public int deleteClScoreItemsByIds(Long[] ids);

    /**
     * 删除分值变更项目信息
     * 
     * @param id 分值变更项目主键
     * @return 结果
     */
    public int deleteClScoreItemsById(Long id);
}
