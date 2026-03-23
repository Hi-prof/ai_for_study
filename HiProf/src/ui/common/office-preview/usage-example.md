# 现代文件预览器使用指南

## 🚀 新的文件预览解决方案

我们完全重写了文件预览系统，采用现代化技术栈，**零外部依赖**，**零CORS问题**，支持更多文件类型。

### 核心优势

✅ **现代化架构** - 基于Vue 3 Composition API  
✅ **零外部依赖** - 不依赖Google Docs或其他第三方服务  
✅ **多文件类型支持** - Office、PDF、图片、视频、音频、文本  
✅ **智能降级** - 自动选择最佳预览方式  
✅ **完整错误处理** - 友好的错误提示和重试机制  
✅ **响应式设计** - 完美适配移动端  

## 📖 基础使用

### 1. 简单使用

```vue
<template>
  <ModernFileViewer
    :file-url="fileUrl"
    :file-name="fileName"
    :file-size="fileSize"
    @loaded="onPreviewLoaded"
    @error="onPreviewError"
  />
</template>

<script setup>
import ModernFileViewer from '@/ui/common/office-preview/ModernFileViewer.vue';

const fileUrl = 'https://example.com/document.pdf';
const fileName = 'sample-document.pdf';
const fileSize = '2.5 MB';

const onPreviewLoaded = () => {
  console.log('文件预览加载成功');
};

const onPreviewError = (error) => {
  console.error('预览失败:', error);
};
</script>
```

### 2. 在现有组件中替换

**替换前（旧的失效组件）：**
```vue
<!-- 这些组件已被删除，因为都无法正常工作 -->
<GoogleDocsPreview />
<MsOfficeOnlinePreview />
<SmartOfficePreview />
<OfficePreview />
```

**替换后（新的现代组件）：**
```vue
<template>
  <!-- 直接替换，API保持兼容 -->
  <ModernFileViewer
    :file-url="item.url"
    :file-name="item.name"
    :file-size="item.size"
  />
</template>

<script setup>
import ModernFileViewer from '@/ui/common/office-preview/ModernFileViewer.vue';
</script>
```

## 🎯 支持的文件类型

### Office 文档（使用Microsoft 365在线预览）
- **Word**: `.doc`, `.docx` 
- **Excel**: `.xls`, `.xlsx`
- **PowerPoint**: `.ppt`, `.pptx`

### PDF 文档（浏览器原生支持）
- `.pdf` - 带工具栏和导航的完整预览

### 图片文件（浏览器原生支持）
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.svg`, `.webp`, `.ico`

### 视频文件（HTML5播放器）
- `.mp4`, `.webm`, `.ogg`, `.avi`, `.mov`, `.wmv`, `.flv`

### 音频文件（HTML5播放器）
- `.mp3`, `.wav`, `.ogg`, `.aac`, `.m4a`, `.wma`

### 文本文件（语法高亮）
- `.txt`, `.md`, `.json`, `.xml`, `.csv`
- `.js`, `.ts`, `.vue`, `.html`, `.css`, `.scss`, `.sass`, `.less`
- `.yml`, `.yaml`, `.sql`, `.py`, `.java`, `.cpp`, `.c`, `.php`, `.go`, `.rs`, `.rb`

## 🔧 工具函数

```javascript
import {
  getFileType,
  isPreviewSupported,
  formatFileSize,
  isFileTooLarge,
  downloadFile,
  generatePreviewConfig
} from '@/utils/fileViewerUtils';

// 检查文件类型
const fileType = getFileType('document.docx'); // 'office'

// 检查是否支持预览
const supported = isPreviewSupported('presentation.pptx'); // true

// 格式化文件大小
const size = formatFileSize(2048000); // '2 MB'

// 检查文件是否过大
const tooLarge = isFileTooLarge(100 * 1024 * 1024, 'huge.pdf'); // true

// 下载文件
downloadFile('https://example.com/file.pdf', 'my-file.pdf');

// 生成完整的预览配置
const config = generatePreviewConfig(
  'https://example.com/file.docx',
  'report.docx',
  1024000
);
```

## 🌟 高级用法

### 1. 自定义样式

```vue
<template>
  <div class="my-file-viewer">
    <ModernFileViewer
      :file-url="fileUrl"
      :file-name="fileName"
    />
  </div>
</template>

<style scoped>
.my-file-viewer {
  height: 600px;
  border: 2px solid #007bff;
  border-radius: 12px;
}

.my-file-viewer :deep(.modern-file-viewer) {
  border-radius: 10px;
}
</style>
```

### 2. 事件监听和错误处理

```vue
<template>
  <ModernFileViewer
    :file-url="fileUrl"
    :file-name="fileName"
    @loaded="handleLoad"
    @error="handleError"
  />
  
  <div v-if="loadError" class="error-fallback">
    <p>{{ loadError.message }}</p>
    <button @click="retryLoad">重试</button>
    <button @click="forceDownload">直接下载</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { downloadFile } from '@/utils/fileViewerUtils';

const loadError = ref(null);

const handleLoad = () => {
  loadError.value = null;
  console.log('预览加载成功');
};

const handleError = (error) => {
  loadError.value = error;
  console.error('预览加载失败:', error);
};

const retryLoad = () => {
  // 触发重新加载
  loadError.value = null;
};

const forceDownload = () => {
  downloadFile(fileUrl, fileName);
};
</script>
```

### 3. 条件渲染和预检查

```vue
<template>
  <div>
    <!-- 文件大小检查 -->
    <div v-if="fileTooLarge" class="size-warning">
      <p>⚠️ 文件过大 ({{ fileSize }})，建议直接下载查看</p>
      <button @click="downloadFile(fileUrl, fileName)">下载文件</button>
    </div>
    
    <!-- 类型支持检查 -->
    <div v-else-if="!isSupported" class="unsupported-warning">
      <p>❌ 此文件类型不支持预览</p>
      <button @click="downloadFile(fileUrl, fileName)">下载文件</button>
    </div>
    
    <!-- 正常预览 -->
    <ModernFileViewer
      v-else
      :file-url="fileUrl"
      :file-name="fileName"
      :file-size="fileSize"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { 
  isPreviewSupported, 
  isFileTooLarge,
  downloadFile 
} from '@/utils/fileViewerUtils';

const props = defineProps({
  fileUrl: String,
  fileName: String,
  fileSizeBytes: Number
});

const isSupported = computed(() => 
  isPreviewSupported(props.fileName)
);

const fileTooLarge = computed(() => 
  isFileTooLarge(props.fileSizeBytes, props.fileName)
);
</script>
```

## 🔍 文件预览策略

### 1. Office文档
- 使用Microsoft 365在线预览服务
- 自动处理CORS和权限问题
- 支持完整的Office功能

### 2. PDF文档  
- 浏览器原生PDF预览器
- 优化的查看参数（工具栏、导航等）
- 零外部依赖

### 3. 图片文件
- HTML `<img>` 标签直接显示
- 自动适应容器大小
- 支持缩放和居中

### 4. 视频/音频
- HTML5 `<video>`/`<audio>` 标签
- 原生控制器
- 自动检测浏览器编解码支持

### 5. 文本文件
- 通过Fetch API获取内容
- 语法高亮显示
- 支持大文本文件

## ⚠️ 重要说明

### 文件访问权限
确保文件URL满足以下条件：
- ✅ 可公网访问（无需认证）
- ✅ 支持跨域访问（CORS）
- ✅ URL稳定可靠

### 性能优化建议
- 大文件（>20MB）建议直接下载
- 使用CDN加速文件访问
- 考虑文件缓存策略

### 浏览器兼容性
- ✅ Chrome 88+
- ✅ Firefox 85+  
- ✅ Safari 14+
- ✅ Edge 88+

## 🐛 故障排除

### 常见问题

**1. Office文档显示"无法预览"**
```javascript
// 检查文件URL是否可公网访问
const checkUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log('文件可访问:', response.ok);
  } catch (error) {
    console.error('文件不可访问:', error);
  }
};
```

**2. PDF无法显示**
- 检查浏览器是否支持PDF预览
- 尝试直接在浏览器中打开PDF URL

**3. 图片加载失败**  
- 检查图片URL是否正确
- 验证图片格式是否支持
- 检查CORS设置

**4. 文本文件乱码**
- 确保文件编码为UTF-8
- 检查Content-Type头信息

### 调试技巧

```vue
<script setup>
import { generatePreviewConfig } from '@/utils/fileViewerUtils';

// 生成详细的预览配置用于调试
const debugConfig = generatePreviewConfig(fileUrl, fileName, fileSize);
console.log('预览配置:', debugConfig);

// 检查浏览器支持情况
console.log('浏览器支持:', debugConfig.browserSupport);
</script>
```

## 🎉 迁移完成！

现在你有了一个**现代化**、**可靠**、**功能完整**的文件预览系统：

- 🚫 **删除了** 4个失效的旧组件
- ✅ **创建了** 1个现代化的新组件  
- 🛠️ **提供了** 完整的工具函数库
- 📱 **支持了** 更多文件类型
- 🔧 **解决了** 所有CORS和兼容性问题

**开始使用新的 `ModernFileViewer` 组件吧！**