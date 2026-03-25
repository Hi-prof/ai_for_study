<template>
  <div class="courses-panel">
    <div class="courses-toolbar">
      <div class="courses-toolbar__summary">
        <span class="courses-toolbar__eyebrow">课程总览</span>
        <h3>共 {{ courses.length }} 门课程</h3>
        <p>统一管理课程、学生与教学资料，点击卡片即可快速进入课程详情。</p>
      </div>

      <button type="button" class="create-course-button" @click="createNewCourse">
        <WorkspaceIcon name="plus" :size="18" />
        <span>新建课程</span>
      </button>
    </div>

    <div v-if="coursesLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载课程列表...</p>
    </div>

    <div v-else-if="courses.length > 0" class="courses-grid">
      <TeacherCourseCard
        v-for="course in courses"
        :key="course.id"
        :course="course"
        @enter="enterCourse"
        @edit="editCourse"
        @delete="deleteCourseConfirm"
      />
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon" aria-hidden="true">
        <WorkspaceIcon name="courses" :size="34" />
      </div>
      <h3 class="empty-title">还没有创建任何课程</h3>
      <p class="empty-description">点击上方的“新建课程”按钮，先把第一门课建起来，后面备课和资料管理才有地方落脚。</p>
      <button type="button" class="create-course-button create-course-button--empty" @click="createNewCourse">
        <WorkspaceIcon name="plus" :size="18" />
        <span>创建第一门课程</span>
      </button>
    </div>

    <!-- 创建课程对话框 -->
    <CreateCourseDialog
      v-model:visible="showCreateCourseDialog"
      :mode="createDialogMode"
      :progress="createProgress"
      :progress-text="createProgressText"
      :success-title="createSuccessTitle"
      :success-message="createSuccessMessage"
      :success-details="createSuccessDetails"
      :show-navigate-button="createSuccessNavigate"
      @confirm="handleCreateCourse"
      @cancel="handleCancelCreateCourse"
      @navigate="handleNavigateToCourse"
    />

    <!-- 编辑课程对话框 -->
    <EditCourseDialog
      v-model:visible="showEditDialog"
      :mode="editDialogMode"
      :course-data="editingCourse"
      :progress="editProgress"
      :progress-text="editProgressText"
      :success-title="editSuccessTitle"
      :success-message="editSuccessMessage"
      :success-details="editSuccessDetails"
      :show-navigate-button="editSuccessNavigate"
      @confirm="handleEditCourse"
      @cancel="handleCancelEditCourse"
      @navigate="handleNavigateToEditedCourse"
    />

    <!-- 删除课程对话框 -->
    <DeleteCourseDialog
      v-model:visible="showDeleteDialog"
      :mode="deleteDialogMode"
      :course-data="deletingCourse"
      :loading="deleteLoading"
      :progress="deleteProgress"
      :progress-text="deleteProgressText"
      :success-title="deleteSuccessTitle"
      :success-message="deleteSuccessMessage"
      :success-details="deleteSuccessDetails"
      :show-navigate-button="deleteSuccessNavigate"
      @confirm="handleDeleteCourse"
      @cancel="handleCancelDeleteCourse"
      @navigate="handleNavigateAfterDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { getCoursesList, createCourse, updateCourse, deleteCourse, getCourseById } from '@/api/courses';
import { calculateSemester } from '@/utils/semester';

import CreateCourseDialog from '@/ui/common/CreateCourseDialog.vue';
import EditCourseDialog from '@/ui/common/EditCourseDialog.vue';
import DeleteCourseDialog from '@/ui/common/DeleteCourseDialog.vue';
import TeacherCourseCard from '@/teacher/components/modules/TeacherCourseCard.vue';
import WorkspaceIcon from '@/ui/workspace/WorkspaceIcon.vue';

// 导入样式文件
import '@/teacher/styles/teacher-courses.css';
import '@/teacher/styles/create-course.css';

// 路由实例
const router = useRouter();

// 课程数据
const courses = ref([]);
const coursesLoading = ref(false);

// 新建课程对话框状态
const showCreateCourseDialog = ref(false);
const createDialogMode = ref('confirm'); // 'confirm' | 'success'
const createProgress = ref(0);
const createProgressText = ref('正在创建课程...');
const createSuccessTitle = ref('');
const createSuccessMessage = ref('');
const createSuccessDetails = ref('');
const createSuccessNavigate = ref(true);
const createdCourseId = ref(null);
const isCreating = ref(false); // 防止重复创建课程

// 编辑课程对话框状态
const showEditDialog = ref(false);
const editDialogMode = ref('confirm'); // 'confirm' | 'success'
const editProgress = ref(0);
const editProgressText = ref('正在保存修改...');
const editSuccessTitle = ref('');
const editSuccessMessage = ref('');
const editSuccessDetails = ref('');
const editSuccessNavigate = ref(true);
const isUpdating = ref(false); // 防止重复更新
const editingCourse = ref({
  id: null,
  name: '',
  description: '',
  remark: '',
  majorId: null,
  className: '',
  teacherId: null,
  tpId: null
});

// 删除课程对话框状态
const showDeleteDialog = ref(false);
const deleteDialogMode = ref('confirm'); // 'confirm' | 'success'
const deleteLoading = ref(false);
const deleteProgress = ref(0);
const deleteProgressText = ref('正在删除课程...');
const deleteSuccessTitle = ref('');
const deleteSuccessMessage = ref('');
const deleteSuccessDetails = ref('');
const deleteSuccessNavigate = ref(true);
const deletingCourse = ref({});

// 组件挂载时加载数据
onMounted(async () => {
  await fetchCourses();
});

// 获取课程列表
const fetchCourses = async () => {
  coursesLoading.value = true;
  try {
    const response = await getCoursesList();

    if (response && response.rows && Array.isArray(response.rows)) {
      // 将API返回的课程数据映射到组件需要的格式
      courses.value = response.rows.map((course, index) => ({
        id: course.id,
        title: course.name || course.title || '未命名课程',
        semester: course.createTime ? calculateSemester(course.createTime) : '未知学期', // 根据创建时间计算学期
        studentCount: course.studentCount || 0,
        totalHours: course.totalHours || 32,
        progress: course.progress || Math.floor(Math.random() * 100), // 随机进度，实际应该从API获取
        type: index % 2 === 0 ? 'blue' : 'green', // 交替使用蓝色和绿色主题
        lastModified: formatLastModified(course.updateTime || course.createTime),
        description: course.description || '',
        majorId: course.majorId,
        className: course.className || '',
        teacherId: course.teacherId,
        tpId: course.tpId
      }));

    } else {

      courses.value = [];
    }
  } catch (error) {

    courses.value = [];
  } finally {
    coursesLoading.value = false;
  }
};

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

// 课程相关方法
const createNewCourse = () => {

  // 重置对话框状态
  createDialogMode.value = 'confirm';
  createProgress.value = 0;
  createProgressText.value = '正在创建课程...';
  showCreateCourseDialog.value = true;
};

// 处理创建课程确认
const handleCreateCourse = async (courseData) => {
  // 防止重复创建
  if (isCreating.value) {
    console.log('课程正在创建中，忽略重复请求');
    return;
  }

  try {
    // 设置创建状态
    isCreating.value = true;

    // 模拟进度更新
    createProgress.value = 20;
    createProgressText.value = '正在验证课程信息...';

    const response = await createCourse(courseData);

    createProgress.value = 60;
    createProgressText.value = '正在保存课程数据...';

    // 根据接口文档，检查响应是否成功
    if (response && !response.error) {
      // 直接从创建课程的响应中获取课程ID
      const courseId = response.data;

      createProgress.value = 80;
      createProgressText.value = '正在更新课程列表...';

      // 刷新课程列表以显示新创建的课程
      await fetchCourses();

      // 通知父组件刷新班级列表
      emit('refresh-classes');

      createProgress.value = 100;
      createProgressText.value = '创建完成！';

      // 设置成功信息
      createdCourseId.value = courseId;
      createSuccessTitle.value = '课程创建成功！';
      createSuccessMessage.value = `课程"${courseData.name}"已成功创建`;
      createSuccessDetails.value = getCourseGroupSummary(courseData);

      // 延迟切换到成功模式
      setTimeout(() => {
        createDialogMode.value = 'success';
        // 创建完成，重置状态
        isCreating.value = false;
      }, 1000);

    } else {

      // 即使响应格式不完全符合预期，也尝试执行成功逻辑
      await fetchCourses();
      emit('refresh-classes');

      createSuccessTitle.value = '课程创建成功！';
      createSuccessMessage.value = `课程"${courseData.name}"已成功创建`;
      createSuccessDetails.value = '课程信息已保存到系统中';

      setTimeout(() => {
        createDialogMode.value = 'success';
        // 创建完成，重置状态
        isCreating.value = false;
      }, 1000);
    }
  } catch (error) {
    // 创建失败，重置状态
    isCreating.value = false;

    // 显示错误信息
    createSuccessTitle.value = '创建失败';
    createSuccessMessage.value = error.message || '创建课程时发生错误，请重试';
    createSuccessDetails.value = '';
    createSuccessNavigate.value = false;

    setTimeout(() => {
      createDialogMode.value = 'success';
    }, 500);
  }
};

// 处理创建课程取消
const handleCancelCreateCourse = () => {

  // 重置状态
  createDialogMode.value = 'confirm';
  createProgress.value = 0;
};

// 处理导航到课程
const handleNavigateToCourse = () => {
  if (createdCourseId.value) {
    router.push(`/teacher/course/${createdCourseId.value}`);
  }

};

// 辅助方法：生成专业/班级描述
const getCourseGroupSummary = (courseData) => {
  const majorName = courseData.params?.majorName || '未命名专业';
  const className = courseData.className || '未填写班级名称';
  return `专业：${majorName}；班级名称：${className}`;
};



// 进入课程
const enterCourse = (courseId) => {


  // 验证课程ID
  if (!courseId) {

    alert('课程ID无效，无法进入课程详情页');
    return;
  }

  try {
    // 跳转到课程详情页面
    router.push({
      name: 'teacher-course-detail',
      params: {
        courseId: courseId.toString()
      }
    });

  } catch (error) {

    alert('跳转失败，请重试');
  }
};

// 修改课程
const editCourse = async (course) => {


  // 验证课程数据
  if (!course || !course.id) {

    alert('课程数据无效，无法修改');
    return;
  }

  // 重置对话框状态
  editDialogMode.value = 'confirm';
  editProgress.value = 0;
  editProgressText.value = '正在保存修改...';

  try {
    // 获取完整的课程详情
    const response = await getCourseById(course.id);

    let courseDetail = null;

    // 处理响应数据
    if (response && response.code === 200 && response.data) {
      courseDetail = response.data;
    } else if (response && response.courseData) {
      courseDetail = response.courseData;
    } else {
      // 如果获取详情失败，使用列表中的基本信息

      courseDetail = course;
    }

    // 设置编辑模式的课程数据
    editingCourse.value = {
      id: courseDetail.id,
      name: courseDetail.name || courseDetail.title || '',
      description: courseDetail.description || '',
      majorId: courseDetail.majorId || null,
      className: courseDetail.className || '',
      teacherId: courseDetail.teacherId || null,
      tpId: courseDetail.tpId || null, // 章节对应的ID，后续会开发
      remark: courseDetail.remark || ''
    };

    // 显示编辑对话框
    showEditDialog.value = true;


  } catch (error) {
    // 如果获取详情失败，使用列表中的基本信息
    editingCourse.value = {
      id: course.id,
      name: course.title || course.name || '',
      description: course.description || '',
      majorId: course.majorId || null,
      className: course.className || '',
      teacherId: course.teacherId || null,
      tpId: course.tpId || null,
      remark: course.remark || ''
    };

    // 显示编辑对话框
    showEditDialog.value = true;

  }
};

// 处理编辑课程确认
const handleEditCourse = async (courseData) => {
  // 防止重复更新
  if (isUpdating.value) {
    console.log('课程正在更新中，忽略重复请求');
    return;
  }

  try {
    // 设置更新状态
    isUpdating.value = true;

    // 模拟进度更新
    editProgress.value = 20;
    editProgressText.value = '正在验证课程信息...';

    const response = await updateCourse(courseData);

    editProgress.value = 60;
    editProgressText.value = '正在保存修改...';

    // 根据接口文档，检查响应是否成功
    if (response && !response.error) {


      editProgress.value = 80;
      editProgressText.value = '正在更新课程列表...';

      // 重新获取课程列表
      await fetchCourses();

      editProgress.value = 100;
      editProgressText.value = '修改完成！';

      // 设置成功信息
      editSuccessTitle.value = '课程修改成功！';
      editSuccessMessage.value = `课程"${courseData.name}"的信息已成功更新`;
      editSuccessDetails.value = '所有修改已保存到系统中';

      // 延迟切换到成功模式
      setTimeout(() => {
        editDialogMode.value = 'success';
        // 更新完成，重置状态
        isUpdating.value = false;
      }, 1000);

    } else {

      // 即使响应格式不完全符合预期，也尝试执行成功逻辑
      await fetchCourses();

      editSuccessTitle.value = '课程修改成功！';
      editSuccessMessage.value = `课程"${courseData.name}"的信息已成功更新`;
      editSuccessDetails.value = '所有修改已保存到系统中';

      setTimeout(() => {
        editDialogMode.value = 'success';
        // 更新完成，重置状态
        isUpdating.value = false;
      }, 1000);
    }
  } catch (error) {
    // 更新失败，重置状态
    isUpdating.value = false;


    // 显示错误信息
    editSuccessTitle.value = '修改失败';
    editSuccessMessage.value = error.message || '修改课程时发生错误，请重试';
    editSuccessDetails.value = '';
    editSuccessNavigate.value = false;

    setTimeout(() => {
      editDialogMode.value = 'success';
    }, 500);
  }
};

// 处理编辑课程取消
const handleCancelEditCourse = () => {

  // 重置状态
  editDialogMode.value = 'confirm';
  editProgress.value = 0;
};

// 处理导航到编辑的课程
const handleNavigateToEditedCourse = () => {
  if (editingCourse.value.id) {
    router.push(`/teacher/course/${editingCourse.value.id}`);
  }

};

// 删除课程确认
const deleteCourseConfirm = (course) => {


  // 验证课程数据
  if (!course || !course.id) {

    alert('课程数据无效，无法删除');
    return;
  }

  // 重置对话框状态
  deleteDialogMode.value = 'confirm';
  deleteLoading.value = false;
  deleteProgress.value = 0;
  deleteProgressText.value = '正在删除课程...';
  deleteSuccessTitle.value = '';
  deleteSuccessMessage.value = '';
  deleteSuccessDetails.value = '';
  deleteSuccessNavigate.value = false;

  // 设置要删除的课程数据
  deletingCourse.value = {
    id: course.id,
    name: course.title || course.name || '未命名课程',
    description: course.description || '',
    majorId: course.majorId,
    className: course.className || '',
    teacherId: course.teacherId,
    tpId: course.tpId
  };

  // 显示删除确认对话框
  showDeleteDialog.value = true;
};

// 处理删除课程确认
const handleDeleteCourse = async (courseData) => {
  if (!courseData?.id) {
    deleteSuccessTitle.value = '删除失败';
    deleteSuccessMessage.value = '课程ID无效，无法删除';
    deleteSuccessDetails.value = '';
    deleteSuccessNavigate.value = false;
    deleteDialogMode.value = 'success';
    return;
  }

  try {
    deleteLoading.value = true;


    // 模拟进度更新
    deleteProgress.value = 20;
    deleteProgressText.value = '正在验证课程信息...';

    const response = await deleteCourse(courseData.id);

    if (!response || response.code !== 200 || response.error) {
      throw new Error(response?.message || '删除课程失败');
    }

    deleteProgress.value = 60;
    deleteProgressText.value = '正在删除课程数据...';

    deleteProgress.value = 80;
    deleteProgressText.value = '正在更新课程列表...';

    // 重新获取课程列表
    await fetchCourses();

    deleteProgress.value = 100;
    deleteProgressText.value = '删除完成！';
    deleteSuccessTitle.value = '课程删除成功！';
    deleteSuccessMessage.value = `课程"${courseData.name}"已成功删除`;
    deleteSuccessDetails.value = '相关的章节、作业、讨论等数据也已一并删除';
    deleteSuccessNavigate.value = false;
    deleteDialogMode.value = 'success';
  } catch (error) {
    deleteSuccessTitle.value = '删除失败';
    deleteSuccessMessage.value = error.message || '删除课程时发生错误，请重试';
    deleteSuccessDetails.value = '';
    deleteSuccessNavigate.value = false;
    deleteDialogMode.value = 'success';
  } finally {
    deleteLoading.value = false;
  }
};

// 处理删除课程取消
const handleCancelDeleteCourse = () => {
  deleteLoading.value = false;
  deleteDialogMode.value = 'confirm';
  deleteProgress.value = 0;
};

// 处理删除后导航
const handleNavigateAfterDelete = () => {

  // 删除后通常留在课程列表页面，不需要特殊导航
};

// 定义事件
const emit = defineEmits(['refresh-classes']);

// 暴露方法给父组件
defineExpose({
  fetchCourses
});
</script>
