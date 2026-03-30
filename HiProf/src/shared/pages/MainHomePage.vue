<template>
  <DefaultLayout>
    <div class="main-homepage-container zoom-container zoom-performance">
      <!-- 主要内容区域：轮播图、日历、座右铭 -->
      <section class="main-content-section">
        <div class="main-content-container">
          <!-- 轮播图区域 -->
          <div class="carousel-area">
            <Carousel />
          </div>
          
          <!-- 日历和座右铭区域 -->
          <div class="widgets-area">
            <div class="calendar-widget">
              <div class="calendar-header">
                <h3 class="calendar-title">{{ currentDateInfo.year }}年{{ currentDateInfo.month }}月</h3>
                <p class="current-date">今天是 {{ formatCurrentDate() }}</p>
              </div>
              <div class="calendar-grid">
                <!-- 表头行 -->
                <div class="week-header">周</div>
                <div v-for="day in weekdays.slice(1)" :key="day" class="weekday-header">{{ day }}</div>
                
                <!-- 数据行 -->
                <template v-for="(week, weekIndex) in calendarWeeks" :key="weekIndex">
                  <div class="week-number">{{ week[0]?.weekNumber ? `第${week[0].weekNumber}周` : '' }}</div>
                  <div 
                    v-for="day in week" 
                    :key="`${day.date}-${day.isCurrentMonth}`"
                    class="day"
                    :class="{ 
                      'current-day': day.isToday, 
                      'other-month': !day.isCurrentMonth 
                    }"
                  >
                    {{ day.date }}
                  </div>
                </template>
              </div>
            </div>
            
            <div class="motto-widget">
              <div class="motto-text">涵养穷索 格物致知</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 知识图谱体验区域 -->
      <section class="knowledge-graph-experience">
        <InteractiveDemo />
      </section>

      <!-- 平台特色展示区域 -->
      <section class="platform-features">
        <div class="container">
          <h2 class="section-title">平台特色功能</h2>
          <p class="section-description">
            Hi Prof 智能教育平台为教师和学生提供全方位的教学与学习支持
          </p>

          <div class="features-grid zoom-grid">
            <div class="feature-card glass-card zoom-card zoom-stable">
              <div class="feature-icon">🔍</div>
              <h3 class="feature-title">知识图谱可视化</h3>
              <p class="feature-description">
                通过交互式图谱直观展示知识点关联，构建完整知识体系
              </p>
            </div>

            <div class="feature-card glass-card">
              <div class="feature-icon">🤖</div>
              <h3 class="feature-title">AI智能助手</h3>
              <p class="feature-description">
                基于DeepSeek先进AI技术，提供个性化问答和学习建议
              </p>
            </div>

            <div class="feature-card glass-card">
              <div class="feature-icon">📚</div>
              <h3 class="feature-title">智能备课工具</h3>
              <p class="feature-description">
                为教师提供教案生成、PPT制作等智能备课功能
              </p>
            </div>

            <div class="feature-card glass-card">
              <div class="feature-icon">🎓</div>
              <h3 class="feature-title">个性化学习</h3>
              <p class="feature-description">
                为学生提供个性化学习路径和进度跟踪
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 可拖动数字人助手 -->
      <!-- 朱熹 - 左侧 -->
      <DraggableAvatar
        type="zhuxi"
        :initial-position="{ x: 50, y: 200 }"
        :auto-open="true"
      />

      <!-- 孔子 - 右侧 -->
      <DraggableAvatar
        type="confucius"
        :initial-position="confuciusPosition"
        :auto-open="true"
      />
    </div>
  </DefaultLayout>
</template>

<script setup>
import { onMounted, onBeforeUnmount, nextTick, ref, computed, reactive } from 'vue';
import DefaultLayout from '@/ui/layouts/DefaultLayout.vue';
import Carousel from '@/ui/home/Carousel.vue';
import InteractiveDemo from '@/ui/home/InteractiveDemo.vue';
import DraggableAvatar from '@/ui/common/DraggableAvatar.vue';

// 孔子的初始位置（右侧）
const confuciusPosition = reactive({
  x: 1200, // 默认值
  y: 200
});

// 计算右对齐位置
const updateConfuciusPosition = () => {
  const screenWidth = window.innerWidth;
  const avatarWidth = 100; // 头像宽度（长方形）
  const margin = 50; // 右边距
  const newX = screenWidth - avatarWidth - margin;

  confuciusPosition.x = newX;
};

// 处理页面加载
onMounted(() => {
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 延迟计算孔子的位置，确保DOM完全渲染
    setTimeout(() => {
      updateConfuciusPosition();
    }, 100);

    // 监听窗口大小变化
    window.addEventListener('resize', updateConfuciusPosition, { passive: true });
  });
});

// 清理事件监听
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateConfuciusPosition);
});

// 日历功能
const today = new Date();
const currentDate = ref(new Date());

const weekdays = ['周', '一', '二', '三', '四', '五', '六', '日'];

const currentDateInfo = computed(() => {
  return {
    year: currentDate.value.getFullYear(),
    month: currentDate.value.getMonth() + 1,
    date: currentDate.value.getDate()
  };
});

const calendarDays = computed(() => {
  const year = currentDateInfo.value.year;
  const month = currentDateInfo.value.month - 1;
  
  // 当月第一天和最后一天
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 计算需要显示的天数
  const firstDayWeek = (firstDay.getDay() + 6) % 7; // 将周日从0转为6，周一从1转为0
  const daysInMonth = lastDay.getDate();
  
  // 9月1日作为第1周的开始
  const sept1 = new Date(year, 8, 1); // 9月是第8个月（0开始）
  
  const days = [];
  
  // 添加上月的天数（灰色显示）
  const prevMonth = new Date(year, month - 1, 0);
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const date = prevMonth.getDate() - i;
    const currentDate = new Date(year, month - 1, date);
    const weekNumber = Math.ceil((currentDate - sept1) / (1000 * 60 * 60 * 24 * 7)) + 1;
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      weekNumber: Math.max(1, weekNumber)
    });
  }
  
  // 添加当月的天数
  for (let date = 1; date <= daysInMonth; date++) {
    const isToday = year === today.getFullYear() && 
                    month === today.getMonth() && 
                    date === today.getDate();
    const currentDate = new Date(year, month, date);
    const weekNumber = Math.ceil((currentDate - sept1) / (1000 * 60 * 60 * 24 * 7)) + 1;
    days.push({
      date,
      isCurrentMonth: true,
      isToday,
      weekNumber: Math.max(1, weekNumber)
    });
  }
  
  // 添加下月的天数（补满6周42天）
  const totalCells = 42;
  const remainingCells = totalCells - days.length;
  for (let date = 1; date <= remainingCells; date++) {
    const currentDate = new Date(year, month + 1, date);
    const weekNumber = Math.ceil((currentDate - sept1) / (1000 * 60 * 60 * 24 * 7)) + 1;
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      weekNumber: Math.max(1, weekNumber)
    });
  }
  
  return days;
});

const calendarWeeks = computed(() => {
  const weeks = [];
  const days = calendarDays.value;
  
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  
  return weeks;
});

const formatCurrentDate = () => {
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const weekday = weekdays[(today.getDay() + 6) % 7 + 1]; // +1是因为weekdays第0个是"周"
  
  return `${year}年${month}月${date}日 星期${weekday}`;
};
</script>

<style scoped>
@import '@/assets/styles/glassmorphism.css';

.main-homepage-container {
  min-height: 100vh;
  background: white;
  position: relative;
}

/* 主要内容区域 - 占满屏幕 */
.main-content-section {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.main-content-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  transform-origin: top left;
  transition: transform 0.3s ease;
}

.carousel-area {
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}

.widgets-area {
  display: flex;
  padding: 0;
  gap: 0;
  background: #f8f9fa;
  flex: 1;
  align-items: stretch;
  width: 100%;
}

.container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  position: relative;
  z-index: 2;
}

.calendar-widget {
  flex: 0 0 40%;
  background: white;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  border: none;
  border-right: 1px solid #e5e5e5;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.motto-widget {
  flex: 1;
  background: white;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  padding: var(--spacing-md);
  height: 100%;
  min-width: 0;
}

.motto-text {
  color: #7D1006;
  font-size: clamp(2rem, 5vw, 6rem);
  font-family: 'KaiTi', 'STKaiti', '楷体', '华文楷体', 'SimKai', serif;
  font-weight: 700;
  letter-spacing: clamp(0.2rem, 0.6vw, 1rem);
  text-shadow: 0 0.375rem 0.75rem rgba(0, 0, 0, 0.4);
  line-height: 1.4;
  text-align: center;
  word-break: keep-all;
  user-select: none;
}

/* 大屏幕优化 */
@media (min-width: 1400px) {
  .motto-text {
    font-size: clamp(3rem, 6vw, 8rem);
    letter-spacing: clamp(0.3rem, 0.8vw, 1.5rem);
  }
}

.calendar-header {
  background: white;
  color: #333;
  padding: var(--spacing-lg);
  text-align: center;
  flex-shrink: 0;
  border-bottom: 1px solid #e5e5e5;
}

.calendar-title {
  font-size: clamp(1rem, 2.2vw, 1.75rem);
  font-weight: 600;
  margin: 0 0 var(--spacing-xs) 0;
  color: #333;
  line-height: 1.3;
}

.current-date {
  font-size: clamp(0.75rem, 1.6vw, 1.125rem);
  margin: 0;
  opacity: 0.9;
  line-height: 1.4;
}

.calendar-grid {
  padding: var(--spacing-md);
  flex: 1;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: auto repeat(6, 1fr);
  gap: 1px;
  align-content: stretch;
}

.week-header, .weekday-header {
  padding: var(--spacing-sm);
  text-align: center;
  font-weight: 600;
  font-size: clamp(0.625rem, 1.2vw, 0.875rem);
  color: #666;
  background: #f8f9fa;
  box-sizing: border-box;
  border: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: auto;
  min-height: 2rem;
}

/* weekday样式已合并到week-header */

/* 移除单独的days容器样式 */

.week-number {
  padding: var(--spacing-sm);
  text-align: center;
  font-size: clamp(0.625rem, 1.2vw, 0.875rem);
  color: #7D1006;
  background: #f8f9fa;
  border: 1px solid #f0f0f0;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 2rem;
}

.day {
  padding: var(--spacing-sm);
  text-align: center;
  font-size: clamp(0.75rem, 1.4vw, 1.125rem);
  color: #333;
  background: white;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 2rem;
}

.day:hover {
  background: #f8f9fa;
}

.day.current-day {
  background: #7D1006;
  color: white;
  font-weight: 600;
  border-color: #7D1006;
}

.day.other-month {
  color: #ccc;
  background: #f9f9f9;
}

/* 桌面端专用设计，移除移动端响应式 */

/* 知识图谱体验区域 */
.knowledge-graph-experience {
  padding: var(--spacing-md) 0;
}

/* 平台特色区域 */
.platform-features {
  padding: var(--spacing-md) 0 var(--spacing-lg);
}

.section-title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 600;
  text-align: center;
  margin-bottom: var(--spacing-md);
  color: rgba(0, 0, 0, 0.85);
  text-shadow: 0 0.125rem 0.625rem rgba(255, 255, 255, 0.5);
  line-height: 1.3;
}

.section-description {
  font-size: clamp(0.875rem, 2vw, 1.125rem);
  color: rgba(0, 0, 0, 0.7);
  text-align: center;
  max-width: 37.5rem;
  margin: 0 auto var(--spacing-md);
  line-height: 1.6;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(17.5rem, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-lg);
  text-align: center;
  transition: var(--glass-transition);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--glass-shadow-hover);
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.25);
}

.feature-icon {
  font-size: clamp(2rem, 4vw, 3rem);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(0.625rem);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: transform var(--transition-normal) ease;
}

.feature-icon:hover {
  transform: scale(1.1);
}

.feature-title {
  font-size: clamp(1.125rem, 2.5vw, 1.5rem);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: rgba(0, 0, 0, 0.9);
  line-height: 1.3;
}

.feature-description {
  font-size: clamp(0.875rem, 1.8vw, 1rem);
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.7);
}

/* 响应式支持 - 使用百分比避免空白 */
@media (max-width: 1400px) {
  .calendar-widget {
    flex: 0 0 45%;
  }
}

@media (max-width: 1200px) {
  .widgets-area {
    flex-direction: column;
    min-height: auto;
  }
  
  .calendar-widget {
    flex: none;
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e5e5;
    height: auto;
  }
  
  .motto-widget {
    min-height: 200px;
    height: auto;
  }
}

@media (max-width: 768px) {
  .main-content-container {
    height: auto;
    min-height: 100vh;
  }
  
  .widgets-area {
    padding: 0;
    flex-direction: column;
  }
  
  .calendar-widget {
    flex: 0 0 auto;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  .feature-card {
    padding: var(--spacing-md);
  }

  .container {
    padding: 0 var(--spacing-md);
  }

  .section-title {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 1.75rem;
  }

  .section-description {
    font-size: 1rem;
  }

  .feature-icon {
    font-size: 2.5rem;
    width: 60px;
    height: 60px;
  }

  .feature-title {
    font-size: 1.25rem;
  }
}
</style>
