package com.hiprof.core.mapper;

import java.util.List;
import com.hiprof.core.domain.ClScoreRecords;

/**
 * 分值变更记录Mapper接口
 * 
 * @author emiya
 * @date 2025-08-09
 */
public interface ClScoreRecordsMapper 
{
    /**
     * 查询分值变更记录
     * 
     * @param id 分值变更记录主键
     * @return 分值变更记录
     */
    public ClScoreRecords selectClScoreRecordsById(Long id);

    /**
     * 查询分值变更记录列表
     * 
     * @param clScoreRecords 分值变更记录
     * @return 分值变更记录集合
     */
    public List<ClScoreRecords> selectClScoreRecordsList(ClScoreRecords clScoreRecords);

    /**
     * 新增分值变更记录
     * 
     * @param clScoreRecords 分值变更记录
     * @return 结果
     */
    public int insertClScoreRecords(ClScoreRecords clScoreRecords);

    /**
     * 修改分值变更记录
     * 
     * @param clScoreRecords 分值变更记录
     * @return 结果
     */
    public int updateClScoreRecords(ClScoreRecords clScoreRecords);

    /**
     * 删除分值变更记录
     * 
     * @param id 分值变更记录主键
     * @return 结果
     */
    public int deleteClScoreRecordsById(Long id);

    /**
     * 批量删除分值变更记录
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteClScoreRecordsByIds(Long[] ids);
}
