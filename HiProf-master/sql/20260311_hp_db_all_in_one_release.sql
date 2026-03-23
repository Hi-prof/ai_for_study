-- 一体化上线脚本
-- 生成时间：2026-03-11
-- 适用场景：新库初始化 / 测试环境重建 / 上线前一次性建库
-- 组成：系统基础库 + Quartz 调度表 + 武夷学院学籍树与课程表修复 + 知识图谱表 + 教师/学生角色权限模板 + 学生班级绑定补丁
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ===================================================================
-- BEGIN FILE: ry_20250522.sql
-- ===================================================================
-- ----------------------------
-- 1、部门表
-- ----------------------------
drop table if exists sys_dept;
create table sys_dept (
  dept_id           bigint(20)      not null auto_increment    comment '部门id',
  parent_id         bigint(20)      default 0                  comment '父部门id',
  ancestors         varchar(50)     default ''                 comment '祖级列表',
  dept_name         varchar(30)     default ''                 comment '部门名称',
  order_num         int(4)          default 0                  comment '显示顺序',
  leader            varchar(20)     default null               comment '负责人',
  phone             varchar(11)     default null               comment '联系电话',
  email             varchar(50)     default null               comment '邮箱',
  status            char(1)         default '0'                comment '部门状态（0正常 1停用）',
  del_flag          char(1)         default '0'                comment '删除标志（0代表存在 2代表删除）',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time 	    datetime                                   comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       datetime                                   comment '更新时间',
  primary key (dept_id)
) engine=innodb auto_increment=200 comment = '部门表';

-- ----------------------------
-- 初始化-部门表数据
-- ----------------------------

-- ----------------------------
-- 武夷学院-学院/专业树（供课程创建使用）
-- 说明：移除默认组织树，仅保留学籍树，避免影响系统用户的部门归属。
-- 除土木工程与建筑学院外，其余学院专业为系统预置的常见专业示例，可按学校实际情况继续调整。
-- ----------------------------
insert into sys_dept (dept_id, parent_id, ancestors, dept_name, order_num, leader, phone, email, status, del_flag, create_by, create_time, update_by, update_time) values
(900000, 0, '0', '武夷学院', 1, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null);

insert into sys_dept (dept_id, parent_id, ancestors, dept_name, order_num, leader, phone, email, status, del_flag, create_by, create_time, update_by, update_time) values
(900100, 900000, '0,900000', '茶与食品学院', 1, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(900101, 900000, '0,900000', '旅游学院', 2, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(900102, 900000, '0,900000', '艺术学院', 3, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(900103, 900000, '0,900000', '机电工程学院', 4, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(900104, 900000, '0,900000', '生态与资源工程学院', 5, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(900105, 900000, '0,900000', '土木工程与建筑学院', 6, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(900106, 900000, '0,900000', '数学与计算机学院', 7, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(900107, 900000, '0,900000', '人文与教师教育学院', 8, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(900108, 900000, '0,900000', '商学院', 9, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(900109, 900000, '0,900000', '海峡成功学院', 10, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(900110, 900000, '0,900000', '海外教育学院', 11, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(900111, 900000, '0,900000', '马克思主义学院', 12, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(900112, 900000, '0,900000', '继续教育学院', 13, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null);

insert into sys_dept (dept_id, parent_id, ancestors, dept_name, order_num, leader, phone, email, status, del_flag, create_by, create_time, update_by, update_time) values
(90010001, 900100, '0,900000,900100', '茶学', 1, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010002, 900100, '0,900000,900100', '园艺', 2, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010003, 900100, '0,900000,900100', '食品科学与工程', 3, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010004, 900100, '0,900000,900100', '食品质量与安全', 4, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010005, 900100, '0,900000,900100', '智慧农业', 5, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010101, 900101, '0,900000,900101', '旅游管理', 1, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010102, 900101, '0,900000,900101', '酒店管理', 2, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010103, 900101, '0,900000,900101', '文化产业管理', 3, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010104, 900101, '0,900000,900101', '康复治疗学', 4, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010201, 900102, '0,900000,900102', '视觉传达设计', 1, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010202, 900102, '0,900000,900102', '环境设计', 2, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010203, 900102, '0,900000,900102', '产品设计', 3, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010204, 900102, '0,900000,900102', '数字媒体艺术', 4, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010205, 900102, '0,900000,900102', '动画', 5, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010206, 900102, '0,900000,900102', '美术学', 6, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010301, 900103, '0,900000,900103', '机械设计制造及其自动化', 1, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010302, 900103, '0,900000,900103', '机械电子工程', 2, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010303, 900103, '0,900000,900103', '电气工程及其自动化', 3, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010304, 900103, '0,900000,900103', '电子信息工程', 4, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010305, 900103, '0,900000,900103', '微电子科学与工程', 5, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010401, 900104, '0,900000,900104', '环境工程', 1, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010402, 900104, '0,900000,900104', '环境生态工程', 2, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010403, 900104, '0,900000,900104', '生物工程', 3, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010404, 900104, '0,900000,900104', '高分子材料与工程', 4, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010405, 900104, '0,900000,900104', '化学工程与工艺', 5, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010501, 900105, '0,900000,900105', '土木工程', 1, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010502, 900105, '0,900000,900105', '工程造价', 2, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010503, 900105, '0,900000,900105', '建筑学', 3, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010601, 900106, '0,900000,900106', '计算机科学与技术', 1, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010602, 900106, '0,900000,900106', '软件工程', 2, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010603, 900106, '0,900000,900106', '数据科学与大数据技术', 3, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010604, 900106, '0,900000,900106', '人工智能', 4, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010605, 900106, '0,900000,900106', '数学与应用数学', 5, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010701, 900107, '0,900000,900107', '汉语言文学', 1, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010702, 900107, '0,900000,900107', '小学教育', 2, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010703, 900107, '0,900000,900107', '学前教育', 3, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010704, 900107, '0,900000,900107', '英语', 4, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010801, 900108, '0,900000,900108', '国际经济与贸易', 1, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010802, 900108, '0,900000,900108', '物流管理', 2, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010803, 900108, '0,900000,900108', '会计学', 3, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010804, 900108, '0,900000,900108', '财务管理', 4, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010805, 900108, '0,900000,900108', '电子商务', 5, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010901, 900109, '0,900000,900109', '软件工程', 1, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010902, 900109, '0,900000,900109', '电子商务', 2, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010903, 900109, '0,900000,900109', '国际经济与贸易', 3, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90010904, 900109, '0,900000,900109', '市场营销', 4, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90011001, 900110, '0,900000,900110', '汉语国际教育', 1, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90011002, 900110, '0,900000,900110', '商务英语', 2, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90011003, 900110, '0,900000,900110', '国际商务', 3, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90011101, 900111, '0,900000,900111', '思想政治教育', 1, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90011102, 900111, '0,900000,900111', '马克思主义理论', 2, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90011201, 900112, '0,900000,900112', '行政管理', 1, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90011202, 900112, '0,900000,900112', '会计学', 2, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90011203, 900112, '0,900000,900112', '学前教育', 3, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null),
(90011204, 900112, '0,900000,900112', '工商管理', 4, '系统初始化', '', '', '0', '0', 'admin', sysdate(), '', null);


-- ----------------------------
-- 2、用户信息表
-- ----------------------------
drop table if exists sys_user;
create table sys_user (
  user_id           bigint(20)      not null auto_increment    comment '用户ID',
  dept_id           bigint(20)      default null               comment '部门ID',
  user_name         varchar(30)     not null                   comment '用户账号',
  nick_name         varchar(30)     not null                   comment '用户昵称',
  user_type         varchar(2)      default '00'               comment '用户类型（00系统用户）',
  email             varchar(50)     default ''                 comment '用户邮箱',
  phonenumber       varchar(11)     default ''                 comment '手机号码',
  sex               char(1)         default '0'                comment '用户性别（0男 1女 2未知）',
  avatar            varchar(100)    default ''                 comment '头像地址',
  password          varchar(100)    default ''                 comment '密码',
  status            char(1)         default '0'                comment '账号状态（0正常 1停用）',
  del_flag          char(1)         default '0'                comment '删除标志（0代表存在 2代表删除）',
  login_ip          varchar(128)    default ''                 comment '最后登录IP',
  login_date        datetime                                   comment '最后登录时间',
  pwd_update_date   datetime                                   comment '密码最后更新时间',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       datetime                                   comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       datetime                                   comment '更新时间',
  remark            varchar(500)    default null               comment '备注',
  primary key (user_id)
) engine=innodb auto_increment=100 comment = '用户信息表';

-- ----------------------------
-- 初始化-用户信息表数据
-- ----------------------------
insert into sys_user values(1,  900000, 'admin', '武夷学院管理员', '00', 'ry@163.com', '15888888888', '1', '', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '0', '0', '127.0.0.1', sysdate(), sysdate(), 'admin', sysdate(), '', null, '管理员');


-- ----------------------------
-- 3、岗位信息表
-- ----------------------------
drop table if exists sys_post;
create table sys_post
(
  post_id       bigint(20)      not null auto_increment    comment '岗位ID',
  post_code     varchar(64)     not null                   comment '岗位编码',
  post_name     varchar(50)     not null                   comment '岗位名称',
  post_sort     int(4)          not null                   comment '显示顺序',
  status        char(1)         not null                   comment '状态（0正常 1停用）',
  create_by     varchar(64)     default ''                 comment '创建者',
  create_time   datetime                                   comment '创建时间',
  update_by     varchar(64)     default ''			       comment '更新者',
  update_time   datetime                                   comment '更新时间',
  remark        varchar(500)    default null               comment '备注',
  primary key (post_id)
) engine=innodb comment = '岗位信息表';

-- ----------------------------
-- 初始化-岗位信息表数据
-- ----------------------------
insert into sys_post values(1, 'ceo',  '董事长',    1, '0', 'admin', sysdate(), '', null, '');
insert into sys_post values(2, 'se',   '项目经理',  2, '0', 'admin', sysdate(), '', null, '');
insert into sys_post values(3, 'hr',   '人力资源',  3, '0', 'admin', sysdate(), '', null, '');
insert into sys_post values(4, 'user', '普通员工',  4, '0', 'admin', sysdate(), '', null, '');


-- ----------------------------
-- 4、角色信息表
-- ----------------------------
drop table if exists sys_role;
create table sys_role (
  role_id              bigint(20)      not null auto_increment    comment '角色ID',
  role_name            varchar(30)     not null                   comment '角色名称',
  role_key             varchar(100)    not null                   comment '角色权限字符串',
  role_sort            int(4)          not null                   comment '显示顺序',
  data_scope           char(1)         default '1'                comment '数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限）',
  menu_check_strictly  tinyint(1)      default 1                  comment '菜单树选择项是否关联显示',
  dept_check_strictly  tinyint(1)      default 1                  comment '部门树选择项是否关联显示',
  status               char(1)         not null                   comment '角色状态（0正常 1停用）',
  del_flag             char(1)         default '0'                comment '删除标志（0代表存在 2代表删除）',
  create_by            varchar(64)     default ''                 comment '创建者',
  create_time          datetime                                   comment '创建时间',
  update_by            varchar(64)     default ''                 comment '更新者',
  update_time          datetime                                   comment '更新时间',
  remark               varchar(500)    default null               comment '备注',
  primary key (role_id)
) engine=innodb auto_increment=100 comment = '角色信息表';

-- ----------------------------
-- 初始化-角色信息表数据
-- ----------------------------
insert into sys_role values('1', '超级管理员',  'admin',   1, 1, 1, 1, '0', '0', 'admin', sysdate(), '', null, '超级管理员');
insert into sys_role values('2', '教师',        'teacher', 2, 2, 1, 1, '0', '0', 'admin', sysdate(), '', null, '教师角色');
insert into sys_role values('3', '学生',        'student', 3, 2, 1, 1, '0', '0', 'admin', sysdate(), '', null, '学生角色');


-- ----------------------------
-- 5、菜单权限表
-- ----------------------------
drop table if exists sys_menu;
create table sys_menu (
  menu_id           bigint(20)      not null auto_increment    comment '菜单ID',
  menu_name         varchar(50)     not null                   comment '菜单名称',
  parent_id         bigint(20)      default 0                  comment '父菜单ID',
  order_num         int(4)          default 0                  comment '显示顺序',
  path              varchar(200)    default ''                 comment '路由地址',
  component         varchar(255)    default null               comment '组件路径',
  query             varchar(255)    default null               comment '路由参数',
  route_name        varchar(50)     default ''                 comment '路由名称',
  is_frame          int(1)          default 1                  comment '是否为外链（0是 1否）',
  is_cache          int(1)          default 0                  comment '是否缓存（0缓存 1不缓存）',
  menu_type         char(1)         default ''                 comment '菜单类型（M目录 C菜单 F按钮）',
  visible           char(1)         default 0                  comment '菜单状态（0显示 1隐藏）',
  status            char(1)         default 0                  comment '菜单状态（0正常 1停用）',
  perms             varchar(100)    default null               comment '权限标识',
  icon              varchar(100)    default '#'                comment '菜单图标',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       datetime                                   comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       datetime                                   comment '更新时间',
  remark            varchar(500)    default ''                 comment '备注',
  primary key (menu_id)
) engine=innodb auto_increment=2000 comment = '菜单权限表';

-- ----------------------------
-- 初始化-菜单信息表数据
-- ----------------------------
-- 一级菜单
insert into sys_menu values('1', '系统管理', '0', '1', 'system',           null, '', '', 1, 0, 'M', '0', '0', '', 'system',   'admin', sysdate(), '', null, '系统管理目录');
insert into sys_menu values('2', '系统监控', '0', '2', 'monitor',          null, '', '', 1, 0, 'M', '0', '0', '', 'monitor',  'admin', sysdate(), '', null, '系统监控目录');
insert into sys_menu values('3', '系统工具', '0', '3', 'tool',             null, '', '', 1, 0, 'M', '0', '0', '', 'tool',     'admin', sysdate(), '', null, '系统工具目录');
-- 二级菜单
insert into sys_menu values('100',  '用户管理', '1',   '1', 'user',       'system/user/index',        '', '', 1, 0, 'C', '0', '0', 'system:user:list',        'user',          'admin', sysdate(), '', null, '用户管理菜单');
insert into sys_menu values('101',  '角色管理', '1',   '2', 'role',       'system/role/index',        '', '', 1, 0, 'C', '0', '0', 'system:role:list',        'peoples',       'admin', sysdate(), '', null, '角色管理菜单');
insert into sys_menu values('102',  '菜单管理', '1',   '3', 'menu',       'system/menu/index',        '', '', 1, 0, 'C', '0', '0', 'system:menu:list',        'tree-table',    'admin', sysdate(), '', null, '菜单管理菜单');
insert into sys_menu values('103',  '部门管理', '1',   '4', 'dept',       'system/dept/index',        '', '', 1, 0, 'C', '0', '0', 'system:dept:list',        'tree',          'admin', sysdate(), '', null, '部门管理菜单');
insert into sys_menu values('104',  '岗位管理', '1',   '5', 'post',       'system/post/index',        '', '', 1, 0, 'C', '0', '0', 'system:post:list',        'post',          'admin', sysdate(), '', null, '岗位管理菜单');
insert into sys_menu values('105',  '字典管理', '1',   '6', 'dict',       'system/dict/index',        '', '', 1, 0, 'C', '0', '0', 'system:dict:list',        'dict',          'admin', sysdate(), '', null, '字典管理菜单');
insert into sys_menu values('106',  '参数设置', '1',   '7', 'config',     'system/config/index',      '', '', 1, 0, 'C', '0', '0', 'system:config:list',      'edit',          'admin', sysdate(), '', null, '参数设置菜单');
insert into sys_menu values('107',  '通知公告', '1',   '8', 'notice',     'system/notice/index',      '', '', 1, 0, 'C', '0', '0', 'system:notice:list',      'message',       'admin', sysdate(), '', null, '通知公告菜单');
insert into sys_menu values('108',  '日志管理', '1',   '9', 'log',        '',                         '', '', 1, 0, 'M', '0', '0', '',                        'log',           'admin', sysdate(), '', null, '日志管理菜单');
insert into sys_menu values('109',  '在线用户', '2',   '1', 'online',     'monitor/online/index',     '', '', 1, 0, 'C', '0', '0', 'monitor:online:list',     'online',        'admin', sysdate(), '', null, '在线用户菜单');
insert into sys_menu values('110',  '定时任务', '2',   '2', 'job',        'monitor/job/index',        '', '', 1, 0, 'C', '0', '0', 'monitor:job:list',        'job',           'admin', sysdate(), '', null, '定时任务菜单');
insert into sys_menu values('111',  '数据监控', '2',   '3', 'druid',      'monitor/druid/index',      '', '', 1, 0, 'C', '0', '0', 'monitor:druid:list',      'druid',         'admin', sysdate(), '', null, '数据监控菜单');
insert into sys_menu values('112',  '服务监控', '2',   '4', 'server',     'monitor/server/index',     '', '', 1, 0, 'C', '0', '0', 'monitor:server:list',     'server',        'admin', sysdate(), '', null, '服务监控菜单');
insert into sys_menu values('113',  '缓存监控', '2',   '5', 'cache',      'monitor/cache/index',      '', '', 1, 0, 'C', '0', '0', 'monitor:cache:list',      'redis',         'admin', sysdate(), '', null, '缓存监控菜单');
insert into sys_menu values('114',  '缓存列表', '2',   '6', 'cacheList',  'monitor/cache/list',       '', '', 1, 0, 'C', '0', '0', 'monitor:cache:list',      'redis-list',    'admin', sysdate(), '', null, '缓存列表菜单');
insert into sys_menu values('115',  '表单构建', '3',   '1', 'build',      'tool/build/index',         '', '', 1, 0, 'C', '0', '0', 'tool:build:list',         'build',         'admin', sysdate(), '', null, '表单构建菜单');
insert into sys_menu values('116',  '代码生成', '3',   '2', 'gen',        'tool/gen/index',           '', '', 1, 0, 'C', '0', '0', 'tool:gen:list',           'code',          'admin', sysdate(), '', null, '代码生成菜单');
insert into sys_menu values('117',  '系统接口', '3',   '3', 'swagger',    'tool/swagger/index',       '', '', 1, 0, 'C', '0', '0', 'tool:swagger:list',       'swagger',       'admin', sysdate(), '', null, '系统接口菜单');
-- 三级菜单
insert into sys_menu values('500',  '操作日志', '108', '1', 'operlog',    'monitor/operlog/index',    '', '', 1, 0, 'C', '0', '0', 'monitor:operlog:list',    'form',          'admin', sysdate(), '', null, '操作日志菜单');
insert into sys_menu values('501',  '登录日志', '108', '2', 'logininfor', 'monitor/logininfor/index', '', '', 1, 0, 'C', '0', '0', 'monitor:logininfor:list', 'logininfor',    'admin', sysdate(), '', null, '登录日志菜单');
-- 用户管理按钮
insert into sys_menu values('1000', '用户查询', '100', '1',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:query',          '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1001', '用户新增', '100', '2',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:add',            '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1002', '用户修改', '100', '3',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:edit',           '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1003', '用户删除', '100', '4',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:remove',         '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1004', '用户导出', '100', '5',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:export',         '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1005', '用户导入', '100', '6',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:import',         '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1006', '重置密码', '100', '7',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:resetPwd',       '#', 'admin', sysdate(), '', null, '');
-- 角色管理按钮
insert into sys_menu values('1007', '角色查询', '101', '1',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:query',          '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1008', '角色新增', '101', '2',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:add',            '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1009', '角色修改', '101', '3',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:edit',           '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1010', '角色删除', '101', '4',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:remove',         '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1011', '角色导出', '101', '5',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:export',         '#', 'admin', sysdate(), '', null, '');
-- 菜单管理按钮
insert into sys_menu values('1012', '菜单查询', '102', '1',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:query',          '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1013', '菜单新增', '102', '2',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:add',            '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1014', '菜单修改', '102', '3',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:edit',           '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1015', '菜单删除', '102', '4',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:remove',         '#', 'admin', sysdate(), '', null, '');
-- 部门管理按钮
insert into sys_menu values('1016', '部门查询', '103', '1',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:query',          '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1017', '部门新增', '103', '2',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:add',            '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1018', '部门修改', '103', '3',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:edit',           '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1019', '部门删除', '103', '4',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:remove',         '#', 'admin', sysdate(), '', null, '');
-- 岗位管理按钮
insert into sys_menu values('1020', '岗位查询', '104', '1',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:query',          '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1021', '岗位新增', '104', '2',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:add',            '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1022', '岗位修改', '104', '3',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:edit',           '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1023', '岗位删除', '104', '4',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:remove',         '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1024', '岗位导出', '104', '5',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:export',         '#', 'admin', sysdate(), '', null, '');
-- 字典管理按钮
insert into sys_menu values('1025', '字典查询', '105', '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:query',          '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1026', '字典新增', '105', '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:add',            '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1027', '字典修改', '105', '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:edit',           '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1028', '字典删除', '105', '4', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:remove',         '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1029', '字典导出', '105', '5', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:export',         '#', 'admin', sysdate(), '', null, '');
-- 参数设置按钮
insert into sys_menu values('1030', '参数查询', '106', '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:query',        '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1031', '参数新增', '106', '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:add',          '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1032', '参数修改', '106', '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:edit',         '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1033', '参数删除', '106', '4', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:remove',       '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1034', '参数导出', '106', '5', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:export',       '#', 'admin', sysdate(), '', null, '');
-- 通知公告按钮
insert into sys_menu values('1035', '公告查询', '107', '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:query',        '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1036', '公告新增', '107', '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:add',          '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1037', '公告修改', '107', '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:edit',         '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1038', '公告删除', '107', '4', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:remove',       '#', 'admin', sysdate(), '', null, '');
-- 操作日志按钮
insert into sys_menu values('1039', '操作查询', '500', '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:operlog:query',      '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1040', '操作删除', '500', '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:operlog:remove',     '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1041', '日志导出', '500', '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:operlog:export',     '#', 'admin', sysdate(), '', null, '');
-- 登录日志按钮
insert into sys_menu values('1042', '登录查询', '501', '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:query',   '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1043', '登录删除', '501', '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:remove',  '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1044', '日志导出', '501', '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:export',  '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1045', '账户解锁', '501', '4', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:unlock',  '#', 'admin', sysdate(), '', null, '');
-- 在线用户按钮
insert into sys_menu values('1046', '在线查询', '109', '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:online:query',       '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1047', '批量强退', '109', '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:online:batchLogout', '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1048', '单条强退', '109', '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:online:forceLogout', '#', 'admin', sysdate(), '', null, '');
-- 定时任务按钮
insert into sys_menu values('1049', '任务查询', '110', '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:query',          '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1050', '任务新增', '110', '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:add',            '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1051', '任务修改', '110', '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:edit',           '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1052', '任务删除', '110', '4', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:remove',         '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1053', '状态修改', '110', '5', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:changeStatus',   '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1054', '任务导出', '110', '6', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:export',         '#', 'admin', sysdate(), '', null, '');
-- 代码生成按钮
insert into sys_menu values('1055', '生成查询', '116', '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:query',             '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1056', '生成修改', '116', '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:edit',              '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1057', '生成删除', '116', '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:remove',            '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1058', '导入代码', '116', '4', '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:import',            '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1059', '预览代码', '116', '5', '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:preview',           '#', 'admin', sysdate(), '', null, '');
insert into sys_menu values('1060', '生成代码', '116', '6', '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:code',              '#', 'admin', sysdate(), '', null, '');


-- ----------------------------
-- 6、用户和角色关联表  用户N-1角色
-- ----------------------------
drop table if exists sys_user_role;
create table sys_user_role (
  user_id   bigint(20) not null comment '用户ID',
  role_id   bigint(20) not null comment '角色ID',
  primary key(user_id, role_id)
) engine=innodb comment = '用户和角色关联表';

-- ----------------------------
-- 初始化-用户和角色关联表数据
-- ----------------------------
insert into sys_user_role values ('1', '1');


-- ----------------------------
-- 7、角色和菜单关联表  角色1-N菜单
-- ----------------------------
drop table if exists sys_role_menu;
create table sys_role_menu (
  role_id   bigint(20) not null comment '角色ID',
  menu_id   bigint(20) not null comment '菜单ID',
  primary key(role_id, menu_id)
) engine=innodb comment = '角色和菜单关联表';

-- ----------------------------
-- 初始化-角色和菜单关联表数据
-- ----------------------------
insert into sys_role_menu values ('2', '1');
insert into sys_role_menu values ('2', '2');
insert into sys_role_menu values ('2', '3');
insert into sys_role_menu values ('2', '100');
insert into sys_role_menu values ('2', '101');
insert into sys_role_menu values ('2', '102');
insert into sys_role_menu values ('2', '103');
insert into sys_role_menu values ('2', '104');
insert into sys_role_menu values ('2', '105');
insert into sys_role_menu values ('2', '106');
insert into sys_role_menu values ('2', '107');
insert into sys_role_menu values ('2', '108');
insert into sys_role_menu values ('2', '109');
insert into sys_role_menu values ('2', '110');
insert into sys_role_menu values ('2', '111');
insert into sys_role_menu values ('2', '112');
insert into sys_role_menu values ('2', '113');
insert into sys_role_menu values ('2', '114');
insert into sys_role_menu values ('2', '115');
insert into sys_role_menu values ('2', '116');
insert into sys_role_menu values ('2', '117');
insert into sys_role_menu values ('2', '500');
insert into sys_role_menu values ('2', '501');
insert into sys_role_menu values ('2', '1000');
insert into sys_role_menu values ('2', '1001');
insert into sys_role_menu values ('2', '1002');
insert into sys_role_menu values ('2', '1003');
insert into sys_role_menu values ('2', '1004');
insert into sys_role_menu values ('2', '1005');
insert into sys_role_menu values ('2', '1006');
insert into sys_role_menu values ('2', '1007');
insert into sys_role_menu values ('2', '1008');
insert into sys_role_menu values ('2', '1009');
insert into sys_role_menu values ('2', '1010');
insert into sys_role_menu values ('2', '1011');
insert into sys_role_menu values ('2', '1012');
insert into sys_role_menu values ('2', '1013');
insert into sys_role_menu values ('2', '1014');
insert into sys_role_menu values ('2', '1015');
insert into sys_role_menu values ('2', '1016');
insert into sys_role_menu values ('2', '1017');
insert into sys_role_menu values ('2', '1018');
insert into sys_role_menu values ('2', '1019');
insert into sys_role_menu values ('2', '1020');
insert into sys_role_menu values ('2', '1021');
insert into sys_role_menu values ('2', '1022');
insert into sys_role_menu values ('2', '1023');
insert into sys_role_menu values ('2', '1024');
insert into sys_role_menu values ('2', '1025');
insert into sys_role_menu values ('2', '1026');
insert into sys_role_menu values ('2', '1027');
insert into sys_role_menu values ('2', '1028');
insert into sys_role_menu values ('2', '1029');
insert into sys_role_menu values ('2', '1030');
insert into sys_role_menu values ('2', '1031');
insert into sys_role_menu values ('2', '1032');
insert into sys_role_menu values ('2', '1033');
insert into sys_role_menu values ('2', '1034');
insert into sys_role_menu values ('2', '1035');
insert into sys_role_menu values ('2', '1036');
insert into sys_role_menu values ('2', '1037');
insert into sys_role_menu values ('2', '1038');
insert into sys_role_menu values ('2', '1039');
insert into sys_role_menu values ('2', '1040');
insert into sys_role_menu values ('2', '1041');
insert into sys_role_menu values ('2', '1042');
insert into sys_role_menu values ('2', '1043');
insert into sys_role_menu values ('2', '1044');
insert into sys_role_menu values ('2', '1045');
insert into sys_role_menu values ('2', '1046');
insert into sys_role_menu values ('2', '1047');
insert into sys_role_menu values ('2', '1048');
insert into sys_role_menu values ('2', '1049');
insert into sys_role_menu values ('2', '1050');
insert into sys_role_menu values ('2', '1051');
insert into sys_role_menu values ('2', '1052');
insert into sys_role_menu values ('2', '1053');
insert into sys_role_menu values ('2', '1054');
insert into sys_role_menu values ('2', '1055');
insert into sys_role_menu values ('2', '1056');
insert into sys_role_menu values ('2', '1057');
insert into sys_role_menu values ('2', '1058');
insert into sys_role_menu values ('2', '1059');
insert into sys_role_menu values ('2', '1060');

-- ----------------------------
-- 8、角色和部门关联表  角色1-N部门
-- ----------------------------
drop table if exists sys_role_dept;
create table sys_role_dept (
  role_id   bigint(20) not null comment '角色ID',
  dept_id   bigint(20) not null comment '部门ID',
  primary key(role_id, dept_id)
) engine=innodb comment = '角色和部门关联表';

-- ----------------------------
-- 初始化-角色和部门关联表数据
-- ----------------------------
insert into sys_role_dept values ('2', '100');
insert into sys_role_dept values ('2', '101');
insert into sys_role_dept values ('2', '105');


-- ----------------------------
-- 9、用户与岗位关联表  用户1-N岗位
-- ----------------------------
drop table if exists sys_user_post;
create table sys_user_post
(
  user_id   bigint(20) not null comment '用户ID',
  post_id   bigint(20) not null comment '岗位ID',
  primary key (user_id, post_id)
) engine=innodb comment = '用户与岗位关联表';

-- ----------------------------
-- 初始化-用户与岗位关联表数据
-- ----------------------------
insert into sys_user_post values ('1', '1');


-- ----------------------------
-- 10、操作日志记录
-- ----------------------------
drop table if exists sys_oper_log;
create table sys_oper_log (
  oper_id           bigint(20)      not null auto_increment    comment '日志主键',
  title             varchar(50)     default ''                 comment '模块标题',
  business_type     int(2)          default 0                  comment '业务类型（0其它 1新增 2修改 3删除）',
  method            varchar(200)    default ''                 comment '方法名称',
  request_method    varchar(10)     default ''                 comment '请求方式',
  operator_type     int(1)          default 0                  comment '操作类别（0其它 1后台用户 2手机端用户）',
  oper_name         varchar(50)     default ''                 comment '操作人员',
  dept_name         varchar(50)     default ''                 comment '部门名称',
  oper_url          varchar(255)    default ''                 comment '请求URL',
  oper_ip           varchar(128)    default ''                 comment '主机地址',
  oper_location     varchar(255)    default ''                 comment '操作地点',
  oper_param        varchar(2000)   default ''                 comment '请求参数',
  json_result       varchar(2000)   default ''                 comment '返回参数',
  status            int(1)          default 0                  comment '操作状态（0正常 1异常）',
  error_msg         varchar(2000)   default ''                 comment '错误消息',
  oper_time         datetime                                   comment '操作时间',
  cost_time         bigint(20)      default 0                  comment '消耗时间',
  primary key (oper_id),
  key idx_sys_oper_log_bt (business_type),
  key idx_sys_oper_log_s  (status),
  key idx_sys_oper_log_ot (oper_time)
) engine=innodb auto_increment=100 comment = '操作日志记录';


-- ----------------------------
-- 11、字典类型表
-- ----------------------------
drop table if exists sys_dict_type;
create table sys_dict_type
(
  dict_id          bigint(20)      not null auto_increment    comment '字典主键',
  dict_name        varchar(100)    default ''                 comment '字典名称',
  dict_type        varchar(100)    default ''                 comment '字典类型',
  status           char(1)         default '0'                comment '状态（0正常 1停用）',
  create_by        varchar(64)     default ''                 comment '创建者',
  create_time      datetime                                   comment '创建时间',
  update_by        varchar(64)     default ''                 comment '更新者',
  update_time      datetime                                   comment '更新时间',
  remark           varchar(500)    default null               comment '备注',
  primary key (dict_id),
  unique (dict_type)
) engine=innodb auto_increment=100 comment = '字典类型表';

insert into sys_dict_type values(1,  '用户性别', 'sys_user_sex',        '0', 'admin', sysdate(), '', null, '用户性别列表');
insert into sys_dict_type values(2,  '菜单状态', 'sys_show_hide',       '0', 'admin', sysdate(), '', null, '菜单状态列表');
insert into sys_dict_type values(3,  '系统开关', 'sys_normal_disable',  '0', 'admin', sysdate(), '', null, '系统开关列表');
insert into sys_dict_type values(4,  '任务状态', 'sys_job_status',      '0', 'admin', sysdate(), '', null, '任务状态列表');
insert into sys_dict_type values(5,  '任务分组', 'sys_job_group',       '0', 'admin', sysdate(), '', null, '任务分组列表');
insert into sys_dict_type values(6,  '系统是否', 'sys_yes_no',          '0', 'admin', sysdate(), '', null, '系统是否列表');
insert into sys_dict_type values(7,  '通知类型', 'sys_notice_type',     '0', 'admin', sysdate(), '', null, '通知类型列表');
insert into sys_dict_type values(8,  '通知状态', 'sys_notice_status',   '0', 'admin', sysdate(), '', null, '通知状态列表');
insert into sys_dict_type values(9,  '操作类型', 'sys_oper_type',       '0', 'admin', sysdate(), '', null, '操作类型列表');
insert into sys_dict_type values(10, '系统状态', 'sys_common_status',   '0', 'admin', sysdate(), '', null, '登录状态列表');


-- ----------------------------
-- 12、字典数据表
-- ----------------------------
drop table if exists sys_dict_data;
create table sys_dict_data
(
  dict_code        bigint(20)      not null auto_increment    comment '字典编码',
  dict_sort        int(4)          default 0                  comment '字典排序',
  dict_label       varchar(100)    default ''                 comment '字典标签',
  dict_value       varchar(100)    default ''                 comment '字典键值',
  dict_type        varchar(100)    default ''                 comment '字典类型',
  css_class        varchar(100)    default null               comment '样式属性（其他样式扩展）',
  list_class       varchar(100)    default null               comment '表格回显样式',
  is_default       char(1)         default 'N'                comment '是否默认（Y是 N否）',
  status           char(1)         default '0'                comment '状态（0正常 1停用）',
  create_by        varchar(64)     default ''                 comment '创建者',
  create_time      datetime                                   comment '创建时间',
  update_by        varchar(64)     default ''                 comment '更新者',
  update_time      datetime                                   comment '更新时间',
  remark           varchar(500)    default null               comment '备注',
  primary key (dict_code)
) engine=innodb auto_increment=100 comment = '字典数据表';

insert into sys_dict_data values(1,  1,  '男',       '0',       'sys_user_sex',        '',   '',        'Y', '0', 'admin', sysdate(), '', null, '性别男');
insert into sys_dict_data values(2,  2,  '女',       '1',       'sys_user_sex',        '',   '',        'N', '0', 'admin', sysdate(), '', null, '性别女');
insert into sys_dict_data values(3,  3,  '未知',     '2',       'sys_user_sex',        '',   '',        'N', '0', 'admin', sysdate(), '', null, '性别未知');
insert into sys_dict_data values(4,  1,  '显示',     '0',       'sys_show_hide',       '',   'primary', 'Y', '0', 'admin', sysdate(), '', null, '显示菜单');
insert into sys_dict_data values(5,  2,  '隐藏',     '1',       'sys_show_hide',       '',   'danger',  'N', '0', 'admin', sysdate(), '', null, '隐藏菜单');
insert into sys_dict_data values(6,  1,  '正常',     '0',       'sys_normal_disable',  '',   'primary', 'Y', '0', 'admin', sysdate(), '', null, '正常状态');
insert into sys_dict_data values(7,  2,  '停用',     '1',       'sys_normal_disable',  '',   'danger',  'N', '0', 'admin', sysdate(), '', null, '停用状态');
insert into sys_dict_data values(8,  1,  '正常',     '0',       'sys_job_status',      '',   'primary', 'Y', '0', 'admin', sysdate(), '', null, '正常状态');
insert into sys_dict_data values(9,  2,  '暂停',     '1',       'sys_job_status',      '',   'danger',  'N', '0', 'admin', sysdate(), '', null, '停用状态');
insert into sys_dict_data values(10, 1,  '默认',     'DEFAULT', 'sys_job_group',       '',   '',        'Y', '0', 'admin', sysdate(), '', null, '默认分组');
insert into sys_dict_data values(11, 2,  '系统',     'SYSTEM',  'sys_job_group',       '',   '',        'N', '0', 'admin', sysdate(), '', null, '系统分组');
insert into sys_dict_data values(12, 1,  '是',       'Y',       'sys_yes_no',          '',   'primary', 'Y', '0', 'admin', sysdate(), '', null, '系统默认是');
insert into sys_dict_data values(13, 2,  '否',       'N',       'sys_yes_no',          '',   'danger',  'N', '0', 'admin', sysdate(), '', null, '系统默认否');
insert into sys_dict_data values(14, 1,  '通知',     '1',       'sys_notice_type',     '',   'warning', 'Y', '0', 'admin', sysdate(), '', null, '通知');
insert into sys_dict_data values(15, 2,  '公告',     '2',       'sys_notice_type',     '',   'success', 'N', '0', 'admin', sysdate(), '', null, '公告');
insert into sys_dict_data values(16, 1,  '正常',     '0',       'sys_notice_status',   '',   'primary', 'Y', '0', 'admin', sysdate(), '', null, '正常状态');
insert into sys_dict_data values(17, 2,  '关闭',     '1',       'sys_notice_status',   '',   'danger',  'N', '0', 'admin', sysdate(), '', null, '关闭状态');
insert into sys_dict_data values(18, 99, '其他',     '0',       'sys_oper_type',       '',   'info',    'N', '0', 'admin', sysdate(), '', null, '其他操作');
insert into sys_dict_data values(19, 1,  '新增',     '1',       'sys_oper_type',       '',   'info',    'N', '0', 'admin', sysdate(), '', null, '新增操作');
insert into sys_dict_data values(20, 2,  '修改',     '2',       'sys_oper_type',       '',   'info',    'N', '0', 'admin', sysdate(), '', null, '修改操作');
insert into sys_dict_data values(21, 3,  '删除',     '3',       'sys_oper_type',       '',   'danger',  'N', '0', 'admin', sysdate(), '', null, '删除操作');
insert into sys_dict_data values(22, 4,  '授权',     '4',       'sys_oper_type',       '',   'primary', 'N', '0', 'admin', sysdate(), '', null, '授权操作');
insert into sys_dict_data values(23, 5,  '导出',     '5',       'sys_oper_type',       '',   'warning', 'N', '0', 'admin', sysdate(), '', null, '导出操作');
insert into sys_dict_data values(24, 6,  '导入',     '6',       'sys_oper_type',       '',   'warning', 'N', '0', 'admin', sysdate(), '', null, '导入操作');
insert into sys_dict_data values(25, 7,  '强退',     '7',       'sys_oper_type',       '',   'danger',  'N', '0', 'admin', sysdate(), '', null, '强退操作');
insert into sys_dict_data values(26, 8,  '生成代码', '8',       'sys_oper_type',       '',   'warning', 'N', '0', 'admin', sysdate(), '', null, '生成操作');
insert into sys_dict_data values(27, 9,  '清空数据', '9',       'sys_oper_type',       '',   'danger',  'N', '0', 'admin', sysdate(), '', null, '清空操作');
insert into sys_dict_data values(28, 1,  '成功',     '0',       'sys_common_status',   '',   'primary', 'N', '0', 'admin', sysdate(), '', null, '正常状态');
insert into sys_dict_data values(29, 2,  '失败',     '1',       'sys_common_status',   '',   'danger',  'N', '0', 'admin', sysdate(), '', null, '停用状态');


-- ----------------------------
-- 13、参数配置表
-- ----------------------------
drop table if exists sys_config;
create table sys_config (
  config_id         int(5)          not null auto_increment    comment '参数主键',
  config_name       varchar(100)    default ''                 comment '参数名称',
  config_key        varchar(100)    default ''                 comment '参数键名',
  config_value      varchar(500)    default ''                 comment '参数键值',
  config_type       char(1)         default 'N'                comment '系统内置（Y是 N否）',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       datetime                                   comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       datetime                                   comment '更新时间',
  remark            varchar(500)    default null               comment '备注',
  primary key (config_id)
) engine=innodb auto_increment=100 comment = '参数配置表';

insert into sys_config values(1, '主框架页-默认皮肤样式名称',     'sys.index.skinName',               'skin-blue',     'Y', 'admin', sysdate(), '', null, '蓝色 skin-blue、绿色 skin-green、紫色 skin-purple、红色 skin-red、黄色 skin-yellow' );
insert into sys_config values(2, '用户管理-账号初始密码',         'sys.user.initPassword',            '123456',        'Y', 'admin', sysdate(), '', null, '初始化密码 123456' );
insert into sys_config values(3, '主框架页-侧边栏主题',           'sys.index.sideTheme',              'theme-dark',    'Y', 'admin', sysdate(), '', null, '深色主题theme-dark，浅色主题theme-light' );
insert into sys_config values(4, '账号自助-验证码开关',           'sys.account.captchaEnabled',       'true',          'Y', 'admin', sysdate(), '', null, '是否开启验证码功能（true开启，false关闭）');
insert into sys_config values(5, '账号自助-是否开启用户注册功能', 'sys.account.registerUser',         'false',         'Y', 'admin', sysdate(), '', null, '是否开启注册用户功能（true开启，false关闭）');
insert into sys_config values(6, '用户登录-黑名单列表',           'sys.login.blackIPList',            '',              'Y', 'admin', sysdate(), '', null, '设置登录IP黑名单限制，多个匹配项以;分隔，支持匹配（*通配、网段）');
insert into sys_config values(7, '用户管理-初始密码修改策略',     'sys.account.initPasswordModify',   '1',             'Y', 'admin', sysdate(), '', null, '0：初始密码修改策略关闭，没有任何提示，1：提醒用户，如果未修改初始密码，则在登录时就会提醒修改密码对话框');
insert into sys_config values(8, '用户管理-账号密码更新周期',     'sys.account.passwordValidateDays', '0',             'Y', 'admin', sysdate(), '', null, '密码更新周期（填写数字，数据初始化值为0不限制，若修改必须为大于0小于365的正整数），如果超过这个周期登录系统时，则在登录时就会提醒修改密码对话框');


-- ----------------------------
-- 14、系统访问记录
-- ----------------------------
drop table if exists sys_logininfor;
create table sys_logininfor (
  info_id        bigint(20)     not null auto_increment   comment '访问ID',
  user_name      varchar(50)    default ''                comment '用户账号',
  ipaddr         varchar(128)   default ''                comment '登录IP地址',
  login_location varchar(255)   default ''                comment '登录地点',
  browser        varchar(50)    default ''                comment '浏览器类型',
  os             varchar(50)    default ''                comment '操作系统',
  status         char(1)        default '0'               comment '登录状态（0成功 1失败）',
  msg            varchar(255)   default ''                comment '提示消息',
  login_time     datetime                                 comment '访问时间',
  primary key (info_id),
  key idx_sys_logininfor_s  (status),
  key idx_sys_logininfor_lt (login_time)
) engine=innodb auto_increment=100 comment = '系统访问记录';


-- ----------------------------
-- 15、定时任务调度表
-- ----------------------------
drop table if exists sys_job;
create table sys_job (
  job_id              bigint(20)    not null auto_increment    comment '任务ID',
  job_name            varchar(64)   default ''                 comment '任务名称',
  job_group           varchar(64)   default 'DEFAULT'          comment '任务组名',
  invoke_target       varchar(500)  not null                   comment '调用目标字符串',
  cron_expression     varchar(255)  default ''                 comment 'cron执行表达式',
  misfire_policy      varchar(20)   default '3'                comment '计划执行错误策略（1立即执行 2执行一次 3放弃执行）',
  concurrent          char(1)       default '1'                comment '是否并发执行（0允许 1禁止）',
  status              char(1)       default '0'                comment '状态（0正常 1暂停）',
  create_by           varchar(64)   default ''                 comment '创建者',
  create_time         datetime                                 comment '创建时间',
  update_by           varchar(64)   default ''                 comment '更新者',
  update_time         datetime                                 comment '更新时间',
  remark              varchar(500)  default ''                 comment '备注信息',
  primary key (job_id, job_name, job_group)
) engine=innodb auto_increment=100 comment = '定时任务调度表';

insert into sys_job values(1, '系统默认（无参）', 'DEFAULT', 'ryTask.ryNoParams',        '0/10 * * * * ?', '3', '1', '1', 'admin', sysdate(), '', null, '');
insert into sys_job values(2, '系统默认（有参）', 'DEFAULT', 'ryTask.ryParams(\'ry\')',  '0/15 * * * * ?', '3', '1', '1', 'admin', sysdate(), '', null, '');
insert into sys_job values(3, '系统默认（多参）', 'DEFAULT', 'ryTask.ryMultipleParams(\'ry\', true, 2000L, 316.50D, 100)',  '0/20 * * * * ?', '3', '1', '1', 'admin', sysdate(), '', null, '');


-- ----------------------------
-- 16、定时任务调度日志表
-- ----------------------------
drop table if exists sys_job_log;
create table sys_job_log (
  job_log_id          bigint(20)     not null auto_increment    comment '任务日志ID',
  job_name            varchar(64)    not null                   comment '任务名称',
  job_group           varchar(64)    not null                   comment '任务组名',
  invoke_target       varchar(500)   not null                   comment '调用目标字符串',
  job_message         varchar(500)                              comment '日志信息',
  status              char(1)        default '0'                comment '执行状态（0正常 1失败）',
  exception_info      varchar(2000)  default ''                 comment '异常信息',
  create_time         datetime                                  comment '创建时间',
  primary key (job_log_id)
) engine=innodb comment = '定时任务调度日志表';


-- ----------------------------
-- 17、通知公告表
-- ----------------------------
drop table if exists sys_notice;
create table sys_notice (
  notice_id         int(4)          not null auto_increment    comment '公告ID',
  notice_title      varchar(50)     not null                   comment '公告标题',
  notice_type       char(1)         not null                   comment '公告类型（1通知 2公告）',
  notice_content    longblob        default null               comment '公告内容',
  status            char(1)         default '0'                comment '公告状态（0正常 1关闭）',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time       datetime                                   comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       datetime                                   comment '更新时间',
  remark            varchar(255)    default null               comment '备注',
  primary key (notice_id)
) engine=innodb auto_increment=10 comment = '通知公告表';

-- ----------------------------
-- 初始化-公告信息表数据
-- ----------------------------
insert into sys_notice values('1', '温馨提醒：2018-07-01 系统新版本发布啦', '2', '新版本内容', '0', 'admin', sysdate(), '', null, '管理员');
insert into sys_notice values('2', '维护通知：2018-07-01 系统凌晨维护', '1', '维护内容',   '0', 'admin', sysdate(), '', null, '管理员');


-- ----------------------------
-- 18、代码生成业务表
-- ----------------------------
drop table if exists gen_table;
create table gen_table (
  table_id          bigint(20)      not null auto_increment    comment '编号',
  table_name        varchar(200)    default ''                 comment '表名称',
  table_comment     varchar(500)    default ''                 comment '表描述',
  sub_table_name    varchar(64)     default null               comment '关联子表的表名',
  sub_table_fk_name varchar(64)     default null               comment '子表关联的外键名',
  class_name        varchar(100)    default ''                 comment '实体类名称',
  tpl_category      varchar(200)    default 'crud'             comment '使用的模板（crud单表操作 tree树表操作）',
  tpl_web_type      varchar(30)     default ''                 comment '前端模板类型（element-ui模版 element-plus模版）',
  package_name      varchar(100)                               comment '生成包路径',
  module_name       varchar(30)                                comment '生成模块名',
  business_name     varchar(30)                                comment '生成业务名',
  function_name     varchar(50)                                comment '生成功能名',
  function_author   varchar(50)                                comment '生成功能作者',
  gen_type          char(1)         default '0'                comment '生成代码方式（0zip压缩包 1自定义路径）',
  gen_path          varchar(200)    default '/'                comment '生成路径（不填默认项目路径）',
  options           varchar(1000)                              comment '其它生成选项',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time 	    datetime                                   comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       datetime                                   comment '更新时间',
  remark            varchar(500)    default null               comment '备注',
  primary key (table_id)
) engine=innodb auto_increment=1 comment = '代码生成业务表';


-- ----------------------------
-- 19、代码生成业务表字段
-- ----------------------------
drop table if exists gen_table_column;
create table gen_table_column (
  column_id         bigint(20)      not null auto_increment    comment '编号',
  table_id          bigint(20)                                 comment '归属表编号',
  column_name       varchar(200)                               comment '列名称',
  column_comment    varchar(500)                               comment '列描述',
  column_type       varchar(100)                               comment '列类型',
  java_type         varchar(500)                               comment 'JAVA类型',
  java_field        varchar(200)                               comment 'JAVA字段名',
  is_pk             char(1)                                    comment '是否主键（1是）',
  is_increment      char(1)                                    comment '是否自增（1是）',
  is_required       char(1)                                    comment '是否必填（1是）',
  is_insert         char(1)                                    comment '是否为插入字段（1是）',
  is_edit           char(1)                                    comment '是否编辑字段（1是）',
  is_list           char(1)                                    comment '是否列表字段（1是）',
  is_query          char(1)                                    comment '是否查询字段（1是）',
  query_type        varchar(200)    default 'EQ'               comment '查询方式（等于、不等于、大于、小于、范围）',
  html_type         varchar(200)                               comment '显示类型（文本框、文本域、下拉框、复选框、单选框、日期控件）',
  dict_type         varchar(200)    default ''                 comment '字典类型',
  sort              int                                        comment '排序',
  create_by         varchar(64)     default ''                 comment '创建者',
  create_time 	    datetime                                   comment '创建时间',
  update_by         varchar(64)     default ''                 comment '更新者',
  update_time       datetime                                   comment '更新时间',
  primary key (column_id)
) engine=innodb auto_increment=1 comment = '代码生成业务表字段';

-- END FILE: ry_20250522.sql

-- ===================================================================
-- BEGIN FILE: quartz.sql
-- ===================================================================
DROP TABLE IF EXISTS QRTZ_FIRED_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_PAUSED_TRIGGER_GRPS;
DROP TABLE IF EXISTS QRTZ_SCHEDULER_STATE;
DROP TABLE IF EXISTS QRTZ_LOCKS;
DROP TABLE IF EXISTS QRTZ_SIMPLE_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_SIMPROP_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_CRON_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_BLOB_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_JOB_DETAILS;
DROP TABLE IF EXISTS QRTZ_CALENDARS;

-- ----------------------------
-- 1、存储每一个已配置的 jobDetail 的详细信息
-- ----------------------------
create table QRTZ_JOB_DETAILS (
    sched_name           varchar(120)    not null            comment '调度名称',
    job_name             varchar(200)    not null            comment '任务名称',
    job_group            varchar(200)    not null            comment '任务组名',
    description          varchar(250)    null                comment '相关介绍',
    job_class_name       varchar(250)    not null            comment '执行任务类名称',
    is_durable           varchar(1)      not null            comment '是否持久化',
    is_nonconcurrent     varchar(1)      not null            comment '是否并发',
    is_update_data       varchar(1)      not null            comment '是否更新数据',
    requests_recovery    varchar(1)      not null            comment '是否接受恢复执行',
    job_data             blob            null                comment '存放持久化job对象',
    primary key (sched_name, job_name, job_group)
) engine=innodb comment = '任务详细信息表';

-- ----------------------------
-- 2、 存储已配置的 Trigger 的信息
-- ----------------------------
create table QRTZ_TRIGGERS (
    sched_name           varchar(120)    not null            comment '调度名称',
    trigger_name         varchar(200)    not null            comment '触发器的名字',
    trigger_group        varchar(200)    not null            comment '触发器所属组的名字',
    job_name             varchar(200)    not null            comment 'qrtz_job_details表job_name的外键',
    job_group            varchar(200)    not null            comment 'qrtz_job_details表job_group的外键',
    description          varchar(250)    null                comment '相关介绍',
    next_fire_time       bigint(13)      null                comment '上一次触发时间（毫秒）',
    prev_fire_time       bigint(13)      null                comment '下一次触发时间（默认为-1表示不触发）',
    priority             integer         null                comment '优先级',
    trigger_state        varchar(16)     not null            comment '触发器状态',
    trigger_type         varchar(8)      not null            comment '触发器的类型',
    start_time           bigint(13)      not null            comment '开始时间',
    end_time             bigint(13)      null                comment '结束时间',
    calendar_name        varchar(200)    null                comment '日程表名称',
    misfire_instr        smallint(2)     null                comment '补偿执行的策略',
    job_data             blob            null                comment '存放持久化job对象',
    primary key (sched_name, trigger_name, trigger_group),
    foreign key (sched_name, job_name, job_group) references QRTZ_JOB_DETAILS(sched_name, job_name, job_group)
) engine=innodb comment = '触发器详细信息表';

-- ----------------------------
-- 3、 存储简单的 Trigger，包括重复次数，间隔，以及已触发的次数
-- ----------------------------
create table QRTZ_SIMPLE_TRIGGERS (
    sched_name           varchar(120)    not null            comment '调度名称',
    trigger_name         varchar(200)    not null            comment 'qrtz_triggers表trigger_name的外键',
    trigger_group        varchar(200)    not null            comment 'qrtz_triggers表trigger_group的外键',
    repeat_count         bigint(7)       not null            comment '重复的次数统计',
    repeat_interval      bigint(12)      not null            comment '重复的间隔时间',
    times_triggered      bigint(10)      not null            comment '已经触发的次数',
    primary key (sched_name, trigger_name, trigger_group),
    foreign key (sched_name, trigger_name, trigger_group) references QRTZ_TRIGGERS(sched_name, trigger_name, trigger_group)
) engine=innodb comment = '简单触发器的信息表';

-- ----------------------------
-- 4、 存储 Cron Trigger，包括 Cron 表达式和时区信息
-- ---------------------------- 
create table QRTZ_CRON_TRIGGERS (
    sched_name           varchar(120)    not null            comment '调度名称',
    trigger_name         varchar(200)    not null            comment 'qrtz_triggers表trigger_name的外键',
    trigger_group        varchar(200)    not null            comment 'qrtz_triggers表trigger_group的外键',
    cron_expression      varchar(200)    not null            comment 'cron表达式',
    time_zone_id         varchar(80)                         comment '时区',
    primary key (sched_name, trigger_name, trigger_group),
    foreign key (sched_name, trigger_name, trigger_group) references QRTZ_TRIGGERS(sched_name, trigger_name, trigger_group)
) engine=innodb comment = 'Cron类型的触发器表';

-- ----------------------------
-- 5、 Trigger 作为 Blob 类型存储(用于 Quartz 用户用 JDBC 创建他们自己定制的 Trigger 类型，JobStore 并不知道如何存储实例的时候)
-- ---------------------------- 
create table QRTZ_BLOB_TRIGGERS (
    sched_name           varchar(120)    not null            comment '调度名称',
    trigger_name         varchar(200)    not null            comment 'qrtz_triggers表trigger_name的外键',
    trigger_group        varchar(200)    not null            comment 'qrtz_triggers表trigger_group的外键',
    blob_data            blob            null                comment '存放持久化Trigger对象',
    primary key (sched_name, trigger_name, trigger_group),
    foreign key (sched_name, trigger_name, trigger_group) references QRTZ_TRIGGERS(sched_name, trigger_name, trigger_group)
) engine=innodb comment = 'Blob类型的触发器表';

-- ----------------------------
-- 6、 以 Blob 类型存储存放日历信息， quartz可配置一个日历来指定一个时间范围
-- ---------------------------- 
create table QRTZ_CALENDARS (
    sched_name           varchar(120)    not null            comment '调度名称',
    calendar_name        varchar(200)    not null            comment '日历名称',
    calendar             blob            not null            comment '存放持久化calendar对象',
    primary key (sched_name, calendar_name)
) engine=innodb comment = '日历信息表';

-- ----------------------------
-- 7、 存储已暂停的 Trigger 组的信息
-- ---------------------------- 
create table QRTZ_PAUSED_TRIGGER_GRPS (
    sched_name           varchar(120)    not null            comment '调度名称',
    trigger_group        varchar(200)    not null            comment 'qrtz_triggers表trigger_group的外键',
    primary key (sched_name, trigger_group)
) engine=innodb comment = '暂停的触发器表';

-- ----------------------------
-- 8、 存储与已触发的 Trigger 相关的状态信息，以及相联 Job 的执行信息
-- ---------------------------- 
create table QRTZ_FIRED_TRIGGERS (
    sched_name           varchar(120)    not null            comment '调度名称',
    entry_id             varchar(95)     not null            comment '调度器实例id',
    trigger_name         varchar(200)    not null            comment 'qrtz_triggers表trigger_name的外键',
    trigger_group        varchar(200)    not null            comment 'qrtz_triggers表trigger_group的外键',
    instance_name        varchar(200)    not null            comment '调度器实例名',
    fired_time           bigint(13)      not null            comment '触发的时间',
    sched_time           bigint(13)      not null            comment '定时器制定的时间',
    priority             integer         not null            comment '优先级',
    state                varchar(16)     not null            comment '状态',
    job_name             varchar(200)    null                comment '任务名称',
    job_group            varchar(200)    null                comment '任务组名',
    is_nonconcurrent     varchar(1)      null                comment '是否并发',
    requests_recovery    varchar(1)      null                comment '是否接受恢复执行',
    primary key (sched_name, entry_id)
) engine=innodb comment = '已触发的触发器表';

-- ----------------------------
-- 9、 存储少量的有关 Scheduler 的状态信息，假如是用于集群中，可以看到其他的 Scheduler 实例
-- ---------------------------- 
create table QRTZ_SCHEDULER_STATE (
    sched_name           varchar(120)    not null            comment '调度名称',
    instance_name        varchar(200)    not null            comment '实例名称',
    last_checkin_time    bigint(13)      not null            comment '上次检查时间',
    checkin_interval     bigint(13)      not null            comment '检查间隔时间',
    primary key (sched_name, instance_name)
) engine=innodb comment = '调度器状态表';

-- ----------------------------
-- 10、 存储程序的悲观锁的信息(假如使用了悲观锁)
-- ---------------------------- 
create table QRTZ_LOCKS (
    sched_name           varchar(120)    not null            comment '调度名称',
    lock_name            varchar(40)     not null            comment '悲观锁名称',
    primary key (sched_name, lock_name)
) engine=innodb comment = '存储的悲观锁信息表';

-- ----------------------------
-- 11、 Quartz集群实现同步机制的行锁表
-- ---------------------------- 
create table QRTZ_SIMPROP_TRIGGERS (
    sched_name           varchar(120)    not null            comment '调度名称',
    trigger_name         varchar(200)    not null            comment 'qrtz_triggers表trigger_name的外键',
    trigger_group        varchar(200)    not null            comment 'qrtz_triggers表trigger_group的外键',
    str_prop_1           varchar(512)    null                comment 'String类型的trigger的第一个参数',
    str_prop_2           varchar(512)    null                comment 'String类型的trigger的第二个参数',
    str_prop_3           varchar(512)    null                comment 'String类型的trigger的第三个参数',
    int_prop_1           int             null                comment 'int类型的trigger的第一个参数',
    int_prop_2           int             null                comment 'int类型的trigger的第二个参数',
    long_prop_1          bigint          null                comment 'long类型的trigger的第一个参数',
    long_prop_2          bigint          null                comment 'long类型的trigger的第二个参数',
    dec_prop_1           numeric(13,4)   null                comment 'decimal类型的trigger的第一个参数',
    dec_prop_2           numeric(13,4)   null                comment 'decimal类型的trigger的第二个参数',
    bool_prop_1          varchar(1)      null                comment 'Boolean类型的trigger的第一个参数',
    bool_prop_2          varchar(1)      null                comment 'Boolean类型的trigger的第二个参数',
    primary key (sched_name, trigger_name, trigger_group),
    foreign key (sched_name, trigger_name, trigger_group) references QRTZ_TRIGGERS(sched_name, trigger_name, trigger_group)
) engine=innodb comment = '同步机制的行锁表';

commit;

-- END FILE: quartz.sql

-- ===================================================================
-- BEGIN FILE: 20260310_wuyiu_academic_tree_and_course_major.sql
-- ===================================================================
-- 执行前请先备份数据库。
-- 用途：
-- 1. 将 cl_courses.dept_id 升级为 major_id，并新增 class_name 字段。
-- 2. 创建 cl_course_members 表，补齐课程创建时的教师成员初始化链路。
-- 3. 初始化课程相关权限菜单，并授权教师角色。
-- 4. 重建 sys_dept 中“武夷学院 -> 学院 -> 专业”树，供课程创建页面使用。
-- 说明：
-- 1. 土木工程与建筑学院专业按你的明确要求固定为：土木工程、工程造价、建筑学。
-- 2. 其他学院专业为系统预置的常见专业示例，可按学校实际情况继续微调。
-- 3. 本脚本可重复执行；若 cl_courses / cl_course_members / major_id / class_name 已存在，会自动跳过相关 DDL。

SET @has_cl_courses_table := (
    SELECT COUNT(*)
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cl_courses'
);

SET @sql := IF(
    @has_cl_courses_table = 0,
    'CREATE TABLE cl_courses (
        id BIGINT NOT NULL AUTO_INCREMENT COMMENT ''课程ID'',
        name VARCHAR(100) NOT NULL COMMENT ''课程名称'',
        description VARCHAR(500) NULL COMMENT ''课程描述'',
        major_id BIGINT NULL COMMENT ''专业ID'',
        class_name VARCHAR(100) NULL COMMENT ''班级名称'',
        teacher_id BIGINT NULL COMMENT ''教师ID'',
        create_time DATETIME NULL COMMENT ''创建时间'',
        update_time DATETIME NULL COMMENT ''更新时间'',
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT=''课程管理表''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_old_dept_id := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cl_courses'
      AND COLUMN_NAME = 'dept_id'
);

SET @sql := IF(
    @has_old_dept_id > 0,
    'ALTER TABLE cl_courses CHANGE COLUMN dept_id major_id BIGINT NULL COMMENT ''专业ID''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_class_name := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cl_courses'
      AND COLUMN_NAME = 'class_name'
);

SET @sql := IF(
    @has_class_name = 0,
    'ALTER TABLE cl_courses ADD COLUMN class_name VARCHAR(100) NULL COMMENT ''班级名称'' AFTER major_id',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE cl_courses
SET class_name = '待补充'
WHERE class_name IS NULL OR class_name = '';

SET @has_cl_course_members_table := (
    SELECT COUNT(*)
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'cl_course_members'
);

SET @sql := IF(
    @has_cl_course_members_table = 0,
    'CREATE TABLE cl_course_members (
        id BIGINT NOT NULL AUTO_INCREMENT COMMENT ''主键ID'',
        course_id BIGINT NOT NULL COMMENT ''课程ID'',
        user_id BIGINT NOT NULL COMMENT ''用户ID'',
        member_role CHAR(1) NOT NULL COMMENT ''成员角色：0教师 1学生'',
        create_time DATETIME NULL COMMENT ''创建时间'',
        update_time DATETIME NULL COMMENT ''更新时间'',
        PRIMARY KEY (id),
        KEY idx_cl_course_members_course_id (course_id),
        KEY idx_cl_course_members_user_id (user_id),
        KEY idx_cl_course_members_course_user (course_id, user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT=''课程成员表''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO sys_menu
(
    menu_name,
    parent_id,
    order_num,
    path,
    component,
    query,
    route_name,
    is_frame,
    is_cache,
    menu_type,
    visible,
    status,
    perms,
    icon,
    create_by,
    create_time,
    update_by,
    update_time,
    remark
)
SELECT
    '课程管理',
    1,
    10,
    'courses',
    'core/courses/index',
    '',
    '',
    1,
    1,
    'C',
    '1',
    '0',
    'core:courses:list',
    'education',
    'migration',
    SYSDATE(),
    '',
    NULL,
    '课程管理菜单'
WHERE NOT EXISTS (
    SELECT 1
    FROM sys_menu
    WHERE perms = 'core:courses:list'
);

SET @course_menu_id := (
    SELECT menu_id
    FROM sys_menu
    WHERE perms = 'core:courses:list'
    ORDER BY menu_id
    LIMIT 1
);

INSERT INTO sys_menu
(
    menu_name,
    parent_id,
    order_num,
    path,
    component,
    query,
    route_name,
    is_frame,
    is_cache,
    menu_type,
    visible,
    status,
    perms,
    icon,
    create_by,
    create_time,
    update_by,
    update_time,
    remark
)
SELECT
    '课程查询',
    @course_menu_id,
    1,
    '#',
    '',
    '',
    '',
    1,
    0,
    'F',
    '0',
    '0',
    'core:courses:query',
    '#',
    'migration',
    SYSDATE(),
    '',
    NULL,
    '课程查询权限'
WHERE NOT EXISTS (
    SELECT 1
    FROM sys_menu
    WHERE perms = 'core:courses:query'
);

INSERT INTO sys_menu
(
    menu_name,
    parent_id,
    order_num,
    path,
    component,
    query,
    route_name,
    is_frame,
    is_cache,
    menu_type,
    visible,
    status,
    perms,
    icon,
    create_by,
    create_time,
    update_by,
    update_time,
    remark
)
SELECT
    '课程新增',
    @course_menu_id,
    2,
    '#',
    '',
    '',
    '',
    1,
    0,
    'F',
    '0',
    '0',
    'core:courses:add',
    '#',
    'migration',
    SYSDATE(),
    '',
    NULL,
    '课程新增权限'
WHERE NOT EXISTS (
    SELECT 1
    FROM sys_menu
    WHERE perms = 'core:courses:add'
);

INSERT INTO sys_menu
(
    menu_name,
    parent_id,
    order_num,
    path,
    component,
    query,
    route_name,
    is_frame,
    is_cache,
    menu_type,
    visible,
    status,
    perms,
    icon,
    create_by,
    create_time,
    update_by,
    update_time,
    remark
)
SELECT
    '课程修改',
    @course_menu_id,
    3,
    '#',
    '',
    '',
    '',
    1,
    0,
    'F',
    '0',
    '0',
    'core:courses:edit',
    '#',
    'migration',
    SYSDATE(),
    '',
    NULL,
    '课程修改权限'
WHERE NOT EXISTS (
    SELECT 1
    FROM sys_menu
    WHERE perms = 'core:courses:edit'
);

INSERT INTO sys_menu
(
    menu_name,
    parent_id,
    order_num,
    path,
    component,
    query,
    route_name,
    is_frame,
    is_cache,
    menu_type,
    visible,
    status,
    perms,
    icon,
    create_by,
    create_time,
    update_by,
    update_time,
    remark
)
SELECT
    '课程删除',
    @course_menu_id,
    4,
    '#',
    '',
    '',
    '',
    1,
    0,
    'F',
    '0',
    '0',
    'core:courses:remove',
    '#',
    'migration',
    SYSDATE(),
    '',
    NULL,
    '课程删除权限'
WHERE NOT EXISTS (
    SELECT 1
    FROM sys_menu
    WHERE perms = 'core:courses:remove'
);

INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 2, m.menu_id
FROM sys_menu m
WHERE m.perms IN (
    'core:courses:list',
    'core:courses:query',
    'core:courses:add',
    'core:courses:edit',
    'core:courses:remove'
)
AND NOT EXISTS (
    SELECT 1
    FROM sys_role_menu rm
    WHERE rm.role_id = 2
      AND rm.menu_id = m.menu_id
);

UPDATE sys_dept
SET del_flag = '2',
    update_by = 'migration',
    update_time = SYSDATE()
WHERE dept_id = 900000
   OR FIND_IN_SET('900000', ancestors);

INSERT INTO sys_dept (dept_id, parent_id, ancestors, dept_name, order_num, leader, phone, email, status, del_flag, create_by, create_time, update_by, update_time)
VALUES (900000, 0, '0', '武夷学院', 1, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL)
ON DUPLICATE KEY UPDATE
    parent_id = VALUES(parent_id),
    ancestors = VALUES(ancestors),
    dept_name = VALUES(dept_name),
    order_num = VALUES(order_num),
    status = '0',
    del_flag = '0',
    update_by = 'migration',
    update_time = SYSDATE();

INSERT INTO sys_dept (dept_id, parent_id, ancestors, dept_name, order_num, leader, phone, email, status, del_flag, create_by, create_time, update_by, update_time)
VALUES
(900100, 900000, '0,900000', '茶与食品学院', 1, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(900101, 900000, '0,900000', '旅游学院', 2, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(900102, 900000, '0,900000', '艺术学院', 3, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(900103, 900000, '0,900000', '机电工程学院', 4, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(900104, 900000, '0,900000', '生态与资源工程学院', 5, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(900105, 900000, '0,900000', '土木工程与建筑学院', 6, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(900106, 900000, '0,900000', '数学与计算机学院', 7, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(900107, 900000, '0,900000', '人文与教师教育学院', 8, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(900108, 900000, '0,900000', '商学院', 9, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(900109, 900000, '0,900000', '海峡成功学院', 10, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(900110, 900000, '0,900000', '海外教育学院', 11, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(900111, 900000, '0,900000', '马克思主义学院', 12, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(900112, 900000, '0,900000', '继续教育学院', 13, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL)
ON DUPLICATE KEY UPDATE
    parent_id = VALUES(parent_id),
    ancestors = VALUES(ancestors),
    dept_name = VALUES(dept_name),
    order_num = VALUES(order_num),
    status = '0',
    del_flag = '0',
    update_by = 'migration',
    update_time = SYSDATE();

INSERT INTO sys_dept (dept_id, parent_id, ancestors, dept_name, order_num, leader, phone, email, status, del_flag, create_by, create_time, update_by, update_time)
VALUES
(90010001, 900100, '0,900000,900100', '茶学', 1, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010002, 900100, '0,900000,900100', '园艺', 2, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010003, 900100, '0,900000,900100', '食品科学与工程', 3, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010004, 900100, '0,900000,900100', '食品质量与安全', 4, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010005, 900100, '0,900000,900100', '智慧农业', 5, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010101, 900101, '0,900000,900101', '旅游管理', 1, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010102, 900101, '0,900000,900101', '酒店管理', 2, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010103, 900101, '0,900000,900101', '文化产业管理', 3, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010104, 900101, '0,900000,900101', '康复治疗学', 4, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010201, 900102, '0,900000,900102', '视觉传达设计', 1, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010202, 900102, '0,900000,900102', '环境设计', 2, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010203, 900102, '0,900000,900102', '产品设计', 3, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010204, 900102, '0,900000,900102', '数字媒体艺术', 4, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010205, 900102, '0,900000,900102', '动画', 5, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010206, 900102, '0,900000,900102', '美术学', 6, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010301, 900103, '0,900000,900103', '机械设计制造及其自动化', 1, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010302, 900103, '0,900000,900103', '机械电子工程', 2, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010303, 900103, '0,900000,900103', '电气工程及其自动化', 3, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010304, 900103, '0,900000,900103', '电子信息工程', 4, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010305, 900103, '0,900000,900103', '微电子科学与工程', 5, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010401, 900104, '0,900000,900104', '环境工程', 1, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010402, 900104, '0,900000,900104', '环境生态工程', 2, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010403, 900104, '0,900000,900104', '生物工程', 3, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010404, 900104, '0,900000,900104', '高分子材料与工程', 4, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010405, 900104, '0,900000,900104', '化学工程与工艺', 5, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010501, 900105, '0,900000,900105', '土木工程', 1, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010502, 900105, '0,900000,900105', '工程造价', 2, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010503, 900105, '0,900000,900105', '建筑学', 3, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010601, 900106, '0,900000,900106', '计算机科学与技术', 1, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010602, 900106, '0,900000,900106', '软件工程', 2, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010603, 900106, '0,900000,900106', '数据科学与大数据技术', 3, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010604, 900106, '0,900000,900106', '人工智能', 4, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010605, 900106, '0,900000,900106', '数学与应用数学', 5, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010701, 900107, '0,900000,900107', '汉语言文学', 1, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010702, 900107, '0,900000,900107', '小学教育', 2, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010703, 900107, '0,900000,900107', '学前教育', 3, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010704, 900107, '0,900000,900107', '英语', 4, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010801, 900108, '0,900000,900108', '国际经济与贸易', 1, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010802, 900108, '0,900000,900108', '物流管理', 2, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010803, 900108, '0,900000,900108', '会计学', 3, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010804, 900108, '0,900000,900108', '财务管理', 4, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010805, 900108, '0,900000,900108', '电子商务', 5, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010901, 900109, '0,900000,900109', '软件工程', 1, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010902, 900109, '0,900000,900109', '电子商务', 2, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010903, 900109, '0,900000,900109', '国际经济与贸易', 3, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90010904, 900109, '0,900000,900109', '市场营销', 4, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90011001, 900110, '0,900000,900110', '汉语国际教育', 1, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90011002, 900110, '0,900000,900110', '商务英语', 2, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90011003, 900110, '0,900000,900110', '国际商务', 3, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90011101, 900111, '0,900000,900111', '思想政治教育', 1, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90011102, 900111, '0,900000,900111', '马克思主义理论', 2, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90011201, 900112, '0,900000,900112', '行政管理', 1, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90011202, 900112, '0,900000,900112', '会计学', 2, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90011203, 900112, '0,900000,900112', '学前教育', 3, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL),
(90011204, 900112, '0,900000,900112', '工商管理', 4, '系统初始化', '', '', '0', '0', 'migration', SYSDATE(), '', NULL)
ON DUPLICATE KEY UPDATE
    parent_id = VALUES(parent_id),
    ancestors = VALUES(ancestors),
    dept_name = VALUES(dept_name),
    order_num = VALUES(order_num),
    status = '0',
    del_flag = '0',
    update_by = 'migration',
    update_time = SYSDATE();

-- END FILE: 20260310_wuyiu_academic_tree_and_course_major.sql

-- ===================================================================
-- BEGIN FILE: 20260312_knowledge_graph_tables_patch.sql
-- ===================================================================
-- ----------------------------
-- 知识图谱相关表
-- ----------------------------
drop table if exists zstp_node_style;
drop table if exists zstp_line;
drop table if exists zstp_node;
drop table if exists zstp_graph;

create table zstp_graph (
  id                bigint(20)      not null auto_increment    comment '图谱ID',
  name              varchar(255)    not null default ''        comment '图谱名称',
  content           text                                      comment '图谱内容文本',
  graph_type        char(1)         not null default '0'       comment '图谱类型（0图谱 1章节）',
  course_id         bigint(20)      not null                   comment '课程ID',
  create_by         varchar(64)     not null default ''        comment '创建者',
  create_time       datetime        not null default current_timestamp comment '创建时间',
  update_by         varchar(64)     not null default ''        comment '更新者',
  update_time       datetime        not null default current_timestamp on update current_timestamp comment '更新时间',
  primary key (id),
  key idx_zstp_graph_course_id (course_id),
  key idx_zstp_graph_graph_type (graph_type),
  key idx_zstp_graph_course_type (course_id, graph_type),
  key idx_zstp_graph_create_by (create_by)
) engine=innodb comment = '知识图谱表';

create table zstp_node (
  id                bigint(20)      not null auto_increment    comment '节点ID',
  parent_id         bigint(20)      default null               comment '父节点ID，NULL表示根节点',
  graph_id          bigint(20)      not null                   comment '所属图谱ID',
  name              varchar(255)    not null default ''        comment '节点名称',
  content           text                                      comment '节点内容',
  primary key (id),
  key idx_zstp_node_graph_id (graph_id),
  key idx_zstp_node_parent_id (parent_id),
  key idx_zstp_node_graph_parent (graph_id, parent_id),
  constraint fk_zstp_node_graph foreign key (graph_id) references zstp_graph (id) on delete cascade on update cascade,
  constraint fk_zstp_node_parent foreign key (parent_id) references zstp_node (id) on delete cascade on update cascade
) engine=innodb comment = '知识图谱节点表';

create table zstp_line (
  id                bigint(20)      not null auto_increment    comment '关系线ID',
  node_id           bigint(20)      not null                   comment '起始节点ID',
  target_id         bigint(20)      not null                   comment '目标节点ID',
  content           varchar(500)    default null               comment '关系描述',
  primary key (id),
  key idx_zstp_line_node_id (node_id),
  key idx_zstp_line_target_id (target_id),
  constraint fk_zstp_line_node foreign key (node_id) references zstp_node (id) on delete cascade on update cascade,
  constraint fk_zstp_line_target foreign key (target_id) references zstp_node (id) on delete cascade on update cascade
) engine=innodb comment = '知识图谱连线表';

-- 注意：fontColor 列名保持 camelCase，是为了兼容当前 MyBatis Mapper 的读写字段名。
create table zstp_node_style (
  id                bigint(20)      not null auto_increment    comment '节点样式ID',
  node_id           bigint(20)      not null                   comment '所属节点ID',
  type              varchar(32)     default null               comment '样式类型',
  color             varchar(32)     default null               comment '节点颜色',
  node_shape        bigint(20)      default null               comment '节点形状',
  width             bigint(20)      default null               comment '节点宽度',
  height            bigint(20)      default null               comment '节点高度',
  border_width      bigint(20)      default null               comment '边框宽度',
  border_height     bigint(20)      default null               comment '边框高度',
  fixed             char(1)         default null               comment '是否固定',
  x                 bigint(20)      default null               comment '横坐标',
  y                 bigint(20)      default null               comment '纵坐标',
  fontColor         varchar(32)     default null               comment '字体颜色',
  primary key (id),
  key idx_zstp_node_style_node_id (node_id),
  constraint fk_zstp_node_style_node foreign key (node_id) references zstp_node (id) on delete cascade on update cascade
) engine=innodb comment = '知识图谱节点样式表';

-- END FILE: 20260312_knowledge_graph_tables_patch.sql

SET FOREIGN_KEY_CHECKS = 1;

-- ===================================================================
-- BEGIN FILE: 20260311_role_template_patch.sql
-- ===================================================================
-- 用途:
-- 1. 补齐 teacher / student 两个基础角色
-- 2. 为业务模块补齐 sys_menu 权限骨架
-- 3. 给教师/学生角色绑定默认权限模板
-- 4. 提供“复制教师/学生模板到新角色”的 SQL 示例
--
-- 说明:
-- 1. 这是增量脚本，不会删除现有数据
-- 2. 角色创建页本身没有“模板复制”能力，所以新建角色默认不会自动继承教师/学生权限
-- 3. 图谱相关接口(/core/zstp、/core/node、/core/style、/core/line)当前控制器未挂 hasPermi，
--    本脚本不为其补权限菜单

-- =========================
-- 0. 执行前检查
-- =========================
SELECT role_id, role_name, role_key, status, del_flag
FROM sys_role
WHERE role_key IN ('teacher', 'student');

SELECT r.role_id, r.role_name, r.role_key, COUNT(rm.menu_id) AS menu_count
FROM sys_role r
LEFT JOIN sys_role_menu rm ON rm.role_id = r.role_id
WHERE r.role_key IN ('teacher', 'student')
GROUP BY r.role_id, r.role_name, r.role_key;

-- =========================
-- 1. 确保 teacher / student 角色存在
-- =========================
INSERT INTO sys_role
(
    role_name,
    role_key,
    role_sort,
    data_scope,
    menu_check_strictly,
    dept_check_strictly,
    status,
    del_flag,
    create_by,
    create_time,
    update_by,
    update_time,
    remark
)
SELECT
    '教师',
    'teacher',
    2,
    '2',
    1,
    1,
    '0',
    '0',
    'migration',
    SYSDATE(),
    '',
    NULL,
    '教师角色模板'
WHERE NOT EXISTS (
    SELECT 1 FROM sys_role WHERE role_key = 'teacher'
);

INSERT INTO sys_role
(
    role_name,
    role_key,
    role_sort,
    data_scope,
    menu_check_strictly,
    dept_check_strictly,
    status,
    del_flag,
    create_by,
    create_time,
    update_by,
    update_time,
    remark
)
SELECT
    '学生',
    'student',
    3,
    '2',
    1,
    1,
    '0',
    '0',
    'migration',
    SYSDATE(),
    '',
    NULL,
    '学生角色模板'
WHERE NOT EXISTS (
    SELECT 1 FROM sys_role WHERE role_key = 'student'
);

UPDATE sys_role
SET role_name = '教师',
    status = '0',
    del_flag = '0',
    update_by = 'migration',
    update_time = SYSDATE()
WHERE role_key = 'teacher';

UPDATE sys_role
SET role_name = '学生',
    status = '0',
    del_flag = '0',
    update_by = 'migration',
    update_time = SYSDATE()
WHERE role_key = 'student';

SET @teacher_role_id := (SELECT role_id FROM sys_role WHERE role_key = 'teacher' ORDER BY role_id LIMIT 1);
SET @student_role_id := (SELECT role_id FROM sys_role WHERE role_key = 'student' ORDER BY role_id LIMIT 1);

-- =========================
-- 2. 创建隐藏的“业务权限模板”菜单根节点
-- =========================
INSERT INTO sys_menu
(
    menu_name,
    parent_id,
    order_num,
    path,
    component,
    query,
    route_name,
    is_frame,
    is_cache,
    menu_type,
    visible,
    status,
    perms,
    icon,
    create_by,
    create_time,
    update_by,
    update_time,
    remark
)
SELECT
    '业务权限模板',
    0,
    99,
    'biz-permissions',
    'Layout',
    '',
    '',
    1,
    1,
    'M',
    '1',
    '0',
    '',
    'tree',
    'migration',
    SYSDATE(),
    '',
    NULL,
    '供教师/学生角色模板使用的隐藏菜单'
WHERE NOT EXISTS (
    SELECT 1 FROM sys_menu WHERE path = 'biz-permissions' AND menu_type = 'M'
);

SET @biz_root_menu_id := (
    SELECT menu_id
    FROM sys_menu
    WHERE path = 'biz-permissions' AND menu_type = 'M'
    ORDER BY menu_id
    LIMIT 1
);

-- =========================
-- 3. 业务权限菜单骨架
-- 规则:
-- - C 菜单的 perms 使用 xxx:list
-- - F 按钮菜单补 query/add/edit/remove
-- =========================

-- 3.1 课程管理
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '课程管理权限', @biz_root_menu_id, 1, 'courses-auth', 'ParentView', '', '', 1, 1, 'C', '1', '0', 'core:courses:list', '#', 'migration', SYSDATE(), '', NULL, '课程管理权限菜单'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:courses:list');
SET @menu_courses := (SELECT menu_id FROM sys_menu WHERE perms = 'core:courses:list' ORDER BY menu_id LIMIT 1);

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '课程查询', @menu_courses, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:courses:query', '#', 'migration', SYSDATE(), '', NULL, '课程查询权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:courses:query');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '课程新增', @menu_courses, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:courses:add', '#', 'migration', SYSDATE(), '', NULL, '课程新增权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:courses:add');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '课程修改', @menu_courses, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:courses:edit', '#', 'migration', SYSDATE(), '', NULL, '课程修改权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:courses:edit');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '课程删除', @menu_courses, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:courses:remove', '#', 'migration', SYSDATE(), '', NULL, '课程删除权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:courses:remove');

-- 3.2 课程成员
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '课程成员权限', @biz_root_menu_id, 2, 'coursemembers-auth', 'ParentView', '', '', 1, 1, 'C', '1', '0', 'core:coursemembers:list', '#', 'migration', SYSDATE(), '', NULL, '课程成员权限菜单'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:coursemembers:list');
SET @menu_coursemembers := (SELECT menu_id FROM sys_menu WHERE perms = 'core:coursemembers:list' ORDER BY menu_id LIMIT 1);

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '课程成员查询', @menu_coursemembers, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:coursemembers:query', '#', 'migration', SYSDATE(), '', NULL, '课程成员查询权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:coursemembers:query');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '课程成员新增', @menu_coursemembers, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:coursemembers:add', '#', 'migration', SYSDATE(), '', NULL, '课程成员新增权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:coursemembers:add');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '课程成员修改', @menu_coursemembers, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:coursemembers:edit', '#', 'migration', SYSDATE(), '', NULL, '课程成员修改权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:coursemembers:edit');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '课程成员删除', @menu_coursemembers, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:coursemembers:remove', '#', 'migration', SYSDATE(), '', NULL, '课程成员删除权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:coursemembers:remove');

-- 3.3 作业管理
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '作业管理权限', @biz_root_menu_id, 3, 'work-auth', 'ParentView', '', '', 1, 1, 'C', '1', '0', 'core:work:list', '#', 'migration', SYSDATE(), '', NULL, '作业管理权限菜单'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:work:list');
SET @menu_work := (SELECT menu_id FROM sys_menu WHERE perms = 'core:work:list' ORDER BY menu_id LIMIT 1);

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '作业查询', @menu_work, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:work:query', '#', 'migration', SYSDATE(), '', NULL, '作业查询权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:work:query');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '作业新增', @menu_work, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:work:add', '#', 'migration', SYSDATE(), '', NULL, '作业新增权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:work:add');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '作业修改', @menu_work, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:work:edit', '#', 'migration', SYSDATE(), '', NULL, '作业修改权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:work:edit');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '作业删除', @menu_work, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:work:remove', '#', 'migration', SYSDATE(), '', NULL, '作业删除权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:work:remove');

-- 3.4 课程文件
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '课程文件权限', @biz_root_menu_id, 4, 'files-auth', 'ParentView', '', '', 1, 1, 'C', '1', '0', 'core:files:list', '#', 'migration', SYSDATE(), '', NULL, '课程文件权限菜单'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:files:list');
SET @menu_files := (SELECT menu_id FROM sys_menu WHERE perms = 'core:files:list' ORDER BY menu_id LIMIT 1);

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '课程文件查询', @menu_files, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:files:query', '#', 'migration', SYSDATE(), '', NULL, '课程文件查询权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:files:query');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '课程文件新增', @menu_files, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:files:add', '#', 'migration', SYSDATE(), '', NULL, '课程文件新增权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:files:add');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '课程文件修改', @menu_files, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:files:edit', '#', 'migration', SYSDATE(), '', NULL, '课程文件修改权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:files:edit');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '课程文件删除', @menu_files, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:files:remove', '#', 'migration', SYSDATE(), '', NULL, '课程文件删除权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:files:remove');

-- 3.5 成绩汇总
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '成绩汇总权限', @biz_root_menu_id, 5, 'summaries-auth', 'ParentView', '', '', 1, 1, 'C', '1', '0', 'core:summaries:list', '#', 'migration', SYSDATE(), '', NULL, '成绩汇总权限菜单'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:summaries:list');
SET @menu_summaries := (SELECT menu_id FROM sys_menu WHERE perms = 'core:summaries:list' ORDER BY menu_id LIMIT 1);

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '成绩汇总查询', @menu_summaries, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:summaries:query', '#', 'migration', SYSDATE(), '', NULL, '成绩汇总查询权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:summaries:query');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '成绩汇总新增', @menu_summaries, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:summaries:add', '#', 'migration', SYSDATE(), '', NULL, '成绩汇总新增权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:summaries:add');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '成绩汇总删除', @menu_summaries, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:summaries:remove', '#', 'migration', SYSDATE(), '', NULL, '成绩汇总删除权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:summaries:remove');

-- 3.6 评分项
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '评分项权限', @biz_root_menu_id, 6, 'items-auth', 'ParentView', '', '', 1, 1, 'C', '1', '0', 'core:items:list', '#', 'migration', SYSDATE(), '', NULL, '评分项权限菜单'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:items:list');
SET @menu_items := (SELECT menu_id FROM sys_menu WHERE perms = 'core:items:list' ORDER BY menu_id LIMIT 1);

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '评分项查询', @menu_items, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:items:query', '#', 'migration', SYSDATE(), '', NULL, '评分项查询权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:items:query');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '评分项新增', @menu_items, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:items:add', '#', 'migration', SYSDATE(), '', NULL, '评分项新增权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:items:add');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '评分项修改', @menu_items, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:items:edit', '#', 'migration', SYSDATE(), '', NULL, '评分项修改权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:items:edit');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '评分项删除', @menu_items, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:items:remove', '#', 'migration', SYSDATE(), '', NULL, '评分项删除权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:items:remove');

-- 3.7 成绩记录
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '成绩记录权限', @biz_root_menu_id, 7, 'records-auth', 'ParentView', '', '', 1, 1, 'C', '1', '0', 'core:records:list', '#', 'migration', SYSDATE(), '', NULL, '成绩记录权限菜单'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:records:list');
SET @menu_records := (SELECT menu_id FROM sys_menu WHERE perms = 'core:records:list' ORDER BY menu_id LIMIT 1);

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '成绩记录查询', @menu_records, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:records:query', '#', 'migration', SYSDATE(), '', NULL, '成绩记录查询权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:records:query');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '成绩记录新增', @menu_records, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:records:add', '#', 'migration', SYSDATE(), '', NULL, '成绩记录新增权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:records:add');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '成绩记录修改', @menu_records, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:records:edit', '#', 'migration', SYSDATE(), '', NULL, '成绩记录修改权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:records:edit');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '成绩记录删除', @menu_records, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:records:remove', '#', 'migration', SYSDATE(), '', NULL, '成绩记录删除权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:records:remove');

-- 3.8 会话管理
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '会话管理权限', @biz_root_menu_id, 8, 'session-auth', 'ParentView', '', '', 1, 1, 'C', '1', '0', 'core:session:list', '#', 'migration', SYSDATE(), '', NULL, '会话管理权限菜单'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:session:list');
SET @menu_session := (SELECT menu_id FROM sys_menu WHERE perms = 'core:session:list' ORDER BY menu_id LIMIT 1);

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '会话查询', @menu_session, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:session:query', '#', 'migration', SYSDATE(), '', NULL, '会话查询权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:session:query');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '会话新增', @menu_session, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:session:add', '#', 'migration', SYSDATE(), '', NULL, '会话新增权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:session:add');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '会话修改', @menu_session, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:session:edit', '#', 'migration', SYSDATE(), '', NULL, '会话修改权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:session:edit');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '会话删除', @menu_session, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:session:remove', '#', 'migration', SYSDATE(), '', NULL, '会话删除权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:session:remove');

-- 3.9 会话成员
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '会话成员权限', @biz_root_menu_id, 9, 'member-auth', 'ParentView', '', '', 1, 1, 'C', '1', '0', 'core:member:list', '#', 'migration', SYSDATE(), '', NULL, '会话成员权限菜单'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:member:list');
SET @menu_member := (SELECT menu_id FROM sys_menu WHERE perms = 'core:member:list' ORDER BY menu_id LIMIT 1);

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '会话成员查询', @menu_member, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:member:query', '#', 'migration', SYSDATE(), '', NULL, '会话成员查询权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:member:query');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '会话成员新增', @menu_member, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:member:add', '#', 'migration', SYSDATE(), '', NULL, '会话成员新增权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:member:add');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '会话成员修改', @menu_member, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:member:edit', '#', 'migration', SYSDATE(), '', NULL, '会话成员修改权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:member:edit');

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '会话成员删除', @menu_member, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:member:remove', '#', 'migration', SYSDATE(), '', NULL, '会话成员删除权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:member:remove');

-- 3.10 会话消息
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '会话消息权限', @biz_root_menu_id, 10, 'message-auth', 'ParentView', '', '', 1, 1, 'C', '1', '0', 'core:message:list', '#', 'migration', SYSDATE(), '', NULL, '会话消息权限菜单'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:message:list');
SET @menu_message := (SELECT menu_id FROM sys_menu WHERE perms = 'core:message:list' ORDER BY menu_id LIMIT 1);

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '会话消息查询', @menu_message, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'core:message:query', '#', 'migration', SYSDATE(), '', NULL, '会话消息查询权限'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'core:message:query');

-- 3.11 教案管理
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '教案权限', @biz_root_menu_id, 11, 'tp-plan-auth', 'ParentView', '', '', 1, 1, 'C', '1', '0', 'tp:plan:list', '#', 'migration', SYSDATE(), '', NULL, '教案权限菜单'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'tp:plan:list');

-- 3.12 教案模块管理
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT '教案模块权限', @biz_root_menu_id, 12, 'tp-module-auth', 'ParentView', '', '', 1, 1, 'C', '1', '0', 'tp:module:list', '#', 'migration', SYSDATE(), '', NULL, '教案模块权限菜单'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE perms = 'tp:module:list');

-- =========================
-- 4. 绑定教师模板权限
-- =========================
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT @teacher_role_id, m.menu_id
FROM sys_menu m
WHERE m.path = 'biz-permissions'
   OR m.perms IN (
        'core:courses:list', 'core:courses:query', 'core:courses:add', 'core:courses:edit', 'core:courses:remove',
        'core:coursemembers:list', 'core:coursemembers:query', 'core:coursemembers:add', 'core:coursemembers:edit', 'core:coursemembers:remove',
        'core:work:list', 'core:work:query', 'core:work:add', 'core:work:edit', 'core:work:remove',
        'core:files:list', 'core:files:query', 'core:files:add', 'core:files:edit', 'core:files:remove',
        'core:summaries:list', 'core:summaries:query', 'core:summaries:add', 'core:summaries:remove',
        'core:items:list', 'core:items:query', 'core:items:add', 'core:items:edit', 'core:items:remove',
        'core:records:list', 'core:records:query', 'core:records:add', 'core:records:edit', 'core:records:remove',
        'core:session:list', 'core:session:query', 'core:session:add', 'core:session:edit', 'core:session:remove',
        'core:member:list', 'core:member:query', 'core:member:add', 'core:member:edit', 'core:member:remove',
        'core:message:list', 'core:message:query',
        'tp:plan:list', 'tp:module:list'
   )
AND NOT EXISTS (
    SELECT 1
    FROM sys_role_menu rm
    WHERE rm.role_id = @teacher_role_id
      AND rm.menu_id = m.menu_id
);

-- =========================
-- 5. 绑定学生模板权限
-- 说明:
-- 当前学生模板只给“查看类”权限；不补删改
-- =========================
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT @student_role_id, m.menu_id
FROM sys_menu m
WHERE m.path = 'biz-permissions'
   OR m.perms IN (
        'core:courses:list', 'core:courses:query',
        'core:coursemembers:list', 'core:coursemembers:query',
        'core:work:list', 'core:work:query',
        'core:files:list', 'core:files:query',
        'core:summaries:list', 'core:summaries:query',
        'core:session:list', 'core:session:query',
        'core:member:list', 'core:member:query',
        'core:message:list', 'core:message:query'
   )
AND NOT EXISTS (
    SELECT 1
    FROM sys_role_menu rm
    WHERE rm.role_id = @student_role_id
      AND rm.menu_id = m.menu_id
);

-- =========================
-- 6. 执行后校验
-- =========================
SELECT r.role_id, r.role_name, r.role_key, COUNT(rm.menu_id) AS menu_count
FROM sys_role r
LEFT JOIN sys_role_menu rm ON rm.role_id = r.role_id
WHERE r.role_key IN ('teacher', 'student')
GROUP BY r.role_id, r.role_name, r.role_key;

SELECT r.role_key, m.menu_name, m.menu_type, m.perms
FROM sys_role r
JOIN sys_role_menu rm ON rm.role_id = r.role_id
JOIN sys_menu m ON m.menu_id = rm.menu_id
WHERE r.role_key IN ('teacher', 'student')
ORDER BY r.role_key, m.parent_id, m.order_num, m.menu_id;

-- =========================
-- 7. 常用复制模板 SQL（手工执行）
-- =========================
-- 示例1：把某个新角色复制为“教师模板”
-- 用法：把 9999 改成你的目标角色ID
-- SET @target_role_id := 9999;
-- INSERT INTO sys_role_menu (role_id, menu_id)
-- SELECT @target_role_id, menu_id
-- FROM sys_role_menu
-- WHERE role_id = @teacher_role_id
--   AND NOT EXISTS (
--       SELECT 1 FROM sys_role_menu rm
--       WHERE rm.role_id = @target_role_id
--         AND rm.menu_id = sys_role_menu.menu_id
--   );

-- 示例2：把某个新角色复制为“学生模板”
-- SET @target_role_id := 9999;
-- INSERT INTO sys_role_menu (role_id, menu_id)
-- SELECT @target_role_id, menu_id
-- FROM sys_role_menu
-- WHERE role_id = @student_role_id
--   AND NOT EXISTS (
--       SELECT 1 FROM sys_role_menu rm
--       WHERE rm.role_id = @target_role_id
--         AND rm.menu_id = sys_role_menu.menu_id
--   );

-- 示例3：把用户授权为教师
-- SET @target_user_id := 101;
-- INSERT INTO sys_user_role (user_id, role_id)
-- SELECT @target_user_id, @teacher_role_id
-- WHERE NOT EXISTS (
--     SELECT 1 FROM sys_user_role WHERE user_id = @target_user_id AND role_id = @teacher_role_id
-- );

-- 示例4：把用户授权为学生
-- SET @target_user_id := 101;
-- INSERT INTO sys_user_role (user_id, role_id)
-- SELECT @target_user_id, @student_role_id
-- WHERE NOT EXISTS (
--     SELECT 1 FROM sys_user_role WHERE user_id = @target_user_id AND role_id = @student_role_id
-- );

-- END FILE: 20260311_role_template_patch.sql

-- ===================================================================
-- BEGIN FILE: 20260317_student_class_binding_patch.sql
-- ===================================================================
-- 学生班级绑定补丁
-- 执行日期：2026-03-17
-- 用途：
-- 1. 新增 cl_student_class_binding 表，存储学生与专业/班级的绑定关系
-- 2. 支撑后台管理页在创建学生时一次性完成班级绑定
-- ===================================================================

CREATE TABLE IF NOT EXISTS cl_student_class_binding (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    student_id BIGINT NOT NULL COMMENT '学生用户ID',
    major_id BIGINT NOT NULL COMMENT '专业ID',
    class_name VARCHAR(100) NOT NULL COMMENT '班级名称',
    create_time DATETIME NULL COMMENT '创建时间',
    update_time DATETIME NULL COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uq_cl_student_class_binding_student (student_id),
    KEY idx_cl_student_class_binding_major_class (major_id, class_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生班级绑定表';

-- END FILE: 20260317_student_class_binding_patch.sql

-- ===================================================================
-- BEGIN FILE: 20260318_teacher_class_binding_patch.sql
-- ===================================================================
-- 教师班级绑定补丁
-- 执行日期：2026-03-18
-- 用途：
-- 1. 新增 cl_teacher_class_binding 表，存储教师与专业/班级的多对多绑定关系
-- 2. 支撑后台管理页为教师维护多个授课班级
-- ===================================================================

CREATE TABLE IF NOT EXISTS cl_teacher_class_binding (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    teacher_id BIGINT NOT NULL COMMENT '教师用户ID',
    major_id BIGINT NOT NULL COMMENT '专业ID',
    class_name VARCHAR(100) NOT NULL COMMENT '班级名称',
    create_time DATETIME NULL COMMENT '创建时间',
    update_time DATETIME NULL COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uq_cl_teacher_class_binding_teacher_major_class (teacher_id, major_id, class_name),
    KEY idx_cl_teacher_class_binding_major_class (major_id, class_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教师班级绑定表';

-- END FILE: 20260318_teacher_class_binding_patch.sql

-- ===================================================================
-- BEGIN FILE: 20260323_class_management_patch.sql
-- ===================================================================
-- 班级管理补丁
-- 执行日期：2026-03-23
-- 用途：
-- 1. 新增 cl_classes 班级主数据表
-- 2. 新增系统管理-班级管理菜单及按钮权限
-- ===================================================================

CREATE TABLE IF NOT EXISTS cl_classes (
    class_id BIGINT NOT NULL AUTO_INCREMENT COMMENT '班级ID',
    major_id BIGINT NOT NULL COMMENT '专业ID',
    class_name VARCHAR(100) NOT NULL COMMENT '班级名称',
    status CHAR(1) NOT NULL DEFAULT '0' COMMENT '状态（0正常 1停用）',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    create_by VARCHAR(64) DEFAULT '' COMMENT '创建者',
    create_time DATETIME DEFAULT NULL COMMENT '创建时间',
    update_by VARCHAR(64) DEFAULT '' COMMENT '更新者',
    update_time DATETIME DEFAULT NULL COMMENT '更新时间',
    PRIMARY KEY (class_id),
    UNIQUE KEY uq_cl_classes_major_class (major_id, class_name),
    KEY idx_cl_classes_major_id (major_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级主数据表';

INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT 118, '班级管理', 1, 9, 'class', 'system/class/index', '', '', 1, 0, 'C', '0', '0', 'system:class:list', 'education', 'migration', SYSDATE(), '', NULL, '班级管理菜单'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE menu_id = 118);

UPDATE sys_menu SET order_num = 10 WHERE menu_id = 108 AND order_num = 9;

INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT 1061, '班级查询', 118, 1, '', '', '', '', 1, 0, 'F', '0', '0', 'system:class:query', '#', 'migration', SYSDATE(), '', NULL, ''
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE menu_id = 1061);

INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT 1062, '班级新增', 118, 2, '', '', '', '', 1, 0, 'F', '0', '0', 'system:class:add', '#', 'migration', SYSDATE(), '', NULL, ''
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE menu_id = 1062);

INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT 1063, '班级修改', 118, 3, '', '', '', '', 1, 0, 'F', '0', '0', 'system:class:edit', '#', 'migration', SYSDATE(), '', NULL, ''
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE menu_id = 1063);

INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT 1064, '班级删除', 118, 4, '', '', '', '', 1, 0, 'F', '0', '0', 'system:class:remove', '#', 'migration', SYSDATE(), '', NULL, ''
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE menu_id = 1064);

INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query, route_name, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
SELECT 1065, '班级导出', 118, 5, '', '', '', '', 1, 0, 'F', '0', '0', 'system:class:export', '#', 'migration', SYSDATE(), '', NULL, ''
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE menu_id = 1065);

-- END FILE: 20260323_class_management_patch.sql
