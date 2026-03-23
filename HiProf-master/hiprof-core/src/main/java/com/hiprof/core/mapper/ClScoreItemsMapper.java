package com.hiprof.core.mapper;

import java.util.List;
import com.hiprof.core.domain.ClScoreItems;

/**
 * 分值变更项目Mapper接口
 * 
 * @author emiya
 * @date 2025-08-09
 */
public interface ClScoreItemsMapper 
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
     * 删除分值变更项目
     * 
     * @param id 分值变更项目主键
     * @return 结果
     */
    public int deleteClScoreItemsById(Long id);

    /**
     * 批量删除分值变更项目
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteClScoreItemsByIds(Long[] ids);
}
