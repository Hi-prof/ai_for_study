/**
 * 文件压缩工具类
 * 支持PPT/PPTX文件的压缩，通过压缩内部图片和优化存储格式来减小文件大小
 */

import JSZip from 'jszip';
import imageCompression from 'browser-image-compression';

/**
 * PPT文件压缩器
 */
export class PPTCompressor {
  constructor(options = {}) {
    this.options = {
      // 图片压缩选项
      imageCompression: {
        maxSizeMB: 0.3, // 图片最大大小0.3MB (更激进的压缩)
        maxWidthOrHeight: 1600, // 最大尺寸1600px (降低分辨率)
        useWebWorker: true,
        initialQuality: 0.7, // 初始质量70% (更低质量)
        alwaysKeepResolution: false
      },
      // 目标文件大小（MB）- 压缩到9MB以确保不超过10MB服务器限制
      targetSizeMB: 9,
      // 压缩级别 (1-9, 9为最高压缩)
      compressionLevel: 8, // 提高压缩级别
      // 是否保留原始文件名
      preserveOriginalName: true,
      // 进度回调
      onProgress: null,
      ...options
    };
  }

  /**
   * 根据文件大小调整压缩参数
   * @param {File} file - 原始文件
   */
  adjustCompressionSettings(file) {
    const fileSizeMB = file.size / 1024 / 1024;
    const targetSizeMB = this.options.targetSizeMB;
    
    if (fileSizeMB > 30) {
      // 超大文件（>30MB），需要最激进压缩
      this.options.imageCompression.maxSizeMB = 0.15;
      this.options.imageCompression.maxWidthOrHeight = 1200;
      this.options.imageCompression.initialQuality = 0.5;
      this.options.compressionLevel = 9;
      this.options.targetSizeMB = 8; // 更严格的目标
    } else if (fileSizeMB > 20) {
      // 很大文件（>20MB），需要激进压缩
      this.options.imageCompression.maxSizeMB = 0.2;
      this.options.imageCompression.maxWidthOrHeight = 1400;
      this.options.imageCompression.initialQuality = 0.6;
      this.options.compressionLevel = 9;
    } else if (fileSizeMB > 15) {
      // 文件较大（>15MB），需要中等压缩
      this.options.imageCompression.maxSizeMB = 0.25;
      this.options.imageCompression.maxWidthOrHeight = 1500;
      this.options.imageCompression.initialQuality = 0.65;
      this.options.compressionLevel = 8;
    }
  }

  /**
   * 压缩PPT文件
   * @param {File} file - 原始PPT文件
   * @returns {Promise<File>} 压缩后的文件
   */
  async compressFile(file) {
    try {
      // 根据文件大小调整压缩参数
      this.adjustCompressionSettings(file);
      
      // 更新进度
      this.updateProgress(0, '正在读取文件...');

      // 读取ZIP内容
      const zip = new JSZip();
      await zip.loadAsync(file);
      
      this.updateProgress(10, '正在分析文件结构...');

      // 创建新的ZIP实例用于压缩后的内容
      const compressedZip = new JSZip();
      
      let processedFiles = 0;
      const totalFiles = Object.keys(zip.files).length;
      let imageCount = 0;
      let compressedImageCount = 0;

      // 遍历ZIP中的所有文件
      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        try {
          if (zipEntry.dir) {
            // 创建目录
            compressedZip.folder(relativePath);
          } else {
            const content = await zipEntry.async('uint8array');
            
            // 检查是否为图片文件
            if (this.isImageFile(relativePath)) {
              imageCount++;
              this.updateProgress(
                10 + (processedFiles / totalFiles) * 70,
                `正在压缩图片 ${imageCount}...`
              );

              try {
                // 压缩图片
                const compressedImage = await this.compressImage(content, relativePath);
                compressedZip.file(relativePath, compressedImage);
                compressedImageCount++;
              } catch (imageError) {
                console.warn(`图片压缩失败，使用原图片: ${relativePath}`, imageError);
                compressedZip.file(relativePath, content);
              }
            } else if (this.isXMLFile(relativePath)) {
              // 压缩XML文件（移除不必要的空白字符）
              const compressedXML = this.compressXML(content);
              compressedZip.file(relativePath, compressedXML);
            } else {
              // 其他文件直接复制
              compressedZip.file(relativePath, content);
            }
          }
          
          processedFiles++;
        } catch (error) {
          // 出错时使用原始内容
          const content = await zipEntry.async('uint8array');
          compressedZip.file(relativePath, content);
        }
      }

      this.updateProgress(80, '正在生成压缩文件...');

      // 生成压缩后的ZIP文件
      const compressedArrayBuffer = await compressedZip.generateAsync({
        type: 'arraybuffer',
        compression: 'DEFLATE',
        compressionOptions: {
          level: this.options.compressionLevel
        }
      });

      this.updateProgress(90, '正在创建文件对象...');

      // 创建新的File对象
      const compressedBlob = new Blob([compressedArrayBuffer], {
        type: file.type
      });

      const compressedFile = new File([compressedBlob], file.name, {
        type: file.type,
        lastModified: Date.now()
      });

      this.updateProgress(100, '压缩完成!');

      const originalSizeMB = file.size / 1024 / 1024;
      const compressedSizeMB = compressedFile.size / 1024 / 1024;
      const compressionRatio = ((originalSizeMB - compressedSizeMB) / originalSizeMB * 100).toFixed(1);

      // 检查压缩后的文件是否符合服务器限制（10MB）
      const serverLimitMB = 10;
      if (compressedSizeMB > serverLimitMB) {
        throw new Error(`文件压缩后仍然过大(${compressedSizeMB.toFixed(2)}MB)，超过服务器限制(${serverLimitMB}MB)。请尝试使用更小的文件或联系管理员。`);
      }

      return compressedFile;

    } catch (error) {
      console.error('PPT压缩失败:', error);
      throw new Error(`文件压缩失败: ${error.message}`);
    }
  }

  /**
   * 压缩图片
   * @param {Uint8Array} imageData - 图片数据
   * @param {string} filename - 文件名
   * @returns {Promise<Uint8Array>} 压缩后的图片数据
   */
  async compressImage(imageData, filename) {
    try {
      // 将Uint8Array转换为Blob
      const blob = new Blob([imageData], { type: this.getMimeType(filename) });
      
      // 如果图片已经很小，直接返回
      if (blob.size < 100 * 1024) { // 小于100KB
        return imageData;
      }

      // 转换为File对象以便使用browser-image-compression
      const file = new File([blob], filename, { type: blob.type });

      // 压缩图片
      const compressedFile = await imageCompression(file, this.options.imageCompression);
      
      // 转换回Uint8Array
      const arrayBuffer = await compressedFile.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      return imageData; // 返回原始数据
    }
  }

  /**
   * 压缩XML内容
   * @param {Uint8Array} xmlData - XML数据
   * @returns {Uint8Array} 压缩后的XML数据
   */
  compressXML(xmlData) {
    try {
      // 转换为字符串
      const xmlString = new TextDecoder('utf-8').decode(xmlData);
      
      // 移除多余的空白字符和换行符
      const compressedXML = xmlString
        .replace(/>\s+</g, '><') // 移除标签间的空白
        .replace(/\s+/g, ' ') // 合并多个空格为一个
        .trim();
      
      // 转换回Uint8Array
      return new TextEncoder().encode(compressedXML);
    } catch (error) {
      return xmlData;
    }
  }

  /**
   * 检查是否为图片文件
   * @param {string} filename - 文件名
   * @returns {boolean}
   */
  isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return imageExtensions.includes(ext);
  }

  /**
   * 检查是否为XML文件
   * @param {string} filename - 文件名
   * @returns {boolean}
   */
  isXMLFile(filename) {
    return filename.toLowerCase().endsWith('.xml') || filename.toLowerCase().endsWith('.rels');
  }

  /**
   * 根据文件扩展名获取MIME类型
   * @param {string} filename - 文件名
   * @returns {string} MIME类型
   */
  getMimeType(filename) {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.tiff': 'image/tiff'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * 更新进度
   * @param {number} percent - 进度百分比
   * @param {string} message - 进度消息
   */
  updateProgress(percent, message) {
    if (typeof this.options.onProgress === 'function') {
      this.options.onProgress(percent, message);
    }
  }

  /**
   * 检查文件是否需要压缩
   * @param {File} file - 文件对象
   * @returns {boolean}
   */
  static shouldCompress(file) {
    // 检查文件类型
    const supportedTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint' // .ppt
    ];
    
    if (!supportedTypes.includes(file.type)) {
      return false;
    }

    // 检查文件大小（大于10MB才压缩，适配服务器限制）
    const fileSizeMB = file.size / 1024 / 1024;
    return fileSizeMB > 10;
  }

  /**
   * 估算压缩后的文件大小
   * @param {File} file - 原始文件
   * @returns {Promise<number>} 估算的压缩后大小（字节）
   */
  static async estimateCompressedSize(file) {
    try {
      // 简单的估算：假设平均压缩率为30-50%
      const originalSize = file.size;
      const estimatedCompressionRatio = 0.4; // 40%的压缩率
      return Math.floor(originalSize * estimatedCompressionRatio);
    } catch (error) {
      return file.size; // 返回原始大小
    }
  }
}

/**
 * 通用文件压缩函数
 * @param {File} file - 要压缩的文件
 * @param {Object} options - 压缩选项
 * @returns {Promise<File>} 压缩后的文件
 */
export async function compressFile(file, options = {}) {
  const fileSizeMB = file.size / 1024 / 1024;
  
  // 检查是否支持该文件类型的压缩
  if (PPTCompressor.shouldCompress(file)) {
    const compressor = new PPTCompressor(options);
    return await compressor.compressFile(file);
  } else {
    // 不支持压缩的文件，直接返回
    return file;
  }
}

/**
 * 批量压缩文件
 * @param {File[]} files - 文件数组
 * @param {Object} options - 压缩选项
 * @returns {Promise<File[]>} 压缩后的文件数组
 */
export async function compressFiles(files, options = {}) {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const compressedFile = await compressFile(file, {
        ...options,
        onProgress: (percent, message) => {
          if (options.onProgress) {
            const overallPercent = Math.floor((i / files.length) * 100 + (percent / files.length));
            options.onProgress(overallPercent, `文件 ${i + 1}/${files.length}: ${message}`);
          }
        }
      });
      results.push(compressedFile);
    } catch (error) {
      // 压缩失败时使用原文件
      results.push(file);
    }
  }
  
  return results;
}

export default {
  PPTCompressor,
  compressFile,
  compressFiles
};
