<template>
  <div
    class="draggable-avatar"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px',
      transform: isDragging ? 'scale(1.1)' : 'scale(1)'
    }"
    @mousedown="startDrag"
    @click="toggleChat"
  >
    <!-- 数字人头像 -->
    <div
      class="avatar-container"
      :class="{
        'dragging': isDragging,
        'speaking': isPlaying,
        'muted': isMuted
      }"
      :title="getStatusTooltip()"
    >
      <div class="avatar-image">
        <img :src="avatar.image" :alt="avatar.name" />
      </div>

      <!-- 语音状态指示器 -->
      <div v-if="isPlaying" class="voice-indicator">
        <div class="voice-wave"></div>
        <div class="voice-wave"></div>
        <div class="voice-wave"></div>
      </div>

      <!-- 状态提示点 -->
      <div class="status-dot" :class="{ 'muted': isMuted, 'speaking': isPlaying }"></div>
    </div>

    <!-- 聊天气泡 -->
    <div
      v-if="showChat"
      class="chat-bubble"
      :class="bubblePosition"
      @click.stop
    >
      <div class="chat-header">
        <span class="avatar-name">{{ avatar.name }}</span>
      </div>
      <div class="chat-content">
        <p>{{ avatar.greeting }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import confuciusImg from '@/assets/images/confucius.svg';
import zhuxiImg from '@/assets/images/zhuxi.svg';

// 定义props
const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['confucius', 'zhuxi'].includes(value)
  },
  initialPosition: {
    type: Object,
    default: () => ({ x: 50, y: 200 })
  },
  autoOpen: {
    type: Boolean,
    default: false
  }
});

// 数字人数据
const avatars = {
  confucius: {
    name: '孔子',
    image: confuciusImg,
    greeting: '温故而知新，可以为师矣。'
  },
  zhuxi: {
    name: '朱熹',
    image: zhuxiImg,
    greeting: '涵养穷索,格物致知'
  }
};

// 响应式数据
const position = reactive({
  x: props.initialPosition.x,
  y: props.initialPosition.y
});
const isDragging = ref(false);
const showChat = ref(false);
const hasMoved = ref(false);

// 音频相关状态
const isPlaying = ref(false);
const isMuted = ref(true); // 页面初始静音状态

// 监听初始位置变化
watch(() => props.initialPosition, (newPos) => {
  if (!hasMoved.value && !isDragging.value) {
    position.x = newPos.x;
    position.y = newPos.y;
  }
}, { deep: true });

// 计算属性
const avatar = computed(() => avatars[props.type]);
const bubblePosition = computed(() => {
  // 根据位置决定气泡方向
  const isLeftSide = position.x < window.innerWidth / 2;
  return isLeftSide ? 'bubble-right' : 'bubble-left';
});

// 拖拽相关
let dragOffset = { x: 0, y: 0 };

const startDrag = (e) => {
  isDragging.value = true;
  hasMoved.value = false;

  // 计算鼠标相对于元素当前位置的偏移
  dragOffset.x = e.clientX - position.x;
  dragOffset.y = e.clientY - position.y;

  document.addEventListener('mousemove', onDrag, { passive: false });
  document.addEventListener('mouseup', stopDrag, { passive: true });
  e.preventDefault();
};

const onDrag = (e) => {
  if (!isDragging.value) return;

  // 防止默认行为和事件冒泡
  e.preventDefault();
  e.stopPropagation();

  hasMoved.value = true; // 标记已经移动过

  const newX = e.clientX - dragOffset.x;
  const newY = e.clientY - dragOffset.y;

  // 限制在视窗范围内，考虑元素大小
  const elementWidth = 100;
  const elementHeight = 160;
  const maxX = window.innerWidth - elementWidth;
  const maxY = window.innerHeight - elementHeight;

  position.x = Math.max(0, Math.min(newX, maxX));
  position.y = Math.max(0, Math.min(newY, maxY));
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);

  // 延迟重置移动标记，避免点击事件立即触发
  setTimeout(() => {
    hasMoved.value = false;
  }, 100);
};

// 获取数字人的语音配置
const getVoiceConfig = (avatarType) => {
  const configs = {
    confucius: {
      // 孔子 - 粗犷北方声音
      rate: 0.7,
      pitch: 0.15,
      volume: 0.95,
      voicePreference: ['male', 'rough', 'northern']
    },
    zhuxi: {
      // 朱熹 - 山东男性声音
      rate: 0.75,
      pitch: 0.2,
      volume: 0.9,
      voicePreference: ['male', 'scholarly', 'northern']
    }
  };

  return configs[avatarType] || configs.confucius;
};

// 获取所有可用的中文语音
const getAvailableChineseVoices = () => {
  if (!('speechSynthesis' in window)) return [];

  const voices = window.speechSynthesis.getVoices();
  return voices.filter(voice =>
    voice.lang.includes('zh') ||
    voice.lang.includes('CN') ||
    voice.lang.includes('cmn') ||
    voice.name.toLowerCase().includes('chinese')
  );
};

// 严格筛选男性语音
const getMaleVoicesOnly = () => {
  const chineseVoices = getAvailableChineseVoices();

  // 已知的男性语音名称（不区分大小写）
  const knownMaleVoices = [
    'kangkang',     // Microsoft Kangkang (男性)
    'male',         // 包含male的语音
    'man',          // 包含man的语音
    '男',           // 中文男性标识
    'yunxi',        // 微软云希（男性）
    'xiaobei',      // 微软小北（男性）
    'xiaogang',     // 微软小刚（男性）
    'xiaolei',      // 微软小雷（男性）
  ];

  // 已知的女性语音名称（需要排除）
  const knownFemaleVoices = [
    'yaoyao',       // Microsoft Yaoyao (女性)
    'huihui',       // Microsoft Huihui (女性)
    'female',       // 包含female的语音
    'woman',        // 包含woman的语音
    '女',           // 中文女性标识
    'xiaoxiao',     // 微软晓晓（女性）
    'xiaoyi',       // 微软小艺（女性）
    'xiaomo',       // 微软小墨（女性）
    'ting-ting',    // macOS中文女性语音
    'sin-ji',       // macOS中文女性语音
  ];

  // 筛选男性语音
  const maleVoices = chineseVoices.filter(voice => {
    const voiceName = voice.name.toLowerCase();

    // 如果明确包含男性标识，优先选择
    const isMale = knownMaleVoices.some(male => voiceName.includes(male));
    if (isMale) return true;

    // 如果明确包含女性标识，排除
    const isFemale = knownFemaleVoices.some(female => voiceName.includes(female));
    if (isFemale) return false;

    // 对于不确定的语音，暂时保留（用户可以手动测试）
    return true;
  });

  return maleVoices;
};

// 选择最适合的语音引擎
const selectBestVoice = (avatarType, voiceIndex = null) => {
  if (!('speechSynthesis' in window)) return null;

  // 优先使用男性语音
  const maleVoices = getMaleVoicesOnly();
  const allChineseVoices = getAvailableChineseVoices();

  // 如果指定了语音索引，从所有中文语音中选择
  if (voiceIndex !== null && voiceIndex < allChineseVoices.length) {
    return allChineseVoices[voiceIndex];
  }

  // 优先使用筛选出的男性语音
  const voicesToUse = maleVoices.length > 0 ? maleVoices : allChineseVoices;

  if (voicesToUse.length === 0) return null;

  // 为不同数字人选择不同的语音
  if (voicesToUse.length > 1) {
    if (avatarType === 'confucius') {
      return voicesToUse[0];
    } else if (avatarType === 'zhuxi') {
      return voicesToUse[Math.min(1, voicesToUse.length - 1)];
    }
  }

  return voicesToUse[0];
};

// 文本转语音功能
const speakText = (text) => {
  // 检查浏览器是否支持Web Speech API
  if (!('speechSynthesis' in window)) {
    console.warn('浏览器不支持语音合成功能');
    return;
  }

  // 如果正在播放，先停止
  if (isPlaying.value) {
    window.speechSynthesis.cancel();
    isPlaying.value = false;
  }

  // 如果静音状态，不播放语音
  if (isMuted.value) {
    isMuted.value = false; // 首次点击取消静音
  }

  // 创建语音合成实例
  const utterance = new SpeechSynthesisUtterance(text);

  // 获取当前数字人的语音配置
  const voiceConfig = getVoiceConfig(props.type);
  const selectedVoice = selectBestVoice(props.type);

  // 设置语音参数
  utterance.lang = 'zh-CN'; // 中文
  utterance.rate = voiceConfig.rate; // 个性化语速
  utterance.pitch = voiceConfig.pitch; // 个性化音调
  utterance.volume = voiceConfig.volume; // 个性化音量

  // 设置语音引擎（如果找到合适的）
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    console.log(`${avatar.value.name}使用语音:`, selectedVoice.name, `(${selectedVoice.lang})`);
  } else {
    console.log(`${avatar.value.name}使用默认语音`);
  }

  // 语音事件监听
  utterance.onstart = () => {
    isPlaying.value = true;
  };

  utterance.onend = () => {
    isPlaying.value = false;
  };

  utterance.onerror = (event) => {
    console.error('语音合成错误:', event.error);
    isPlaying.value = false;
  };

  // 开始语音合成
  window.speechSynthesis.speak(utterance);
};

// 聊天相关
const toggleChat = () => {
  // 如果刚刚拖拽过，不触发聊天
  if (isDragging.value || hasMoved.value) return;

  const wasVisible = showChat.value;

  // 如果对话框已存在，先隐藏再显示（重新弹出效果）
  if (wasVisible) {
    showChat.value = false;
    // 短暂延迟后重新显示，创建重新弹出的视觉效果
    setTimeout(() => {
      showChat.value = true;
      // 朗读对话框内容
      speakText(avatar.value.greeting);
    }, 100);
  } else {
    // 对话框不存在，直接显示并朗读
    showChat.value = true;
    // 朗读对话框内容
    speakText(avatar.value.greeting);
  }
};

// 获取状态提示文字
const getStatusTooltip = () => {
  if (isPlaying.value) {
    return `${avatar.value.name}正在朗读...`;
  } else if (isMuted.value) {
    return `点击${avatar.value.name}开始语音交互`;
  } else {
    return `点击${avatar.value.name}重新朗读`;
  }
};



// 简化的语音初始化
const showAvailableVoices = () => {
  const maleVoices = getMaleVoicesOnly();
  console.log(`${avatar.value.name} 已配置为${props.type === 'confucius' ? '粗犷北方' : '山东男性'}风格`);
  if (maleVoices.length > 0) {
    console.log(`✅ 找到 ${maleVoices.length} 个男性语音，优先使用`);
  }
};

// 初始化语音引擎
const initVoices = () => {
  if ('speechSynthesis' in window) {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        showAvailableVoices();
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
};

// 生命周期
onMounted(() => {
  // 初始化语音引擎
  initVoices();

  // 如果设置了自动打开，2秒后自动打开对话框
  if (props.autoOpen) {
    setTimeout(() => {
      if (!showChat.value && !hasMoved.value) {
        showChat.value = true;
      }
    }, 2000);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);

  // 清理语音合成
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
});
</script>

<style scoped>
.draggable-avatar {
  position: fixed;
  z-index: 9999;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s ease;
}

.avatar-container {
  position: relative;
  width: 100px;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  background: white;
  border: 2px solid white;
}

/* 静音状态样式 */
.avatar-container.muted {
  opacity: 0.8;
  border-color: rgba(156, 163, 175, 0.6);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.avatar-container.muted:hover {
  opacity: 0.9;
  border-color: rgba(156, 163, 175, 0.8);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
}

.avatar-container:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.avatar-container.dragging {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.avatar-container.speaking {
  animation: speaking-pulse 1.5s ease-in-out infinite;
}

@keyframes speaking-pulse {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
  50% {
    box-shadow: 0 6px 30px rgba(59, 130, 246, 0.4);
  }
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.avatar-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 语音状态指示器 */
.voice-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(59, 130, 246, 0.9);
  padding: 4px 6px;
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.voice-wave {
  width: 3px;
  height: 12px;
  background: white;
  border-radius: 2px;
  animation: voice-wave 1.2s ease-in-out infinite;
}

.voice-wave:nth-child(2) {
  animation-delay: 0.2s;
}

.voice-wave:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes voice-wave {
  0%, 100% {
    height: 4px;
  }
  50% {
    height: 12px;
  }
}

/* 状态提示点 */
.status-dot {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.8);
  transition: all 0.3s ease;
  opacity: 0;
}

.status-dot.muted {
  background: rgba(156, 163, 175, 0.8);
  opacity: 1;
}

.status-dot.speaking {
  background: rgba(59, 130, 246, 0.9);
  opacity: 1;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    transform: translateX(-50%) scale(1);
    opacity: 0.8;
  }
  50% {
    transform: translateX(-50%) scale(1.3);
    opacity: 1;
  }
}



.chat-bubble {
  position: absolute;
  bottom: 170px;
  width: 280px;
  background: transparent;
  border-radius: 15px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  border: 2px solid white;
  overflow: visible;
  animation: slideUp 0.3s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 聊天气泡的小三角形指向 */
.chat-bubble::before {
  content: '';
  position: absolute;
  bottom: -12px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 12px 12px 0 12px;
  border-color: white transparent transparent transparent;
}

.chat-bubble::after {
  content: '';
  position: absolute;
  bottom: -8px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 10px 10px 0 10px;
  border-color: transparent transparent transparent transparent;
  background: transparent;
}

.chat-bubble.bubble-right {
  left: 110px; /* 气泡在右侧 */
}

.chat-bubble.bubble-right::before {
  left: 30px; /* 三角形指向左侧的数字人 */
}

.chat-bubble.bubble-right::after {
  left: 32px;
}

.chat-bubble.bubble-left {
  right: 110px; /* 气泡在左侧 */
}

.chat-bubble.bubble-left::before {
  right: 30px; /* 三角形指向右侧的数字人 */
}

.chat-bubble.bubble-left::after {
  right: 32px;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.chat-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 16px;
  background: transparent;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.avatar-name {
  font-weight: 600;
  font-size: 14px;
}



.chat-content {
  padding: 16px;
}

.chat-content p {
  margin: 0 0 12px 0;
  line-height: 1.5;
  color: white;
  font-size: 14px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}



/* 响应式设计 */
@media (max-width: 768px) {
  .chat-bubble {
    width: 250px;
  }

  .chat-bubble.bubble-right {
    left: 80px;
  }

  .chat-bubble.bubble-right::before {
    left: 25px;
  }

  .chat-bubble.bubble-right::after {
    left: 27px;
  }

  .chat-bubble.bubble-left {
    right: 80px;
  }

  .chat-bubble.bubble-left::before {
    right: 25px;
  }

  .chat-bubble.bubble-left::after {
    right: 27px;
  }

  .avatar-container {
    width: 80px;
    height: 128px;
  }
}
</style>
