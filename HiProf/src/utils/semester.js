/**
 * 学期计算工具函数
 * 根据创建时间计算对应的学期
 */

/**
 * 根据日期计算学期
 * @param {string|Date} dateInput 日期字符串或Date对象，格式如 "2025-08-10 18:20:57"
 * @returns {string} 学期字符串，格式如 "2025秋季学期"
 */
export const calculateSemester = (dateInput) => {
  try {
    // 处理输入参数
    let date;
    if (typeof dateInput === 'string') {
      // 处理字符串格式的日期
      date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      console.warn('无效的日期输入:', dateInput);
      return '未知学期';
    }

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('无法解析的日期:', dateInput);
      return '未知学期';
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth()返回0-11，需要+1

    // 学期划分规则：
    // 春季学期：2月-7月
    // 秋季学期：8月-次年1月
    let semester;
    let semesterYear;

    if (month >= 2 && month <= 7) {
      // 春季学期：2-7月
      semester = '春季学期';
      semesterYear = year;
    } else {
      // 秋季学期：8-12月和次年1月
      semester = '秋季学期';
      if (month >= 8) {
        // 8-12月，属于当年秋季学期
        semesterYear = year;
      } else {
        // 1月，属于上一年的秋季学期
        semesterYear = year - 1;
      }
    }

    return `${semesterYear}${semester}`;
  } catch (error) {
    console.error('计算学期时发生错误:', error);
    return '未知学期';
  }
};

/**
 * 获取当前学期
 * @returns {string} 当前学期字符串
 */
export const getCurrentSemester = () => {
  return calculateSemester(new Date());
};

/**
 * 批量计算课程学期
 * @param {Array} courses 课程数组，每个课程对象应包含createTime字段
 * @returns {Array} 添加了semester字段的课程数组
 */
export const addSemesterToCourses = (courses) => {
  if (!Array.isArray(courses)) {
    console.warn('courses参数必须是数组');
    return [];
  }

  return courses.map(course => ({
    ...course,
    semester: course.createTime ? calculateSemester(course.createTime) : getCurrentSemester()
  }));
};

/**
 * 学期排序比较函数
 * 用于对学期进行排序，最新的学期排在前面
 * @param {string} semesterA 学期A
 * @param {string} semesterB 学期B
 * @returns {number} 比较结果
 */
export const compareSemesters = (semesterA, semesterB) => {
  try {
    // 解析学期字符串，如 "2025秋季学期" -> {year: 2025, season: "秋季"}
    const parseSemseter = (semester) => {
      const match = semester.match(/^(\d{4})(春季|秋季)学期$/);
      if (!match) return { year: 0, season: '' };
      
      const year = parseInt(match[1]);
      const season = match[2];
      
      // 将季节转换为数字便于比较，秋季 > 春季
      const seasonValue = season === '秋季' ? 2 : 1;
      
      return { year, season: seasonValue };
    };

    const a = parseSemseter(semesterA);
    const b = parseSemseter(semesterB);

    // 先按年份排序，再按季节排序
    if (a.year !== b.year) {
      return b.year - a.year; // 年份降序
    }
    return b.season - a.season; // 季节降序
  } catch (error) {
    console.error('学期排序时发生错误:', error);
    return 0;
  }
};
