<template>
  <div class="file-preview-test">
    <h2>🧪 现代文件预览器测试</h2>
    <p class="description">测试新的文件预览系统，支持多种文件类型</p>
    
    <!-- 文件选择器 -->
    <div class="file-selector">
      <h3>选择测试文件：</h3>
      <div class="test-files">
        <button 
          v-for="file in testFiles" 
          :key="file.id"
          @click="selectFile(file)"
          :class="['file-btn', { active: currentFile?.id === file.id }]"
        >
          {{ file.icon }} {{ file.name }}
          <small>({{ file.type }})</small>
        </button>
      </div>
    </div>

    <!-- 当前文件信息 -->
    <div v-if="currentFile" class="current-file-info">
      <h3>📄 当前文件信息</h3>
      <div class="file-details">
        <div class="detail-item">
          <strong>文件名:</strong> {{ currentFile.name }}
        </div>
        <div class="detail-item">
          <strong>文件类型:</strong> {{ fileConfig?.fileType || 'unknown' }}
        </div>
        <div class="detail-item">
          <strong>文件大小:</strong> {{ currentFile.size }}
        </div>
        <div class="detail-item">
          <strong>是否支持预览:</strong> 
          <span :class="fileConfig?.supported ? 'supported' : 'unsupported'">
            {{ fileConfig?.supported ? '✅ 支持' : '❌ 不支持' }}
          </span>
        </div>
        <div class="detail-item">
          <strong>浏览器支持:</strong>
          <div class="browser-support">
            <span v-for="(support, key) in fileConfig?.browserSupport?.nativeSupport" 
                  :key="key" 
                  :class="support ? 'supported' : 'unsupported'"
            >
              {{ key }}: {{ support ? '✅' : '❌' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览区域 -->
    <div v-if="currentFile" class="preview-section">
      <h3>🖥️ 文件预览</h3>
      <div class="preview-container">
        <ModernFileViewer
          :file-url="currentFile.url"
          :file-name="currentFile.name"
          :file-size="currentFile.size"
          @loaded="onPreviewLoaded"
          @error="onPreviewError"
        />
      </div>
    </div>

    <!-- 预览状态 -->
    <div v-if="currentFile" class="preview-status">
      <h3>📊 预览状态</h3>
      <div class="status-info">
        <div class="status-item">
          <strong>状态:</strong>
          <span :class="previewStatus">{{ previewStatusText }}</span>
        </div>
        <div v-if="previewError" class="status-item">
          <strong>错误信息:</strong>
          <span class="error-text">{{ previewError }}</span>
        </div>
        <div class="status-item">
          <strong>加载时间:</strong>
          <span>{{ loadTime }}ms</span>
        </div>
      </div>
    </div>

    <!-- 工具函数测试 -->
    <div class="utils-test">
      <h3>🛠️ 工具函数测试</h3>
      <div class="utils-results">
        <button @click="testUtils" class="btn btn-primary">运行工具函数测试</button>
        <pre v-if="utilsResults" class="utils-output">{{ utilsResults }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import ModernFileViewer from './ModernFileViewer.vue';
import { 
  generatePreviewConfig, 
  getFileType, 
  isPreviewSupported,
  formatFileSize,
  getBrowserSupport
} from '@/utils/fileViewerUtils';

// 测试文件列表
const testFiles = ref([
  {
    id: 1,
    name: 'sample.pdf',
    type: 'PDF文档',
    icon: '📄',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    size: '13.3 KB'
  },
  {
    id: 2,
    name: 'presentation.pptx',
    type: 'PowerPoint演示',
    icon: '📽️',
    url: 'https://file-examples.com/storage/fe68c9fa89d4b5c22c24dc9/2017/08/file_example_PPT_1MB.pptx',
    size: '1 MB'
  },
  {
    id: 3,
    name: 'spreadsheet.xlsx',
    type: 'Excel表格',
    icon: '📊',
    url: 'https://file-examples.com/storage/fe68c9fa89d4b5c22c24dc9/2017/02/file_example_XLSX_1000.xlsx',
    size: '51 KB'
  },
  {
    id: 4,
    name: 'sample-image.jpg',
    type: '图片文件',
    icon: '🖼️',
    url: 'https://picsum.photos/800/600',
    size: '45 KB'
  },
  {
    id: 5,
    name: 'sample-video.mp4',
    type: '视频文件',
    icon: '🎥',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    size: '1 MB'
  },
  {
    id: 6,
    name: 'readme.txt',
    type: '文本文件',
    icon: '📄',
    url: 'data:text/plain;charset=utf-8,Hello%20World!%0A%0AThis%20is%20a%20sample%20text%20file%20for%20testing%20the%20modern%20file%20viewer.%0A%0AFeatures:%0A-%20Multi-language%20support%0A-%20Syntax%20highlighting%0A-%20Large%20file%20handling%0A%0AThank%20you%20for%20testing!',
    size: '234 B'
  }
]);

// 当前选中的文件
const currentFile = ref(null);

// 预览状态
const previewStatus = ref('idle');
const previewError = ref('');
const loadTime = ref(0);
const startTime = ref(0);

// 工具函数测试结果
const utilsResults = ref('');

// 计算属性
const fileConfig = computed(() => {
  if (!currentFile.value) return null;
  return generatePreviewConfig(
    currentFile.value.url,
    currentFile.value.name,
    parseInt(currentFile.value.size) || 0
  );
});

const previewStatusText = computed(() => {
  const statusMap = {
    idle: '等待中',
    loading: '加载中...',
    success: '✅ 加载成功',
    error: '❌ 加载失败'
  };
  return statusMap[previewStatus.value] || '未知状态';
});

// 方法
const selectFile = (file) => {
  currentFile.value = file;
  previewStatus.value = 'loading';
  previewError.value = '';
  startTime.value = Date.now();
};

const onPreviewLoaded = () => {
  previewStatus.value = 'success';
  loadTime.value = Date.now() - startTime.value;
  console.log('✅ 预览加载成功:', currentFile.value.name);
};

const onPreviewError = (error) => {
  previewStatus.value = 'error';
  previewError.value = error.message || '未知错误';
  loadTime.value = Date.now() - startTime.value;
  console.error('❌ 预览加载失败:', error);
};

const testUtils = () => {
  if (!currentFile.value) {
    utilsResults.value = '请先选择一个文件进行测试';
    return;
  }

  const fileName = currentFile.value.name;
  const fileSize = 1024 * 500; // 模拟500KB
  
  const results = {
    fileName,
    fileType: getFileType(fileName),
    isSupported: isPreviewSupported(fileName),
    formattedSize: formatFileSize(fileSize),
    browserSupport: getBrowserSupport(fileName),
    fullConfig: generatePreviewConfig(
      currentFile.value.url,
      fileName,
      fileSize
    )
  };

  utilsResults.value = JSON.stringify(results, null, 2);
  console.log('🛠️ 工具函数测试结果:', results);
};

// 监听文件变化
watch(currentFile, (newFile) => {
  if (newFile) {
    console.log('📄 选择文件:', newFile);
  }
});

// 默认选择第一个文件
selectFile(testFiles.value[0]);
</script>

<style scoped>
.file-preview-test {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.description {
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
}

.file-selector {
  margin-bottom: 30px;
}

.file-selector h3 {
  margin-bottom: 15px;
  color: #333;
}

.test-files {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.file-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
}

.file-btn:hover {
  border-color: #007bff;
  background: #f8f9ff;
}

.file-btn.active {
  border-color: #007bff;
  background: #007bff;
  color: white;
}

.file-btn small {
  margin-top: 4px;
  opacity: 0.8;
  font-size: 11px;
}

.current-file-info, .preview-section, .preview-status, .utils-test {
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.current-file-info h3, .preview-section h3, .preview-status h3, .utils-test h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.file-details {
  display: grid;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-item strong {
  min-width: 100px;
  color: #555;
}

.supported {
  color: #28a745;
  font-weight: 600;
}

.unsupported {
  color: #dc3545;
  font-weight: 600;
}

.browser-support {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.browser-support span {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f8f9fa;
}

.preview-container {
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.status-info {
  display: grid;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.status-item strong {
  min-width: 100px;
  color: #555;
}

.error-text {
  color: #dc3545;
  font-family: monospace;
}

.utils-results {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.utils-output {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  font-size: 12px;
  line-height: 1.4;
  overflow-x: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-preview-test {
    padding: 15px;
  }
  
  .test-files {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 8px;
  }
  
  .file-btn {
    min-width: auto;
    padding: 10px 8px;
  }
  
  .preview-container {
    height: 400px;
  }
  
  .detail-item, .status-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .detail-item strong, .status-item strong {
    min-width: auto;
  }
}
</style>
