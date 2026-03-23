import { ref, computed, watch } from 'vue';
import { useApiList, useApi } from './useApi';
import { getCurrentUser } from '@/api/auth';
import { getCoursesList, createCourse, updateCourse, deleteCourse } from '@/api/courses';
import { getClassesList, createClass, updateClass, deleteClasses } from '@/api/class';

/**
 * 教师数据管理 Composable
 * 统一管理教师相关的数据和操作
 */
export function useTeacherData() {
  // 当前用户信息
  const currentUser = ref(getCurrentUser() || {});

  // 更新当前用户信息
  const updateCurrentUser = (userData) => {
    currentUser.value = { ...currentUser.value, ...userData };
  };

  return {
    currentUser,
    updateCurrentUser
  };
}

/**
 * 课程数据管理 Composable
 */
export function useTeacherCourses() {
  const { currentUser } = useTeacherData();
  
  // 使用API列表管理课程数据
  const coursesApi = useApiList(getCoursesList, {
    immediate: false
  });

  // 课程操作API
  const createCourseApi = useApi();
  const updateCourseApi = useApi();
  const deleteCourseApi = useApi();

  // 计算属性
  const courses = computed(() => {
    return coursesApi.list.value.map((course, index) => ({
      id: course.id,
      title: course.name || course.title || '未命名课程',
      semester: course.semester || '2024春季学期',
      studentCount: course.studentCount || 0,
      totalHours: course.totalHours || 32,
      progress: course.progress || Math.floor(Math.random() * 100),
      type: index % 2 === 0 ? 'blue' : 'green',
      lastModified: formatLastModified(course.updateTime || course.createTime),
      description: course.description || '',
      majorId: course.majorId,
      teacherId: course.teacherId,
      tpId: course.tpId,
      className: course.className || '未命名班级'
    }));
  });

  const coursesLoading = computed(() => coursesApi.isLoading.value);
  const coursesError = computed(() => coursesApi.error.value);
  const hasCourses = computed(() => courses.value.length > 0);

  // 格式化最后修改时间
  const formatLastModified = (dateString) => {
    if (!dateString) return '未知';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return '刚刚';
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}周前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 获取课程列表
  const fetchCourses = async () => {
    return await coursesApi.fetchList();
  };

  // 创建课程
  const createNewCourse = async (courseData) => {
    const data = {
      ...courseData,
      teacherId: currentUser.value.id || 0,
      createBy: currentUser.value.username || '',
      updateBy: currentUser.value.username || '',
      params: {}
    };

    const result = await createCourseApi.execute(createCourse, data);

    if (result && result.success) {
      // 刷新课程列表
      await fetchCourses();
      return result;
    }

    throw new Error(result?.msg || '创建课程失败');
  };

  // 更新课程
  const updateExistingCourse = async (courseId, updates) => {
    const data = {
      id: courseId,
      ...updates,
      updateBy: currentUser.value.username || '',
      updateTime: new Date().toISOString()
    };

    const result = await updateCourseApi.execute(updateCourse, data);
    
    if (result && result.success) {
      // 更新本地数据
      coursesApi.updateItem(courseId, updates);
      return result;
    }
    
    throw new Error(result?.msg || '更新课程失败');
  };

  // 删除课程
  const deleteCourseById = async (courseId) => {
    const result = await deleteCourseApi.execute(deleteCourse, courseId);
    
    if (result && result.success) {
      // 从本地列表中移除
      coursesApi.removeItem(courseId);
      return result;
    }
    
    throw new Error(result?.msg || '删除课程失败');
  };

  return {
    // 状态
    courses,
    coursesLoading,
    coursesError,
    hasCourses,
    
    // API状态
    createCourseLoading: createCourseApi.isLoading,
    updateCourseLoading: updateCourseApi.isLoading,
    deleteCourseLoading: deleteCourseApi.isLoading,

    // 方法
    fetchCourses,
    createNewCourse,
    updateExistingCourse,
    deleteCourseById,
    
    // 原始API对象（用于高级操作）
    coursesApi,
    createCourseApi,
    updateCourseApi,
    deleteCourseApi
  };
}

/**
 * 班级数据管理 Composable
 */
export function useTeacherClasses() {
  const { currentUser } = useTeacherData();
  
  // 使用API列表管理班级数据
  const classesApi = useApiList(getClassesList, {
    immediate: false
  });

  // 班级操作API
  const createClassApi = useApi();
  const updateClassApi = useApi();
  const deleteClassApi = useApi();

  // 计算属性
  const classes = computed(() => {
    return classesApi.list.value.map((classItem, index) => ({
      id: classItem.id,
      name: classItem.name || '未命名班级',
      semester: classItem.semester || '2024春季学期',
      studentCount: classItem.studentCount !== undefined ? classItem.studentCount : 0,
      courseCount: classItem.courseCount !== undefined ? classItem.courseCount : 0,
      avgProgress: classItem.avgProgress !== undefined ? classItem.avgProgress : 0,
      type: index % 2 === 0 ? 'blue' : 'green',
      teacher: classItem.teacher || classItem.createBy || currentUser.value.username || '未知教师',
      startDate: classItem.startDate || '2024-02-20',
      endDate: classItem.endDate || '2024-06-30',
      createBy: classItem.createBy,
      createTime: classItem.createTime,
      updateBy: classItem.updateBy,
      updateTime: classItem.updateTime,
      remark: classItem.remark || ''
    }));
  });

  const classesLoading = computed(() => classesApi.isLoading.value);
  const classesError = computed(() => classesApi.error.value);
  const hasClasses = computed(() => classes.value.length > 0);

  // 获取班级列表
  const fetchClasses = async () => {
    return await classesApi.fetchList();
  };

  // 创建班级
  const createNewClass = async (classData) => {
    const data = {
      ...classData,
      createBy: currentUser.value.username || '',
      updateBy: currentUser.value.username || '',
      params: {}
    };

    const result = await createClassApi.execute(createClass, data);
    
    if (result && result.success) {
      // 刷新班级列表
      await fetchClasses();
      return result;
    }
    
    throw new Error(result?.msg || '创建班级失败');
  };

  // 更新班级
  const updateExistingClass = async (classId, updates) => {
    const data = {
      id: classId,
      ...updates,
      updateBy: currentUser.value.username || '',
      updateTime: new Date().toISOString()
    };

    const result = await updateClassApi.execute(updateClass, data);
    
    if (result && result.success) {
      // 更新本地数据
      classesApi.updateItem(classId, updates);
      return result;
    }
    
    throw new Error(result?.msg || '更新班级失败');
  };

  // 删除班级
  const deleteClassById = async (classId) => {
    const result = await deleteClassApi.execute(deleteClasses, [classId]);
    
    if (result && result.success) {
      // 从本地列表中移除
      classesApi.removeItem(classId);
      return result;
    }
    
    throw new Error(result?.msg || '删除班级失败');
  };

  // 获取可用班级列表（用于课程创建时选择）
  const getAvailableClasses = async () => {
    const result = await fetchClasses();
    return classes.value.map(classItem => ({
      id: classItem.id,
      name: classItem.name
    }));
  };

  return {
    // 状态
    classes,
    classesLoading,
    classesError,
    hasClasses,
    
    // API状态
    createClassLoading: createClassApi.isLoading,
    updateClassLoading: updateClassApi.isLoading,
    deleteClassLoading: deleteClassApi.isLoading,

    // 方法
    fetchClasses,
    createNewClass,
    updateExistingClass,
    deleteClassById,
    getAvailableClasses,
    
    // 原始API对象（用于高级操作）
    classesApi,
    createClassApi,
    updateClassApi,
    deleteClassApi
  };
}

/**
 * 教师统计数据 Composable
 */
export function useTeacherStats() {
  const { courses } = useTeacherCourses();
  const { classes } = useTeacherClasses();

  // 计算统计数据
  const stats = computed(() => {
    const totalCourses = courses.value.length;
    const totalClasses = classes.value.length;
    const totalStudents = classes.value.reduce((sum, cls) => sum + cls.studentCount, 0);
    const avgProgress = courses.value.length > 0 
      ? Math.round(courses.value.reduce((sum, course) => sum + course.progress, 0) / courses.value.length)
      : 0;

    return {
      totalCourses,
      totalClasses,
      totalStudents,
      avgProgress
    };
  });

  return {
    stats
  };
}

// 默认导出
export default useTeacherData;
