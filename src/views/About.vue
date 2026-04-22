<template>
  <div class="about-page">
    <div class="page-container">
      <div class="page-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/profile' }">个人中心</el-breadcrumb-item>
          <el-breadcrumb-item>关于我们</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div class="content-card">
        <div class="about-header">
          <div class="logo">
            <span class="logo-text">NexMart</span>
          </div>
          <h1 class="app-name">NexMart 电商平台</h1>
          <p class="slogan">让购物更简单，让生活更美好</p>
        </div>

        <el-divider />

        <div class="about-section">
          <h2 class="section-title">关于 NexMart</h2>
          <p class="section-content">
            NexMart 是一个现代化的电子商务平台，致力于为用户提供便捷、安全、愉悦的在线购物体验。
            我们精选优质商品，提供完善的售后服务，让每一位用户都能享受到品质生活。
          </p>
        </div>

        <div class="about-section">
          <h2 class="section-title">我们的使命</h2>
          <p class="section-content">
            通过技术创新和优质服务，连接消费者与优质商品，打造值得信赖的购物平台，
            让每一次购物都成为美好的体验。
          </p>
        </div>

        <div class="about-section">
          <h2 class="section-title">核心价值</h2>
          <div class="value-list">
            <div class="value-item">
              <el-icon :size="32" class="value-icon"><Goods /></el-icon>
              <h3>品质保证</h3>
              <p>严选商品，品质无忧</p>
            </div>
            <div class="value-item">
              <el-icon :size="32" class="value-icon"><Service /></el-icon>
              <h3>贴心服务</h3>
              <p>专业客服，随时在线</p>
            </div>
            <div class="value-item">
              <el-icon :size="32" class="value-icon"><Lock /></el-icon>
              <h3>安全可靠</h3>
              <p>支付安全，隐私保护</p>
            </div>
            <div class="value-item">
              <el-icon :size="32" class="value-icon"><Van /></el-icon>
              <h3>快速配送</h3>
              <p>物流快捷，准时送达</p>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="about-section">
          <h2 class="section-title">联系我们</h2>
          <div class="contact-info">
            <p><el-icon><Message /></el-icon> 邮箱：2923249470@qq.com</p>
            <p><el-icon><Phone /></el-icon> 客服热线：1859522xxxx</p>
            <p><el-icon><Clock /></el-icon> 服务时间：周一至周日 9:00-21:00</p>
          </div>
        </div>


      </div>
    </div>
  </div>
</template>

<script setup>
import { Goods, Service, Lock, Van, Message, Phone, Clock } from '@element-plus/icons-vue'
</script>

<style scoped>
.about-page {
  padding: 24px 0;
  min-height: calc(100vh - 60px);
  background: var(--bg-base);
}

.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  margin-bottom: 20px;
}

.content-card {
  background: var(--bg-white);
  border-radius: var(--border-radius-large);
  padding: 40px;
  box-shadow: var(--box-shadow-base);
}

.about-header {
  text-align: center;
  padding: 20px 0;
}

.logo {
  margin-bottom: 16px;
}

.logo-text {
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-color), #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.slogan {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
}

.about-section {
  margin: 30px 0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px;
  padding-left: 12px;
  border-left: 4px solid var(--primary-color);
}

.section-content {
  font-size: 15px;
  color: var(--text-regular);
  line-height: 1.8;
  margin: 0;
}

.value-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 16px;
}

.value-item {
  text-align: center;
  padding: 24px 16px;
  background: var(--bg-base);
  border-radius: var(--border-radius-base);
  transition: all 0.3s;
}

.value-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.value-icon {
  color: var(--primary-color);
  margin-bottom: 12px;
}

.value-item h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.value-item p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.contact-info {
  background: var(--bg-base);
  padding: 20px 24px;
  border-radius: var(--border-radius-base);
}

.contact-info p {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: var(--text-regular);
  margin: 0 0 12px;
}

.contact-info p:last-child {
  margin-bottom: 0;
}

.contact-info .el-icon {
  color: var(--primary-color);
}

.copyright {
  text-align: center;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color-lighter);
}

.copyright p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 4px;
}

.version {
  font-size: 12px !important;
  color: var(--text-placeholder) !important;
}
</style>
