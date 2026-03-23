<template>
  <div class="left-panel">
    <div class="input-section">
      <!-- 文件上传区域 -->
      <div class="form-group">
        <label class="form-label">上传文档文件（可选）</label>
        <div class="file-upload-area">
          <input
            type="file"
            ref="fileInput"
            class="file-input"
            accept=".txt,.pdf,.docx,.doc,.pptx,.ppt"
            @change="handleFileUpload"
            :disabled="isUploading"
          />
          <div class="file-upload-button" @click="triggerFileUpload" :class="{ 'uploading': isUploading }">
            <i class="upload-icon" v-if="!isUploading"></i>
            <i class="loading-icon" v-else></i>
            <span>{{ isUploading ? '正在读取文件...' : '选择文档文件' }}</span>
          </div>
          <div class="file-upload-hint">
            支持 .txt、.pdf、.docx、.doc、.pptx、.ppt 格式，最大 50MB
          </div>
        </div>
        <!-- 已上传文件显示 -->
        <div v-if="uploadedFileName" class="uploaded-file-info">
          <div class="file-item">
            <i class="file-icon"></i>
            <span class="file-name">{{ uploadedFileName }}</span>
            <button class="btn-remove" @click="removeUploadedFile" title="移除文件">
              <i class="close-icon"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 知识图谱要求 -->
      <div class="form-group">
        <label class="form-label">
          知识图谱内容描述
          <span class="input-mode-hint" v-if="uploadedFileName">（已从文件加载内容，可继续编辑）</span>
        </label>
        <textarea
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          class="form-textarea large-textarea"
          rows="20"
          placeholder="请输入知识图谱的内容描述，AI将根据您提供的信息生成知识图谱，例如：&#10;&#10;土木工程概论课程知识图谱&#10;&#10;主要包含以下知识点：&#10;1. 土木工程基础概念&#10;2. 工程材料与性能&#10;3. 结构设计原理&#10;4. 施工技术与管理&#10;5. 工程测量与监测&#10;6. 工程安全与质量控制&#10;&#10;请生成包含这些知识点及其相互关系的知识图谱结构。&#10;&#10;或者点击上方选择文档文件按钮上传现有的课程文档。"
        ></textarea>
      </div>
    </div>

    <!-- 生成/停止按钮 -->
    <div class="action-section">
      <button
        v-if="!isGenerating"
        class="btn btn-ai btn-large"
        @click="handleGenerate"
        :disabled="!modelValue.trim()"
      >
        <i class="ai-icon"></i>
        开始生成知识图谱
      </button>
      
      <button
        v-else
        class="btn btn-danger btn-large"
        @click="handleStop"
      >
        <i class="stop-icon"></i>
        停止生成
      </button>
      
      <!-- 生成状态提示 -->
      <div v-if="isGenerating" class="generation-status">
        <i class="loading-icon"></i>
        <span>正在流式生成知识图谱内容...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { parseFileContent, validateFile, getFileTypeName, formatFileSize } from '@/utils/fileParser.js';

// 定义props和emits
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  isGenerating: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'generate', 'stop']);

// 响应式数据
const fileInput = ref(null);
const isUploading = ref(false);
const uploadedFileName = ref('');

// 文件上传相关方法
const triggerFileUpload = () => {
  if (!isUploading.value && fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileUpload = async (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const file = files[0];

  try {
    isUploading.value = true;

    // 使用文件解析模块读取文件内容
    const content = await parseFileContent(file);

    // 将内容填充到文本框
    if (content.trim()) {
      // 如果已有内容，询问用户是否替换
      if (props.modelValue.trim()) {
        const shouldReplace = confirm('检测到已有内容，是否要替换为文件内容？\n点击"确定"替换，点击"取消"追加到末尾。');
        if (shouldReplace) {
          emit('update:modelValue', content);
        } else {
          emit('update:modelValue', props.modelValue + '\n\n' + content);
        }
      } else {
        emit('update:modelValue', content);
      }

      uploadedFileName.value = file.name;
      console.log(`文件上传成功: ${file.name} (${getFileTypeName(file.name)}, ${formatFileSize(file.size)})`);
    } else {
      throw new Error('文件内容为空或无法读取');
    }

  } catch (error) {
    console.error('文件上传失败:', error);
    alert(`文件上传失败: ${error.message}`);
    uploadedFileName.value = '';
  } finally {
    isUploading.value = false;
    // 清空文件输入，允许重新选择同一文件
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const removeUploadedFile = () => {
  uploadedFileName.value = '';
  // 可选：清空文本框内容
  const shouldClearContent = confirm('是否同时清空文本框中的内容？');
  if (shouldClearContent) {
    emit('update:modelValue', '');
  }
};

const handleGenerate = () => {
  if (!props.modelValue.trim()) {
    alert('请输入知识图谱内容描述');
    return;
  }
  emit('generate', props.modelValue);
};

const handleStop = () => {
  emit('stop');
};
</script>

<style scoped>
@import '@/teacher/styles/ai-knowledge-graph-generator.css';
</style>

