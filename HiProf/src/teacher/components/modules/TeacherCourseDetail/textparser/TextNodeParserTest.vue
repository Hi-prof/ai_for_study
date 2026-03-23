<template>
  <div class="text-node-parser-test">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">文本节点解析器测试页面</h1>
      <p class="page-description">测试文本格式识别并自动创建节点功能</p>
    </div>

    <!-- 课程选择 -->
    <div class="course-selection">
      <h2>选择测试课程</h2>
      <div class="course-input">
        <label for="courseId">课程ID:</label>
        <input
          id="courseId"
          v-model="selectedCourseId"
          type="text"
          placeholder="请输入课程ID（例如：1）"
          class="course-id-input"
        />
        <button 
          class="btn btn-primary" 
          @click="loadCourseInfo"
          :disabled="!selectedCourseId || loadingCourse"
        >
          {{ loadingCourse ? '加载中...' : '加载课程' }}
        </button>
      </div>
      
      <!-- 课程信息显示 -->
      <div v-if="courseInfo" class="course-info">
        <h3>当前课程信息</h3>
        <div class="info-card">
          <p><strong>课程ID:</strong> {{ courseInfo.id }}</p>
          <p><strong>课程名称:</strong> {{ courseInfo.name || '未设置' }}</p>
          <p><strong>课程描述:</strong> {{ courseInfo.description || '暂无描述' }}</p>
        </div>
      </div>
    </div>

    <!-- API测试区域 -->
    <div v-if="selectedCourseId" class="test-section">
      <h2>API测试功能</h2>
      <div class="test-controls">
        <div class="test-input-group">
          <label for="testText">测试文本:</label>
          <input
            id="testText"
            v-model="testText"
            type="text"
            placeholder="例如: 1:测试章节"
            class="test-input"
          />
        </div>
        <div class="test-buttons">
          <button
            class="btn btn-info"
            @click="testChapterCreation"
            :disabled="!testText.trim() || testLoading"
          >
            <i class="btn-icon test-icon"></i>
            {{ testLoading ? '测试中...' : '测试章节创建' }}
          </button>
          <button
            class="btn btn-warning"
            @click="testNodeCreation"
            :disabled="!testText.trim() || testLoading || !lastCreatedChapterId"
          >
            <i class="btn-icon test-icon"></i>
            {{ testLoading ? '测试中...' : '测试子节点创建' }}
          </button>
          <button
            class="btn btn-purple"
            @click="debugApiResponse"
            :disabled="testLoading"
          >
            <i class="btn-icon debug-icon"></i>
            调试API响应格式
          </button>
          <button
            class="btn btn-info"
            @click="checkDuplicateChapters"
            :disabled="testLoading"
          >
            <i class="btn-icon check-icon"></i>
            检查重复章节
          </button>
          <button
            class="btn btn-secondary"
            @click="clearTestResults"
          >
            <i class="btn-icon clear-icon"></i>
            清空测试结果
          </button>
        </div>
      </div>

      <!-- 测试结果显示 -->
      <div v-if="testResults.length > 0" class="test-results">
        <h3>测试结果</h3>
        <div class="test-results-list">
          <div
            v-for="(result, index) in testResults"
            :key="index"
            class="test-result-item"
            :class="{ 'success': result.success, 'error': !result.success }"
          >
            <div class="result-header">
              <div class="result-icon">
                <span v-if="result.success">✓</span>
                <span v-else>✗</span>
              </div>
              <div class="result-title">{{ result.title }}</div>
              <div class="result-time">{{ result.time }}</div>
            </div>
            <div class="result-details">
              <div v-if="result.success" class="result-success">
                <p><strong>操作成功:</strong> {{ result.message }}</p>
                <div v-if="result.data" class="result-data">
                  <details>
                    <summary>查看返回数据</summary>
                    <pre>{{ JSON.stringify(result.data, null, 2) }}</pre>
                  </details>
                </div>
              </div>
              <div v-else class="result-error">
                <p><strong>错误信息:</strong> {{ result.error }}</p>
                <div v-if="result.errorDetails" class="error-details">
                  <details>
                    <summary>查看错误详情</summary>
                    <pre>{{ JSON.stringify(result.errorDetails, null, 2) }}</pre>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文本解析器测试区域 -->
    <div v-if="selectedCourseId" class="parser-section">
      <h2>文本节点自动创建测试</h2>

      <!-- 文本输入区域 -->
      <div class="input-section">
        <h3>输入文本内容</h3>
        <textarea
          v-model="inputText"
          class="text-input"
          placeholder="请输入要解析的文本内容，例如：
1:绪论
1.1:绪论（上）
1.2:绪论（中）
1.3:绪论（下）

2:土木工程材料
2.1:土木工程材料（上）
2.2:土木工程材料（下）"
          rows="15"
        ></textarea>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button
          class="btn btn-secondary"
          @click="previewParsedNodes"
          :disabled="!inputText.trim()"
        >
          <i class="btn-icon preview-icon"></i>
          预览解析结果
        </button>
        <button
          class="btn btn-primary"
          @click="createNodes"
          :disabled="!inputText.trim() || creating"
        >
          <i class="btn-icon create-icon"></i>
          {{ creating ? '创建中...' : '创建节点' }}
        </button>
        <button
          class="btn btn-warning"
          @click="clearAll"
        >
          <i class="btn-icon clear-icon"></i>
          清空
        </button>
      </div>

      <!-- 解析预览 -->
      <div v-if="previewNodes.length > 0" class="preview-section">
        <h3>解析预览</h3>
        <div class="parsed-tree">
          <div
            v-for="node in previewNodes"
            :key="node.id"
            class="tree-node"
            :class="`level-${node.level}`"
          >
            <div class="node-content">
              <span class="node-number">{{ node.number }}</span>
              <span class="node-title">{{ node.title }}</span>
            </div>
            <!-- 递归显示子节点 -->
            <div v-if="node.children && node.children.length > 0" class="node-children">
              <div
                v-for="child in node.children"
                :key="child.id"
                class="tree-node"
                :class="`level-${child.level}`"
              >
                <div class="node-content">
                  <span class="node-number">{{ child.number }}</span>
                  <span class="node-title">{{ child.title }}</span>
                </div>
                <!-- 三级节点 -->
                <div v-if="child.children && child.children.length > 0" class="node-children">
                  <div
                    v-for="grandChild in child.children"
                    :key="grandChild.id"
                    class="tree-node"
                    :class="`level-${grandChild.level}`"
                  >
                    <div class="node-content">
                      <span class="node-number">{{ grandChild.number }}</span>
                      <span class="node-title">{{ grandChild.title }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 创建进度 -->
      <div v-if="creating" class="progress-section">
        <div class="progress-header">
          <h3>正在创建节点...</h3>
          <span class="progress-text">{{ progressText }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
      </div>

      <!-- 创建结果 -->
      <div v-if="createResults.length > 0" class="results-section">
        <h3>创建结果</h3>
        <div class="results-summary">
          <div class="summary-item success">
            <span class="summary-label">成功:</span>
            <span class="summary-count">{{ successCount }}</span>
          </div>
          <div class="summary-item failed">
            <span class="summary-label">失败:</span>
            <span class="summary-count">{{ failedCount }}</span>
          </div>
          <div class="summary-item total">
            <span class="summary-label">总计:</span>
            <span class="summary-count">{{ totalCount }}</span>
          </div>
        </div>
        <div class="results-list">
          <div
            v-for="result in createResults"
            :key="result.id"
            class="result-item"
            :class="{ 'success': result.success, 'error': !result.success }"
          >
            <div class="result-icon">
              <span v-if="result.success">✓</span>
              <span v-else>✗</span>
            </div>
            <div class="result-content">
              <div class="result-title">{{ result.title }}</div>
              <div v-if="!result.success" class="result-error">{{ result.error }}</div>
              <div v-if="result.warning" class="result-warning">⚠️ {{ result.warning }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 隐藏的TextNodeParser组件引用 -->
      <TextNodeParser ref="textNodeParserRef" style="display: none;" />
    </div>

    <!-- 示例文本 -->
    <div class="examples-section">
      <h2>示例文本</h2>
      <div class="examples-grid">
        <div class="example-card">
          <h3>示例1：基础格式</h3>
          <div class="example-content">
            <pre>{{ example1 }}</pre>
          </div>
          <button class="btn btn-secondary" @click="useExample(example1)">
            使用此示例
          </button>
        </div>

        <div class="example-card">
          <h3>示例2：复杂层级</h3>
          <div class="example-content">
            <pre>{{ example2 }}</pre>
          </div>
          <button class="btn btn-secondary" @click="useExample(example2)">
            使用此示例
          </button>
        </div>

        <div class="example-card">
          <h3>示例3：完整课程结构</h3>
          <div class="example-content">
            <pre>{{ example3 }}</pre>
          </div>
          <button class="btn btn-secondary" @click="useExample(example3)">
            使用此示例
          </button>
        </div>

        <div class="example-card">
          <h3>示例4：简单三级节点测试</h3>
          <div class="example-content">
            <pre>{{ exampleSimple3Level }}</pre>
          </div>
          <button class="btn btn-secondary" @click="useExample(exampleSimple3Level)">
            使用此示例
          </button>
        </div>
      </div>
    </div>

    <!-- 创建结果通知 -->
    <div v-if="showSuccessMessage" class="success-notification">
      <div class="notification-content">
        <div class="notification-icon">✓</div>
        <div class="notification-text">
          <h3>节点创建成功！</h3>
          <p>已成功创建节点，您可以在章节管理页面查看结果。</p>
        </div>
        <button class="notification-close" @click="showSuccessMessage = false">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import TextNodeParser from './TextNodeParser.vue';
import { createChapter } from '@/api/chapters';
import { createChapterNode } from '@/api/node';

// 响应式数据
const selectedCourseId = ref('1'); // 默认课程ID
const courseInfo = ref(null);
const loadingCourse = ref(false);
const showSuccessMessage = ref(false);

// 测试相关数据
const testText = ref('1:测试章节');
const testLoading = ref(false);
const testResults = ref([]);
const lastCreatedChapterId = ref(null);
const lastCreatedGraphId = ref(null);

// 文本解析器相关数据
const inputText = ref('');
const previewNodes = ref([]);
const creating = ref(false);
const progress = ref(0);
const progressText = ref('');
const createResults = ref([]);
const textNodeParserRef = ref(null);

// 示例文本
const example1 = `1:绪论
1.1:绪论（上）
1.2:绪论（中）
1.3:绪论（下）

2:土木工程材料
2.1:土木工程材料（上）
2.2:土木工程材料（下）`;

const example2 = `1:基础理论
1.1:理论概述
1.1.1:基本概念
1.1.2:发展历史
1.2:核心原理
1.2.1:第一原理
1.2.2:第二原理

2:实践应用
2.1:应用场景
2.1.1:场景一
2.1.2:场景二
2.2:案例分析`;

// 添加一个简单的三级节点测试示例
const exampleSimple3Level = `1:测试章节
1.1:测试子节点
1.1.1:测试三级节点`;

const example3 = `1:绪论
1.1:绪论（上）
1.2:绪论（中）
1.3:绪论（下）
1.4:绪论（更新内容-01）
1.5:绪论（更新内容-02）
1.6:绪论作业

2:土木工程材料
2.1:土木工程材料（上）
2.2:土木工程材料（下）

3:地基基础及地下工程
3.1:地基基础及地下工程（上）
3.2:地基基础及地下工程（下）

4:建筑工程
4.1:建筑工程（上）
4.2:建筑工程（下）`;

// 加载课程信息（模拟）
const loadCourseInfo = async () => {
  if (!selectedCourseId.value) return;
  
  loadingCourse.value = true;
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟课程信息
    courseInfo.value = {
      id: selectedCourseId.value,
      name: `测试课程 ${selectedCourseId.value}`,
      description: '这是一个用于测试文本节点解析功能的课程'
    };
    
    console.log('课程信息加载成功:', courseInfo.value);
  } catch (error) {
    console.error('加载课程信息失败:', error);
    alert('加载课程信息失败：' + error.message);
  } finally {
    loadingCourse.value = false;
  }
};

// 使用示例文本
const useExample = (exampleText) => {
  // 通过事件或其他方式将示例文本传递给TextNodeParser组件
  // 这里我们可以通过全局事件或者ref来实现
  const event = new CustomEvent('use-example-text', {
    detail: { text: exampleText }
  });
  window.dispatchEvent(event);
};

// 处理节点创建成功
const handleNodesCreated = () => {
  showSuccessMessage.value = true;
  
  // 3秒后自动隐藏通知
  setTimeout(() => {
    showSuccessMessage.value = false;
  }, 3000);
};

// 测试章节创建
const testChapterCreation = async () => {
  if (!testText.value.trim()) {
    alert('请输入测试文本');
    return;
  }

  testLoading.value = true;
  const startTime = new Date().toLocaleTimeString();

  try {
    // 解析测试文本
    const match = testText.value.trim().match(/^(\d+(?:\.\d+)*):(.+)$/);
    if (!match) {
      throw new Error('文本格式不正确，请使用格式：1:章节名称');
    }

    const [, number, title] = match;

    // 构建章节数据
    const chapterData = {
      courseId: selectedCourseId.value,
      graphType: "1",
      name: `[测试] ${title}`,
      content: `${number} ${title}`,
      remark: "API测试创建的章节"
    };

    console.log('测试章节创建，发送数据:', chapterData);

    // 调用API
    const response = await createChapter(chapterData);
    console.log('章节创建响应:', response);

    // 尝试获取创建的章节ID
    let chapterId = null;
    if (response.data && typeof response.data === 'object') {
      chapterId = response.data.id || response.data.nodeId;
    } else if (typeof response.data === 'number' || typeof response.data === 'string') {
      chapterId = response.data;
    } else if (response.id) {
      chapterId = response.id;
    }

    console.log('解析到的章节ID:', chapterId);

    if (chapterId) {
      lastCreatedChapterId.value = chapterId;
      lastCreatedGraphId.value = chapterId; // 对于章节，ID和GraphID相同
    } else {
      console.warn('无法从响应中获取章节ID，响应结构:', response);
    }

    testResults.value.unshift({
      title: '章节创建测试',
      success: true,
      message: `成功创建章节: ${title}`,
      data: response,
      time: startTime
    });

  } catch (error) {
    console.error('章节创建测试失败:', error);
    testResults.value.unshift({
      title: '章节创建测试',
      success: false,
      error: error.message || '创建失败',
      errorDetails: error.response?.data || error,
      time: startTime
    });
  } finally {
    testLoading.value = false;
  }
};

// 测试子节点创建
const testNodeCreation = async () => {
  if (!testText.value.trim()) {
    alert('请输入测试文本');
    return;
  }

  if (!lastCreatedChapterId.value) {
    alert('请先测试章节创建，获取父节点ID');
    return;
  }

  testLoading.value = true;
  const startTime = new Date().toLocaleTimeString();

  try {
    // 解析测试文本
    const match = testText.value.trim().match(/^(\d+(?:\.\d+)*):(.+)$/);
    if (!match) {
      throw new Error('文本格式不正确，请使用格式：1.1:子节点名称');
    }

    const [, number, title] = match;

    // 构建子节点数据
    const nodeData = {
      parentId: lastCreatedChapterId.value,
      graphId: lastCreatedGraphId.value || lastCreatedChapterId.value,
      name: `[测试] ${title}`,
      content: `${number} ${title}`,
      remark: "API测试创建的子节点"
    };

    console.log('子节点创建参数详情:', {
      parentId: nodeData.parentId,
      graphId: nodeData.graphId,
      name: nodeData.name,
      lastCreatedChapterId: lastCreatedChapterId.value,
      lastCreatedGraphId: lastCreatedGraphId.value
    });

    console.log('测试子节点创建，发送数据:', nodeData);

    // 调用API
    const response = await createChapterNode(nodeData);
    console.log('子节点创建响应:', response);

    testResults.value.unshift({
      title: '子节点创建测试',
      success: true,
      message: `成功创建子节点: ${title}`,
      data: response,
      time: startTime
    });

  } catch (error) {
    console.error('子节点创建测试失败:', error);
    testResults.value.unshift({
      title: '子节点创建测试',
      success: false,
      error: error.message || '创建失败',
      errorDetails: error.response?.data || error,
      time: startTime
    });
  } finally {
    testLoading.value = false;
  }
};

// 调试API响应格式
const debugApiResponse = async () => {
  testLoading.value = true;
  const startTime = new Date().toLocaleTimeString();

  try {
    // 测试章节创建API
    const chapterData = {
      courseId: selectedCourseId.value,
      graphType: "1",
      name: "[调试] 测试章节响应格式",
      content: "用于调试API响应格式的测试章节",
      remark: "调试用途"
    };

    console.log('=== 调试章节创建API ===');
    console.log('发送数据:', chapterData);

    const chapterResponse = await createChapter(chapterData);
    console.log('章节创建原始响应:', chapterResponse);
    console.log('响应类型:', typeof chapterResponse);
    console.log('响应键:', Object.keys(chapterResponse || {}));

    if (chapterResponse.data) {
      console.log('response.data:', chapterResponse.data);
      console.log('response.data类型:', typeof chapterResponse.data);
      console.log('response.data键:', Object.keys(chapterResponse.data || {}));
    }

    // 尝试获取章节ID
    let chapterId = null;
    const idExtractionMethods = [
      { name: 'response.data.id', value: chapterResponse.data?.id },
      { name: 'response.data', value: chapterResponse.data },
      { name: 'response.id', value: chapterResponse.id },
      { name: 'response', value: chapterResponse }
    ];

    for (const method of idExtractionMethods) {
      if (method.value && (typeof method.value === 'number' || typeof method.value === 'string')) {
        chapterId = method.value;
        console.log(`✓ 从 ${method.name} 获取到章节ID:`, chapterId);
        break;
      } else {
        console.log(`✗ ${method.name}:`, method.value, typeof method.value);
      }
    }

    if (chapterId) {
      // 测试子节点创建API
      const nodeData = {
        parentId: chapterId,
        graphId: chapterId,
        name: "[调试] 测试子节点响应格式",
        content: "用于调试API响应格式的测试子节点",
        remark: "调试用途"
      };

      console.log('=== 调试子节点创建API ===');
      console.log('发送数据:', nodeData);

      const nodeResponse = await createChapterNode(nodeData);
      console.log('子节点创建原始响应:', nodeResponse);
      console.log('响应类型:', typeof nodeResponse);
      console.log('响应键:', Object.keys(nodeResponse || {}));

      if (nodeResponse.data) {
        console.log('response.data:', nodeResponse.data);
        console.log('response.data类型:', typeof nodeResponse.data);
        console.log('response.data键:', Object.keys(nodeResponse.data || {}));
      }

      // 尝试获取子节点ID
      let nodeId = null;
      for (const method of idExtractionMethods) {
        const value = method.name.includes('response.data') ? nodeResponse.data?.[method.name.split('.').pop()] :
                     method.name === 'response.data' ? nodeResponse.data :
                     method.name === 'response.id' ? nodeResponse.id : nodeResponse;

        if (value && (typeof value === 'number' || typeof value === 'string')) {
          nodeId = value;
          console.log(`✓ 从 ${method.name} 获取到子节点ID:`, nodeId);
          break;
        } else {
          console.log(`✗ ${method.name}:`, value, typeof value);
        }
      }

      testResults.value.unshift({
        title: 'API响应格式调试',
        success: true,
        message: `章节ID: ${chapterId}, 子节点ID: ${nodeId}`,
        data: {
          chapterResponse,
          nodeResponse,
          extractedChapterId: chapterId,
          extractedNodeId: nodeId
        },
        time: startTime
      });
    } else {
      throw new Error('无法从章节创建响应中获取ID');
    }

  } catch (error) {
    console.error('API调试失败:', error);
    testResults.value.unshift({
      title: 'API响应格式调试',
      success: false,
      error: error.message || '调试失败',
      errorDetails: error.response?.data || error,
      time: startTime
    });
  } finally {
    testLoading.value = false;
  }
};

// 预览解析结果
const previewParsedNodes = async () => {
  if (!inputText.value.trim()) {
    alert('请输入要解析的文本内容');
    return;
  }

  try {
    if (!textNodeParserRef.value) {
      alert('TextNodeParser组件未加载');
      return;
    }

    const nodes = textNodeParserRef.value.parseText(inputText.value);
    previewNodes.value = nodes;
    console.log('解析预览结果:', nodes);
  } catch (error) {
    console.error('解析失败:', error);
    alert('解析失败：' + error.message);
  }
};

// 创建节点
const createNodes = async () => {
  if (!inputText.value.trim()) {
    alert('请输入要解析的文本内容');
    return;
  }

  if (!selectedCourseId.value) {
    alert('请先选择课程');
    return;
  }

  // 防止重复点击
  if (creating.value) {
    console.warn('节点创建正在进行中，请勿重复点击');
    return;
  }

  creating.value = true;
  progress.value = 0;
  progressText.value = '开始创建节点...';
  createResults.value = [];

  console.log('=== 开始创建节点 ===');
  console.log('输入文本:', inputText.value);
  console.log('课程ID:', selectedCourseId.value);

  try {
    if (!textNodeParserRef.value) {
      throw new Error('TextNodeParser组件未加载');
    }

    const result = await textNodeParserRef.value.parseAndCreateNodes(
      inputText.value,
      selectedCourseId.value,
      {
        onProgress: (message) => {
          progressText.value = message;
          console.log('进度:', message);
        },
        onResult: (result) => {
          createResults.value.push(result);
          console.log('节点结果:', result);
        }
      }
    );

    progress.value = 100;
    progressText.value = '创建完成！';

    console.log('最终结果:', result);

    // 显示完成消息
    const successCount = result.success.length;
    const failCount = result.failed.length;

    if (failCount === 0) {
      alert(`所有节点创建成功！共创建 ${successCount} 个节点。`);
    } else {
      alert(`节点创建完成！成功 ${successCount} 个，失败 ${failCount} 个。请查看详细结果。`);
    }

    // 触发成功通知
    handleNodesCreated();

  } catch (error) {
    console.error('创建节点失败:', error);
    alert('创建节点失败：' + error.message);
  } finally {
    creating.value = false;
  }
};

// 清空所有内容
const clearAll = () => {
  inputText.value = '';
  previewNodes.value = [];
  createResults.value = [];
  progress.value = 0;
  progressText.value = '';
  creating.value = false;
};

// 计算属性
const successCount = computed(() => createResults.value.filter(r => r.success).length);
const failedCount = computed(() => createResults.value.filter(r => !r.success).length);
const totalCount = computed(() => createResults.value.length);

// 检查重复章节
const checkDuplicateChapters = async () => {
  if (!selectedCourseId.value) {
    alert('请先选择课程');
    return;
  }

  testLoading.value = true;
  const startTime = new Date().toLocaleTimeString();

  try {
    // 这里需要调用获取章节列表的API
    // 假设有一个获取章节列表的API
    console.log('=== 检查课程章节 ===');
    console.log('课程ID:', selectedCourseId.value);

    // 模拟API调用 - 您需要根据实际的API来修改这部分
    const response = await fetch(`/api/chapters?courseId=${selectedCourseId.value}`);
    const chapters = await response.json();

    console.log('当前课程的所有章节:', chapters);

    // 检查是否有重复的章节名称
    const chapterNames = chapters.map(ch => ch.name);
    const duplicates = chapterNames.filter((name, index) => chapterNames.indexOf(name) !== index);

    if (duplicates.length > 0) {
      console.warn('发现重复章节:', duplicates);
      alert(`发现重复章节: ${duplicates.join(', ')}`);
    } else {
      console.log('未发现重复章节');
      alert('未发现重复章节');
    }

    testResults.value.unshift({
      title: '重复章节检查',
      success: duplicates.length === 0,
      message: duplicates.length === 0 ? '未发现重复章节' : `发现重复章节: ${duplicates.join(', ')}`,
      data: { chapters, duplicates },
      time: startTime
    });

  } catch (error) {
    console.error('检查重复章节失败:', error);
    testResults.value.unshift({
      title: '重复章节检查',
      success: false,
      error: error.message || '检查失败',
      time: startTime
    });
  } finally {
    testLoading.value = false;
  }
};

// 清空测试结果
const clearTestResults = () => {
  testResults.value = [];
  lastCreatedChapterId.value = null;
  lastCreatedGraphId.value = null;
};

// 页面加载时自动加载默认课程
loadCourseInfo();
</script>

<style scoped>
.text-node-parser-test {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f8fafc;
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.page-description {
  font-size: 1.125rem;
  margin: 0;
  opacity: 0.9;
}

.course-selection {
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.course-selection h2 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.course-input {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.course-input label {
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.course-id-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.course-id-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #6366f1;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #4f46e5;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.course-info {
  margin-top: 1rem;
}

.course-info h3 {
  margin: 0 0 0.75rem 0;
  color: #1f2937;
  font-size: 1rem;
}

.info-card {
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.info-card p {
  margin: 0 0 0.5rem 0;
  color: #4b5563;
}

.info-card p:last-child {
  margin-bottom: 0;
}

.test-section {
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.test-section h2 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.test-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.test-input-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.test-input-group label {
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.test-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.test-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.test-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-info {
  background-color: #0ea5e9;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background-color: #0284c7;
}

.btn-warning {
  background-color: #f59e0b;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background-color: #d97706;
}

.btn-purple {
  background-color: #8b5cf6;
  color: white;
}

.btn-purple:hover:not(:disabled) {
  background-color: #7c3aed;
}

.test-results {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.test-results h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1rem;
}

.test-results-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.test-result-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background-color: #fafafa;
}

.test-result-item.success {
  border-color: #10b981;
  background-color: #f0fdf4;
}

.test-result-item.error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.result-icon {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
}

.test-result-item.success .result-icon {
  background-color: #10b981;
  color: white;
}

.test-result-item.error .result-icon {
  background-color: #ef4444;
  color: white;
}

.result-title {
  flex: 1;
  font-weight: 600;
  color: #1f2937;
}

.result-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.result-details {
  font-size: 0.875rem;
}

.result-success p {
  color: #059669;
  margin: 0 0 0.5rem 0;
}

.result-error p {
  color: #dc2626;
  margin: 0 0 0.5rem 0;
}

.result-data, .error-details {
  margin-top: 0.5rem;
}

.result-data details, .error-details details {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  padding: 0.5rem;
}

.result-data summary, .error-details summary {
  cursor: pointer;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.result-data pre, .error-details pre {
  font-size: 0.75rem;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

.parser-section {
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.parser-section h2 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.input-section {
  margin-bottom: 1.5rem;
}

.input-section h3 {
  margin: 0 0 0.75rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.text-input {
  width: 100%;
  min-height: 300px;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
}

.text-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.preview-section {
  margin-bottom: 1.5rem;
}

.preview-section h3 {
  margin: 0 0 0.75rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.parsed-tree {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.tree-node {
  margin-bottom: 0.5rem;
}

.tree-node.level-1 {
  font-weight: 600;
  color: #1f2937;
}

.tree-node.level-2 {
  margin-left: 1.5rem;
  color: #374151;
}

.tree-node.level-3 {
  margin-left: 3rem;
  color: #6b7280;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.node-number {
  font-weight: 600;
  color: #3b82f6;
}

.node-children {
  margin-top: 0.25rem;
}

.progress-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f0f9ff;
  border-radius: 0.375rem;
  border: 1px solid #bae6fd;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1rem;
}

.progress-text {
  color: #6b7280;
  font-size: 0.875rem;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease;
}

.results-section h3 {
  margin: 0 0 0.75rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.results-summary {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.875rem;
  font-weight: 500;
}

.summary-count {
  font-size: 1.5rem;
  font-weight: 700;
}

.summary-item.success .summary-label {
  color: #059669;
}

.summary-item.success .summary-count {
  color: #10b981;
}

.summary-item.failed .summary-label {
  color: #dc2626;
}

.summary-item.failed .summary-count {
  color: #ef4444;
}

.summary-item.total .summary-label {
  color: #6b7280;
}

.summary-item.total .summary-count {
  color: #374151;
}

.results-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item.success {
  background-color: #f0fdf4;
}

.result-item.error {
  background-color: #fef2f2;
}

.result-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.result-item.success .result-icon {
  background-color: #22c55e;
  color: white;
}

.result-item.error .result-icon {
  background-color: #ef4444;
  color: white;
}

.result-content {
  flex: 1;
}

.result-title {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.result-error {
  font-size: 0.875rem;
  color: #dc2626;
}

.result-warning {
  font-size: 0.875rem;
  color: #f59e0b;
  margin-top: 0.25rem;
}

.examples-section {
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.examples-section h2 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.example-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background-color: #fafafa;
}

.example-card h3 {
  margin: 0 0 0.75rem 0;
  color: #1f2937;
  font-size: 1rem;
}

.example-content {
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
  max-height: 200px;
  overflow-y: auto;
}

.example-content pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #374151;
  white-space: pre-wrap;
}

.success-notification {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background-color: #10b981;
  color: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

.notification-icon {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.notification-text h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.notification-text p {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.9;
}

.notification-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.notification-close:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .text-node-parser-test {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .course-input {
    flex-direction: column;
    align-items: stretch;
  }
  
  .examples-grid {
    grid-template-columns: 1fr;
  }
  
  .success-notification {
    top: 1rem;
    right: 1rem;
    left: 1rem;
  }
}

/* 图标样式 */
.btn-icon, .test-icon, .clear-icon, .debug-icon, .preview-icon, .create-icon, .check-icon {
  width: 1rem;
  height: 1rem;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.test-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.debug-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.preview-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath d='M10 12a2 2 0 100-4 2 2 0 000 4z' /%3E%3Cpath fill-rule='evenodd' d='M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.create-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.check-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clip-rule='evenodd' /%3E%3C/svg%3E");
}

.clear-icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z' clip-rule='evenodd' /%3E%3C/svg%3E");
}
</style>
