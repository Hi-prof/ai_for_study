package com.hiprof.core.service.impl;

import java.util.List;
import com.hiprof.common.utils.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.hiprof.core.mapper.ClScoreRecordsMapper;
import com.hiprof.core.domain.ClScoreRecords;
import com.hiprof.core.service.IClScoreRecordsService;

/**
 * 分值变更记录Service业务层处理
 * 
 * @author emiya
 * @date 2025-08-09
 */
@Service
public class ClScoreRecordsServiceImpl implements IClScoreRecordsService 
{
    @Autowired
    private ClScoreRecordsMapper clScoreRecordsMapper;

    /**
     * 查询分值变更记录
     * 
     * @param id 分值变更记录主键
     * @return 分值变更记录
     */
    @Override
    public ClScoreRecords selectClScoreRecordsById(Long id)
    {
        return clScoreRecordsMapper.selectClScoreRecordsById(id);
    }

    /**
     * 查询分值变更记录列表
     * 
     * @param clScoreRecords 分值变更记录
     * @return 分值变更记录
     */
    @Override
    public List<ClScoreRecords> selectClScoreRecordsList(ClScoreRecords clScoreRecords)
    {
        return clScoreRecordsMapper.selectClScoreRecordsList(clScoreRecords);
    }

    /**
     * 新增分值变更记录
     * 
     * @param clScoreRecords 分值变更记录
     * @return 结果
     */
    @Override
    public int insertClScoreRecords(ClScoreRecords clScoreRecords)
    {
        clScoreRecords.setCreateTime(DateUtils.getNowDate());
        return clScoreRecordsMapper.insertClScoreRecords(clScoreRecords);
    }

    /**
     * 修改分值变更记录
     * 
     * @param clScoreRecords 分值变更记录
     * @return 结果
     */
    @Override
    public int updateClScoreRecords(ClScoreRecords clScoreRecords)
    {
        clScoreRecords.setUpdateTime(DateUtils.getNowDate());
        return clScoreRecordsMapper.updateClScoreRecords(clScoreRecords);
    }

    /**
     * 批量删除分值变更记录
     * 
     * @param ids 需要删除的分值变更记录主键
     * @return 结果
     */
    @Override
    public int deleteClScoreRecordsByIds(Long[] ids)
    {
        return clScoreRecordsMapper.deleteClScoreRecordsByIds(ids);
    }

    /**
     * 删除分值变更记录信息
     * 
     * @param id 分值变更记录主键
     * @return 结果
     */
    @Override
    public int deleteClScoreRecordsById(Long id)
    {
        return clScoreRecordsMapper.deleteClScoreRecordsById(id);
    }
}
