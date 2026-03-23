package com.hiprof.core.service.impl;

import com.hiprof.common.core.domain.entity.SysDept;
import com.hiprof.common.exception.ServiceException;
import com.hiprof.common.utils.DateUtils;
import com.hiprof.common.utils.StringUtils;
import com.hiprof.core.domain.ClClass;
import com.hiprof.core.domain.ClCourses;
import com.hiprof.core.domain.ClStudentClassBinding;
import com.hiprof.core.domain.ClTeacherClassBinding;
import com.hiprof.core.mapper.ClClassMapper;
import com.hiprof.core.mapper.ClCoursesMapper;
import com.hiprof.core.mapper.ClStudentClassBindingMapper;
import com.hiprof.core.mapper.ClTeacherClassBindingMapper;
import com.hiprof.core.service.IClClassService;
import com.hiprof.system.mapper.SysDeptMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 班级管理Service业务层处理
 */
@Service
public class ClClassServiceImpl implements IClClassService
{
    @Autowired
    private ClClassMapper clClassMapper;

    @Autowired
    private SysDeptMapper sysDeptMapper;

    @Autowired
    private ClStudentClassBindingMapper clStudentClassBindingMapper;

    @Autowired
    private ClTeacherClassBindingMapper clTeacherClassBindingMapper;

    @Autowired
    private ClCoursesMapper clCoursesMapper;

    @Override
    public ClClass selectClClassById(Long classId)
    {
        return clClassMapper.selectClClassById(classId);
    }

    @Override
    public List<ClClass> selectClClassList(ClClass clClass)
    {
        return clClassMapper.selectClClassList(clClass);
    }

    @Override
    public int insertClClass(ClClass clClass)
    {
        normalizeAndValidate(clClass, false);
        clClass.setCreateTime(DateUtils.getNowDate());
        return clClassMapper.insertClClass(clClass);
    }

    @Override
    public int updateClClass(ClClass clClass)
    {
        if (clClass.getClassId() == null)
        {
            throw new ServiceException("班级ID不能为空");
        }

        ClClass oldClass = clClassMapper.selectClClassById(clClass.getClassId());
        if (oldClass == null)
        {
            throw new ServiceException("班级不存在");
        }

        normalizeAndValidate(clClass, true);
        if (isBindingChanged(oldClass, clClass) && isClassInUse(oldClass))
        {
            throw new ServiceException("班级已被课程或用户绑定使用，不能修改专业或班级名称");
        }

        clClass.setUpdateTime(DateUtils.getNowDate());
        return clClassMapper.updateClClass(clClass);
    }

    @Override
    public int deleteClClassByIds(Long[] classIds)
    {
        if (StringUtils.isEmpty(classIds))
        {
            return 0;
        }

        for (Long classId : classIds)
        {
            ClClass clClass = clClassMapper.selectClClassById(classId);
            if (clClass == null)
            {
                continue;
            }
            if (isClassInUse(clClass))
            {
                throw new ServiceException("班级\"" + clClass.getClassName() + "\"已被课程或用户绑定使用，不能删除");
            }
        }
        return clClassMapper.deleteClClassByIds(classIds);
    }

    @Override
    public boolean checkClassNameUnique(ClClass clClass)
    {
        ClClass query = new ClClass();
        query.setMajorId(clClass.getMajorId());
        query.setClassName(clClass.getClassName());
        ClClass existing = clClassMapper.selectClClassByMajorIdAndClassName(query);
        if (existing == null)
        {
            return true;
        }
        return clClass.getClassId() == null || existing.getClassId().equals(clClass.getClassId());
    }

    private void normalizeAndValidate(ClClass clClass, boolean update)
    {
        if (clClass == null)
        {
            throw new ServiceException("班级信息不能为空");
        }
        if (clClass.getMajorId() == null)
        {
            throw new ServiceException("所属专业不能为空");
        }

        SysDept major = sysDeptMapper.selectDeptById(clClass.getMajorId());
        if (major == null)
        {
            throw new ServiceException("所属专业不存在");
        }

        if (StringUtils.isEmpty(clClass.getClassName()) || StringUtils.isEmpty(clClass.getClassName().trim()))
        {
            throw new ServiceException("班级名称不能为空");
        }
        clClass.setClassName(clClass.getClassName().trim());

        if (StringUtils.isEmpty(clClass.getStatus()))
        {
            clClass.setStatus("0");
        }

        if (!checkClassNameUnique(clClass))
        {
            throw new ServiceException((update ? "修改" : "新增") + "班级\"" + clClass.getClassName() + "\"失败，同一专业下班级名称已存在");
        }
    }

    private boolean isBindingChanged(ClClass oldClass, ClClass newClass)
    {
        if (!oldClass.getMajorId().equals(newClass.getMajorId()))
        {
            return true;
        }
        return !oldClass.getClassName().equals(newClass.getClassName());
    }

    private boolean isClassInUse(ClClass clClass)
    {
        ClStudentClassBinding studentQuery = new ClStudentClassBinding();
        studentQuery.setMajorId(clClass.getMajorId());
        studentQuery.setClassName(clClass.getClassName());
        List<ClStudentClassBinding> studentBindings = clStudentClassBindingMapper.selectClStudentClassBindingList(studentQuery);
        if (!StringUtils.isEmpty(studentBindings))
        {
            return true;
        }

        ClTeacherClassBinding teacherQuery = new ClTeacherClassBinding();
        teacherQuery.setMajorId(clClass.getMajorId());
        teacherQuery.setClassName(clClass.getClassName());
        List<ClTeacherClassBinding> teacherBindings = clTeacherClassBindingMapper.selectClTeacherClassBindingList(teacherQuery);
        if (!StringUtils.isEmpty(teacherBindings))
        {
            return true;
        }

        ClCourses courseQuery = new ClCourses();
        courseQuery.setMajorId(clClass.getMajorId());
        courseQuery.setClassName(clClass.getClassName());
        List<ClCourses> courses = clCoursesMapper.selectClCoursesList(courseQuery);
        return !StringUtils.isEmpty(courses);
    }
}
