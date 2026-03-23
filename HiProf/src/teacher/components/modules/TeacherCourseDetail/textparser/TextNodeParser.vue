<template>
  <div class="text-node-parser">
    <!-- 简化的组件，只保留核心功能 -->
  </div>
</template>

<script setup>
import { createChapter } from '@/api/chapters';
import { createChapterNode } from '@/api/node';

// 解析结构化内容的函数
const parseStructuredContent = (content) => {
  // 检查是否使用了新的分隔符格式 ||定义||...||属性||...
  if (content.includes('||定义||')) {
    console.log('🔍 检测到结构化内容格式，开始解析...');

    // 使用正则表达式提取各个部分
    const definitionMatch = content.match(/\|\|定义\|\|([^|]*?)(?=\|\||$)/);
    const attributesMatch = content.match(/\|\|属性\|\|([^|]*?)(?=\|\||$)/);
    const examplesMatch = content.match(/\|\|示例\|\|([^|]*?)(?=\|\||$)/);
    const relationsMatch = content.match(/\|\|关联\|\|([^|]*?)(?=\|\||$)/);
    const referencesMatch = content.match(/\|\|参考\|\|([^|]*?)(?=\|\||$)/);

    // 提取内容并格式化
    const definition = definitionMatch ? definitionMatch[1].trim() : '';
    const attributes = attributesMatch ? attributesMatch[1].trim() : '';
    const examples = examplesMatch ? examplesMatch[1].trim() : '';
    const relations = relationsMatch ? relationsMatch[1].trim() : '';
    const references = referencesMatch ? referencesMatch[1].trim() : '';

    console.log('📋 解析结果:', { definition, attributes, examples, relations, references });

    // 格式化为可读的显示格式
    let formattedContent = '';
    if (definition) formattedContent += `1.定义：${definition}\n`;
    if (attributes) formattedContent += `2.属性：${attributes}\n`;
    if (examples) formattedContent += `3.示例与应用：${examples}\n`;
    if (relations) formattedContent += `4.相关联系：${relations}\n`;
    if (references) formattedContent += `5.来源与参考：${references}`;

    return formattedContent || content; // 如果解析失败，返回原内容
  }

  return content; // 不是结构化格式，返回原内容
};

// 解析文本内容
const parseText = (text) => {
  console.log('🔍 开始解析文本内容:');
  console.log('原始文本:', text);

  const lines = text.split('\n').filter(line => line.trim());
  console.log('分割后的行数:', lines.length);

  const nodes = [];
  let nodeId = 1;

  lines.forEach((line, index) => {
    console.log(`🔍 处理第${index + 1}行:`, line);
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // 匹配最新JSON格式：数字:{name:名称,context:内容}
    const jsonFormatMatch = trimmedLine.match(/^(\d+(?:\.\d+)*):\{name:([^,]+),context:(.+)\}$/);
    // 匹配之前的格式：数字:(名称)-{内容}
    const oldNewFormatMatch = trimmedLine.match(/^(\d+(?:\.\d+)*):(.+?)-\{(.+)\}$/);
    // 兼容最旧格式：数字:标题
    const oldFormatMatch = trimmedLine.match(/^(\d+(?:\.\d+)*):(.+)$/);

    console.log('🔍 正则匹配结果:');
    console.log('  JSON格式匹配:', jsonFormatMatch ? '✅' : '❌');
    console.log('  旧新格式匹配:', oldNewFormatMatch ? '✅' : '❌');
    console.log('  最旧格式匹配:', oldFormatMatch ? '✅' : '❌');

    let numberPart, title, content;

    if (jsonFormatMatch) {
      // 最新JSON格式：编号:{name:名称,context:内容}
      [, numberPart, title, content] = jsonFormatMatch;
      title = title.trim();
      content = content.trim();

      // 检查是否使用了新的分隔符格式
      content = parseStructuredContent(content);

      console.log(`📝 解析JSON格式 - 编号: ${numberPart}, 标题: ${title}, 内容: ${content}`);
    } else if (oldNewFormatMatch) {
      // 之前的格式：编号:(名称)-{内容}
      [, numberPart, title, content] = oldNewFormatMatch;
      title = title.trim();
      content = content.trim();
      console.log(`📝 解析旧格式 - 编号: ${numberPart}, 标题: ${title}, 内容: ${content}`);
    } else if (oldFormatMatch) {
      // 最旧格式：编号:标题
      [, numberPart, title] = oldFormatMatch;
      title = title.trim();
      content = title; // 如果没有单独的内容，使用标题作为内容
      console.log(`📝 解析最旧格式 - 编号: ${numberPart}, 标题: ${title}, 内容: ${content}`);
    } else {
      console.log(`❌ 无法解析行: ${trimmedLine}`);
      return; // 不匹配任何格式，跳过
    }

    const numbers = numberPart.split('.').map(n => parseInt(n));
    const level = numbers.length;

    const node = {
      id: nodeId++,
      number: numberPart,
      title: title,
      content: content,
      level: level,
      numbers: numbers,
      children: []
    };

    nodes.push(node);
  });

  return buildNodeTree(nodes);
};

// 构建节点树
const buildNodeTree = (flatNodes) => {
  const tree = [];
  const nodeMap = new Map();

  // 按层级排序
  flatNodes.sort((a, b) => {
    for (let i = 0; i < Math.max(a.numbers.length, b.numbers.length); i++) {
      const aNum = a.numbers[i] || 0;
      const bNum = b.numbers[i] || 0;
      if (aNum !== bNum) return aNum - bNum;
    }
    return 0;
  });

  flatNodes.forEach(node => {
    nodeMap.set(node.number, node);

    if (node.level === 1) {
      // 一级节点直接添加到树根
      tree.push(node);
    } else {
      // 查找父节点
      const parentNumbers = node.numbers.slice(0, -1);
      const parentNumber = parentNumbers.join('.');
      const parent = nodeMap.get(parentNumber);

      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      }
    }
  });

  return tree;
};





// 从API响应中提取节点ID（复用现有的复杂逻辑）
const extractNodeIdFromResponse = (response, node) => {
  let currentId = null;

  console.log('开始解析节点ID，完整响应:', JSON.stringify(response, null, 2));

  // 尝试从不同的响应字段中获取ID
  if (response.data && typeof response.data === 'object') {
    currentId = response.data.id || response.data.nodeId;
    console.log('从response.data对象中尝试获取ID:', currentId);
  } else if (typeof response.data === 'number' || typeof response.data === 'string') {
    currentId = response.data;
    console.log('response.data直接是ID:', currentId);
  } else if (response.id) {
    currentId = response.id;
    console.log('从response.id获取ID:', currentId);
  } else if (response.result && response.result.id) {
    currentId = response.result.id;
    console.log('从response.result.id获取ID:', currentId);
  }

  // 如果还是没有找到，尝试更多可能的字段
  if (!currentId) {
    console.log('常规字段未找到ID，尝试其他可能的字段...');
    console.log('响应对象的所有属性:', Object.getOwnPropertyNames(response || {}));

    // 尝试其他可能的字段名（排除code和msg，因为它们是状态信息）
    const possibleIdFields = ['nodeId', 'recordId', 'insertId', 'newId', 'createdId'];
    for (const field of possibleIdFields) {
      if (response && response[field] !== undefined && response[field] !== null) {
        // 对于数字类型的字段，可能是ID（但排除200这样的状态码）
        if ((typeof response[field] === 'number' && response[field] !== 200) ||
            (typeof response[field] === 'string' && /^\d+$/.test(response[field]) && response[field] !== '200')) {
          currentId = response[field];
          console.log(`从response.${field}获取到ID:`, currentId);
          break;
        }
      }
      if (response.data && response.data[field] !== undefined && response.data[field] !== null) {
        if ((typeof response.data[field] === 'number' && response.data[field] !== 200) ||
            (typeof response.data[field] === 'string' && /^\d+$/.test(response.data[field]) && response.data[field] !== '200')) {
          currentId = response.data[field];
          console.log(`从response.data.${field}获取到ID:`, currentId);
          break;
        }
      }
    }

    // 如果响应是数字且不是状态码，可能整个响应就是ID
    if (!currentId && typeof response === 'number' && response !== 200) {
      currentId = response;
      console.log('整个响应就是ID:', currentId);
    }

    // 检查是否有嵌套的对象包含ID（排除状态码字段）
    if (!currentId && response && typeof response === 'object') {
      const searchForId = (obj, path = '') => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          // 只查找包含'id'的字段，排除'code'和'msg'
          if (key.toLowerCase().includes('id') &&
              (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) &&
              value !== 200 && value !== '200') {
            console.log(`在${currentPath}找到可能的ID:`, value);
            return value;
          }
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            const nestedId = searchForId(value, currentPath);
            if (nestedId) return nestedId;
          }
        }
        return null;
      };
      currentId = searchForId(response);
    }
  }

  console.log('最终获取到的节点ID:', currentId, '节点层级:', node.level);
  return currentId;
};

// 优化后的单节点创建函数（用于层级并行处理）
const createSingleNodeOptimized = async (node, parentId, rootGraphId, courseId, onProgressUpdate, onResult) => {
  try {
    let nodeData;
    let response;

    if (node.level === 1) {
      // 一级节点：在用户选择的父节点下创建新的章节（图谱根节点）
      if (!parentId) {
        throw new Error('创建一级节点时缺少父节点ID（用户选择的父节点）');
      }

      nodeData = {
        courseId: courseId,
        graphType: "1",
        name: node.title,
        content: node.content || `${node.number} ${node.title}`,
        remark: "通过文本解析自动创建的章节",
        parentId: parentId // 设置父节点为用户选择的节点
      };
      console.log(`🔵 准备创建一级节点（章节）: ${node.title}`);
      console.log(`📋 节点数据详情:`, {
        name: nodeData.name,
        content: nodeData.content,
        originalNodeContent: node.content,
        nodeTitle: node.title
      });
      response = await createChapter(nodeData);
      console.log(`✅ 章节创建完成: ${node.title}`, response);
    } else {
      // 子节点：在上级节点下创建子节点
      if (!parentId) {
        throw new Error(`创建${node.level}级节点时缺少父节点ID`);
      }

      nodeData = {
        parentId: parentId,
        graphId: rootGraphId || parentId, // 使用根图谱ID，如果没有则使用父节点ID
        name: node.title,
        content: node.content || `${node.number} ${node.title}`,
        remark: `通过文本解析自动创建的${node.level}级节点`
      };
      console.log(`🔵 准备创建${node.level}级节点: ${node.title}`);
      console.log(`📋 节点数据详情:`, {
        name: nodeData.name,
        content: nodeData.content,
        originalNodeContent: node.content,
        nodeTitle: node.title,
        level: node.level
      });
      response = await createChapterNode(nodeData);
      console.log(`✅ ${node.level}级节点创建完成: ${node.title}`, response);
    }

    // 检查响应是否成功
    const isSuccess = response && (
      response.code === 200 ||
      response.code === '200' ||
      (!response.error && !response.code) ||
      response.success === true
    );

    if (isSuccess) {
      // 获取创建的节点ID（使用现有的复杂ID解析逻辑）
      const currentId = extractNodeIdFromResponse(response, node);

      // 记录成功结果
      const result = {
        id: node.id,
        title: node.title, // 节点名称
        content: node.content, // 节点内容（AI生成的context部分）
        success: true,
        nodeId: currentId,
        level: node.level,
        warning: !currentId ? 'API未返回节点ID，无法创建子节点' : null
      };

      onResult(result);
      onProgressUpdate(node.title);

      if (!currentId) {
        throw new Error('API未返回节点ID，无法创建子节点');
      }

      return currentId;
    } else {
      throw new Error(response?.msg || response?.message || '创建失败');
    }

  } catch (error) {
    console.error(`创建${node.level}级节点失败: ${node.title}`, error);
    throw error; // 重新抛出错误，让上层处理
  }
};

// 解析并创建节点的核心函数
const parseAndCreateNodes = async (text, courseId, options = {}) => {
  if (!text || !text.trim()) {
    throw new Error('请提供要解析的文本内容');
  }

  if (!courseId) {
    throw new Error('请提供课程ID');
  }

  const results = {
    success: [],
    failed: [],
    total: 0,
    progress: 0
  };

  const onProgress = options.onProgress || (() => {});
  const onResult = options.onResult || (() => {});
  const parentNodeId = options.parentNodeId || null; // 用户选择的父节点ID

  try {
    // 解析文本
    const nodes = parseText(text);
    if (nodes.length === 0) {
      throw new Error('未识别到有效的节点格式');
    }

    // 计算总节点数（包括子节点）
    const countAllNodes = (nodeList) => {
      let count = 0;
      nodeList.forEach(node => {
        count++;
        if (node.children) {
          count += countAllNodes(node.children);
        }
      });
      return count;
    };

    const totalNodes = countAllNodes(nodes);
    results.total = totalNodes;




    // 全局进度跟踪
    let globalCompletedCount = 0;

    // 全局进度更新函数
    const updateGlobalProgress = (nodeTitle) => {
      globalCompletedCount++;
      const progress = Math.round((globalCompletedCount / totalNodes) * 100);
      const message = `[${globalCompletedCount}/${totalNodes}] 已完成: ${nodeTitle} (${progress}%)`;
      onProgress(message);
      results.progress = progress;
    };

    // 递归标记失败节点的所有后代
    const markDescendantsAsFailed = (node, reason) => {
      const failResult = {
        id: node.id,
        title: node.title, // 节点名称
        content: node.content, // 节点内容
        success: false,
        error: `跳过创建: ${reason}`,
        level: node.level
      };
      results.failed.push(failResult);
      onResult(failResult);
      updateGlobalProgress(node.title);

      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          markDescendantsAsFailed(child, reason);
        });
      }
    };

    // 层级递归并行处理核心算法
    const processNodesRecursivelyParallel = async (nodeList, parentId, rootGraphId, level = 1) => {
      if (!nodeList || nodeList.length === 0) return;

      console.log(`🚀 开始并行处理第${level}级的 ${nodeList.length} 个节点`);

      // 第一步：并行创建当前层级的所有节点
      const currentLevelTasks = nodeList.map(async (node) => {
        try {
          const nodeId = await createSingleNodeOptimized(node, parentId, rootGraphId, courseId, updateGlobalProgress, onResult);
          return { success: true, node, nodeId };
        } catch (error) {
          console.error(`节点 ${node.title} 创建失败:`, error);
          // 标记当前节点失败
          const failResult = {
            id: node.id,
            title: node.title, // 节点名称
            content: node.content, // 节点内容
            success: false,
            error: error.message || '创建失败',
            level: node.level
          };
          results.failed.push(failResult);
          onResult(failResult);
          updateGlobalProgress(node.title);

          // 标记所有后代节点失败
          if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
              markDescendantsAsFailed(child, `父节点${node.title}创建失败`);
            });
          }

          return { success: false, node, error };
        }
      });

      // 等待当前层级所有节点创建完成
      const currentLevelResults = await Promise.allSettled(currentLevelTasks);

      // 第二步：收集成功创建的节点的子节点，准备下一层级的并行处理
      const nextLevelGroups = [];

      currentLevelResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.success) {
          const { node, nodeId } = result.value;

          // 如果有子节点，加入下一层级处理队列
          if (node.children && node.children.length > 0) {
            nextLevelGroups.push({
              children: node.children,
              parentId: nodeId,
              rootGraphId: rootGraphId || nodeId
            });
          }
        }
      });

      // 第三步：并行处理下一层级的所有子节点组
      if (nextLevelGroups.length > 0) {
        console.log(`📋 准备处理第${level + 1}级，共 ${nextLevelGroups.length} 个父节点的子节点`);

        const nextLevelTasks = nextLevelGroups.map(group =>
          processNodesRecursivelyParallel(group.children, group.parentId, group.rootGraphId, level + 1)
        );

        await Promise.allSettled(nextLevelTasks);
      }
    };

    // 开始层级递归并行处理
    console.log(`🚀 开始层级递归并行处理，共 ${nodes.length} 个一级节点，总计 ${totalNodes} 个节点`);
    await processNodesRecursivelyParallel(nodes, parentNodeId, null, 1);

    onProgress('所有节点组处理完成！');
    results.progress = 100;

    // 统计结果
    const successCount = results.success.length;
    const failCount = results.failed.length;

    console.log(`节点创建完成！成功 ${successCount} 个，失败 ${failCount} 个`);

    return results;

  } catch (error) {
    console.error('创建节点过程中发生错误:', error);
    throw error;
  }
};

// 测试解析功能的辅助函数
const testParseText = (text) => {
  console.log('🧪 测试文本解析功能');
  console.log('输入文本:', text);
  const result = parseText(text);
  console.log('解析结果:', JSON.stringify(result, null, 2));
  return result;
};

// 测试单行解析的辅助函数
const testSingleLine = (line) => {
  console.log('🧪 测试单行解析:', line);

  const jsonFormatMatch = line.match(/^(\d+(?:\.\d+)*):\{name:([^,]+),context:(.+)\}$/);
  const oldNewFormatMatch = line.match(/^(\d+(?:\.\d+)*):(.+?)-\{(.+)\}$/);
  const oldFormatMatch = line.match(/^(\d+(?:\.\d+)*):(.+)$/);

  console.log('JSON格式匹配:', jsonFormatMatch);
  console.log('旧新格式匹配:', oldNewFormatMatch);
  console.log('最旧格式匹配:', oldFormatMatch);

  if (jsonFormatMatch) {
    const [, numberPart, title, content] = jsonFormatMatch;
    console.log('✅ JSON格式解析成功:');
    console.log('  编号:', numberPart);
    console.log('  标题:', title.trim());
    console.log('  原始内容:', content.trim());

    // 测试结构化内容解析
    const parsedContent = parseStructuredContent(content.trim());
    console.log('  解析后内容:', parsedContent);
  }

  return { jsonFormatMatch, oldNewFormatMatch, oldFormatMatch };
};

// 测试结构化内容解析的辅助函数
const testStructuredContent = (content) => {
  console.log('🧪 测试结构化内容解析:', content);
  const result = parseStructuredContent(content);
  console.log('解析结果:', result);
  return result;
};

// 导出核心函数供外部使用
defineExpose({
  parseText,
  buildNodeTree,
  parseAndCreateNodes,
  testParseText,
  testSingleLine,
  testStructuredContent,
  parseStructuredContent
});
</script>

<style scoped>
/* 简化的组件，只保留核心功能函数 */
</style>
