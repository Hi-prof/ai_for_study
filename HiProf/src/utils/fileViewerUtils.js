/**
 * 现代文件预览器工具函数
 * 支持多种文件类型的智能预览
 */

// 文件类型映射
const FILE_TYPE_MAP = {
  // Office 文档
  'doc': 'office',
  'docx': 'office', 
  'xls': 'office',
  'xlsx': 'office',
  'ppt': 'office',
  'pptx': 'office',
  
  // PDF
  'pdf': 'pdf',
  
  // 图片
  'jpg': 'image',
  'jpeg': 'image',
  'png': 'image',
  'gif': 'image',
  'bmp': 'image',
  'svg': 'image',
  'webp': 'image',
  'ico': 'image',
  
  // 视频
  'mp4': 'video',
  'webm': 'video',
  'ogg': 'video',
  'avi': 'video',
  'mov': 'video',
  'wmv': 'video',
  'flv': 'video',
  
  // 音频
  'mp3': 'audio',
  'wav': 'audio',
  'ogg': 'audio',
  'aac': 'audio',
  'm4a': 'audio',
  'wma': 'audio',
  
  // 文本
  'txt': 'text',
  'md': 'text',
  'markdown': 'text',
  'json': 'text',
  'xml': 'text',
  'csv': 'text',
  'js': 'text',
  'ts': 'text',
  'vue': 'text',
  'html': 'text',
  'css': 'text',
  'scss': 'text',
  'sass': 'text',
  'less': 'text',
  'yml': 'text',
  'yaml': 'text',
  'sql': 'text',
  'py': 'text',
  'java': 'text',
  'cpp': 'text',
  'c': 'text',
  'php': 'text',
  'go': 'text',
  'rs': 'text',
  'rb': 'text'
};

/**
 * 获取文件扩展名
 * @param {string} fileName - 文件名
 * @returns {string} 扩展名（小写）
 */
export function getFileExtension(fileName) {
  if (!fileName || typeof fileName !== 'string') return '';
  
  const parts = fileName.split('.');
  if (parts.length < 2) return '';
  
  return parts.pop().toLowerCase();
}

/**
 * 获取文件类型分类
 * @param {string} fileName - 文件名
 * @returns {string} 文件类型分类
 */
export function getFileType(fileName) {
  const ext = getFileExtension(fileName);
  return FILE_TYPE_MAP[ext] || 'unknown';
}

/**
 * 检查是否为支持预览的文件类型
 * @param {string} fileName - 文件名
 * @returns {boolean} 是否支持预览
 */
export function isPreviewSupported(fileName) {
  const fileType = getFileType(fileName);
  return fileType !== 'unknown';
}

/**
 * 获取文件图标
 * @param {string} fileName - 文件名
 * @returns {string} 文件图标emoji
 */
export function getFileIcon(fileName) {
  const fileType = getFileType(fileName);
  const ext = getFileExtension(fileName);
  
  const iconMap = {
    'office': {
      'doc': '📝', 'docx': '📝',
      'xls': '📊', 'xlsx': '📊', 
      'ppt': '📽️', 'pptx': '📽️'
    },
    'pdf': '📄',
    'image': '🖼️',
    'video': '🎥',
    'audio': '🎵',
    'text': '📄',
    'unknown': '📄'
  };
  
  if (fileType === 'office' && iconMap.office[ext]) {
    return iconMap.office[ext];
  }
  
  return iconMap[fileType] || iconMap.unknown;
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  if (!bytes || bytes < 0) return 'Unknown';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 检查文件是否过大（不建议预览）
 * @param {number} fileSize - 文件大小（字节）
 * @param {string} fileName - 文件名
 * @returns {boolean} 是否过大
 */
export function isFileTooLarge(fileSize, fileName) {
  if (!fileSize || fileSize <= 0) return false;
  
  const fileType = getFileType(fileName);
  const limits = {
    'pdf': 50 * 1024 * 1024,      // 50MB
    'office': 20 * 1024 * 1024,   // 20MB
    'image': 10 * 1024 * 1024,    // 10MB
    'video': 100 * 1024 * 1024,   // 100MB
    'audio': 50 * 1024 * 1024,    // 50MB
    'text': 5 * 1024 * 1024,      // 5MB
    'unknown': 10 * 1024 * 1024   // 10MB
  };
  
  return fileSize > (limits[fileType] || limits.unknown);
}

/**
 * 验证文件URL是否有效
 * @param {string} url - 文件URL
 * @returns {Promise<boolean>} URL是否有效
 */
export async function validateFileUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('文件URL验证失败:', error);
    return false;
  }
}

/**
 * 获取Microsoft Office Online预览URL
 * @param {string} fileUrl - 原始文件URL
 * @param {string} fileName - 文件名
 * @returns {string|null} Office Online预览URL或null
 */
export function getOfficePreviewUrl(fileUrl, fileName) {
  const fileType = getFileType(fileName);
  if (fileType !== 'office') return null;
  
  try {
    const encodedUrl = encodeURIComponent(fileUrl);
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
  } catch (error) {
    console.error('生成Office预览URL失败:', error);
    return null;
  }
}

/**
 * 获取PDF预览URL（带参数优化）
 * @param {string} fileUrl - 原始PDF文件URL
 * @returns {string} 优化后的PDF URL
 */
export function getPdfPreviewUrl(fileUrl) {
  if (!fileUrl) return '';
  
  // 添加PDF查看器参数
  const params = [
    'toolbar=1',      // 显示工具栏
    'navpanes=1',     // 显示导航面板
    'scrollbar=1',    // 显示滚动条
    'page=1',         // 从第一页开始
    'view=FitH'       // 适合宽度
  ].join('&');
  
  return `${fileUrl}#${params}`;
}

/**
 * 下载文件
 * @param {string} fileUrl - 文件URL
 * @param {string} fileName - 文件名
 */
export function downloadFile(fileUrl, fileName) {
  try {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'download';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // 添加到DOM，点击，然后移除
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('文件下载失败:', error);
    // 如果下载失败，尝试在新窗口打开
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  }
}

/**
 * 获取文件MIME类型
 * @param {string} fileName - 文件名
 * @returns {string} MIME类型
 */
export function getMimeType(fileName) {
  const ext = getFileExtension(fileName);
  
  const mimeTypes = {
    // Office
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // PDF
    'pdf': 'application/pdf',
    
    // 图片
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    
    // 视频
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    
    // 音频
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'aac': 'audio/aac',
    'm4a': 'audio/mp4',
    
    // 文本
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'csv': 'text/csv'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 检查浏览器是否支持某种文件类型的预览
 * @param {string} fileName - 文件名
 * @returns {object} 支持信息
 */
export function getBrowserSupport(fileName) {
  const fileType = getFileType(fileName);
  const mimeType = getMimeType(fileName);
  
  // 检查浏览器支持
  const video = document.createElement('video');
  const audio = document.createElement('audio');
  
  return {
    fileType,
    mimeType,
    nativeSupport: {
      video: fileType === 'video' ? video.canPlayType(mimeType) !== '' : false,
      audio: fileType === 'audio' ? audio.canPlayType(mimeType) !== '' : false,
      image: fileType === 'image',
      pdf: fileType === 'pdf' && 'application/pdf' in navigator.mimeTypes,
      text: fileType === 'text'
    }
  };
}

/**
 * 生成文件预览的配置对象
 * @param {string} fileUrl - 文件URL
 * @param {string} fileName - 文件名
 * @param {number} fileSize - 文件大小
 * @returns {object} 预览配置
 */
export function generatePreviewConfig(fileUrl, fileName, fileSize = 0) {
  const fileType = getFileType(fileName);
  const icon = getFileIcon(fileName);
  const sizeFormatted = formatFileSize(fileSize);
  const tooLarge = isFileTooLarge(fileSize, fileName);
  const browserSupport = getBrowserSupport(fileName);
  
  return {
    fileUrl,
    fileName,
    fileSize: sizeFormatted,
    fileType,
    icon,
    supported: isPreviewSupported(fileName),
    tooLarge,
    browserSupport,
    previewUrls: {
      office: getOfficePreviewUrl(fileUrl, fileName),
      pdf: fileType === 'pdf' ? getPdfPreviewUrl(fileUrl) : null,
      direct: fileUrl
    }
  };
}
