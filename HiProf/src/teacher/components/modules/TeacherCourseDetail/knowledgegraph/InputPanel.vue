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
            accept=".pdf"
            @change="handleFileUpload"
            :disabled="isUploading"
          />
          <div class="file-upload-button" @click="triggerFileUpload" :class="{ 'uploading': isUploading }">
            <i class="upload-icon" v-if="!isUploading"></i>
            <i class="loading-icon" v-else></i>
            <span>{{ isUploading ? '正在读取文件...' : '选择文档文件' }}</span>
          </div>
          <div class="file-upload-hint">
            支持 PDF 格式，上传后将交给后端智能体参与生成，最大 50MB
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
          <span class="input-mode-hint" v-if="uploadedFileName">（已上传 PDF，可继续补充文字要求）</span>
        </label>
        <textarea
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          class="form-textarea large-textarea"
          rows="20"
          placeholder="请输入知识图谱生成要求，例如课程重点、希望展开的知识点、需要重点深化的章节等。也可以先上传 PDF 资料，再在这里补充教师要求。"
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
        <span>正在调用后端智能体生成知识图谱...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { formatFileSize } from '@/utils/fileParser.js';
import { uploadFile } from '@/api/files';

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
const uploadedPdfUrl = ref('');

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

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    alert('当前仅支持上传 PDF 文件');
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    return;
  }

  try {
    isUploading.value = true;
    const result = await uploadFile(file);
    if (result.code !== 200 || !result.data?.fileUrl) {
      throw new Error(result.message || 'PDF 上传失败');
    }

    uploadedFileName.value = file.name;
    uploadedPdfUrl.value = result.data.fileUrl;
    console.log(`PDF 上传成功: ${file.name} (${formatFileSize(file.size)})`, uploadedPdfUrl.value);

  } catch (error) {
    console.error('文件上传失败:', error);
    alert(`文件上传失败: ${error.message}`);
    uploadedFileName.value = '';
    uploadedPdfUrl.value = '';
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
  uploadedPdfUrl.value = '';
};

const handleGenerate = () => {
  if (!props.modelValue.trim() && !uploadedPdfUrl.value) {
    alert('请输入知识图谱内容描述或上传 PDF 文件');
    return;
  }
  emit('generate', {
    requirements: props.modelValue,
    pdfPaths: uploadedPdfUrl.value ? [uploadedPdfUrl.value] : []
  });
};

const handleStop = () => {
  emit('stop');
};
</script>

<style scoped>
@import '@/teacher/styles/ai-knowledge-graph-generator.css';
</style>
