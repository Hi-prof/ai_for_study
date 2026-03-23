package com.hiprof.core.service;

import java.util.List;
import com.hiprof.core.domain.ClScoreSummaries;

/**
 * 分值统计表Service接口
 * 
 * @author emiya
 * @date 2025-08-09
 */
public interface IClScoreSummariesService 
{
    /**
     * 查询分值统计表
     * 
     * @param id 分值统计表主键
     * @return 分值统计表
     */
    public ClScoreSummaries selectClScoreSummariesById(Long id);

    /**
     * 查询分值统计表列表
     * 
     * @param clScoreSummaries 分值统计表
     * @return 分值统计表集合
     */
    public List<ClScoreSummaries> selectClScoreSummariesList(ClScoreSummaries clScoreSummaries);

    /**
     * 新增分值统计表
     * 
     * @param clScoreSummaries 分值统计表
     * @return 结果
     */
    public int insertClScoreSummaries(ClScoreSummaries clScoreSummaries);

    /**
     * 修改分值统计表
     * 
     * @param clScoreSummaries 分值统计表
     * @return 结果
     */
    public int updateClScoreSummaries(ClScoreSummaries clScoreSummaries);

    /**
     * 批量删除分值统计表
     * 
     * @param ids 需要删除的分值统计表主键集合
     * @return 结果
     */
    public int deleteClScoreSummariesByIds(Long[] ids);

    /**
     * 删除分值统计表信息
     * 
     * @param id 分值统计表主键
     * @return 结果
     */
    public int deleteClScoreSummariesById(Long id);
}
