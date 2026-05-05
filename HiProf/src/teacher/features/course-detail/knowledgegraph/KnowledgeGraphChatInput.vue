<template>
  <section class="kg-chat-card">
    <div class="kg-chat-thread">
      <div class="kg-chat-message kg-chat-message-ai">
        <div class="kg-chat-avatar">AI</div>
        <div class="kg-chat-bubble">
          <div class="kg-chat-title">知识图谱助手</div>
          <p>输入课程目标、知识点范围或重点章节，也可以上传课程资料后生成草稿图谱。</p>
        </div>
      </div>

      <div v-if="progressText" class="kg-chat-message kg-chat-message-status">
        <div class="kg-chat-avatar kg-chat-avatar-status">
          <i class="loading-icon" v-if="isSubmitting"></i>
          <i class="ai-icon" v-else></i>
        </div>
        <div class="kg-chat-bubble">
          <p>{{ progressText }}</p>
        </div>
      </div>
    </div>

    <div class="kg-composer">
      <textarea
        class="kg-chat-input"
        :value="modelValue"
        :disabled="isSubmitting"
        rows="6"
        placeholder="例如：围绕本课程前三章生成知识图谱，突出核心概念、前置关系和易错点。"
        @input="$emit('update:modelValue', $event.target.value)"
      ></textarea>

      <div v-if="sourceFiles.length" class="kg-file-list">
        <div
          v-for="file in sourceFiles"
          :key="file.id"
          class="kg-file-card"
          :class="`kg-file-card-${file.status}`"
        >
          <i class="file-icon"></i>
          <div class="kg-file-main">
            <div class="kg-file-name" :title="file.name">{{ file.name }}</div>
            <div class="kg-file-meta">{{ formatFileSize(file.size) }} · {{ getFileStatusText(file) }}</div>
          </div>
          <button
            type="button"
            class="btn-remove kg-file-remove"
            :disabled="isSubmitting"
            title="移除文件"
            @click="removeFile(file.id)"
          >
            <i class="close-icon"></i>
          </button>
        </div>
      </div>

      <div class="kg-composer-actions">
        <input
          ref="fileInput"
          class="file-input"
          type="file"
          multiple
          :accept="uploadAccept"
          :disabled="isSubmitting"
          @change="handleFilesSelected"
        />
        <button type="button" class="btn btn-secondary" :disabled="isSubmitting" @click="triggerFileSelect">
          <i class="upload-icon upload-icon-muted"></i>
          上传资料
        </button>
        <span v-if="hasParsingFiles" class="kg-inline-status">
          <i class="loading-icon loading-icon-muted"></i>
          正在解析
        </span>
        <div class="kg-action-spacer"></div>
        <button v-if="isSubmitting" type="button" class="btn btn-danger" @click="$emit('stop')">
          <i class="stop-icon"></i>
          停止
        </button>
        <button
          v-else
          type="button"
          class="btn btn-ai"
          :disabled="!canGenerate || hasParsingFiles"
          @click="submit"
        >
          <i class="ai-icon"></i>
          生成图谱
        </button>
      </div>

      <div class="kg-composer-hint">支持 PDF、DOCX、PPTX、TXT，单个文件最大 50MB。</div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { parseKnowledgeGraphSourceFile } from '@/api/graph.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.txt', '.pdf', '.docx', '.pptx'];
const FILE_TYPE_NAMES = {
  '.txt': 'TXT',
  '.pdf': 'PDF',
  '.docx': 'DOCX',
  '.pptx': 'PPTX'
};

const props = defineProps({
  modelValue: { type: String, default: '' },
  isSubmitting: { type: Boolean, default: false },
  progressText: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue', 'generate', 'stop']);

const fileInput = ref(null);
const sourceFiles = ref([]);
const uploadAccept = ALLOWED_EXTENSIONS.join(',');

const canGenerate = computed(() => {
  return props.modelValue.trim() || sourceFiles.value.some(file => file.status === 'success');
});

const hasParsingFiles = computed(() => sourceFiles.value.some(file => file.status === 'parsing'));

const triggerFileSelect = () => {
  fileInput.value?.click();
};

const handleFilesSelected = async (event) => {
  const files = Array.from(event.target.files || []);

  for (const file of files) {
    const extension = getFileExtension(file.name);
    const item = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name: file.name,
      size: file.size,
      type: getFileTypeName(file.name),
      status: 'parsing',
      text: '',
      error: ''
    };

    sourceFiles.value.push(item);

    try {
      validateSourceFile(file, extension);
      const response = await parseKnowledgeGraphSourceFile(file);
      const parsedSource = response?.data || response || {};
      item.text = parsedSource.text || '';
      item.parsedSource = parsedSource;
      item.status = item.text.trim() ? 'success' : 'error';
      item.error = item.status === 'error' ? '文档内容为空或无法读取' : '';
    } catch (error) {
      item.status = 'error';
      item.error = resolveUploadErrorMessage(error);
    }
  }

  event.target.value = '';
};

const validateSourceFile = (file, extension) => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件大小超过限制，最大支持 ${formatFileSize(MAX_FILE_SIZE)}`);
  }

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error(`不支持的文件类型: ${extension}`);
  }
};

const removeFile = (fileId) => {
  sourceFiles.value = sourceFiles.value.filter(file => file.id !== fileId);
};

const submit = () => {
  if (!canGenerate.value) {
    alert('请输入生成要求或上传可解析的资料');
    return;
  }

  if (hasParsingFiles.value) {
    alert('请等待文件解析完成');
    return;
  }

  const parsedText = sourceFiles.value
    .filter(file => file.status === 'success')
    .map(file => `【${file.name}】\n${file.text}`)
    .join('\n\n');

  emit('generate', {
    requirements: props.modelValue.trim(),
    sourceText: parsedText || props.modelValue.trim(),
    pdfPaths: [],
    sourceFiles: sourceFiles.value
  });
};

const getFileExtension = (fileName) => `.${String(fileName).split('.').pop().toLowerCase()}`;

const getFileTypeName = (fileName) => FILE_TYPE_NAMES[getFileExtension(fileName)] || 'FILE';

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, unitIndex);
  return `${Number(size.toFixed(2))} ${units[unitIndex]}`;
};

const getFileStatusText = (file) => {
  if (file.status === 'parsing') return `${file.type} 解析中`;
  if (file.status === 'success') return `${file.type} 已解析`;
  return file.error || '解析失败';
};

const resolveUploadErrorMessage = (error) => {
  return error?.businessResponse?.msg
    || error?.businessResponse?.message
    || error?.response?.data?.msg
    || error?.response?.data?.message
    || error?.message
    || '后端解析失败';
};
</script>
