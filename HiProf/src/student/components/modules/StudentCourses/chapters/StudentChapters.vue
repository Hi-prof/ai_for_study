<template>
  <div class="student-chapters">
    <!-- 页面标题 -->
    <div class="section-header">
      <h2 class="section-title">课程章节</h2>
      <div class="section-info">
        <span class="chapter-count">共 {{ chapters.length }} 个章节</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载章节列表...</p>
    </div>

    <!-- 章节列表 -->
    <div v-else-if="chapters.length > 0" class="chapters-list">
      <div
        v-for="(chapter, index) in chapters"
        :key="chapter.id"
        class="chapter-item"
        :class="{ expanded: chapter.expanded }"
      >
        <!-- 章节头部 -->
        <div class="chapter-header" @click="toggleChapter(chapter)">
          <div class="chapter-info">
            <div class="chapter-number">第{{ index + 1 }}章</div>
            <div class="chapter-title">{{ chapter.title }}</div>
          </div>
          <div class="chapter-actions">
            <div class="chapter-progress">
              <span class="progress-text">{{ chapter.progress || 0 }}%</span>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="`width: ${chapter.progress || 0}%`"
                ></div>
              </div>
            </div>
            <i class="expand-icon" :class="{ rotated: chapter.expanded }"></i>
          </div>
        </div>

        <!-- 章节内容（展开时显示） -->
        <div v-if="chapter.expanded" class="chapter-content">
          <!-- 章节描述 -->
          <div v-if="chapter.description" class="chapter-description">
            {{ chapter.description }}
          </div>

          <!-- 章节文件列表 -->
          <div v-if="chapter.sectionsLoaded" class="chapter-files-section">
            <StudentChapterFileList
              :course-id="courseId"
              :node-name="chapter.title || chapter.name"
              :node-id="null"
              @file-change="handleChapterFileChange"
            />
          </div>

          <!-- 章节加载状态 -->
          <div v-if="chapter.loading" class="sections-loading">
            <div class="loading-spinner"></div>
            <p class="loading-text">正在加载章节内容...</p>
          </div>

          <!-- 小节列表 -->
          <div v-else-if="chapter.sectionsLoaded && chapter.sections && chapter.sections.length > 0" class="sections-list">
            <StudentSectionNode
              v-for="(section, sectionIndex) in chapter.sections"
              :key="section.id"
              :section="section"
              :level="0"
              :index="sectionIndex"
              :expanded-nodes="expandedSections"
              :course-id="courseId"
              @toggle="toggleSection"
            />
          </div>

          <!-- 无小节提示 -->
          <div v-else-if="chapter.sectionsLoaded && (!chapter.sections || chapter.sections.length === 0)" class="no-sections">
            <p>该章节暂无具体内容</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📚</div>
      <h3 class="empty-title">暂无章节内容</h3>
      <p class="empty-description">该课程还没有添加章节内容，请联系老师</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getChaptersByCourseId, getChapterDetail } from '@/api/chapters';
import { getChapterNodes } from '@/api/node';
import StudentSectionNode from './StudentSectionNode.vue';
import StudentChapterFileList from './StudentChapterFileList.vue';
import '@/student/styles/student-chapters.css';

// 定义 props
const props = defineProps({
  courseId: {
    type: [String, Number],
    required: true
  }
});

// 响应式数据
const loading = ref(false);
const chapters = ref([]);
const expandedSections = ref(new Set());

// 切换章节展开/收起
const toggleChapter = async (chapter) => {
  chapter.expanded = !chapter.expanded;
  console.log('切换章节展开状态:', chapter.title, chapter.expanded);

  // 如果展开章节且还未加载子节点，则加载子节点
  if (chapter.expanded && !chapter.sectionsLoaded) {
    await loadChapterSections(chapter);
  }
};

// 切换子节点展开状态
const toggleSection = (sectionId) => {
  if (expandedSections.value.has(sectionId)) {
    expandedSections.value.delete(sectionId);
  } else {
    expandedSections.value.add(sectionId);
  }
};

// 处理章节文件变化
const handleChapterFileChange = () => {
  console.log('章节文件列表已更新');
};

// 获取章节列表
const fetchChapters = async () => {
  loading.value = true;
  try {
    console.log('正在加载章节列表，课程ID:', props.courseId);
    
    const response = await getChaptersByCourseId(props.courseId);
    console.log('获取章节列表响应:', response);

    if (response && response.rows && Array.isArray(response.rows)) {
      // 处理章节数据，添加学生端需要的字段
      chapters.value = response.rows.map((chapter, index) => ({
        ...chapter,
        title: chapter.name || `第${index + 1}章`, // 将 name 字段映射为 title
        description: chapter.content || '暂无描述', // 将 content 字段映射为 description
        expanded: false, // 默认不展开
        progress: Math.floor(Math.random() * 100), // 模拟学习进度，实际应该从API获取
        sections: [], // 初始为空，展开时再加载
        sectionsLoaded: false, // 标记是否已加载子节点
        loading: false, // 加载状态
        _zstpData: chapter // 保留原始数据
      }));
      
      console.log('章节列表加载成功:', chapters.value);
    } else {
      console.warn('章节列表响应格式异常:', response);
      chapters.value = [];
    }
  } catch (error) {
    console.error('获取章节列表失败:', error);
    chapters.value = [];
  } finally {
    loading.value = false;
  }
};

// 加载章节的子节点
const loadChapterSections = async (chapter) => {
  try {
    chapter.loading = true;
    console.log(`正在加载章节${chapter.id}的子节点...`);

    // 获取图谱ID
    const graphId = chapter._zstpData?.id || chapter.id;

    // 调用API获取子节点
    const response = await getChapterNodes(null, graphId);
    console.log(`章节${chapter.id}子节点响应:`, response);

    if (response && response.rows) {
      // 过滤出属于该章节的子节点
      const chapterNodes = response.rows.filter(node => {
        return node.parentId === null ||
               node.parentId === chapter.id ||
               String(node.parentId) === String(chapter.id);
      });

      console.log(`过滤后的章节${chapter.id}子节点数量:`, chapterNodes.length);

      // 构建树形结构
      chapter.sections = buildNodeTree(chapterNodes, chapter.id);
      chapter.sectionsLoaded = true;

      console.log(`章节${chapter.id}子节点加载成功，数量:`, chapter.sections.length);
    } else {
      chapter.sections = [];
      chapter.sectionsLoaded = true;
    }
  } catch (error) {
    console.error(`加载章节${chapter.id}子节点失败:`, error);
    chapter.sections = [];
    chapter.sectionsLoaded = true;
  } finally {
    chapter.loading = false;
  }
};

// 构建节点树形结构
const buildNodeTree = (nodes, rootParentId) => {
  console.log(`开始构建节点树，根父节点ID: ${rootParentId}, 节点数量: ${nodes.length}`);

  // 转换节点数据格式
  const formattedNodes = nodes.map((node, index) => ({
    id: node.id,
    title: node.name || `子节点${index + 1}`,
    name: node.name,
    content: node.content || '',
    parentId: node.parentId,
    graphId: node.graphId,
    completed: Math.random() > 0.5, // 模拟完成状态
    progress: Math.floor(Math.random() * 100), // 模拟学习进度
    _nodeData: node
  }));

  // 递归构建子节点
  const getChildren = (parentId, depth = 0) => {
    if (depth > 10) {
      console.warn(`递归深度超过限制，停止构建，当前父节点ID: ${parentId}`);
      return [];
    }

    const children = formattedNodes.filter(node => {
      const nodeParentId = node.parentId;
      return nodeParentId === parentId || String(nodeParentId) === String(parentId);
    });

    return children.map(child => ({
      ...child,
      children: getChildren(child.id, depth + 1)
    }));
  };

  // 获取根节点（parentId为null或等于章节ID的节点）
  const rootNodes = formattedNodes.filter(node => {
    return node.parentId === null ||
           node.parentId === rootParentId ||
           String(node.parentId) === String(rootParentId);
  });

  // 为每个根节点构建子树
  return rootNodes.map(rootNode => ({
    ...rootNode,
    children: getChildren(rootNode.id)
  }));
};

// 组件挂载时加载数据
onMounted(() => {
  if (props.courseId) {
    fetchChapters();
  } else {
    console.warn('课程ID为空，无法加载章节列表');
  }
});

// 暴露方法给父组件
defineExpose({
  fetchChapters
});
</script>

<style scoped>
/* 加载状态样式 */
.sections-loading {
  margin-top: 1rem;
  padding: 2rem;
  text-align: center;
  background-color: #f8fafc;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.sections-list {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}
</style>




