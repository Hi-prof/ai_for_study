import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/styles/theme.css';
import './assets/styles/glassmorphism.css';
import './assets/styles/components/index.css';

// 创建Vue应用实例
const app = createApp(App);

// 使用路由
app.use(router);

// 添加全局滚动重置
if (window.location.pathname === '/') {
  // 确保首页滚动到顶部
  window.addEventListener('load', () => {
    window.scrollTo(0, 0);
    
    // 延迟再次滚动，确保所有资源加载完成
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }, { passive: true });
}

// 挂载应用
app.mount('#app');
