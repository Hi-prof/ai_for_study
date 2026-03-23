/**
 * 教案内容解析工具
 * 用于解析AI生成的教案内容，提取标题和模块信息
 */

/**
 * 清理模块内容
 * @param {string} content - 原始模块内容
 * @returns {string} 清理后的内容
 */
function cleanModuleContent(content) {
  if (!content) return '';

  return content
    // 移除开头和结尾的空白字符
    .trim()
    // 将多个连续的换行符替换为最多两个
    .replace(/\n{3,}/g, '\n\n')
    // 移除行首行尾的空白字符，但保留段落结构
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // 再次移除开头和结尾可能产生的多余换行
    .replace(/^\n+|\n+$/g, '')
    // 确保内容不为空
    .trim();
}

/**
 * 检测内容是否为教案格式
 * @param {string} content - 要检测的内容
 * @returns {boolean} 是否为教案格式
 */
export function isLessonPlanContent(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  // 检测是否包含教案标题格式 [标题]
  const hasTitleFormat = /\[([^\]]+)\]/.test(content);
  
  // 检测是否包含模块标题格式 ### 标题 ###
  const hasModuleFormat = /###\s*([^#]+?)\s*###/.test(content);
  
  return hasTitleFormat && hasModuleFormat;
}

/**
 * 解析教案内容
 * @param {string} content - AI生成的教案内容
 * @returns {Object} 解析后的教案数据 { title, modules }
 */
export function parseLessonPlan(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('内容不能为空');
  }

  // 提取教案标题
  const titleMatch = content.match(/\[([^\]]+)\]/);
  const title = titleMatch ? titleMatch[1].trim() : '未命名教案';

  // 提取所有模块标题和位置
  const moduleRegex = /###\s*([^#]+?)\s*###/g;
  const modulePositions = [];
  let match;

  // 找到所有模块标题的位置
  while ((match = moduleRegex.exec(content)) !== null) {
    modulePositions.push({
      title: match[1].trim(),
      titleStart: match.index,           // 模块标题开始位置
      titleEnd: match.index + match[0].length,  // 模块标题结束位置
      contentStart: match.index + match[0].length,  // 模块内容开始位置
      contentEnd: 0                      // 模块内容结束位置（待计算）
    });
  }

  if (modulePositions.length === 0) {
    throw new Error('未找到有效的模块标题');
  }

  // 计算每个模块的内容边界
  for (let i = 0; i < modulePositions.length; i++) {
    const current = modulePositions[i];
    const next = modulePositions[i + 1];

    // 确定当前模块内容的结束位置
    if (next) {
      // 使用下一个模块标题的开始位置作为当前模块内容的结束位置
      current.contentEnd = next.titleStart;
    } else {
      // 最后一个模块，内容到文档结尾
      current.contentEnd = content.length;
    }
  }

  // 提取模块内容
  const modules = [];
  for (let i = 0; i < modulePositions.length; i++) {
    const current = modulePositions[i];

    // 提取模块内容：从模块标题结束位置到下一个模块标题开始位置
    let moduleContent = content.substring(current.contentStart, current.contentEnd);

    // 验证内容不包含当前模块的标题
    const titlePattern = `### ${current.title} ###`;
    if (moduleContent.includes(titlePattern)) {
      console.warn(`警告：模块 "${current.title}" 的内容包含了标题文本`);
      console.warn(`内容范围: ${current.contentStart} - ${current.contentEnd}`);
      console.warn(`原始内容: "${moduleContent}"`);

      // 尝试移除标题（如果意外包含）
      moduleContent = moduleContent.replace(titlePattern, '').trim();
    }

    // 清理内容
    moduleContent = cleanModuleContent(moduleContent);

    // 只添加有内容的模块
    if (moduleContent && moduleContent.trim()) {
      modules.push({
        title: current.title,
        content: moduleContent,
        sort: i + 1
      });
    }
  }

  if (modules.length === 0) {
    throw new Error('未找到有效的模块内容');
  }

  return {
    title,
    modules
  };
}

/**
 * 将解析后的教案数据转换为API所需的格式
 * @param {Object} parsedData - 解析后的教案数据
 * @param {Object} currentUser - 当前用户信息
 * @returns {Object} API格式的教案数据
 */
export function convertToApiFormat(parsedData, currentUser) {
  if (!parsedData || !parsedData.title || !parsedData.modules) {
    throw new Error('教案数据格式不正确');
  }

  if (!currentUser) {
    throw new Error('用户未登录');
  }

  // 尝试获取用户ID，支持多种字段名
  const userId = currentUser.id || currentUser.userId || currentUser.user_id || currentUser.ID || 1;
  console.log('用户信息详情:', currentUser)
  console.log('提取的用户ID:', userId)

  const apiData = {
    createBy: currentUser.username || '',
    createTime: '',
    updateBy: '',
    updateTime: '',
    remark: '',
    params: {},
    id: 0,
    title: parsedData.title,
    createUser: parseInt(userId),
    tpModuleList: parsedData.modules.map((module, index) => ({
      createBy: currentUser.username || '',
      createTime: '',
      updateBy: '',
      updateTime: '',
      remark: '',
      params: {},
      id: 0,
      title: module.title,
      planId: 0,
      sort: module.sort || (index + 1),
      content: {
        createBy: currentUser.username || '',
        createTime: '',
        updateBy: '',
        updateTime: '',
        remark: '',
        params: {},
        id: 0,
        moduleId: 0,
        content: module.content,
        fileUrl: ''
      }
    }))
  };

  return apiData;
}

/**
 * 验证解析结果
 * @param {Object} parsedData - 解析后的数据
 * @returns {Object} 验证结果 { isValid, errors }
 */
export function validateParsedData(parsedData) {
  const errors = [];

  if (!parsedData) {
    errors.push('解析数据为空');
    return { isValid: false, errors };
  }

  if (!parsedData.title || parsedData.title.trim() === '') {
    errors.push('教案标题不能为空');
  }

  if (!parsedData.modules || !Array.isArray(parsedData.modules)) {
    errors.push('模块数据格式不正确');
  } else if (parsedData.modules.length === 0) {
    errors.push('至少需要一个教学模块');
  } else {
    parsedData.modules.forEach((module, index) => {
      if (!module.title || module.title.trim() === '') {
        errors.push(`第${index + 1}个模块标题不能为空`);
      }
      if (!module.content || module.content.trim() === '') {
        errors.push(`第${index + 1}个模块内容不能为空`);
      }

      // 验证模块内容不包含标题
      const titlePattern = `### ${module.title} ###`;
      if (module.content.includes(titlePattern)) {
        errors.push(`第${index + 1}个模块内容错误地包含了标题文本`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 预览解析结果（用于调试）
 * @param {string} content - 原始内容
 * @returns {Object} 预览信息
 */
export function previewParsedData(content) {
  try {
    const parsed = parseLessonPlan(content);
    const validation = validateParsedData(parsed);
    
    return {
      success: true,
      data: parsed,
      validation,
      moduleCount: parsed.modules.length,
      titleLength: parsed.title.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null,
      validation: { isValid: false, errors: [error.message] }
    };
  }
}
