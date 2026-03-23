package com.hiprof.core.service.impl;

import com.hiprof.common.constant.Constants;
import com.hiprof.common.core.domain.entity.SysDept;
import com.hiprof.common.core.domain.entity.SysRole;
import com.hiprof.common.core.domain.model.TeacherClassBindingItem;
import com.hiprof.common.exception.ServiceException;
import com.hiprof.common.utils.DateUtils;
import com.hiprof.common.utils.StringUtils;
import com.hiprof.core.domain.ClTeacherClassBinding;
import com.hiprof.core.mapper.ClTeacherClassBindingMapper;
import com.hiprof.core.service.IClTeacherClassBindingService;
import com.hiprof.system.mapper.SysDeptMapper;
import com.hiprof.system.mapper.SysRoleMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 教师班级绑定Service业务层处理
 */
@Service
public class ClTeacherClassBindingServiceImpl implements IClTeacherClassBindingService
{
    @Autowired
    private ClTeacherClassBindingMapper clTeacherClassBindingMapper;

    @Autowired
    private SysDeptMapper sysDeptMapper;

    @Autowired
    private SysRoleMapper sysRoleMapper;

    @Override
    public List<TeacherClassBindingItem> selectBindingItemsByTeacherId(Long teacherId)
    {
        List<TeacherClassBindingItem> items = new ArrayList<TeacherClassBindingItem>();
        if (teacherId == null)
        {
            return items;
        }
        List<ClTeacherClassBinding> bindings = clTeacherClassBindingMapper.selectClTeacherClassBindingListByTeacherId(teacherId);
        if (StringUtils.isEmpty(bindings))
        {
            return items;
        }
        for (ClTeacherClassBinding binding : bindings)
        {
            if (binding == null)
            {
                continue;
            }
            TeacherClassBindingItem item = new TeacherClassBindingItem();
            item.setMajorId(binding.getMajorId());
            item.setClassName(binding.getClassName());
            items.add(item);
        }
        return items;
    }

    @Override
    @Transactional
    public void syncTeacherBindings(Long teacherId, Long[] roleIds, List<TeacherClassBindingItem> bindings)
    {
        if (teacherId == null)
        {
            throw new ServiceException("教师用户不能为空");
        }

        if (!hasTeacherRole(roleIds))
        {
            clTeacherClassBindingMapper.deleteClTeacherClassBindingByTeacherId(teacherId);
            return;
        }

        List<ClTeacherClassBinding> normalizedBindings = normalizeBindings(teacherId, bindings);
        clTeacherClassBindingMapper.deleteClTeacherClassBindingByTeacherId(teacherId);
        for (ClTeacherClassBinding binding : normalizedBindings)
        {
            clTeacherClassBindingMapper.insertClTeacherClassBinding(binding);
        }
    }

    @Override
    @Transactional
    public void deleteByTeacherIds(Long[] teacherIds)
    {
        if (StringUtils.isEmpty(teacherIds))
        {
            return;
        }
        clTeacherClassBindingMapper.deleteClTeacherClassBindingByTeacherIds(teacherIds);
    }

    private List<ClTeacherClassBinding> normalizeBindings(Long teacherId, List<TeacherClassBindingItem> bindings)
    {
        List<ClTeacherClassBinding> normalizedBindings = new ArrayList<ClTeacherClassBinding>();
        if (StringUtils.isEmpty(bindings))
        {
            return normalizedBindings;
        }

        Set<String> uniqueKeys = new LinkedHashSet<String>();
        for (TeacherClassBindingItem item : bindings)
        {
            if (item == null)
            {
                continue;
            }

            Long majorId = item.getMajorId();
            String className = item.getClassName() == null ? null : item.getClassName().trim();
            if (majorId == null && StringUtils.isEmpty(className))
            {
                continue;
            }
            if (majorId == null)
            {
                throw new ServiceException("教师绑定班级时必须选择所属专业");
            }
            if (StringUtils.isEmpty(className))
            {
                throw new ServiceException("教师绑定班级名称不能为空");
            }

            SysDept major = sysDeptMapper.selectDeptById(majorId);
            if (major == null)
            {
                throw new ServiceException("教师绑定的专业不存在");
            }

            String uniqueKey = majorId + "::" + className;
            if (!uniqueKeys.add(uniqueKey))
            {
                throw new ServiceException("教师绑定班级不能重复");
            }

            ClTeacherClassBinding binding = new ClTeacherClassBinding();
            binding.setTeacherId(teacherId);
            binding.setMajorId(majorId);
            binding.setClassName(className);
            binding.setCreateTime(DateUtils.getNowDate());
            normalizedBindings.add(binding);
        }
        return normalizedBindings;
    }

    private boolean hasTeacherRole(Long[] roleIds)
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
            String roleKey = role.getRoleKey().trim();
            if (Constants.TEACHER_ROLE.equals(roleKey) || Constants.COMMON_ROLE.equals(roleKey))
            {
                return true;
            }
        }
        return false;
    }
}
