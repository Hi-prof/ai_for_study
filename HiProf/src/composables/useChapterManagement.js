import { ref } from 'vue';
import {
  getCourseChapterList,
  createChapter,
  updateChapter,
  deleteChapter as deleteChapterApi,
  getChapterDetail
} from '@/api/chapters';
import { getChapterNodes } from '@/api/node';

/**
 * 章节管理 Composable
 * @param {string|number} courseId 课程ID
 */
export function useChapterManagement(courseId) {
  // 响应式数据
  const loading = ref(false);
  const chapters = ref([]);

  // 将知识图谱数据转换为章节显示格式
  const convertZstpToChapters = (zstpList) => {
    if (!zstpList || !Array.isArray(zstpList)) {
      return [];
    }

    // 按创建时间排序（升序，最早创建的在前面）
    const sortedZstpList = [...zstpList].sort((a, b) => {
      // 尝试多种可能的时间字段名
      const timeA = a.createTime || a.createdAt || a.created_at || a.createDate || a.gmtCreate || a.id;
      const timeB = b.createTime || b.createdAt || b.created_at || b.createDate || b.gmtCreate || b.id;
      
      // 尝试将时间转换为Date对象进行比较
      const dateA = new Date(timeA);
      const dateB = new Date(timeB);
      
      // 如果时间解析成功，按时间排序
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // 如果时间解析失败，按ID排序（通常ID越小创建越早）
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      return idA - idB;
    });

    return sortedZstpList.map((zstp, index) => ({
      id: zstp.id,
      title: zstp.name || `第${index + 1}章`,
      description: zstp.content || '暂无描述',
      status: 'published',
      hours: 2,
      difficulty: 'medium',
      progress: 0,
      expanded: false,
      sections: [],
      sectionsLoaded: false, // 改为false，在展开时才加载子节点
      loading: false,
      detailLoaded: false,
      detailContent: '',
      detailRemark: '',
      _zstpData: zstp
    }));
  };

  // 确保课程有章节，如果没有则创建默认章节
  const ensureCourseHasChapters = async () => {
    try {

      // 查询当前课程的章节
      const response = await getCourseChapterList(courseId);

      // 检查响应数据
      if (response && response.rows && response.rows.length > 0) {
        return response.rows;
      }

      // 如果提取失败但有原始响应数据，记录详细信息
      if (response && response.extractionFailed && response.originalResponse) {
        console.error('数据提取失败，原始响应数据:', response.originalResponse);
        console.error('请检查后端API响应格式是否发生变化');
      }

      // 如果没有章节，创建默认章节
      const defaultChapterData = {
        courseId: courseId,
        graphType: "1",
        name: "第一章 课程介绍",
        content: "这是默认创建的第一章内容，请根据实际需要进行修改。",
        remark: "系统自动创建的默认章节"
      };

      const createResponse = await createChapter(defaultChapterData);

      if (createResponse && !createResponse.error) {
        // 重新查询章节列表
        const newResponse = await getCourseChapterList(courseId);
        return newResponse.rows || [];
      } else {
        throw new Error(createResponse?.msg || '创建默认章节失败');
      }

    } catch (error) {
      console.error('确保课程有章节时发生错误:', error);
      throw error;
    }
  };

  // 加载章节列表
  const loadChapters = async () => {
    loading.value = true;
    try {

      // 确保课程有章节，如果没有则创建默认章节
      const zstpList = await ensureCourseHasChapters();

      // 将知识图谱数据转换为章节格式（包含按创建时间排序）
      chapters.value = convertZstpToChapters(zstpList);


    } catch (error) {
      console.error('加载章节列表失败:', error);
      
      // 如果加载失败，显示空状态
      chapters.value = [];
      
      // 提供更详细的错误信息
      let errorMessage = '加载章节列表失败';
      if (error.message) {
        errorMessage += '：' + error.message;
      }
      
      // 如果是网络错误，提供相应提示
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
        errorMessage += '\n请检查网络连接后重试';
      } else if (error.response?.status === 404) {
        errorMessage += '\n课程不存在或已被删除';
      } else if (error.response?.status === 403) {
        errorMessage += '\n没有权限访问该课程';
      } else {
        errorMessage += '\n请刷新页面重试，如问题持续存在请联系管理员';
      }
      
      alert(errorMessage);
    } finally {
      loading.value = false;
    }
  };

  // 切换章节展开状态
  const toggleChapter = async (chapterId) => {
    const chapter = chapters.value.find(c => c.id === chapterId);
    if (!chapter || chapter.loading) return;

    // 切换展开状态
    chapter.expanded = !chapter.expanded;


    // 如果是展开状态且还没有加载详细信息或子节点，则加载它们
    if (chapter.expanded && (!chapter.detailLoaded || !chapter.sectionsLoaded)) {
      await loadChapterDetail(chapterId);
    }
  };

  // 加载章节详细信息
  const loadChapterDetail = async (chapterId) => {
    const chapter = chapters.value.find(c => c.id === chapterId);
    if (!chapter) return;

    try {
      chapter.loading = true;

      // 并行加载章节详细信息和子节点
      const [detailResponse, nodesResponse] = await Promise.allSettled([
        getChapterDetail(chapterId),
        loadChapterNodes(chapterId)
      ]);

      // 处理章节详细信息
      if (detailResponse.status === 'fulfilled' && detailResponse.value && !detailResponse.value.error) {
        if (detailResponse.value.data) {
          chapter.detailContent = detailResponse.value.data.content || chapter.description;
          chapter.detailRemark = detailResponse.value.data.remark || '';
          chapter.detailLoaded = true;
        }
      } else {
        console.warn(`章节${chapterId}详细信息加载失败:`, detailResponse);
      }

      // 处理子节点信息
      if (nodesResponse.status === 'fulfilled' && nodesResponse.value) {
        chapter.sections = nodesResponse.value;
        chapter.sectionsLoaded = true;
      } else {
        console.warn(`章节${chapterId}子节点加载失败:`, nodesResponse);
        chapter.sections = [];
        chapter.sectionsLoaded = true;
      }

    } catch (error) {
      console.error(`加载章节${chapterId}详细信息失败:`, error);
    } finally {
      chapter.loading = false;
    }
  };

  // 加载章节子节点
  const loadChapterNodes = async (chapterId) => {
    try {

      // 找到对应的章节以获取图谱ID
      const chapter = chapters.value.find(c => c.id === chapterId);
      if (!chapter || !chapter._zstpData) {
        console.warn(`找不到章节${chapterId}或缺少图谱信息`);
        return [];
      }

      const graphId = chapter._zstpData.id || chapterId;

      // 调用API获取所有节点列表（包括多级节点）
      const response = await getChapterNodes(null, graphId); // 传null获取所有节点

      if (response && response.rows) {
        // 添加调试信息：查看节点的详细信息

        // 修改过滤逻辑：显示所有属于该图谱的节点作为章节的子节点
        // 如果节点的parentId为null或者等于章节ID，则认为是章节的直接子节点
        const chapterNodes = response.rows.filter(node => {
          const isDirectChild = node.parentId === null ||
                               node.parentId === chapterId ||
                               String(node.parentId) === String(chapterId);
          const isDescendant = isDescendantOf(node, chapterId, response.rows);


          return isDirectChild || isDescendant;
        });


        // 构建树形结构 - 如果节点的parentId为null，则将其作为章节的直接子节点
        return buildNodeTree(chapterNodes, chapterId);
      }

      return [];
    } catch (error) {
      console.error(`加载章节${chapterId}子节点失败:`, error);
      return [];
    }
  };

  // 检查节点是否是指定父节点的后代
  const isDescendantOf = (node, ancestorId, allNodes) => {
    let currentParentId = node.parentId;
    while (currentParentId) {
      if (currentParentId === ancestorId) {
        return true;
      }
      const parentNode = allNodes.find(n => n.id === currentParentId);
      currentParentId = parentNode ? parentNode.parentId : null;
    }
    return false;
  };

  // 构建节点树形结构
  const buildNodeTree = (nodes, rootParentId) => {

    // 转换节点数据格式
    const formattedNodes = nodes.map((node, index) => ({
      // 显示用的字段
      id: node.id,
      title: node.name || `子节点${index + 1}`,
      content: node.content || '',

      // 更新接口需要的字段（保留原始数据）
      name: node.name,
      parentId: node.parentId,
      graphId: node.graphId,
      createBy: node.createBy,
      createTime: node.createTime,
      updateBy: node.updateBy,
      updateTime: node.updateTime,
      remark: node.remark,
      params: node.params,

      // 保留完整的原始节点数据
      _nodeData: node
    }));

    // 用于防止无限递归的访问记录
    const visitedNodes = new Set();

    // 递归构建子节点
    const getChildren = (parentId, depth = 0) => {
      // 防止无限递归
      if (depth > 10) {
        console.warn(`递归深度超过限制，停止构建，当前父节点ID: ${parentId}`);
        return [];
      }

      // 防止循环引用
      if (visitedNodes.has(parentId)) {
        console.warn(`检测到循环引用，跳过节点: ${parentId}`);
        return [];
      }

      visitedNodes.add(parentId);


      const filteredNodes = formattedNodes.filter(node => {
        const nodeParentId = node.parentId;
        const isMatch = nodeParentId === parentId || String(nodeParentId) === String(parentId);


        return isMatch;
      });


      const result = filteredNodes.map(node => ({
        ...node,
        children: getChildren(node.id, depth + 1)
      }));

      visitedNodes.delete(parentId);
      return result;
    };

    const result = getChildren(rootParentId);
    return result;
  };

  // 创建新章节
  const createNewChapter = async (chapterName) => {
    try {
      loading.value = true;

      // 创建新章节数据
      const newChapterData = {
        courseId: courseId,
        graphType: "1",
        name: chapterName.trim(),
        content: "请输入章节描述",
        remark: "用户新增的章节"
      };

      // 调用API创建章节
      const createResponse = await createChapter(newChapterData);

      if (createResponse && !createResponse.error) {
        // 重新加载章节列表
        await loadChapters();
        return true;
      } else {
        throw new Error(createResponse?.msg || '创建章节失败');
      }

    } catch (error) {
      console.error('新增章节失败:', error);
      alert('新增章节失败：' + (error.message || '请重试'));
      return false;
    } finally {
      loading.value = false;
    }
  };

  // 更新章节
  const updateChapterInfo = async (chapter, newName) => {
    try {
      loading.value = true;

      // 构建更新数据
      const updateData = {
        ...chapter._zstpData,
        name: newName.trim(),
        content: chapter.description
      };

      // 调用API更新章节
      const updateResponse = await updateChapter(updateData);

      if (updateResponse && !updateResponse.error) {
        // 重新加载章节列表
        await loadChapters();
        return true;
      } else {
        throw new Error(updateResponse?.msg || '更新章节失败');
      }

    } catch (error) {
      console.error('编辑章节失败:', error);
      alert('编辑章节失败：' + (error.message || '请重试'));
      return false;
    } finally {
      loading.value = false;
    }
  };

  // 删除章节
  const deleteChapter = async (chapterId) => {
    try {

      const chapterToDelete = chapters.value.find(c => c.id === chapterId);
      if (!chapterToDelete) {
        alert('找不到要删除的章节');
        return false;
      }

      if (!confirm(`确定要删除章节"${chapterToDelete.title}"吗？此操作不可撤销。`)) {
        return false;
      }

      loading.value = true;

      // 调用API删除章节
      const deleteResponse = await deleteChapterApi(chapterId);

      if (deleteResponse && !deleteResponse.error) {
        // 重新加载章节列表
        await loadChapters();
        return true;
      } else {
        throw new Error(deleteResponse?.msg || '删除章节失败');
      }

    } catch (error) {
      console.error('删除章节失败:', error);
      alert('删除章节失败：' + (error.message || '请重试'));
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    // 响应式数据
    loading,
    chapters,
    
    // 方法
    loadChapters,
    toggleChapter,
    createNewChapter,
    updateChapterInfo,
    deleteChapter
  };
}
