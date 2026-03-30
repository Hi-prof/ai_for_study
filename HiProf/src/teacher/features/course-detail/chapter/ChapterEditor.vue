<template>
  <div class="chapter-editor" v-show="true">
    <button
      class="btn btn-primary"
      @click="openEditor"
      style="
        display: inline-flex !important;
        background-color: #6366f1 !important;
        color: white !important;
        padding: 0.5rem 1rem !important;
        border: none !important;
        border-radius: 0.375rem !important;
        cursor: pointer !important;
        font-size: 0.875rem !important;
        font-weight: 500 !important;
      "
    >
      编辑章节
    </button>

    <div v-if="isEditorOpen" class="editor-modal-overlay">
      <div class="editor-modal">
        <!-- 标题和关闭按钮 -->
        <div class="modal-title-bar">
          <h3 class="modal-title">编辑章节</h3>
          <button class="close-btn" @click="closeEditor">&times;</button>
        </div>

        <!-- 主要内容区域 -->
        <div class="modal-main">
          <!-- 章节列表组件 -->
          <ChapterList
            :chapters="editableChapters"
            :course-id="courseId"
            @chapters-change="onChaptersChange"
          />

          <!-- 上传进度 -->
          <div v-if="uploading" class="upload-progress">
            <div class="progress-header">
              <span class="progress-text">{{ uploadProgressText }}</span>
              <span class="progress-percentage">{{ uploadProgress }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
            </div>
          </div>

          <!-- 底部操作区域 -->
          <div class="modal-actions">
            <div class="action-buttons">
              <button class="btn btn-secondary" @click="closeEditor" :disabled="isSaving">取消</button>
              <button
                class="btn btn-primary"
                @click="saveChanges"
                :disabled="isSaving || uploading"
              >
                {{ isSaving ? '保存中...' : '保存更改' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import { useChapterManagement } from '@/teacher/composables/useChapterManagement';
import { useFileUpload } from '@/teacher/composables/useFileUpload';
import {
  createChapterNode,
  updateChapterNode
} from '@/api/node';
import { deleteChapter as deleteChapterApi } from '@/api/chapters';
import ChapterList from './ChapterList.vue';

const props = defineProps({
  chapters: {
    type: Array,
    default: () => []
  },
  courseId: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['save', 'loading']);

// 深拷贝函数
const deepClone = (obj) => {
  if (!obj) return [];
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('深拷贝失败:', error);
    return [];
  }
};

// 使用章节管理 Composable
let chapterManagement = null;

// 响应式数据
const isEditorOpen = ref(false);
const editableChapters = ref([]);
const originalChapters = ref([]);
const isSaving = ref(false);

// 文件上传管理
const {
  uploading,
  uploadProgress,
  uploadProgressText,
  generateCreateTime,
  uploadChapterFiles,
  uploadNodeFiles,
  setUploadingState,
  updateUploadProgress
} = useFileUpload();

// 监听章节数据变化
watch(() => props.chapters, (newChapters) => {
  if (newChapters && Array.isArray(newChapters)) {
    // 只有在编辑器未打开时才更新数据，避免在编辑过程中被重置
    if (!isEditorOpen.value) {
      editableChapters.value = deepClone(newChapters);
      originalChapters.value = deepClone(newChapters);
    }
  }
}, { deep: true, immediate: true });

// 初始化章节管理
const initChapterManagement = () => {
  if (!chapterManagement && props.courseId) {
    chapterManagement = useChapterManagement(props.courseId);
  }
};

// 处理章节数据变化
const onChaptersChange = (updatedChapters) => {
  editableChapters.value = updatedChapters;
};

// 打开编辑器
const openEditor = () => {
  initChapterManagement();
  editableChapters.value = deepClone(props.chapters || []);
  originalChapters.value = deepClone(props.chapters || []);

  // 如果没有章节数据，自动添加一个新章节供编辑
  if (editableChapters.value.length === 0) {
    const newChapter = {
      tempId: `new-${Date.now()}`,
      title: '',
      description: '',
      isNew: true,
      selectedFiles: [],
      nodes: [],
      showNodes: false
    };
    editableChapters.value.push(newChapter);
  }

  isEditorOpen.value = true;
};

// 关闭编辑器
const closeEditor = () => {
  if (!isSaving.value && !uploading.value) {
    isEditorOpen.value = false;
    // 重置状态
    editableChapters.value = [];
    originalChapters.value = [];
  }
};

// 获取章节的图谱ID
const getChapterGraphId = (chapter) => {
  return chapter._zstpData?.id ||
         chapter.graphId ||
         chapter.id ||
         props.courseId;
};


// 保存更改
const saveChanges = async () => {
  try {
    isSaving.value = true;
    setUploadingState(true);
    emit('loading', true);

    const createTime = generateCreateTime();

    // 处理章节
    for (const chapter of editableChapters.value) {
      if (chapter.isNew) {
        // 新增章节
        uploadProgressText.value = `创建新章节: ${chapter.title}`;
        
        // 上传文件
        const uploadedFiles = await uploadChapterFiles(chapter, props.courseId, createTime);
        
        // 创建章节数据
        const chapterData = typeof chapter.title === 'string' ? chapter.title : 
          {
            chapterName: chapter.title,
            createTime: createTime,
            uploadedFiles: uploadedFiles
          };
        
        await chapterManagement.createNewChapter(chapterData);
        
      } else {
        // 更新章节
        const originalChapter = originalChapters.value.find(c => c.id === chapter.id);
        
        // 检查标题或描述是否有变化
        const titleChanged = originalChapter && originalChapter.title !== chapter.title;
        const descriptionChanged = originalChapter && originalChapter.description !== chapter.description;
        
        if (originalChapter && (titleChanged || descriptionChanged)) {
          uploadProgressText.value = `更新章节: ${chapter.title}`;
          
          // 上传新文件
          await uploadChapterFiles(chapter, props.courseId, createTime);

          await chapterManagement.updateChapterInfo(chapter, chapter.title);
        }
      }

      // 处理节点
      if (chapter.nodes) {
        for (const node of chapter.nodes) {
          if (node.isNew) {
            // 新增节点
            uploadProgressText.value = `创建节点: ${node.name}`;
            
            // 上传文件
            const uploadedFiles = await uploadNodeFiles(node, chapter, props.courseId, createTime);
            
            // 将创建时间记录到节点内容
            let nodeContent = node.content || '';
            if (uploadedFiles.length > 0) {
              const contentData = { createTime: createTime };
              nodeContent = JSON.stringify(contentData);
            }
            
            const nodeData = {
              parentId: chapter.id,
              graphId: getChapterGraphId(chapter),
              name: node.name,
              content: nodeContent,
              remark: '章节子节点'
            };
            
            await createChapterNode(nodeData);
            
          } else {
            // 更新节点
            const originalNode = chapter.sections?.find(n => n.id === node.id);
            if (originalNode && (originalNode.name !== node.name || originalNode.content !== node.content)) {
              uploadProgressText.value = `更新节点: ${node.name}`;
              
              // 上传新文件
              const uploadedFiles = await uploadNodeFiles(node, chapter, props.courseId, createTime);
              
              // 将创建时间记录到节点内容
              let nodeContent = node.content || '';
              if (uploadedFiles.length > 0) {
                const contentData = JSON.parse(nodeContent || '{}');
                contentData.createTime = createTime;
                nodeContent = JSON.stringify(contentData);
              }
              
              const nodeData = {
                id: node.id,
                parentId: node.parentId,
                graphId: node.graphId,
                name: node.name,
                content: nodeContent,
                createBy: node.createBy || '',
                createTime: node.createTime || '',
                updateBy: node.updateBy || '',
                updateTime: node.updateTime || '',
                remark: node.remark || '章节子节点',
                params: node.params || {}
              };
              
              await updateChapterNode(nodeData);
            }
          }
        }
      }
    }

    // 处理删除的章节
    for (const originalChapter of originalChapters.value) {
      const stillExists = editableChapters.value.find(c => c.id === originalChapter.id);
      if (!stillExists) {
        uploadProgressText.value = `删除章节: ${originalChapter.title}`;
        try {
          // 直接调用 API 删除章节，避免 chapterManagement 中的检查逻辑
          const deleteResponse = await deleteChapterApi(originalChapter.id);

          if (deleteResponse && deleteResponse.code === 200) {
            // 删除成功
          } else {
            throw new Error(deleteResponse?.msg || '删除章节失败');
          }
        } catch (error) {
          console.error(`删除章节失败: ${originalChapter.title}`, error);
          throw error;
        }
      }
    }

    updateUploadProgress(100, '保存完成！');

    // 通知父组件刷新数据
    emit('save');

    setTimeout(() => {
      closeEditor();
    }, 1000);

  } catch (error) {
    console.error('保存章节失败:', error);
    alert(`保存失败: ${error.message}`);
  } finally {
    isSaving.value = false;
    setUploadingState(false);
    emit('loading', false);
  }
};
</script>

<style scoped>
@import '@/teacher/styles/chapter-editor.css';
</style>
