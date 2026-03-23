package com.hiprof.framework.web.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import com.hiprof.common.constant.UserConstants;
import com.hiprof.common.core.domain.entity.SysRole;
import com.hiprof.common.core.domain.entity.SysUser;
import com.hiprof.common.utils.StringUtils;
import com.hiprof.system.service.ISysMenuService;
import com.hiprof.system.service.ISysRoleService;

/**
 * 用户权限处理
 * 
 * @author ruoyi
 */
@Component
public class SysPermissionService
{
    @Autowired
    private ISysRoleService roleService;

    @Autowired
    private ISysMenuService menuService;

    /**
     * 获取角色数据权限
     * 
     * @param user 用户信息
     * @return 角色权限信息
     */
    public Set<String> getRolePermission(SysUser user)
    {
        Set<String> roles = new HashSet<String>();
        // 管理员拥有所有权限
        if (user.isAdmin()) {
            roles.add("admin");
        } else {
            roles.addAll(roleService.selectRolePermissionByUserId(user.getUserId()));
        }
        return roles;
    }

    /**
     * 获取菜单数据权限
     * 
     * @param user 用户信息
     * @return 菜单权限信息
     */
    public Set<String> getMenuPermission(SysUser user)
    {
        //创建一个空的权限列表（用户可能拥有多个角色，每个角色又可能会出现权限重复的问题，因此使用Set集合）
        Set<String> perms = new HashSet<String>();
        // 管理员拥有所有权限
        if (user.isAdmin()) {
            perms.add("*:*:*");
        } else {
            //获取当前用户的角色列表
            List<SysRole> roles = user.getRoles();
            //角色列表是否为空
            if (!CollectionUtils.isEmpty(roles)) {
                // 遍历当前用户角色列表，将每个角色的权限添加到用户的权限列表中
                for (SysRole role : roles) {
                    if (StringUtils.equals(role.getStatus(), UserConstants.ROLE_NORMAL) && !role.isAdmin()) {
                        //获取角色对应权限
                        Set<String> rolePerms = menuService.selectMenuPermsByRoleId(role.getRoleId());
                        //将角色权限添加到角色对象中，用于数据权限匹配
                        role.setPermissions(rolePerms);
                        //将角色权限添加到用户的权限列表中
                        perms.addAll(rolePerms);
                    }
                }
            }
            else {
                //当前用户没有角色，采取通过用户ID获取查询权限
                perms.addAll(menuService.selectMenuPermsByUserId(user.getUserId()));
            }
        }
        return perms;
    }
}
