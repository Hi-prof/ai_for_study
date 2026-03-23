<template>
  <div class="compression-demo">
    <h3>文件压缩功能演示</h3>
    
    <!-- 文件选择区域 -->
    <div class="demo-section">
      <h4>1. 选择要压缩的PPT文件</h4>
      <input 
        type="file" 
        accept=".ppt,.pptx" 
        @change="handleFileSelect"
        ref="fileInput"
      >
      
      <div v-if="selectedFile" class="file-info">
        <p><strong>文件名:</strong> {{ selectedFile.name }}</p>
        <p><strong>原始大小:</strong> {{ formatFileSize(selectedFile.size) }}</p>
        <p><strong>文件类型:</strong> {{ selectedFile.type }}</p>
      </div>
    </div>

    <!-- 压缩选项 -->
    <div v-if="selectedFile" class="demo-section">
      <h4>2. 压缩选项</h4>
      <div class="options-grid">
        <div class="option-item">
          <label>目标文件大小 (MB):</label>
          <input 
            type="number" 
            v-model="compressionOptions.targetSizeMB" 
            min="1" 
            max="50"
            step="0.5"
          >
        </div>
        
        <div class="option-item">
          <label>图片压缩质量:</label>
          <input 
            type="range" 
            v-model="compressionOptions.imageQuality" 
            min="0.1" 
            max="1" 
            step="0.1"
          >
          <span>{{ Math.round(compressionOptions.imageQuality * 100) }}%</span>
        </div>
        
        <div class="option-item">
          <label>压缩级别:</label>
          <select v-model="compressionOptions.compressionLevel">
            <option value="1">1 - 最快</option>
            <option value="3">3 - 快</option>
            <option value="6">6 - 平衡</option>
            <option value="9">9 - 最佳压缩</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 压缩操作 -->
    <div v-if="selectedFile" class="demo-section">
      <h4>3. 开始压缩</h4>
      <button 
        @click="startCompression" 
        :disabled="isCompressing"
        class="compress-btn"
      >
        {{ isCompressing ? '压缩中...' : '开始压缩' }}
      </button>
      
      <!-- 压缩进度 -->
      <div v-if="isCompressing" class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: compressionProgress + '%' }"
          ></div>
        </div>
        <p class="progress-text">{{ progressMessage }}</p>
        <p class="progress-percent">{{ compressionProgress }}%</p>
      </div>
    </div>

    <!-- 压缩结果 -->
    <div v-if="compressedFile" class="demo-section">
      <h4>4. 压缩结果</h4>
      <div class="result-container">
        <div class="result-comparison">
          <div class="original-info">
            <h5>原始文件</h5>
            <p>大小: {{ formatFileSize(selectedFile.size) }}</p>
          </div>
          
          <div class="arrow">→</div>
          
          <div class="compressed-info">
            <h5>压缩后</h5>
            <p>大小: {{ formatFileSize(compressedFile.size) }}</p>
            <p class="compression-ratio">
              压缩率: {{ compressionRatio }}%
            </p>
          </div>
        </div>
        
        <div class="download-actions">
          <button @click="downloadCompressed" class="download-btn">
            下载压缩文件
          </button>
          <button @click="resetDemo" class="reset-btn">
            重新选择文件
          </button>
        </div>
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { compressFile } from './FileCompressionUtils.js';

// 响应式数据
const selectedFile = ref(null);
const compressedFile = ref(null);
const isCompressing = ref(false);
const compressionProgress = ref(0);
const progressMessage = ref('');
const errorMessage = ref('');
const fileInput = ref(null);

// 压缩选项
const compressionOptions = ref({
  targetSizeMB: 10,
  imageQuality: 0.8,
  compressionLevel: 6
});

// 计算压缩率
const compressionRatio = computed(() => {
  if (!selectedFile.value || !compressedFile.value) return 0;
  const original = selectedFile.value.size;
  const compressed = compressedFile.value.size;
  return Math.round((1 - compressed / original) * 100);
});

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    compressedFile.value = null;
    errorMessage.value = '';
    
    // 检查文件类型
    if (!file.type.includes('presentation') && !file.name.toLowerCase().endsWith('.ppt') && !file.name.toLowerCase().endsWith('.pptx')) {
      errorMessage.value = '请选择PPT或PPTX文件';
      selectedFile.value = null;
      return;
    }
    
    console.log('选择的文件:', file);
  }
};

// 开始压缩
const startCompression = async () => {
  if (!selectedFile.value) return;
  
  isCompressing.value = true;
  compressionProgress.value = 0;
  progressMessage.value = '初始化压缩...';
  errorMessage.value = '';
  
  try {
    const compressed = await compressFile(selectedFile.value, {
      targetSizeMB: compressionOptions.value.targetSizeMB,
      compressionLevel: compressionOptions.value.compressionLevel,
      imageCompression: {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: compressionOptions.value.imageQuality,
        alwaysKeepResolution: false
      },
      onProgress: (percent, message) => {
        compressionProgress.value = percent;
        progressMessage.value = message;
      }
    });
    
    compressedFile.value = compressed;
    console.log('压缩完成:', compressed);
    
  } catch (error) {
    console.error('压缩失败:', error);
    errorMessage.value = `压缩失败: ${error.message}`;
  } finally {
    isCompressing.value = false;
  }
};

// 下载压缩文件
const downloadCompressed = () => {
  if (!compressedFile.value) return;
  
  const url = URL.createObjectURL(compressedFile.value);
  const link = document.createElement('a');
  link.href = url;
  link.download = `compressed_${selectedFile.value.name}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 重置演示
const resetDemo = () => {
  selectedFile.value = null;
  compressedFile.value = null;
  isCompressing.value = false;
  compressionProgress.value = 0;
  progressMessage.value = '';
  errorMessage.value = '';
  fileInput.value.value = '';
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style scoped>
.compression-demo {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Arial', sans-serif;
}

.demo-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: #f9fafb;
}

.demo-section h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  border-bottom: 2px solid #6366f1;
  padding-bottom: 0.5rem;
}

.file-info {
  margin-top: 1rem;
  padding: 1rem;
  background-color: white;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
}

.file-info p {
  margin: 0.5rem 0;
  color: #374151;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-item label {
  font-weight: 500;
  color: #374151;
}

.option-item input,
.option-item select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.option-item input[type="range"] {
  margin-bottom: 0.25rem;
}

.compress-btn {
  background-color: #6366f1;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.compress-btn:hover:not(:disabled) {
  background-color: #4f46e5;
}

.compress-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.progress-container {
  margin-top: 1rem;
}

.progress-bar {
  width: 100%;
  height: 0.75rem;
  background-color: #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background-color: #6366f1;
  transition: width 0.3s ease;
}

.progress-text {
  margin: 0.5rem 0;
  color: #374151;
  font-size: 0.875rem;
}

.progress-percent {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
  text-align: center;
}

.result-container {
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
}

.result-comparison {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.original-info,
.compressed-info {
  text-align: center;
  flex: 1;
}

.original-info h5,
.compressed-info h5 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.arrow {
  font-size: 1.5rem;
  color: #6366f1;
  margin: 0 1rem;
}

.compression-ratio {
  color: #059669;
  font-weight: 600;
}

.download-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.download-btn,
.reset-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.download-btn {
  background-color: #059669;
  color: white;
}

.download-btn:hover {
  background-color: #047857;
}

.reset-btn {
  background-color: #6b7280;
  color: white;
}

.reset-btn:hover {
  background-color: #4b5563;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  color: #dc2626;
  font-size: 0.875rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .compression-demo {
    padding: 1rem;
  }
  
  .result-comparison {
    flex-direction: column;
    gap: 1rem;
  }
  
  .arrow {
    transform: rotate(90deg);
  }
  
  .download-actions {
    flex-direction: column;
  }
  
  .options-grid {
    grid-template-columns: 1fr;
  }
}
</style>
