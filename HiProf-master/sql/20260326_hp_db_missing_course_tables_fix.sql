-- 缺失课程相关业务表修复脚本
-- 生成时间：2026-03-26
-- 适用场景：在 hp_db 上补齐课程资料、学情统计、讨论模块缺失的数据表
-- 说明：
-- 1. 本脚本为幂等脚本，可重复执行。
-- 2. 主要修复缺表导致的接口 500 问题，不负责修复历史脏数据。
-- 3. chat_session 已补充 course_id 字段，但历史旧数据若没有课程归属，需要后续人工回填。

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `cl_files` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '文件ID',
  `course_id` bigint(20) DEFAULT NULL COMMENT '所属课程ID',
  `file_url` varchar(500) DEFAULT NULL COMMENT '文件地址',
  `file_type` varchar(100) DEFAULT NULL COMMENT '文件MIME类型',
  `file_size` bigint(20) DEFAULT NULL COMMENT '文件大小(字节)',
  `file_key` varchar(255) DEFAULT NULL COMMENT '文件存储Key',
  `file_name` varchar(255) DEFAULT NULL COMMENT '文件显示名称',
  `create_by` varchar(64) DEFAULT NULL COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_cl_files_course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='课程文件表';

CREATE TABLE IF NOT EXISTS `cl_score_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '项目ID',
  `course_id` bigint(20) DEFAULT NULL COMMENT '所属课程ID',
  `item_name` varchar(100) DEFAULT NULL COMMENT '项目名称',
  `item_type` varchar(32) DEFAULT NULL COMMENT '项目类型 regular/extra/penalty',
  `item_weight` decimal(10,4) DEFAULT NULL COMMENT '权重系数',
  `max_score` bigint(20) DEFAULT NULL COMMENT '项目最高分',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_cl_score_items_course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='课程分值项目表';

CREATE TABLE IF NOT EXISTS `cl_score_records` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `item_id` bigint(20) DEFAULT NULL COMMENT '所属分值项目ID',
  `student_id` bigint(20) DEFAULT NULL COMMENT '学生ID',
  `course_id` bigint(20) DEFAULT NULL COMMENT '所属课程ID',
  `score` decimal(10,4) DEFAULT NULL COMMENT '得分值',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `grader_id` bigint(20) DEFAULT NULL COMMENT '评分人ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_cl_score_records_course_student_item` (`course_id`, `student_id`, `item_id`),
  KEY `idx_cl_score_records_item_id` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='课程分值记录表';

CREATE TABLE IF NOT EXISTS `cl_score_summaries` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '统计ID',
  `student_id` bigint(20) DEFAULT NULL COMMENT '学生ID',
  `course_id` bigint(20) DEFAULT NULL COMMENT '所属课程ID',
  `regular_score` decimal(10,4) DEFAULT NULL COMMENT '常规分',
  `extra_score` decimal(10,4) DEFAULT NULL COMMENT '附加分',
  `penalty_score` decimal(10,4) DEFAULT NULL COMMENT '扣分',
  `total_score` decimal(10,4) DEFAULT NULL COMMENT '总分',
  `ranking` bigint(20) DEFAULT NULL COMMENT '课程内排名',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cl_score_summaries_course_student` (`course_id`, `student_id`),
  KEY `idx_cl_score_summaries_course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='课程分值汇总表';

CREATE TABLE IF NOT EXISTS `chat_session` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `name` varchar(255) DEFAULT NULL COMMENT '会话名称',
  `course_id` bigint(20) DEFAULT NULL COMMENT '所属课程ID',
  `create_by` varchar(64) DEFAULT NULL COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_chat_session_course_id` (`course_id`),
  KEY `idx_chat_session_create_by` (`create_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='讨论会话表';

CREATE TABLE IF NOT EXISTS `chat_members` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `session_id` bigint(20) DEFAULT NULL COMMENT '会话ID',
  `user_id` bigint(20) DEFAULT NULL COMMENT '用户ID',
  `role` varchar(32) DEFAULT NULL COMMENT '角色 admin/member/owner',
  `unread_count` bigint(20) DEFAULT 0 COMMENT '未读消息数',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_chat_members_session_user` (`session_id`, `user_id`),
  KEY `idx_chat_members_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='讨论会话成员表';

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `session_id` bigint(20) DEFAULT NULL COMMENT '会话ID',
  `create_by` varchar(64) DEFAULT NULL COMMENT '发送者',
  `content` text COMMENT '消息内容',
  `content_type` varchar(32) DEFAULT NULL COMMENT '消息类型 text/image/video/other/audio',
  `file_url` varchar(500) DEFAULT NULL COMMENT '附件地址',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_session_time` (`session_id`, `create_time`),
  KEY `idx_chat_messages_create_by` (`create_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='讨论消息表';

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'chat_session'
        AND column_name = 'course_id'
    ),
    'SELECT ''chat_session.course_id exists''',
    'ALTER TABLE `chat_session` ADD COLUMN `course_id` bigint(20) DEFAULT NULL COMMENT ''所属课程ID'' AFTER `name`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'chat_session'
        AND index_name = 'idx_chat_session_course_id'
    ),
    'SELECT ''idx_chat_session_course_id exists''',
    'ALTER TABLE `chat_session` ADD INDEX `idx_chat_session_course_id` (`course_id`)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'cl_files'
        AND index_name = 'idx_cl_files_course_id'
    ),
    'SELECT ''idx_cl_files_course_id exists''',
    'ALTER TABLE `cl_files` ADD INDEX `idx_cl_files_course_id` (`course_id`)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'cl_score_items'
        AND index_name = 'idx_cl_score_items_course_id'
    ),
    'SELECT ''idx_cl_score_items_course_id exists''',
    'ALTER TABLE `cl_score_items` ADD INDEX `idx_cl_score_items_course_id` (`course_id`)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'cl_score_records'
        AND index_name = 'idx_cl_score_records_course_student_item'
    ),
    'SELECT ''idx_cl_score_records_course_student_item exists''',
    'ALTER TABLE `cl_score_records` ADD INDEX `idx_cl_score_records_course_student_item` (`course_id`, `student_id`, `item_id`)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'cl_score_records'
        AND index_name = 'idx_cl_score_records_item_id'
    ),
    'SELECT ''idx_cl_score_records_item_id exists''',
    'ALTER TABLE `cl_score_records` ADD INDEX `idx_cl_score_records_item_id` (`item_id`)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'cl_score_summaries'
        AND index_name = 'uk_cl_score_summaries_course_student'
    ),
    'SELECT ''uk_cl_score_summaries_course_student exists''',
    'ALTER TABLE `cl_score_summaries` ADD UNIQUE INDEX `uk_cl_score_summaries_course_student` (`course_id`, `student_id`)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'cl_score_summaries'
        AND index_name = 'idx_cl_score_summaries_course_id'
    ),
    'SELECT ''idx_cl_score_summaries_course_id exists''',
    'ALTER TABLE `cl_score_summaries` ADD INDEX `idx_cl_score_summaries_course_id` (`course_id`)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'chat_session'
        AND index_name = 'idx_chat_session_create_by'
    ),
    'SELECT ''idx_chat_session_create_by exists''',
    'ALTER TABLE `chat_session` ADD INDEX `idx_chat_session_create_by` (`create_by`)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'chat_members'
        AND index_name = 'uk_chat_members_session_user'
    ),
    'SELECT ''uk_chat_members_session_user exists''',
    'ALTER TABLE `chat_members` ADD UNIQUE INDEX `uk_chat_members_session_user` (`session_id`, `user_id`)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'chat_members'
        AND index_name = 'idx_chat_members_user_id'
    ),
    'SELECT ''idx_chat_members_user_id exists''',
    'ALTER TABLE `chat_members` ADD INDEX `idx_chat_members_user_id` (`user_id`)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'chat_messages'
        AND index_name = 'idx_chat_messages_session_time'
    ),
    'SELECT ''idx_chat_messages_session_time exists''',
    'ALTER TABLE `chat_messages` ADD INDEX `idx_chat_messages_session_time` (`session_id`, `create_time`)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = 'chat_messages'
        AND index_name = 'idx_chat_messages_create_by'
    ),
    'SELECT ''idx_chat_messages_create_by exists''',
    'ALTER TABLE `chat_messages` ADD INDEX `idx_chat_messages_create_by` (`create_by`)'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
