<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-grid">
          <div class="footer-section">
            <h3 class="footer-title">关于我们</h3>
            <p class="footer-text">知识图谱网站是一个专注于可视化学习和知识管理的平台，帮助用户构建、分享和学习知识体系。</p>
          </div>
          
          <div class="footer-section">
            <h3 class="footer-title">快速链接</h3>
            <ul class="footer-links">
              <li><router-link to="/" class="footer-link">首页</router-link></li>
              <li><router-link to="/outline" class="footer-link">大纲</router-link></li>
              <li><router-link to="/graph" class="footer-link">知识图谱</router-link></li>
              <li><router-link to="/share" class="footer-link">分享</router-link></li>
              <li><router-link to="/my" class="footer-link">个人中心</router-link></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h3 class="footer-title">帮助中心</h3>
            <ul class="footer-links">
              <li><a href="#" class="footer-link">使用指南</a></li>
              <li><a href="#" class="footer-link">常见问题</a></li>
              <li><a href="#" class="footer-link">联系我们</a></li>
              <li><a href="#" class="footer-link">意见反馈</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h3 class="footer-title">联系方式</h3>
            <p class="footer-text">邮箱：3581441352@qq.com</p>
            <p class="footer-text">电话：</p>
            <div class="social-links mt-2">
              <a href="#" class="social-link">微博</a>
              <a href="#" class="social-link">微信</a>
              <a href="#" class="social-link">QQ</a>
            </div>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p class="copyright">© {{ currentYear }} 知识图谱网站 版权所有</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue';

const currentYear = computed(() => new Date().getFullYear());
</script>

<style scoped>
.footer {
  background: var(--glass-bg-secondary, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.08);
  padding: var(--spacing-lg) 0;
  margin-top: auto;
  position: relative;
  overflow: hidden;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-xl);
}

.footer-title {
  font-size: var(--font-size-medium);
  margin-bottom: var(--spacing-md);
  color: var(--text-color);
}

.footer-text {
  color: var(--text-light);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-small);
  line-height: 1.6;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.footer-link {
  color: var(--text-light);
  font-size: var(--font-size-small);
  transition: color var(--transition-fast);
}

.footer-link:hover {
  color: var(--primary-color);
}

.social-links {
  display: flex;
  gap: var(--spacing-md);
}

.social-link {
  color: var(--text-light);
  transition: color var(--transition-fast);
}

.social-link:hover {
  color: var(--primary-color);
}

.footer-bottom {
  border-top: 1px solid var(--border-color);
  padding-top: var(--spacing-md);
  text-align: center;
}

.copyright {
  color: var(--text-lighter);
  font-size: var(--font-size-small);
}
</style> 