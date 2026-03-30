// 图谱工具函数

// AI搜索知识点内容
export const searchAIContent = async (editedTitle, editedContent) => {
  if (!editedTitle.trim()) {
    alert('请先输入知识点标题');
    return { success: false };
  }
  
  try {
    // 使用AI API进行搜索
    const apiKey = 'sk-Cvdoz7cRodGwhmMmioj1VrZOhCKNzBpoHkaVKAmqL7qLaQ3B';
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    
    const prompt = `请简要介绍"${editedTitle}"这个知识点的相关内容，包括定义、特点、应用等方面，限制在300字以内。`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个知识图谱辅助工具，擅长简洁地解释各个知识点'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content.trim();
      
      if (content) {
        // 添加标题和内容
        const formattedContent = `${editedTitle}：\n\n${content}`;
        return { success: true, content: formattedContent };
      } else {
        alert('AI未生成相关内容');
        return await searchUsingBackupMethod(editedTitle);
      }
    } else {
      console.error('AI API响应格式异常:', data);
      return await searchUsingBackupMethod(editedTitle);
    }
  } catch (error) {
    console.error('AI搜索失败:', error);
    // 尝试备用方法
    return await searchUsingBackupMethod(editedTitle);
  }
};

// 备用搜索方法
export const searchUsingBackupMethod = async (editedTitle) => {
  try {
    // 改进的内容生成
    const keywords = editedTitle.split(/\s+/).filter(k => k.length > 1);
    
    // 根据知识点类型提供更具体的内容
    let typeSpecificContent = '';
    
    if (editedTitle.includes('测量') || editedTitle.includes('测绘')) {
      typeSpecificContent = '这是土木工程测量中的重要概念，涉及到工程定位、放样和验收等环节。';
    } else if (editedTitle.includes('结构') || editedTitle.includes('力学')) {
      typeSpecificContent = '这是结构工程中的核心概念，与建筑物的稳定性、受力分析和抗震设计等密切相关。';
    } else if (editedTitle.includes('材料') || editedTitle.includes('混凝土') || editedTitle.includes('钢筋')) {
      typeSpecificContent = '这与建筑材料的性能、应用和检测有关，对工程质量和耐久性有重要影响。';
    } else if (editedTitle.includes('设计') || editedTitle.includes('施工')) {
      typeSpecificContent = '这与工程设计和施工过程密切相关，涉及到规范要求、技术标准和实践经验。';
    }
    
    // 生成通用介绍
    const baseInfo = `${editedTitle}是土木工程领域中的一个重要知识点`;
    const relationInfo = keywords.length > 0 ? 
      `，与${keywords.join('、')}等概念有密切关联` : 
      '，是理解相关工程原理的基础';
    
    // 补充应用信息
    const applicationInfo = typeSpecificContent || 
      `它在工程实践中有广泛应用，特别是在设计、施工和验收环节。掌握这一知识点对提高工程质量和效率有重要意义。`;
    
    // 组合内容
    const content = `${baseInfo}${relationInfo}。\n\n${applicationInfo}\n\n更多详细信息建议参考专业教材和规范标准。`;
    
    return { success: true, content };
  } catch (error) {
    console.error('备用搜索失败:', error);
    alert('内容生成失败，请手动输入内容');
    return { success: false };
  }
};

// 处理节点数据转换
export const processNodeData = async (nodes, getNodeStyle) => {
  console.log('graphUtils: 开始处理节点数据，节点数量:', nodes.length);

  const nodePromises = nodes.map(async (node) => {
    try {
      console.log(`graphUtils: 处理节点 ${node.id}:`, node);

      // 确保节点有基本的必需字段
      if (!node.id) {
        console.error('graphUtils: 节点缺少ID:', node);
        return null;
      }

      // 获取节点样式，但不让样式获取失败影响整个流程
      let style = null;
      try {
        style = await getNodeStyle(node.id);
        console.log(`graphUtils: 节点 ${node.id} 样式:`, style);
      } catch (styleError) {
        console.warn(`graphUtils: 获取节点 ${node.id} 样式失败，使用默认样式:`, styleError);
      }

      // 构建节点数据，确保所有必需字段都存在
      const processedNode = {
        id: node.id.toString(),
        text: node.name || `节点${node.id}`, // 确保有文本显示
        data: {
          content: node.content || '',
          category: node.category || 'default',
          originalData: node // 保留原始数据
        },
        // 样式相关字段，使用默认值
        type: style?.type || 'default',
        nodeShape: style?.nodeShape || 0,
        width: style?.nodeWidth || 75, // 圆形节点宽度
        height: style?.nodeHeight || 75, // 圆形节点高度
        borderWidth: style?.borderWidth || 2,
        borderHeight: style?.borderHeight || 2,
        // 添加默认颜色
        color: style?.color || '#4299e1',
        fontColor: style?.fontColor || '#333333'
      };

      console.log(`graphUtils: 节点 ${node.id} 处理完成:`, processedNode);
      return processedNode;

    } catch (error) {
      console.error(`graphUtils: 处理节点 ${node.id} 失败:`, error);
      // 返回最基本的节点结构，确保不会因为单个节点失败而影响整个图谱
      return {
        id: node.id.toString(),
        text: node.name || `节点${node.id}`,
        data: {
          content: node.content || '',
          category: 'default'
        },
        type: 'default',
        color: '#4299e1',
        fontColor: '#333333'
      };
    }
  });

  const results = await Promise.all(nodePromises);
  // 过滤掉null值
  const validNodes = results.filter(node => node !== null);

  console.log('graphUtils: 节点数据处理完成，有效节点数量:', validNodes.length);
  return validNodes;
};

// 处理连线数据
export const processLineData = (linesArrays) => {
  console.log('graphUtils: 开始处理连线数据，数组数量:', linesArrays.length);

  // 展平所有连线数组
  const allLines = linesArrays.flat();
  console.log('graphUtils: 展平后的连线数量:', allLines.length);

  // 处理连线数据，添加验证
  const processedLines = allLines.map((line, index) => {
    try {
      // 验证连线数据的完整性
      if (!line.nodeId || !line.targetId) {
        console.warn(`graphUtils: 连线 ${index} 缺少必要字段:`, line);
        return null;
      }

      const processedLine = {
        from: line.nodeId.toString(),
        to: line.targetId.toString(),
        text: line.content || '', // 连线文本可以为空
        id: line.id ? line.id.toString() : `line_${index}` // 确保有ID
      };

      console.log(`graphUtils: 连线 ${index} 处理完成:`, processedLine);
      return processedLine;

    } catch (error) {
      console.error(`graphUtils: 处理连线 ${index} 失败:`, error, line);
      return null;
    }
  }).filter(line => line !== null); // 过滤掉无效的连线

  console.log('graphUtils: 连线数据处理完成，有效连线数量:', processedLines.length);
  return processedLines;
};

// 构建图谱数据
export const buildGraphData = (nodes, processedNodes, processedLines) => {
  console.log('graphUtils: 开始构建图谱数据');
  console.log('graphUtils: 原始节点数量:', nodes.length);
  console.log('graphUtils: 处理后节点数量:', processedNodes.length);
  console.log('graphUtils: 连线数量:', processedLines.length);

  // 验证数据完整性
  if (!nodes || nodes.length === 0) {
    console.error('graphUtils: 没有原始节点数据');
    throw new Error('没有节点数据');
  }

  if (!processedNodes || processedNodes.length === 0) {
    console.error('graphUtils: 没有处理后的节点数据');
    throw new Error('节点数据处理失败');
  }

  // 确定根节点ID
  let rootId = null;
  if (nodes.length > 0) {
    // 优先选择parentId为null的节点作为根节点
    const rootNode = nodes.find(node => !node.parentId || node.parentId === null);
    rootId = rootNode ? rootNode.id.toString() : nodes[0].id.toString();
  }

  const graphData = {
    rootId: rootId,
    nodes: processedNodes,
    links: processedLines || [] // 确保links不为undefined
  };

  console.log('graphUtils: 图谱数据构建完成:', graphData);

  // 验证构建的数据
  if (!graphData.nodes || graphData.nodes.length === 0) {
    throw new Error('构建的图谱数据中没有节点');
  }

  return graphData;
};
