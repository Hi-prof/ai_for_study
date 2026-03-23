package com.hiprof.core.service.impl;

import java.math.BigDecimal;
import java.util.List;
import com.hiprof.common.utils.DateUtils;
import com.hiprof.common.utils.PageUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.hiprof.core.mapper.ClScoreSummariesMapper;
import com.hiprof.core.domain.ClScoreSummaries;
import com.hiprof.core.service.IClScoreSummariesService;
import org.springframework.transaction.annotation.Transactional;

/**
 * 分值统计表Service业务层处理
 * 
 * @author emiya
 * @date 2025-08-09
 */
@Service
public class ClScoreSummariesServiceImpl implements IClScoreSummariesService 
{
    @Autowired
    private ClScoreSummariesMapper clScoreSummariesMapper;

    /**
     * 查询分值统计表
     * 
     * @param id 分值统计表主键
     * @return 分值统计表
     */
    @Override
    public ClScoreSummaries selectClScoreSummariesById(Long id)
    {
        return clScoreSummariesMapper.selectClScoreSummariesById(id);
    }

    /**
     * 查询分值统计表列表
     * 
     * @param clScoreSummaries 分值统计表
     * @return 分值统计表
     */
    @Transactional
    @Override
    public List<ClScoreSummaries> selectClScoreSummariesList(ClScoreSummaries clScoreSummaries)
    {

        if (clScoreSummaries.getCourseId() == null) throw new RuntimeException("查询必须传入课程Id");
        //先判断是否有存在记录
        List<ClScoreSummaries> selected = clScoreSummariesMapper.selectClScoreSummariesList(clScoreSummaries);
        if (!selected.isEmpty()){
            //先计算再返回
            clScoreSummariesMapper.mathScoreSummaries(clScoreSummaries);
            clScoreSummariesMapper.updateScoreSummariesRanking(clScoreSummaries);
            PageUtils.startPage();
            return clScoreSummariesMapper.selectClScoreSummariesList(clScoreSummaries);
        }
        return null;
    }

    /**
     * 新增分值统计表
     * 
     * @param clScoreSummaries 分值统计表
     * @return 结果
     */
    @Override
    public int insertClScoreSummaries(ClScoreSummaries clScoreSummaries) {
        clScoreSummaries.setCreateTime(DateUtils.getNowDate());
        clScoreSummaries.setExtraScore(BigDecimal.valueOf(0.0));
        clScoreSummaries.setPenaltyScore(BigDecimal.valueOf(0.0));
        clScoreSummaries.setTotalScore(BigDecimal.valueOf(0.0));
        clScoreSummaries.setRegularScore(BigDecimal.valueOf(0.0));
        if(clScoreSummaries.getStudentId() == null){
            //说明插入整个课程人员
            return clScoreSummariesMapper.initScoreSummariesByCourseId(clScoreSummaries.getCourseId());
        }
        //插入单个人员
        return clScoreSummariesMapper.insertClScoreSummaries(clScoreSummaries);
    }

    /**
     * 修改分值统计表
     * 
     * @param clScoreSummaries 分值统计表
     * @return 结果
     */
    @Override
    public int updateClScoreSummaries(ClScoreSummaries clScoreSummaries)
    {
        clScoreSummaries.setUpdateTime(DateUtils.getNowDate());
        return clScoreSummariesMapper.updateClScoreSummaries(clScoreSummaries);
    }

    /**
     * 批量删除分值统计表
     * 
     * @param ids 需要删除的分值统计表主键
     * @return 结果
     */
    @Override
    public int deleteClScoreSummariesByIds(Long[] ids)
    {
        return clScoreSummariesMapper.deleteClScoreSummariesByIds(ids);
    }

    /**
     * 删除分值统计表信息
     * 
     * @param id 分值统计表主键
     * @return 结果
     */
    @Override
    public int deleteClScoreSummariesById(Long id)
    {
        return clScoreSummariesMapper.deleteClScoreSummariesById(id);
    }
}
