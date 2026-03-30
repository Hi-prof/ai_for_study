<template>
  <div class="outline-page">
    <div class="container">
      <div class="header-actions">
        <button @click="goBackToCourse" class="back-to-dashboard-btn">
          <span class="back-icon">←</span> 返回课程
        </button>
        <button @click="toggleView" class="enter-graph-btn">
          <span class="graph-icon">{{ viewMode === 'outline' ? '🔍' : '📋' }}</span>
          {{ viewMode === 'outline' ? '进入知识图谱' : '返回大纲' }}
        </button>
      </div>
      <OutlineToolbar v-if="false && !embedded && !isEditMode" />
      <div class="outline-content">
        <!-- 图谱视图 -->
        <div v-if="viewMode === 'graph'" class="graph-view-container">
          <iframe
            v-if="graphId"
            :key="iframeKey"
            :src="getGraphUrl()"
            class="graph-iframe"
            frameborder="0"
            @load="onIframeLoad"
            @error="onIframeError"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          ></iframe>
        </div>

        <!-- 大纲视图 -->
        <NodeTreeView
          v-else-if="viewMode === 'outline'"
          :is-loading="isLoading"
          :error="error"
          :hierarchical-nodes="hierarchicalNodes"
          :current-graph="currentGraph"
          :course-id="courseId"
          :is-edit-mode="isEditMode"
          :search-query="searchQuery"
          @toggle-node="toggleNode"
          @edit-node="editNode"
          @add-child-node="addChildNode"
          @delete-node="deleteNodeEvent"
          @add-root-node="addRootNode"
          @search="searchNodes"
          @clear-search="clearSearch"
          @retry="fetchGraphNodes"
        />
        <OutlineList v-else @select-outline="handleOutlineSelect" />
      </div>
    </div>

    <!-- 节点编辑对话框 -->
    <NodeEditDialog
      :show-edit-dialog="showEditDialog && isEditMode"
      :show-delete-dialog="showDeleteDialog && isEditMode"
      :editing-node="editingNode"
      :deleting-node="deletingNode"
      :child-node-info="childNodeInfo"
      :is-loading="isLoading"
      :course-id="courseId"
      @save="saveNode"
      @cancel="cancelEdit"
      @confirm-delete="confirmDelete"
      @cancel-delete="cancelDelete"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCurrentUser } from '@/api/auth';
import OutlineToolbar from '@/shared/features/graph/components/outline/OutlineToolbar.vue';
import OutlineList from '@/shared/features/graph/components/outline/OutlineList.vue';
import NodeTreeView from '@/shared/features/graph/components/outline/NodeTreeView.vue';
import NodeEditDialog from '@/shared/features/graph/components/outline/NodeEditDialog.vue';
import { getKnowledgeGraphNodes, createNode, createChapterNode, updateNode, deleteNode } from '@/api/node';
import { getKnowledgeGraphList, getCourseKnowledgeGraphList } from '@/api/graph';

const route = useRoute();
const router = useRouter();

// 新增的响应式数据
const viewMode = ref('outline'); // 'outline' 或 'graph'
const iframeKey = ref(0);

// 获取当前用户信息
const currentUser = getCurrentUser() || {};

// 返回课程页面
const goBackToCourse = () => {
  const courseIdParam = route.query.courseId;

  if (!courseIdParam) {
    // 没有课程ID，返回到对应角色的主页
    if (currentUser.role === 'teacher') {
      router.push('/teacher/my-lessons');
    } else {
      router.push('/student/my');
    }
    return;
  }

  // 有课程ID，根据角色跳转到对应的课程详情页
  if (currentUser.role === 'teacher') {
    router.push(`/teacher/course/${courseIdParam}`);
  } else {
    router.push(`/student/course/${courseIdParam}`);
  }
};

// 切换视图模式
const toggleView = () => {
  viewMode.value = viewMode.value === 'outline' ? 'graph' : 'outline';
  if (viewMode.value === 'graph') {
    iframeKey.value++; // 强制重新加载iframe
  }
};

// 获取图谱URL
const getGraphUrl = () => {
  if (!graphId.value) return '';

  const hostname = window.location.hostname;
  const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '0.0.0.0';

  const baseUrl = isProduction ? '/#/graph' : '/graph';
  const courseIdParam = route.query.courseId || courseId.value || '';
  const params = `embedded=true&courseId=${courseIdParam}&graphId=${graphId.value}&readonly=true&t=${Date.now()}`;

  return `${baseUrl}?${params}`;
};

// iframe事件处理
const onIframeLoad = () => {
  console.log('知识图谱iframe加载完成');
};

const onIframeError = (error) => {
  console.error('知识图谱iframe加载失败:', error);
};

// Check if we're in edit mode
// 编辑模式：基于用户角色和路由配置判断
const isEditMode = computed(() => {
  // 如果是学生用户，始终为只读模式
  if (currentUser.role === 'student') {
    return false;
  }

  // 教师用户基于路由配置判断编辑模式
  return route.meta.isEditMode ||
         route.name?.includes('edit') ||
         route.query.edit === 'true';
});

// 提取URL参数 - 使用computed确保路由变化时自动更新
const embedded = computed(() => route.query.embedded === 'true');
// 图谱ID从路径参数获取，课程ID从查询参数获取
const graphId = computed(() => route.params.id || null);
const courseId = computed(() => route.query.courseId || route.params.id || null);



// 数据状态
const isLoading = ref(false);
const error = ref(null);
//节点列表
const graphNodes = ref([]);
//展开的节点
const expandedNodes = ref([]);
//当前知识图谱
const currentGraph = ref(null);
const hierarchicalData = ref([]); // 保存构建好的层级数据结构
// 保存原始课程ID，防止路由参数丢失
const originalCourseId = ref(null);
// 搜索相关
const searchQuery = ref('');
const filteredNodes = ref([]);

// 节点操作状态
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const editingNode = ref({});
const deletingNode = ref({});
const childNodeInfo = ref(null);
const isNewNode = ref(false);
const parentNodeId = ref(null);

const normalizeTextValue = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return '';
};

const normalizeOutlineNode = (node = {}) => {
  const normalizedName = normalizeTextValue(node?.name) ||
    normalizeTextValue(node?.nodeName) ||
    normalizeTextValue(node?.title);

  return {
    ...node,
    id: node?.id ?? node?.nodeId ?? null,
    parentId: node?.parentId ?? node?.parent_id ?? node?.parentNodeId ?? null,
    graphId: node?.graphId ?? node?.graph_id ?? null,
    name: normalizedName,
    nodeName: normalizeTextValue(node?.nodeName) || normalizedName,
    title: normalizeTextValue(node?.title) || normalizedName,
    content: normalizeTextValue(node?.content)
  };
};

const normalizeOutlineNodes = (nodes) => {
  if (!Array.isArray(nodes)) {
    return [];
  }

  return nodes.map(node => normalizeOutlineNode(node));
};

// 构建节点的层级结构
const buildHierarchy = () => {
  if (!graphNodes.value || graphNodes.value.length === 0) {
    hierarchicalData.value = [];
    return;
  }
  
  // 获取要显示的节点 - 如果有搜索查询，只显示过滤后的节点及其父节点
  let nodesToDisplay = graphNodes.value;
  
  if (searchQuery.value && filteredNodes.value.length > 0) {
    // 创建一个存储需要显示的节点ID的集合
    const nodeIdsToShow = new Set();
    
    // 添加所有匹配的节点ID
    filteredNodes.value.forEach(node => {
      nodeIdsToShow.add(node.id);
      
      // 添加所有父节点ID以保持树形结构
      let parentId = node.parentId;
      while (parentId) {
        nodeIdsToShow.add(parentId);
        const parentNode = graphNodes.value.find(n => n.id === parentId);
        parentId = parentNode ? parentNode.parentId : null;
      }
    });
    
    // 只显示匹配节点及其父节点
    nodesToDisplay = graphNodes.value.filter(node => nodeIdsToShow.has(node.id));
  }
  
  // 首先找出根节点（没有parent_id的节点）
  const rootNodes = nodesToDisplay.filter(node => {
    const parentId = node.parentId;
    // 根节点的条件：parentId为null、undefined、空字符串或0
    return parentId === null ||
           parentId === undefined ||
           parentId === '' ||
           parentId === 0 ||
           parentId === '0';
  });

  // 构建层级结构
  hierarchicalData.value = rootNodes.map(node => {
    const children = getNodeChildren(node.id, nodesToDisplay);

    return {
      ...node,
      expanded: expandedNodes.value.includes(String(node.id)),
      children: children,
      isSearchResult: filteredNodes.value.some(n => String(n.id) === String(node.id))
    };
  });
};

// 获取节点的所有子节点（递归构建层级）
const getNodeChildren = (nodeId, nodesToDisplay) => {
  // 确保nodeId和parentId的类型一致（都转换为字符串进行比较）
  const children = nodesToDisplay.filter(node => {
    const parentId = node.parentId;
    // 处理不同的数据类型：null、undefined、数字、字符串
    if (parentId === null || parentId === undefined) {
      return false;
    }
    // 将两个值都转换为字符串进行比较
    return String(parentId) === String(nodeId);
  });

  // 递归获取每个子节点的子节点
  return children.map(child => {
    const grandChildren = getNodeChildren(child.id, nodesToDisplay);

    return {
      ...child,
      expanded: expandedNodes.value.includes(String(child.id)),
      children: grandChildren,
      isSearchResult: filteredNodes.value.some(n => String(n.id) === String(child.id))
    };
  });
};

// 根据层级结构获取顶级节点（根节点）
const hierarchicalNodes = computed(() => {
  return hierarchicalData.value;
});

// 切换节点展开/折叠状态
const toggleNode = (nodeId) => {
  const stringNodeId = String(nodeId);
  const index = expandedNodes.value.indexOf(stringNodeId);
  if (index > -1) {
    expandedNodes.value.splice(index, 1);
  } else {
    expandedNodes.value.push(stringNodeId);
  }

  // 重新构建层级结构以更新expanded状态
  buildHierarchy();
};

// 刷新节点数据（不修改URL）
const refreshNodeData = async () => {
  const targetCourseId = courseId.value || originalCourseId.value;

  if (!targetCourseId) {
    console.warn('没有课程ID，无法刷新节点数据');
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    console.log('刷新节点数据，课程ID:', targetCourseId);

    // 首先获取课程对应的知识图谱列表
    const graphListResponse = await getCourseKnowledgeGraphList(targetCourseId);
    if (!graphListResponse || !graphListResponse.rows || graphListResponse.rows.length === 0) {
      console.warn('该课程没有知识图谱');
      graphNodes.value = [];
      buildHierarchy();
      return;
    }

    // 使用第一个知识图谱
    const firstGraph = graphListResponse.rows[0];

    // 更新当前图谱信息
    currentGraph.value = firstGraph;

    // 使用知识图谱ID获取节点数据
    const response = await getKnowledgeGraphNodes(firstGraph.id);

    // 处理响应数据格式
    let nodes = [];
    if (response && response.rows) {
      nodes = response.rows;
    } else if (Array.isArray(response)) {
      nodes = response;
    }

    graphNodes.value = normalizeOutlineNodes(nodes);

    // 默认展开所有一级节点
    const rootNodes = graphNodes.value.filter(node => !node.parentId);
    expandedNodes.value = rootNodes.map(node => String(node.id));

    // 构建层级结构
    buildHierarchy();

  } catch (err) {
    console.error('刷新节点数据失败:', err);
    error.value = '刷新节点数据失败，请重试';
  } finally {
    isLoading.value = false;
  }
};

// 获取知识图谱节点数据
const fetchGraphNodes = async (forceCourseId = null) => {
  // 使用传入的课程ID或从路由获取，支持强制指定课程ID
  const targetCourseId = forceCourseId || courseId.value || originalCourseId.value;

  if (!targetCourseId) {
    console.warn('没有课程ID，无法获取节点数据');
    console.log('当前路由信息:', {
      path: route.path,
      params: route.params,
      query: route.query
    });
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    console.log('开始获取课程的知识图谱节点，课程ID:', targetCourseId);

    // 首先获取课程对应的知识图谱列表
    const graphListResponse = await getCourseKnowledgeGraphList(targetCourseId);
    if (!graphListResponse || !graphListResponse.rows || graphListResponse.rows.length === 0) {
      console.warn('该课程没有知识图谱');
      graphNodes.value = [];
      buildHierarchy();
      return;
    }

    // 使用第一个知识图谱
    const firstGraph = graphListResponse.rows[0];

    // 更新当前图谱信息
    currentGraph.value = firstGraph;

    // 如果查询参数中没有课程ID，但我们有有效的课程ID，则更新URL
    if (!route.query.courseId && targetCourseId && !isLoading.value) {
      router.replace({
        path: route.path,
        query: { ...route.query, courseId: targetCourseId }
      });
    }

    // 使用知识图谱ID获取节点数据
    const response = await getKnowledgeGraphNodes(firstGraph.id);

    // 处理响应数据格式
    let nodes = [];
    if (response && response.rows) {
      nodes = response.rows;
    } else if (Array.isArray(response)) {
      nodes = response;
    }

    graphNodes.value = normalizeOutlineNodes(nodes);

    // 默认展开所有一级节点
    const rootNodes = graphNodes.value.filter(node => !node.parentId);
    expandedNodes.value = rootNodes.map(node => String(node.id));

    // 构建层级结构
    buildHierarchy();

  } catch (err) {
    console.error('获取知识图谱数据失败:', err);
    error.value = '获取知识图谱数据失败，请重试';
  } finally {
    isLoading.value = false;
  }
};

// 处理选择大纲的事件
const handleOutlineSelect = (course) => {
  if (course && course.id) {
    currentGraph.value = course;
    // 更新URL，保留其他参数 - courseId会通过computed自动更新
    router.push({
      path: route.path,
      query: { ...route.query, courseId: course.id }
    });

    // 数据会通过watch自动重新加载，无需手动调用
  }
};

// 编辑节点
const editNode = (node) => {
  editingNode.value = normalizeOutlineNode(node);
  isNewNode.value = false;
  showEditDialog.value = true;
};

// 添加子节点
const addChildNode = (node) => {
  console.log('添加子节点，父节点:', node);
  console.log('当前图谱信息:', currentGraph.value);
  console.log('课程ID:', courseId.value);

  const graphId = currentGraph.value?.id || courseId.value;
  console.log('将使用的图谱ID:', graphId, '类型:', typeof graphId);

  editingNode.value = {
    name: '',
    content: '',
    parentId: String(node.id), // 确保parentId是字符串类型
    graphId: graphId
  };
  isNewNode.value = true;
  parentNodeId.value = String(node.id); // 确保parentNodeId是字符串类型
  showEditDialog.value = true;
};

// 添加根节点
const addRootNode = () => {
  editingNode.value = {
    name: '',
    content: '',
    parentId: null,
    graphId: currentGraph.value?.id || courseId.value || graphId.value
  };
  isNewNode.value = true;
  parentNodeId.value = null;
  showEditDialog.value = true;
};

// 保存节点（新建或编辑）
const saveNode = async (nodeData) => {
  try {
    if (!nodeData.name) {
      alert('节点名称不能为空');
      return;
    }

    // 验证课程ID是否存在
    if (!courseId.value) {
      alert('课程ID缺失，无法创建节点');
      return;
    }

    isLoading.value = true;

    if (isNewNode.value) {
      // 创建新节点 - 使用当前图谱的真实ID
      const graphId = currentGraph.value?.id || nodeData.graphId;
      const createData = {
        name: nodeData.name,
        content: nodeData.content || '',
        parentId: nodeData.parentId,
        graphId: graphId,
        // 添加可能需要的额外字段
        courseId: courseId.value,
        remark: nodeData.parentId ? '子节点' : '根节点'
      };

      console.log('创建节点:', createData);

      // 尝试使用更合适的API函数
      let createResult;
      try {
        if (createData.parentId) {
          // 如果有父节点，使用createChapterNode
          createResult = await createChapterNode(createData);
        } else {
          // 如果是根节点，使用createNode
          createResult = await createNode(createData);
        }

        // 检查创建结果
        if (!createResult) {
          throw new Error('节点创建失败：API返回空结果');
        }

        // 检查是否有错误码
        if (createResult.code && createResult.code !== 200) {
          throw new Error(`节点创建失败：${createResult.message || createResult.msg || '未知错误'}`);
        }
      } catch (apiError) {
        console.error('节点创建API调用失败:', apiError);
        console.error('API错误详情:', {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          message: apiError.message
        });
        throw new Error(`节点创建失败：${apiError.response?.data?.msg || apiError.message || '网络错误'}`);
      }

    } else {
      // 更新节点
      const updateData = {
        name: nodeData.name,
        content: nodeData.content,
        id: nodeData.id,
        graphId: currentGraph.value?.id || nodeData.graphId
      };

      const updateResult = await updateNode(updateData);

      // 检查更新结果
      if (updateResult && updateResult.code && updateResult.code !== 200) {
        throw new Error(`节点更新失败：${updateResult.message || updateResult.msg || '未知错误'}`);
      }
    }

    // 节点创建/更新成功，关闭对话框
    showEditDialog.value = false;

    // 重新获取节点数据以显示最新内容，保持URL参数不变
    await refreshNodeData();

  } catch (err) {
    console.error('保存节点失败:', err);
    const errorMessage = err.response?.data?.msg || err.message || '请重试';
    alert(`保存失败：${errorMessage}`);
  } finally {
    isLoading.value = false;
  }
};

// 取消编辑
const cancelEdit = () => {
  showEditDialog.value = false;
  editingNode.value = {};
};

// 删除节点确认
const deleteNodeEvent = (node) => {
  deletingNode.value = node;

  // 计算子节点信息
  const childCount = getChildNodeCount(node.id);
  const descendantCount = getDescendantCount(node.id);

  // 设置子节点信息
  childNodeInfo.value = descendantCount > 0 ? {
    directChildren: childCount,
    totalDescendants: descendantCount
  } : null;

  showDeleteDialog.value = true;
};

// 取消删除
const cancelDelete = () => {
  showDeleteDialog.value = false;
  deletingNode.value = {};
  childNodeInfo.value = null;
};

// 获取节点的子节点数量
const getChildNodeCount = (nodeId) => {
  if (!graphNodes.value || !nodeId) return 0;
  return graphNodes.value.filter(node =>
    String(node.parentId) === String(nodeId)
  ).length;
};

// 获取节点的所有后代节点数量（递归计算）
const getDescendantCount = (nodeId) => {
  if (!graphNodes.value || !nodeId) return 0;

  let count = 0;
  const children = graphNodes.value.filter(node =>
    String(node.parentId) === String(nodeId)
  );

  count += children.length;

  // 递归计算子节点的后代
  children.forEach(child => {
    count += getDescendantCount(child.id);
  });

  return count;
};

// 确认删除 - 参考章节删除的实现
const confirmDelete = async () => {
  try {
    const nodeToDelete = deletingNode.value;
    if (!nodeToDelete) {
      alert('找不到要删除的节点');
      return;
    }

    isLoading.value = true;

    // 删除节点 - 确保ID是字符串类型
    const nodeId = String(nodeToDelete.id);
    console.log(`开始删除节点: ${nodeToDelete.name} (ID: ${nodeId})`);

    // 获取子节点信息用于日志
    const descendantCount = getDescendantCount(nodeToDelete.id);
    if (descendantCount > 0) {
      console.log(`将同时删除 ${descendantCount} 个子节点`);
    }

    await deleteNode(nodeId);
    console.log('删除节点成功:', nodeId);

    // 重新获取节点数据
    await fetchGraphNodes();
    showDeleteDialog.value = false;

    // 显示成功消息
    const successMessage = descendantCount > 0
      ? `成功删除节点"${nodeToDelete.name}"及其 ${descendantCount} 个子节点`
      : `成功删除节点"${nodeToDelete.name}"`;

    console.log(successMessage);

  } catch (err) {
    console.error('删除节点失败:', err);

    // 改进错误处理
    let errorMessage = '删除失败，请重试';
    if (err.response?.data?.msg) {
      errorMessage = `删除失败: ${err.response.data.msg}`;
    } else if (err.message) {
      errorMessage = `删除失败: ${err.message}`;
    }

    alert(errorMessage);
  } finally {
    isLoading.value = false;
  }
};

// 搜索节点
const searchNodes = (query) => {
  const normalizedQuery = normalizeTextValue(query).trim().toLowerCase();

  searchQuery.value = normalizeTextValue(query);

  // 如果搜索框为空，重置过滤
  if (!normalizedQuery) {
    filteredNodes.value = [];
    buildHierarchy();
    return;
  }

  // 根据名称或内容搜索节点
  filteredNodes.value = graphNodes.value.filter(node => {
    const normalizedNode = normalizeOutlineNode(node);

    return normalizedNode.name.toLowerCase().includes(normalizedQuery) ||
           normalizedNode.content.toLowerCase().includes(normalizedQuery);
  });

  // 展开包含搜索结果的所有父节点
  if (filteredNodes.value.length > 0) {
    const nodesToExpand = new Set();

    filteredNodes.value.forEach(node => {
      // 将节点ID添加到需要展开的集合中
      nodesToExpand.add(node.id);

      // 递归添加所有父节点
      let parentId = node.parentId;
      while (parentId) {
        nodesToExpand.add(parentId);
        const parentNode = graphNodes.value.find(n => n.id === parentId);
        parentId = parentNode ? parentNode.parentId : null;
      }
    });

    // 更新展开的节点列表
    expandedNodes.value = [...nodesToExpand];
  }

  // 重建层级结构以反映搜索结果
  buildHierarchy();
};

// 清除搜索
const clearSearch = () => {
  searchQuery.value = '';
  filteredNodes.value = [];
  buildHierarchy();
};

// 获取课程信息
const fetchCourseInfo = async () => {
  try {
    const response = await getKnowledgeGraphList();
    if (response && response.rows && Array.isArray(response.rows)) {
      const foundCourse = response.rows.find(course => course.id == courseId.value);
      if (foundCourse) {
        // Normalize the course data to ensure we have a name property
        currentGraph.value = {
          ...foundCourse,
          name: foundCourse.name || foundCourse.title || foundCourse.courseName || `知识图谱大纲 #${courseId.value}`
        };
        // 检查课程信息中的courseId，如果与当前URL不匹配，则修复URL
        // 但只在初始加载时执行，避免在节点操作后误触发
        if (foundCourse.courseId && foundCourse.courseId != route.query.courseId && !originalCourseId.value) {
          // 更新originalCourseId
          originalCourseId.value = foundCourse.courseId;

          // 修复URL
          router.replace({
            path: route.path,
            query: { ...route.query, courseId: foundCourse.courseId }
          });
        }
      }
    }
  } catch (error) {
    console.error('获取课程信息失败:', error);
  }
};

onMounted(() => {
  // 保存初始的课程ID，防止后续丢失
  const initialCourseId = courseId.value;
  if (initialCourseId) {
    originalCourseId.value = initialCourseId;
  }

  // 数据加载由watch处理，这里不需要重复调用
});

// 监听courseId变化，自动重新加载数据
watch(courseId, (newCourseId, oldCourseId) => {
  if (newCourseId && newCourseId !== oldCourseId) {
    // 更新保存的课程ID
    originalCourseId.value = newCourseId;

    fetchCourseInfo();
    fetchGraphNodes();
  }
}, { immediate: true });


</script>

<style scoped>
/* 引入外部样式文件 */
@import '@/styles/pages/OutlinePage.css';
/* 图谱视图样式 */
.graph-view-container {
  width: 100%;
  height: 600px;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  background: white;
}

.graph-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* 按钮样式更新 */
.back-to-dashboard-btn,
.enter-graph-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-to-dashboard-btn:hover,
.enter-graph-btn:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.back-icon,
.graph-icon {
  font-size: 1rem;
  font-style: normal;
}
</style>
