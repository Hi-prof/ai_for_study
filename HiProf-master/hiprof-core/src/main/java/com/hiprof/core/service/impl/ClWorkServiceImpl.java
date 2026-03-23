package com.hiprof.core.service.impl;

import java.util.Date;
import java.util.List;
import com.hiprof.common.utils.DateUtils;
import com.hiprof.core.domain.ClCourses;
import com.hiprof.core.mapper.ClCoursesMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.hiprof.core.mapper.ClWorkMapper;
import com.hiprof.core.domain.ClWork;
import com.hiprof.core.service.IClWorkService;

/**
 * 作业管理Service业务层处理
 * 
 * @author emiya
 * @date 2025-07-20
 */
@Service
public class ClWorkServiceImpl implements IClWorkService 
{
    @Autowired
    private ClWorkMapper clWorkMapper;
    @Autowired
    private ClCoursesMapper clCoursesMapper;

    /**
     * 查询作业管理
     * 
     * @param id 作业管理主键
     * @return 作业管理
     */
    @Override
    public ClWork selectClWorkById(Long id)
    {
        return clWorkMapper.selectClWorkById(id);
    }

    /**
     * 查询作业管理列表
     * 
     * @param clWork 作业管理
     * @return 作业管理
     */
    @Override
    public List<ClWork> selectClWorkList(ClWork clWork)
    {
        return clWorkMapper.selectClWorkList(clWork);
    }

    /**
     * 新增作业管理
     * 
     * @param clWork 作业管理
     * @return 结果
     */
    @Override
    public int insertClWork(ClWork clWork)
    {

        clWork.setCreateTime(DateUtils.getNowDate());

        //校验参数有效性
        Long courseId = clWork.getCourseId();
        if (courseId == null) throw new RuntimeException("课程ID不能为空");
        ClCourses clCourses = clCoursesMapper.selectClCoursesById(courseId);
        if (clCourses == null) throw new RuntimeException("课程不存在");
        Date overTime = clWork.getOverTime();
        Date createTime = clWork.getCreateTime();
        if (!(checkTime(overTime, createTime))) throw new RuntimeException("截止时间不合法");

        return clWorkMapper.insertClWork(clWork);
    }


    private boolean checkTime(Date overTime, Date startTime) {
        if (overTime == null) return false;
        if (startTime == null) return false;
        return !overTime.before(startTime);
    }

    /**
     * 修改作业管理
     * 
     * @param clWork 作业管理
     * @return 结果
     */
    @Override
    public int updateClWork(ClWork clWork)
    {
        if (!checkTime(clWork.getOverTime(), clWork.getCreateTime())) throw new RuntimeException("截止时间不合法");
        clWork.setUpdateTime(DateUtils.getNowDate());
        return clWorkMapper.updateClWork(clWork);
    }

    /**
     * 批量删除作业管理
     * 
     * @param ids 需要删除的作业管理主键
     * @return 结果
     */
    @Override
    public int deleteClWorkByIds(Long[] ids)
    {
        return clWorkMapper.deleteClWorkByIds(ids);
    }

    /**
     * 删除作业管理信息
     * 
     * @param id 作业管理主键
     * @return 结果
     */
    @Override
    public int deleteClWorkById(Long id)
    {
        return clWorkMapper.deleteClWorkById(id);
    }
}
