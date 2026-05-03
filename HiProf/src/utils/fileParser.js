/**
 * 文件解析工具模块
 * 支持解析 .txt、.pdf、.docx、.pptx 格式的文件
 */

import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

// 动态导入，避免构建时的问题
let JSZip = null;
let pdfjsLib = null;

// 延迟加载JSZip库
async function loadJSZip() {
  if (!JSZip) {
    try {
      const jsZipModule = await import('jszip');
      JSZip = jsZipModule.default;
    } catch (error) {
      console.error('JSZip库加载失败:', error);
      throw new Error('文件解压功能不可用，请联系管理员');
    }
  }
  return JSZip;
}

// 延迟加载 PDF 解析库
async function loadPdfParser() {
  if (!pdfjsLib) {
    try {
      pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    } catch (error) {
      console.error('PDF解析库加载失败:', error);
      throw new Error('PDF解析功能加载失败，请联系管理员');
    }
  }
  return pdfjsLib;
}

/**
 * 文件解析配置
 */
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
  ],
  ALLOWED_EXTENSIONS: ['.txt', '.pdf', '.docx', '.pptx']
};

/**
 * 验证文件是否符合要求
 * @param {File} file - 文件对象
 * @throws {Error} 如果文件不符合要求
 */
export function validateFile(file) {
  // 检查文件大小
  if (file.size > FILE_CONFIG.MAX_FILE_SIZE) {
    throw new Error(`文件大小超过限制 (最大 ${FILE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }
  
  // 检查文件类型
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  if (!FILE_CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension)) {
    throw new Error(`不支持的文件类型: ${fileExtension}。支持的格式: ${FILE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`);
  }
}

/**
 * 解析文本文件
 * @param {File} file - 文件对象
 * @returns {Promise<string>} 文件内容
 */
async function parseTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    
    reader.onerror = () => {
      reject(new Error('文本文件读取失败'));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * 解析 PDF 文档
 * @param {File} file - PDF文件对象
 * @returns {Promise<string>} 提取的文本内容
 */
async function parsePdfFile(file) {
  const normalizePdfText = (text) => text
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  const extractTextFromPdfItems = (items = []) => {
    const lines = [];
    let currentLine = [];
    let lastY = null;

    items.forEach((item) => {
      const segment = item?.str ? item.str.trim() : '';
      if (!segment) {
        return;
      }

      const y = Number(item?.transform?.[5] ?? 0);
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        const lineText = currentLine.join(' ').trim();
        if (lineText) {
          lines.push(lineText);
        }
        currentLine = [];
      }

      currentLine.push(segment);
      lastY = y;
    });

    const tailLine = currentLine.join(' ').trim();
    if (tailLine) {
      lines.push(tailLine);
    }

    return lines.join('\n');
  };

  try {
    const pdfjs = await loadPdfParser();
    const pdfData = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({
      data: pdfData,
      useWorkerFetch: false,
      isEvalSupported: false
    });
    const pdf = await loadingTask.promise;
    const pageTexts = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = normalizePdfText(extractTextFromPdfItems(textContent.items));
      if (pageText) {
        pageTexts.push(pageText);
      }
      page.cleanup();
    }

    const extractedText = normalizePdfText(pageTexts.join('\n\n'));
    if (!extractedText) {
      throw new Error('当前PDF未提取到可用文本，可能是扫描件或纯图片内容');
    }

    return extractedText;
  } catch (error) {
    console.error('PDF文件解析失败:', error);

    if (error?.name === 'PasswordException') {
      throw new Error('PDF文件已加密，暂不支持直接解析，请先移除密码后重试');
    }

    if (error?.message?.includes('Invalid PDF')) {
      throw new Error('PDF文件损坏或格式异常，无法解析，请检查文件后重试');
    }

    if (error?.message?.includes('扫描件或纯图片内容')) {
      throw error;
    }

    throw new Error('PDF文件解析失败，请确认文件未加密且包含可复制文本内容');
  }
}

/**
 * 解析Word文档文件 (.docx)
 * @param {File} file - Word文档文件对象
 * @returns {Promise<string>} 提取的文本内容
 */
async function parseDocxFile(file) {
  try {
    const JSZipLib = await loadJSZip();
    const arrayBuffer = await file.arrayBuffer();
    const zip = new JSZipLib();
    const zipContent = await zip.loadAsync(arrayBuffer);
    const xmlFiles = [];

    zipContent.forEach((relativePath, zipEntry) => {
      if (
        relativePath === 'word/document.xml' ||
        /^word\/(header|footer|footnotes|endnotes|comments)\d*\.xml$/.test(relativePath)
      ) {
        xmlFiles.push({ path: relativePath, file: zipEntry });
      }
    });

    xmlFiles.sort((a, b) => {
      if (a.path === 'word/document.xml') return -1;
      if (b.path === 'word/document.xml') return 1;
      return a.path.localeCompare(b.path);
    });

    const textParts = [];
    for (const xmlFile of xmlFiles) {
      const xmlContent = await xmlFile.file.async('text');
      const extractedText = extractTextFromWordXml(xmlContent);
      if (extractedText) {
        textParts.push(extractedText);
      }
    }

    const cleanedText = cleanupOfficeText(textParts.join('\n\n'));
    if (!cleanedText || cleanedText.length < 10) {
      throw new Error('Word文档中没有可提取的文本内容');
    }

    return cleanedText;
  } catch (error) {
    console.error('Word文档解析失败:', error);
    throw new Error('Word文档解析失败，请确认文件为未损坏的 .docx 文档');
  }
}

/**
 * 解析PowerPoint文件 (.pptx)
 * @param {File} file - PowerPoint文件对象
 * @returns {Promise<string>} 提取的文本内容
 */
async function parsePptxFile(file) {
  try {
    const JSZipLib = await loadJSZip();
    const arrayBuffer = await file.arrayBuffer();

    // 使用JSZip解压PPTX文件
    const zip = new JSZipLib();
    const zipContent = await zip.loadAsync(arrayBuffer);

    let text = '';
    let slideCount = 0;

    // 遍历所有幻灯片文件
    const slideFiles = [];
    zipContent.forEach((relativePath, file) => {
      if (relativePath.startsWith('ppt/slides/slide') && relativePath.endsWith('.xml')) {
        slideFiles.push({ path: relativePath, file });
      }
    });

    // 按文件名排序，确保幻灯片顺序正确
    slideFiles.sort((a, b) => {
      const aNum = parseInt(a.path.match(/slide(\d+)\.xml/)?.[1] || '0');
      const bNum = parseInt(b.path.match(/slide(\d+)\.xml/)?.[1] || '0');
      return aNum - bNum;
    });

    // 解析每个幻灯片
    for (const slideFile of slideFiles) {
      try {
        slideCount++;
        const xmlContent = await slideFile.file.async('text');

        // 使用优化的文本提取方法
        const slideText = extractTextFromPPTXSlide(xmlContent);

        if (slideText.trim()) {
          text += `\n=== 幻灯片 ${slideCount} ===\n`;
          text += slideText + '\n';
        }
      } catch (slideError) {
        console.warn(`解析幻灯片 ${slideCount} 失败:`, slideError);
        continue;
      }
    }

    if (!text || text.trim().length === 0) {
      throw new Error('PowerPoint文件中没有可提取的文本内容');
    }

    return text.trim();
  } catch (error) {
    console.error('PowerPoint解析失败:', error);
    throw new Error(`PowerPoint文件解析失败，建议您：\n1. 在PowerPoint中打开文件\n2. 选择"文件" > "另存为"\n3. 选择"纯文本(*.txt)"格式保存\n4. 重新上传txt文件`);
  }
}

function extractTextFromWordXml(xmlContent) {
  let text = '';
  const tokenPattern =
    /<w:t[^>]*>([\s\S]*?)<\/w:t>|<w:tab\s*\/>|<w:br\s*\/>|<\/w:p>|<\/w:tc>/g;
  let match;

  while ((match = tokenPattern.exec(xmlContent)) !== null) {
    const token = match[0];
    if (match[1] !== undefined) {
      text += decodeSimpleXMLEntities(match[1]);
    } else if (token.startsWith('<w:tab')) {
      text += '\t';
    } else if (token.startsWith('<w:br') || token === '</w:p>') {
      text += '\n';
    } else if (token === '</w:tc>') {
      text += '\t';
    }
  }

  return cleanupOfficeText(text);
}

function cleanupOfficeText(text) {
  return text
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

/**
 * 从PPTX幻灯片XML中提取文本内容（简化版本）
 * @param {string} xmlContent - XML内容
 * @returns {string} 提取的文本
 */
function extractTextFromPPTXSlide(xmlContent) {
  let text = '';

  try {
    // 方法1: 查找所有<a:t>标签（最常见的文本标签）
    const textRegex = /<a:t[^>]*>(.*?)<\/a:t>/gs;
    let match;

    while ((match = textRegex.exec(xmlContent)) !== null) {
      const textContent = match[1];
      if (textContent && textContent.trim()) {
        // 清理文本内容，移除任何XML残留
        let cleanText = textContent
          .replace(/<[^>]+>/g, ' ')  // 移除内部XML标签
          .replace(/\b\w+="[^"]*"/g, ' ')  // 移除XML属性
          .replace(/\b\w+='[^']*'/g, ' ')  // 移除单引号XML属性
          .trim();

        const decodedText = decodeSimpleXMLEntities(cleanText);
        if (decodedText && decodedText.length > 0) {
          text += decodedText + '\n';
        }
      }
    }

    // 方法2: 如果没有找到<a:t>标签，尝试其他可能的文本标签
    if (!text.trim()) {
      const alternativePatterns = [
        /<t[^>]*>(.*?)<\/t>/gs,
        /<text[^>]*>(.*?)<\/text>/gs,
        /<p:txBody[^>]*>(.*?)<\/p:txBody>/gs
      ];

      for (const pattern of alternativePatterns) {
        let altMatch;
        while ((altMatch = pattern.exec(xmlContent)) !== null) {
          const textContent = altMatch[1];
          if (textContent && textContent.trim()) {
            // 彻底清理XML内容，只保留纯文本
            const cleanText = textContent
              .replace(/<[^>]+>/g, ' ')  // 移除XML标签
              .replace(/\b\w+="[^"]*"/g, ' ')  // 移除XML属性
              .replace(/\b\w+='[^']*'/g, ' ')  // 移除单引号XML属性
              .replace(/[<>]/g, ' ')  // 移除尖括号
              .replace(/\s+/g, ' ')  // 合并空白字符
              .trim();

            const decodedText = decodeSimpleXMLEntities(cleanText);
            if (decodedText && decodedText.length > 2) {
              text += decodedText + '\n';
            }
          }
        }
        if (text.trim()) break; // 如果找到了文本就停止
      }
    }

    // 清理文本中的XML残留
    if (text.trim()) {
      // 移除可能残留的XML标签和属性
      text = text
        .replace(/<[^>]+>/g, ' ')  // 移除XML标签
        .replace(/\b\w+="[^"]*"/g, ' ')  // 移除XML属性
        .replace(/\b\w+='[^']*'/g, ' ')  // 移除单引号XML属性
        .replace(/[<>]/g, ' ')  // 移除尖括号
        .replace(/\s+/g, ' ')  // 合并多个空白字符
        .trim();
    }

    // 方法3: 最后的备用方案 - 如果前面的方法都没有提取到干净的文本
    if (!text.trim()) {
      const cleanXML = xmlContent
        .replace(/<[^>]+>/g, ' ')  // 移除所有XML标签
        .replace(/\s+/g, ' ')      // 合并多个空白字符
        .trim();

      // 只保留可读字符
      const readableText = cleanXML
        .replace(/[^\u0020-\u007E\u4e00-\u9fa5\u3000-\u303F\uFF00-\uFFEF]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (readableText.length > 10) {  // 至少要有10个字符
        text = readableText;
      }
    }

    // 最终清理 - 确保没有XML残留
    text = text
      .replace(/<[^>]+>/g, ' ')  // 再次移除任何残留的XML标签
      .replace(/\b\w+="[^"]*"/g, ' ')  // 移除XML属性
      .replace(/\b\w+='[^']*'/g, ' ')  // 移除单引号XML属性
      .replace(/[<>]/g, ' ')  // 移除尖括号
      .replace(/\s+/g, ' ')  // 合并多个空白字符为单个空格
      .replace(/\n\s*\n/g, '\n')  // 移除多余空行
      .replace(/^\s+|\s+$/gm, '')  // 移除每行首尾空白
      .trim();

  } catch (error) {
    console.warn('PPTX文本提取失败:', error);
  }

  return text;
}

/**
 * 简单的XML实体解码
 * @param {string} text - 包含XML实体的文本
 * @returns {string} 解码后的文本
 */
function decodeSimpleXMLEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => {
      try {
        return String.fromCharCode(parseInt(dec));
      } catch (e) {
        return match;
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch (e) {
        return match;
      }
    })
    .trim();
}

/**
 * 根据文件类型解析文件内容
 * @param {File} file - 文件对象
 * @returns {Promise<string>} 解析后的文本内容
 */
export async function parseFileContent(file) {
  // 验证文件
  validateFile(file);
  
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  
  try {
    switch (fileExtension) {
      case '.txt':
        return await parseTextFile(file);

      case '.pdf':
        return await parsePdfFile(file);

      case '.docx':
        return await parseDocxFile(file);

      case '.pptx':
        return await parsePptxFile(file);

      default:
        throw new Error(`不支持的文件格式: ${fileExtension}`);
    }
  } catch (error) {
    console.error(`文件解析失败 (${file.name}):`, error);
    throw error;
  }
}

/**
 * 获取文件类型的友好名称
 * @param {string} fileName - 文件名
 * @returns {string} 文件类型名称
 */
export function getFileTypeName(fileName) {
  const extension = '.' + fileName.split('.').pop().toLowerCase();
  
  const typeNames = {
    '.txt': '文本文件',
    '.pdf': 'PDF文档',
    '.docx': 'Word文档',
    '.pptx': 'PowerPoint演示文稿'
  };
  
  return typeNames[extension] || '未知文件';
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
