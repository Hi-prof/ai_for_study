<template>
  <div class="left-panel input-panel-root">
    <div class="input-section input-panel-scroll">
      <!-- 文件上传区域 -->
      <div class="form-group input-form-group input-card input-card-combined">
        <div class="input-combined-body">
          <div class="file-upload-area input-card-surface upload-dropzone" @click="triggerFileUpload">
            <input
              type="file"
              ref="fileInput"
              class="file-input"
              :accept="uploadAccept"
              @change="handleFileUpload"
              :disabled="isUploading"
            />
            <div class="upload-dropzone-content">
              <div class="file-upload-button" :class="{ 'uploading': isUploading }">
                <i class="upload-icon" v-if="!isUploading"></i>
                <i class="loading-icon" v-else></i>
                <span>{{ isUploading ? '正在读取文件...' : '上传文档' }}</span>
              </div>
              <div class="upload-main-text">支持上传 PDF、DOC、DOCX、PPT、PPTX、TXT 文档，点击这里即可选择文件</div>
              <div class="upload-support-text">可上传课程资料、讲义或知识点整理文档，单个文件最大 50MB。</div>
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

          <div class="input-divider"></div>

          <div class="section-header section-header-spaced section-header-inner">
            <div>
              <label class="form-label section-title">知识图谱内容描述</label>
            </div>
            <div class="section-hint input-mode-hint" v-if="uploadedFileName">已上传文档，可继续补充文字要求</div>
          </div>
          <textarea
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
            class="form-textarea large-textarea input-textarea"
            rows="20"
            placeholder="请输入知识图谱生成要求，例如课程重点、希望展开的知识点、需要重点深化的章节等。也可以先上传 PDF 资料，再在这里补充教师要求。"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- 生成/停止按钮 -->
    <div class="action-section input-panel-actions">
      <button
        v-if="!isGenerating"
        class="btn btn-ai btn-large"
        @click="handleGenerate"
        :disabled="(!modelValue || !modelValue.trim()) && !uploadedFileContent"
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
import { FILE_CONFIG, parseFileContent, formatFileSize, getFileTypeName } from '@/utils/fileParser.js';

const uploadAccept = FILE_CONFIG.ALLOWED_EXTENSIONS.join(',');

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
const uploadedFileContent = ref('');

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

  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  if (!FILE_CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension)) {
    alert(`当前支持上传 ${FILE_CONFIG.ALLOWED_EXTENSIONS.join('、')} 文件`);
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    return;
  }

  try {
    isUploading.value = true;
    const content = await parseFileContent(file);
    if (!content.trim()) {
      throw new Error('文档内容为空或无法读取');
    }

    uploadedFileName.value = file.name;
    uploadedFileContent.value = content;
    console.log(`PDF 解析成功: ${file.name} (${getFileTypeName(file.name)}, ${formatFileSize(file.size)})`);

  } catch (error) {
    console.error('文件上传失败:', error);
    alert(`文件上传失败: ${error.message}`);
    uploadedFileName.value = '';
    uploadedFileContent.value = '';
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
  uploadedFileContent.value = '';
};

const handleGenerate = () => {
  if (!props.modelValue.trim() && !uploadedFileContent.value) {
    alert('请输入知识图谱内容描述或上传 PDF 文件');
    return;
  }
  emit('generate', {
    requirements: props.modelValue,
    sourceText: uploadedFileContent.value || props.modelValue,
    pdfPaths: []
  });
};

const handleStop = () => {
  emit('stop');
};
</script>

<style scoped>
.input-panel-root {
  height: 100%;
  min-height: 0;
}

.input-panel-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.input-panel-actions {
  flex-shrink: 0;
  padding-top: 1rem;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0) 0%, #f8fafc 18%, #f8fafc 100%);
}

.input-form-group {
  margin-bottom: 1.5rem;
}

.input-card {
  padding: 1.1rem 1.1rem 1rem;
  border: 1px solid #cfd9e6;
  border-radius: 1rem;
  background: linear-gradient(180deg, #ffffff 0%, #f4f8fc 100%);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.input-card-editor {
  padding-bottom: 1.15rem;
}

.input-card-combined {
  padding-bottom: 1.15rem;
}

.input-card-surface {
  border: 1px solid #d6e0eb;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.85);
}

.input-combined-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0) 0%, rgba(148, 163, 184, 0.55) 18%, rgba(148, 163, 184, 0.55) 82%, rgba(148, 163, 184, 0) 100%);
}

.section-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.45rem;
  margin-bottom: 0.95rem;
}

.section-header-spaced {
  margin-bottom: 1rem;
}

.section-header-inner {
  margin-bottom: 0.9rem;
}

.section-title {
  margin: 0;
  padding-bottom: 0 !important;
  border-bottom: none !important;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  position: static;
}

.section-title::after {
  content: none !important;
  display: none !important;
}

.section-subtitle {
  margin-top: 0.2rem;
  font-size: 0.78rem;
  color: #64748b;
  letter-spacing: 0.02em;
}

.section-hint {
  font-size: 0.75rem;
  color: #475569;
  line-height: 1.4;
}

.file-upload-area {
  margin-top: 0;
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: linear-gradient(180deg, #eef4fa 0%, #e8f0f8 100%);
}

.upload-dropzone {
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.upload-dropzone:hover {
  border-color: #9fb4ca;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.9), 0 8px 18px rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
}

.upload-dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.upload-main-text {
  margin-top: 0.9rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
}

.upload-support-text {
  margin-top: 0.45rem;
  font-size: 0.78rem;
  line-height: 1.5;
  color: #475569;
}

.input-textarea {
  min-height: 460px;
  border-radius: 0.75rem;
  background-color: #f8fbfe;
  border-color: #c7d4e2;
}

.input-textarea:focus {
  background-color: #ffffff;
  border-color: #7c9ab8;
  box-shadow: 0 0 0 3px rgba(124, 154, 184, 0.16);
}
</style>
