/**
 * 章节文件命名处理工具函数
 * 用于处理章节文件的命名、解析和分类
 */

/**
 * 生成章节文件名
 * @param {string} nodeName 节点名称，必须有有效值
 * @param {string|number} nodeId 节点ID，必须有有效值
 * @param {string} originalFileName 原始文件名
 * @returns {string} 格式化后的文件名
 */
export const generateChapterFileName = (nodeName, nodeId, originalFileName) => {
  // 使用固定的"章节文件"前缀
  const fixedPrefix = '章节文件';

  // 处理节点ID，nodeId应该始终有有效值
  if (nodeId === null || nodeId === undefined || nodeId === '') {
    throw new Error(`节点ID不能为空: ${nodeId}`);
  }

  // 处理节点名称，nodeName应该始终有有效值
  if (!nodeName || typeof nodeName !== 'string' || nodeName.trim() === '') {
    throw new Error(`节点名称不能为空: ${nodeName}`);
  }

  const safeNodeId = String(nodeId);
  const safeNodeName = nodeName.trim();

  // 确保原始文件名不为空
  if (!originalFileName || originalFileName.trim() === '') {
    throw new Error('原始文件名不能为空');
  }

  // 新格式：章节文件-{节点id}-{节点名称}-{原文件名称}
  return `${fixedPrefix}-${safeNodeId}-${safeNodeName}-${originalFileName}`;
};

/**
 * 解析章节文件名
 * @param {string} fileName 文件名
 * @returns {Object|null} 解析结果 { nodeName, nodeId, originalFileName } 或 null
 */
export const parseChapterFileName = (fileName) => {
  if (!fileName || typeof fileName !== 'string') {
    return null;
  }

  // 最新格式：章节文件-{节点ID}-{节点名称}-{原始文件名}
  // 格式：章节文件-591-第一章 课程介绍-example.pdf
  // 节点ID只能是数字或null，节点名称不能为空，原始文件名必须有扩展名
  const latestFormatMatch = fileName.match(/^章节文件-(\d+|null)-([^-]+)-(.+\..+)$/);
  if (latestFormatMatch) {
    const [, nodeIdStr, nodeName, originalFileName] = latestFormatMatch;
    return {
      nodeName: nodeName.trim(),
      nodeId: nodeIdStr === 'null' ? null : nodeIdStr,
      originalFileName: originalFileName.trim()
    };
  }

  // 向后兼容旧格式1：章节文件-{节点ID}-{原始文件名}
  // 格式：章节文件-591-example.pdf 或 章节文件-null-example.pdf
  const oldFormat1Match = fileName.match(/^章节文件-(\d+|null)-(.+\..+)$/);
  if (oldFormat1Match) {
    const [, nodeIdStr, originalFileName] = oldFormat1Match;
    return {
      nodeName: '章节文件',
      nodeId: nodeIdStr === 'null' ? null : nodeIdStr,
      originalFileName: originalFileName.trim()
    };
  }

  // 向后兼容旧格式2：{节点名称}-{节点ID}-{原始文件名}
  // 要求：节点名称不能包含连字符且不能是数字，节点ID必须是数字或null，原始文件名必须有扩展名
  const oldFormat2Match = fileName.match(/^([^-\d][^-]*)-(\d+|null)-(.+\..+)$/);
  if (oldFormat2Match) {
    const [, nodeName, nodeIdStr, originalFileName] = oldFormat2Match;
    // 额外检查：节点名称不能是纯数字或包含版本号模式
    if (!/^\d+$/.test(nodeName) && !/v\d+\.\d+/.test(nodeName)) {
      return {
        nodeName: nodeName.trim(),
        nodeId: nodeIdStr === 'null' ? null : nodeIdStr,
        originalFileName: originalFileName.trim()
      };
    }
  }

  // 如果都不匹配，返回null
  return null;
};

/**
 * 检查文件名是否为章节文件格式
 * @param {string} fileName 文件名
 * @returns {boolean} 是否为章节文件格式
 */
export const isChapterFile = (fileName) => {
  return parseChapterFileName(fileName) !== null;
};

/**
 * 根据章节信息筛选文件列表（增强版：支持ID和名称双重匹配，向后兼容旧格式）
 * @param {Array} fileList 文件列表
 * @param {string} chapterName 章节名称
 * @param {string|number|null} chapterId 章节ID
 * @returns {Array} 筛选后的文件列表
 */
export const filterFilesByChapter = (fileList, chapterName, chapterId) => {
  if (!Array.isArray(fileList)) {
    return [];
  }

  console.log(`筛选章节文件: chapterName=${chapterName}, chapterId=${chapterId}`);

  // 先尝试通过章节ID匹配
  const idMatches = fileList.filter(file => {
    if (!file.fileName) {
      return false;
    }

    const parsed = parseChapterFileName(file.fileName);
    if (!parsed) {
      return false;
    }

    // 特殊处理：如果文件的nodeId为null，不显示在任何章节中
    if (parsed.nodeId === null) {
      console.warn(`发现nodeId为null的文件，已过滤: ${file.fileName}`);
      return false;
    }

    const fileChapterId = parsed.nodeId === 'null' ? null : parsed.nodeId;
    const targetChapterId = chapterId === null || chapterId === undefined ? null : String(chapterId);
    
    const isMatch = fileChapterId === targetChapterId;
    if (isMatch) {
      console.log(`章节ID匹配成功: 文件=${file.fileName}, 解析出的nodeId=${fileChapterId}`);
    }
    
    return isMatch;
  });

  // 如果找到了ID匹配的文件，直接返回
  if (idMatches.length > 0) {
    console.log(`通过章节ID找到 ${idMatches.length} 个匹配文件`);
    return idMatches.map(file => {
      const parsed = parseChapterFileName(file.fileName);
      return {
        ...file,
        originalFileName: parsed?.originalFileName,
        parsedInfo: parsed
      };
    });
  }

  console.log('章节ID匹配失败，尝试通过章节名称匹配');

  // 如果没有找到ID匹配的文件，再尝试通过章节名称匹配
  const nameMatches = fileList.filter(file => {
    if (!file.fileName) {
      return false;
    }

    const parsed = parseChapterFileName(file.fileName);
    if (!parsed) {
      return false;
    }

    // 特殊处理：如果文件的nodeId为null，不显示在任何章节中
    if (parsed.nodeId === null) {
      console.warn(`发现nodeId为null的文件，已过滤: ${file.fileName}`);
      return false;
    }

    const isMatch = parsed.nodeName === chapterName;
    if (isMatch) {
      console.log(`章节名称匹配成功: 文件=${file.fileName}, 解析出的nodeName=${parsed.nodeName}`);
    }
    
    return isMatch;
  });

  console.log(`通过章节名称找到 ${nameMatches.length} 个匹配文件`);

  return nameMatches.map(file => {
    const parsed = parseChapterFileName(file.fileName);
    return {
      ...file,
      originalFileName: parsed?.originalFileName,
      parsedInfo: parsed
    };
  });
};

/**
 * 根据节点信息筛选文件列表（增强版：支持ID和名称双重匹配，向后兼容旧格式）
 * @param {Array} fileList 文件列表
 * @param {string} nodeName 节点名称
 * @param {string|number} nodeId 节点ID
 * @returns {Array} 筛选后的文件列表
 */
export const filterFilesByNode = (fileList, nodeName, nodeId) => {
  if (!Array.isArray(fileList)) {
    return [];
  }

  console.log(`筛选文件: nodeName=${nodeName}, nodeId=${nodeId}`);

  // 先尝试通过节点ID匹配（新格式和旧格式都支持）
  const idMatches = fileList.filter(file => {
    if (!file.fileName) {
      return false;
    }

    const parsed = parseChapterFileName(file.fileName);
    if (!parsed) {
      return false;
    }

    const fileNodeId = parsed.nodeId === 'null' ? null : parsed.nodeId;
    const targetNodeId = nodeId === null || nodeId === undefined ? null : String(nodeId);
    
    const isMatch = fileNodeId === targetNodeId;
    if (isMatch) {
      console.log(`ID匹配成功: 文件=${file.fileName}, 解析出的nodeId=${fileNodeId}`);
    }
    
    return isMatch;
  });

  // 如果找到了ID匹配的文件，直接返回
  if (idMatches.length > 0) {
    console.log(`通过ID找到 ${idMatches.length} 个匹配文件`);
    return idMatches.map(file => {
      const parsed = parseChapterFileName(file.fileName);
      return {
        ...file,
        originalFileName: parsed?.originalFileName,
        parsedInfo: parsed
      };
    });
  }

  console.log('ID匹配失败，尝试通过节点名称匹配');
  
  // 如果没有找到ID匹配的文件，再尝试通过节点名称匹配
  const nameMatches = fileList.filter(file => {
    if (!file.fileName) {
      return false;
    }

    const parsed = parseChapterFileName(file.fileName);
    if (!parsed) {
      return false;
    }

    const isMatch = parsed.nodeName === nodeName;
    if (isMatch) {
      console.log(`名称匹配成功: 文件=${file.fileName}, 解析出的nodeName=${parsed.nodeName}`);
    }
    
    return isMatch;
  });

  console.log(`通过名称找到 ${nameMatches.length} 个匹配文件`);

  return nameMatches.map(file => {
    const parsed = parseChapterFileName(file.fileName);
    return {
      ...file,
      originalFileName: parsed?.originalFileName,
      parsedInfo: parsed
    };
  });
};

/**
 * 将文件列表按章节分组
 * @param {Array} fileList 文件列表
 * @returns {Object} 按章节分组的文件对象 { chapterKey: files[] }
 */
export const groupFilesByChapter = (fileList) => {
  if (!Array.isArray(fileList)) {
    return {};
  }
  
  const grouped = {};
  
  fileList.forEach(file => {
    if (!file.fileName) {
      return;
    }
    
    const parsed = parseChapterFileName(file.fileName);
    if (!parsed) {
      // 非章节文件，归类到 "其他" 分组
      const otherKey = 'other';
      if (!grouped[otherKey]) {
        grouped[otherKey] = [];
      }
      grouped[otherKey].push(file);
      return;
    }
    
    // 生成章节键值 - 统一使用节点名称和节点ID
    const chapterKey = `${parsed.nodeName}-${parsed.nodeId || 'null'}`;

    if (!grouped[chapterKey]) {
      grouped[chapterKey] = [];
    }

    grouped[chapterKey].push({
      ...file,
      parsedInfo: parsed
    });
  });
  
  return grouped;
};

/**
 * 创建重命名后的文件对象
 * @param {File} originalFile 原始文件对象
 * @param {string} newFileName 新文件名
 * @returns {File} 重命名后的文件对象
 */
export const createRenamedFile = (originalFile, newFileName) => {
  if (!originalFile || !newFileName) {
    throw new Error('原始文件和新文件名都不能为空');
  }
  
  // 创建新的File对象，保持原有属性但使用新文件名
  return new File([originalFile], newFileName, {
    type: originalFile.type,
    lastModified: originalFile.lastModified
  });
};

/**
 * 验证章节文件上传参数
 * @param {File} file 文件对象
 * @param {string} nodeName 节点名称
 * @param {string|number|null} nodeId 节点ID
 * @returns {Object} 验证结果 { valid: boolean, error?: string }
 */
export const validateChapterFileParams = (file, nodeName, nodeId) => {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: '文件对象无效' };
  }
  
  if (!nodeName || typeof nodeName !== 'string' || nodeName.trim() === '') {
    return { valid: false, error: '节点名称不能为空' };
  }
  
  // nodeId 可以为 null（根节点），但如果不为null则必须是有效值
  if (nodeId !== null && nodeId !== undefined && String(nodeId).trim() === '') {
    return { valid: false, error: '节点ID不能为空字符串' };
  }
  
  return { valid: true };
};
