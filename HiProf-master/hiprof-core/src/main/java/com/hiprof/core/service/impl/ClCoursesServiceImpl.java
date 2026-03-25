package com.hiprof.core.service.impl;

import java.util.Arrays;
import java.util.List;

import com.hiprof.common.constant.Constants;
import com.hiprof.common.core.domain.entity.SysDept;
import com.hiprof.common.core.domain.entity.SysRole;
import com.hiprof.common.utils.DateUtils;
import com.hiprof.common.utils.StringUtils;
import com.hiprof.core.domain.ClCourseMembers;
import com.hiprof.core.mapper.*;
import com.hiprof.system.mapper.SysDeptMapper;
import com.hiprof.system.mapper.SysRoleMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import com.hiprof.core.domain.ClCourses;
import com.hiprof.core.service.IClStudentClassBindingService;
import com.hiprof.core.service.IClCoursesService;
import org.springframework.transaction.annotation.Transactional;

/**
 * 课程管理Service业务层处理
 *
 * @author emiya
 * @date 2025-07-20
 */
@Service
public class ClCoursesServiceImpl implements IClCoursesService {
    private static final Logger log = LoggerFactory.getLogger(ClCoursesServiceImpl.class);

    @Autowired
    private ClCoursesMapper clCoursesMapper;

    @Autowired
    private SysDeptMapper sysDeptMapper;

    @Autowired
    private SysRoleMapper sysRoleMapper;

    @Autowired
    private ClWorkMapper clWorkMapper;


    @Autowired
    private ZstpGraphMapper zstpGraphMapper;
    @Autowired
    private ClCourseMembersMapper clCourseMembersMapper;

    @Autowired
    private IClStudentClassBindingService clStudentClassBindingService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * 查询课程管理
     *
     * @param id 课程管理主键
     * @return 课程管理
     */
    @Override
    public ClCourses selectClCoursesById(Long id) {
        return clCoursesMapper.selectClCoursesById(id);
    }

    /**
     * 查询课程管理列表
     *
     * @param clCourses 课程管理
     * @return 课程管理
     */
    @Override
    public List<ClCourses> selectClCoursesList(ClCourses clCourses) {
        return clCoursesMapper.selectClCoursesList(clCourses);
    }

    /**
     * 新增课程管理
     *
     * @param clCourses 课程管理
     * @return 结果
     */
    @Transactional
    @Override
    public Long insertClCourses(ClCourses clCourses) {
        // 新增课程需要确认其中的专业ID、教师ID是否存在
        Long majorId = clCourses.getMajorId();
        if (majorId == null) {
            throw new RuntimeException("请选择专业");
        }
        SysDept sysDept = sysDeptMapper.selectDeptById(majorId);
        if (sysDept == null) {
            throw new RuntimeException("专业ID不存在");
        }
        Long teacherId = clCourses.getTeacherId();
        if (teacherId == null) {
            throw new RuntimeException("教师ID不能为空");
        }
        List<SysRole> roles = sysRoleMapper.selectRolePermissionByUserId(teacherId);
        if (!hasTeacherRole(roles)) {
            throw new RuntimeException("无法识别教师");
        }
        if (StringUtils.isEmpty(clCourses.getClassName())) {
            throw new RuntimeException("班级名称不能为空");
        }
        clCourses.setClassName(clCourses.getClassName().trim());
        clCourses.setCreateTime(DateUtils.getNowDate());
        // 插入课程
        int insertRows = clCoursesMapper.insertClCourses(clCourses);
        if (insertRows <= 0 || clCourses.getId() == null) {
            throw new RuntimeException("课程创建失败");
        }
        ClCourseMembers clCourseMembers = new ClCourseMembers();
        clCourseMembers.setCourseId(clCourses.getId());
        clCourseMembers.setUserId(teacherId);
        clCourseMembers.setMemberRole("0");
        // 插入课程成员
        int memberRows = clCourseMembersMapper.insertClCourseMembers(clCourseMembers);
        if (memberRows <= 0) {
            throw new RuntimeException("课程教师成员初始化失败");
        }
        clStudentClassBindingService.syncBoundStudentsToCourse(clCourses.getId(), majorId, clCourses.getClassName());
        return clCourses.getId();

    }

    /**
     * 修改课程管理
     *
     * @param clCourses 课程管理
     * @return 结果
     */
    @Override
    public int updateClCourses(ClCourses clCourses) {
        if (clCourses.getMajorId() != null) {
            SysDept sysDept = sysDeptMapper.selectDeptById(clCourses.getMajorId());
            if (sysDept == null) {
                throw new RuntimeException("专业ID不存在");
            }
        }
        if (clCourses.getClassName() != null) {
            clCourses.setClassName(clCourses.getClassName().trim());
        }
        clCourses.setUpdateTime(DateUtils.getNowDate());
        int rows = clCoursesMapper.updateClCourses(clCourses);
        if (rows > 0 && clCourses.getId() != null)
        {
            ClCourses currentCourse = clCoursesMapper.selectClCoursesById(clCourses.getId());
            if (currentCourse != null)
            {
                clStudentClassBindingService.syncBoundStudentsToCourse(currentCourse.getId(), currentCourse.getMajorId(), currentCourse.getClassName());
            }
        }
        return rows;
    }

    /**
     * 批量删除课程管理
     *
     * @param ids 需要删除的课程管理主键
     * @return 结果
     */
    @Override
    @Transactional
    public int deleteClCoursesByIds(Long[] ids) {
        //一并删除课程积分，删除课程作业,删除课程下的图谱,删除课程下的成员
        if (tableExists("cl_work")) {
            clWorkMapper.deleteClWorkByCourseIds(ids);
        } else {
            log.warn("删除课程时跳过作业清理，数据表 cl_work 不存在，课程ID={}", Arrays.toString(ids));
        }
        zstpGraphMapper.deleteZstpGraphByIds(ids);
        clCourseMembersMapper.deleteClCourseMembersByCourseIds(ids);
        return clCoursesMapper.deleteClCoursesByIds(ids);
    }

    /**
     * 删除课程管理信息
     *
     * @param id 课程管理主键
     * @return 结果
     */
    @Override
    public int deleteClCoursesById(Long id) {
        return clCoursesMapper.deleteClCoursesById(id);
    }

    private boolean hasTeacherRole(List<SysRole> roles) {
        if (roles == null || roles.isEmpty()) {
            return false;
        }
        for (SysRole role : roles) {
            if (role == null || role.getRoleKey() == null) {
                continue;
            }
            String roleKey = role.getRoleKey().trim();
            if (Constants.TEACHER_ROLE.equals(roleKey) || Constants.COMMON_ROLE.equals(roleKey)) {
                return true;
            }
        }
        return false;
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(1) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
            Integer.class,
            tableName
        );
        return count != null && count > 0;
    }

}
