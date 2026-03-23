-- 将 admin 账号密码重置为：admin@123
-- 说明：本项目使用 Spring Security 的 BCryptPasswordEncoder 存储密码，
-- 所以下面写入的是 admin@123 对应的 BCrypt 哈希，不是明文。

START TRANSACTION;

UPDATE sys_user
SET password = '$2a$10$TQIS2NWlo2eQXSwX9ZkTieac2YsEzlKwqjxEu9vPv89AWrVeDfemC',
    pwd_update_date = SYSDATE(),
    update_by = 'admin',
    update_time = SYSDATE()
WHERE user_name = 'admin'
  AND del_flag = '0';

COMMIT;

-- 执行后可用下面语句确认是否更新成功
SELECT user_id,
       user_name,
       status,
       del_flag,
       pwd_update_date,
       update_time
FROM sys_user
WHERE user_name = 'admin';
