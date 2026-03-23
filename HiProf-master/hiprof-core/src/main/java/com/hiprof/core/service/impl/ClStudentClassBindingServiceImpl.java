package com.hiprof.core.service.impl;

import com.hiprof.common.constant.Constants;
import com.hiprof.common.core.domain.entity.SysDept;
import com.hiprof.common.core.domain.entity.SysRole;
import com.hiprof.common.exception.ServiceException;
import com.hiprof.common.utils.DateUtils;
import com.hiprof.common.utils.StringUtils;
import com.hiprof.core.domain.ClCourseMembers;
import com.hiprof.core.domain.ClCourses;
import com.hiprof.core.domain.ClStudentClassBinding;
import com.hiprof.core.mapper.ClCourseMembersMapper;
import com.hiprof.core.mapper.ClCoursesMapper;
import com.hiprof.core.mapper.ClStudentClassBindingMapper;
import com.hiprof.core.service.IClStudentClassBindingService;
import com.hiprof.system.mapper.SysDeptMapper;
import com.hiprof.system.mapper.SysRoleMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 学生班级绑定Service业务层处理
 *
 * @author codex
 */
@Service
public class ClStudentClassBindingServiceImpl implements IClStudentClassBindingService
{
    private static final String STUDENT_MEMBER_ROLE = "1";

    @Autowired
    private ClStudentClassBindingMapper clStudentClassBindingMapper;

    @Autowired
    private ClCoursesMapper clCoursesMapper;

    @Autowired
    private ClCourseMembersMapper clCourseMembersMapper;

    @Autowired
    private SysDeptMapper sysDeptMapper;

    @Autowired
    private SysRoleMapper sysRoleMapper;

    @Override
    public ClStudentClassBinding selectByStudentId(Long studentId)
    {
        if (studentId == null)
        {
            return null;
        }
        return clStudentClassBindingMapper.selectClStudentClassBindingByStudentId(studentId);
    }

    @Override
    public List<String> selectClassNamesByMajorId(Long majorId)
    {
        List<String> classNames = new ArrayList<String>();
        if (majorId == null)
        {
            return classNames;
        }

        ClCourses query = new ClCourses();
        query.setMajorId(majorId);
        List<ClCourses> courses = clCoursesMapper.selectClCoursesList(query);
        Set<String> uniqueClassNames = new LinkedHashSet<String>();
        for (ClCourses course : courses)
        {
            if (course == null || StringUtils.isEmpty(course.getClassName()))
            {
                continue;
            }
            uniqueClassNames.add(course.getClassName().trim());
        }
        classNames.addAll(uniqueClassNames);
        return classNames;
    }

    @Override
    @Transactional
    public void syncStudentBinding(Long studentId, Long[] roleIds, Long majorId, String className)
    {
        if (studentId == null)
        {
            throw new ServiceException("学生用户不能为空");
        }

        ClStudentClassBinding existingBinding = selectByStudentId(studentId);
        if (!hasStudentRole(roleIds))
        {
            removeCourseMembersByBinding(studentId, existingBinding);
            if (existingBinding != null)
            {
                clStudentClassBindingMapper.deleteClStudentClassBindingByStudentId(studentId);
            }
            return;
        }

        String normalizedClassName = validateAndNormalizeBinding(majorId, className);
        removeStaleCourseMembers(studentId, existingBinding, majorId, normalizedClassName);

        if (existingBinding == null)
        {
            ClStudentClassBinding binding = new ClStudentClassBinding();
            binding.setStudentId(studentId);
            binding.setMajorId(majorId);
            binding.setClassName(normalizedClassName);
            binding.setCreateTime(DateUtils.getNowDate());
            clStudentClassBindingMapper.insertClStudentClassBinding(binding);
        }
        else
        {
            existingBinding.setMajorId(majorId);
            existingBinding.setClassName(normalizedClassName);
            existingBinding.setUpdateTime(DateUtils.getNowDate());
            clStudentClassBindingMapper.updateClStudentClassBinding(existingBinding);
        }

        addStudentToCourses(studentId, loadCourseIds(majorId, normalizedClassName));
    }

    @Override
    @Transactional
    public void syncBoundStudentsToCourse(Long courseId, Long majorId, String className)
    {
        if (courseId == null || majorId == null || StringUtils.isEmpty(className))
        {
            return;
        }

        ClStudentClassBinding query = new ClStudentClassBinding();
        query.setMajorId(majorId);
        query.setClassName(className.trim());
        List<ClStudentClassBinding> bindings = clStudentClassBindingMapper.selectClStudentClassBindingList(query);
        if (StringUtils.isEmpty(bindings))
        {
            return;
        }

        ClCourseMembers memberQuery = new ClCourseMembers();
        memberQuery.setCourseId(courseId);
        memberQuery.setMemberRole(STUDENT_MEMBER_ROLE);
        List<ClCourseMembers> existingMembers = clCourseMembersMapper.selectClCourseMembersList(memberQuery);
        Set<Long> existingUserIds = new HashSet<Long>();
        for (ClCourseMembers existingMember : existingMembers)
        {
            existingUserIds.add(existingMember.getUserId());
        }

        for (ClStudentClassBinding binding : bindings)
        {
            if (binding == null || binding.getStudentId() == null || !existingUserIds.add(binding.getStudentId()))
            {
                continue;
            }
            ClCourseMembers clCourseMembers = new ClCourseMembers();
            clCourseMembers.setCourseId(courseId);
            clCourseMembers.setUserId(binding.getStudentId());
            clCourseMembers.setMemberRole(STUDENT_MEMBER_ROLE);
            clCourseMembers.setCreateTime(DateUtils.getNowDate());
            if (clCourseMembersMapper.insertClCourseMembers(clCourseMembers) <= 0)
            {
                throw new ServiceException("同步班级学生到课程失败");
            }
        }
    }

    @Override
    @Transactional
    public void deleteByStudentIds(Long[] studentIds)
    {
        if (StringUtils.isEmpty(studentIds))
        {
            return;
        }

        for (Long studentId : studentIds)
        {
            if (studentId == null)
            {
                continue;
            }
            removeCourseMembersByBinding(studentId, selectByStudentId(studentId));
        }
        clStudentClassBindingMapper.deleteClStudentClassBindingByStudentIds(studentIds);
    }

    private String validateAndNormalizeBinding(Long majorId, String className)
    {
        if (majorId == null)
        {
            throw new ServiceException("学生必须绑定所属专业");
        }
        SysDept major = sysDeptMapper.selectDeptById(majorId);
        if (major == null)
        {
            throw new ServiceException("绑定的专业不存在");
        }
        if (StringUtils.isEmpty(className) || StringUtils.isEmpty(className.trim()))
        {
            throw new ServiceException("学生必须绑定班级");
        }
        return className.trim();
    }

    private boolean hasStudentRole(Long[] roleIds)
    {
        if (StringUtils.isEmpty(roleIds))
        {
            return false;
        }

        for (Long roleId : roleIds)
        {
            if (roleId == null)
            {
                continue;
            }
            SysRole role = sysRoleMapper.selectRoleById(roleId);
            if (role == null || role.getRoleKey() == null)
            {
                continue;
            }
            if (Constants.STUDENT_ROLE.equals(role.getRoleKey().trim()))
            {
                return true;
            }
        }
        return false;
    }

    private void removeStaleCourseMembers(Long studentId, ClStudentClassBinding existingBinding, Long majorId, String className)
    {
        if (existingBinding == null)
        {
            return;
        }
        boolean sameMajor = majorId != null && majorId.equals(existingBinding.getMajorId());
        boolean sameClass = className.equals(existingBinding.getClassName());
        if (sameMajor && sameClass)
        {
            return;
        }
        removeCourseMembersByBinding(studentId, existingBinding);
    }

    private void removeCourseMembersByBinding(Long studentId, ClStudentClassBinding binding)
    {
        if (binding == null || binding.getMajorId() == null || StringUtils.isEmpty(binding.getClassName()))
        {
            return;
        }
        deleteStudentCourseMembers(studentId, loadCourseIds(binding.getMajorId(), binding.getClassName()));
    }

    private List<Long> loadCourseIds(Long majorId, String className)
    {
        List<Long> courseIds = new ArrayList<Long>();
        if (majorId == null || StringUtils.isEmpty(className))
        {
            return courseIds;
        }

        ClCourses query = new ClCourses();
        query.setMajorId(majorId);
        query.setClassName(className.trim());
        List<ClCourses> courses = clCoursesMapper.selectClCoursesList(query);
        for (ClCourses course : courses)
        {
            if (course != null && course.getId() != null)
            {
                courseIds.add(course.getId());
            }
        }
        return courseIds;
    }

    private void addStudentToCourses(Long studentId, List<Long> courseIds)
    {
        if (StringUtils.isEmpty(courseIds))
        {
            return;
        }

        ClCourseMembers query = new ClCourseMembers();
        query.setUserId(studentId);
        query.setMemberRole(STUDENT_MEMBER_ROLE);
        List<ClCourseMembers> existingMembers = clCourseMembersMapper.selectClCourseMembersList(query);
        Set<Long> existingCourseIds = new HashSet<Long>();
        for (ClCourseMembers existingMember : existingMembers)
        {
            existingCourseIds.add(existingMember.getCourseId());
        }

        for (Long courseId : courseIds)
        {
            if (courseId == null || !existingCourseIds.add(courseId))
            {
                continue;
            }
            ClCourseMembers clCourseMembers = new ClCourseMembers();
            clCourseMembers.setCourseId(courseId);
            clCourseMembers.setUserId(studentId);
            clCourseMembers.setMemberRole(STUDENT_MEMBER_ROLE);
            clCourseMembers.setCreateTime(DateUtils.getNowDate());
            if (clCourseMembersMapper.insertClCourseMembers(clCourseMembers) <= 0)
            {
                throw new ServiceException("同步学生到班级课程失败");
            }
        }
    }

    private void deleteStudentCourseMembers(Long studentId, List<Long> courseIds)
    {
        if (StringUtils.isEmpty(courseIds))
        {
            return;
        }

        ClCourseMembers query = new ClCourseMembers();
        query.setUserId(studentId);
        query.setMemberRole(STUDENT_MEMBER_ROLE);
        List<ClCourseMembers> existingMembers = clCourseMembersMapper.selectClCourseMembersList(query);
        Set<Long> courseIdSet = new HashSet<Long>(courseIds);
        List<Long> memberIds = new ArrayList<Long>();
        for (ClCourseMembers existingMember : existingMembers)
        {
            if (existingMember.getCourseId() != null && courseIdSet.contains(existingMember.getCourseId()))
            {
                memberIds.add(existingMember.getId());
            }
        }
        if (!memberIds.isEmpty())
        {
            clCourseMembersMapper.deleteClCourseMembersByIds(memberIds.toArray(new Long[0]));
        }
    }
}
