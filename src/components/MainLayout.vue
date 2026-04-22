<template>
  <div class="layout">
    <!-- 顶部导航栏 -->
    <header class="navbar">
      <div class="navbar-inner">
        <!-- Logo区 -->
        <router-link to="/" class="logo">NexMart</router-link>

        <!-- 主导航区 -->
        <nav class="main-nav">
          <router-link to="/" class="nav-item" exact-active-class="active">首页</router-link>
          <router-link to="/category" class="nav-item" active-class="active">分类</router-link>
          <router-link to="/cart" class="nav-item" active-class="active">
            <el-badge :value="userStore.cartCount" :hidden="userStore.cartCount <= 0" :max="99" class="nav-badge">
              购物车
            </el-badge>
          </router-link>
          <router-link to="/orders" class="nav-item" active-class="active">我的订单</router-link>
          <router-link to="/profile" class="nav-item" active-class="active">个人中心</router-link>
          <router-link to="/customer-service" class="nav-item" active-class="active">
            <el-badge :value="csStore.unreadCount" :hidden="csStore.unreadCount <= 0" :max="99" class="nav-badge">
              客服中心
            </el-badge>
          </router-link>
          <router-link to="/ai-assistant" class="nav-item" active-class="active">AI 小助手</router-link>
        </nav>

        <!-- 右侧操作区：登录注册 / 头像下拉 -->
        <div class="nav-actions">
          <!-- 未登录 -->
          <template v-if="!userStore.isLoggedIn">
            <el-button text class="login-text-btn" @click="$router.push('/login')">登录 / 注册</el-button>
          </template>

          <!-- 已登录 -->
          <template v-else>
            <el-dropdown trigger="click" @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="36" class="avatar-circle" :src="userStore.userInfo?.avatarUrl">
                  {{ userStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
                </el-avatar>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </div>
      </div>
    </header>

    <!-- 页面内容 -->
    <main class="page-content">
      <router-view />
    </main>

    <!-- 底部 (Placeholder) -->
    <footer class="footer">
      <p>© 2026 NexMart Demo Mockup. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCustomerServiceStore } from '@/stores/customerService'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const csStore = useCustomerServiceStore()

const syncCustomerServiceState = async () => {
  const isCustomerServicePage = route.name === 'CustomerService'
  csStore.setChatActive(isCustomerServicePage)

  if (!userStore.isLoggedIn) {
    csStore.disconnect()
    return
  }

  try {
    const session = await csStore.initSession()
    if (session?.id) {
      csStore.connectWebSocket(session.id)
    }
  } catch (error) {
    console.error('Failed to initialize customer service connection:', error)
  }
}

const handleCommand = (cmd) => {
  if (cmd === 'logout') {
    csStore.disconnect()
    userStore.logout()
    router.push('/')
  }
}

onMounted(() => {
  // We keep this to not crash the layout, even though API is mocked later
  userStore.loadCartCount && userStore.loadCartCount()
  csStore.checkPendingSeckillResult()
})

watch(
  () => userStore.isLoggedIn,
  () => {
    syncCustomerServiceState()
  },
  { immediate: true }
)

watch(
  () => route.name,
  () => {
    csStore.setChatActive(route.name === 'CustomerService')
  }
)

onUnmounted(() => {
  csStore.disconnect()
})
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Navbar */
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--bg-white, #fff);
  height: var(--nav-height, 64px);
  border-bottom: 1px solid var(--border-color-lighter, #ebeef5);
  box-shadow: var(--box-shadow-base);
}

.navbar-inner {
  max-width: var(--layout-max-width, 1440px);
  height: 100%;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 26px;
  font-weight: 800;
  color: var(--primary-color, #409eff);
  text-decoration: none;
  letter-spacing: 1px;
}

/* Main Navigation */
.main-nav {
  display: flex;
  gap: 40px;
  height: 100%;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  font-size: 16px;
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 500;
  transition: var(--transition-base);
}

.nav-item:hover, .nav-item.active {
  color: var(--primary-color);
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: var(--primary-color);
  border-radius: 2px 2px 0 0;
}

:deep(.nav-badge .el-badge__content) {
  top: 10px;
  right: -2px;
  transform: translateY(-50%) translateX(100%) scale(0.85);
}

/* Actions */
.nav-actions {
  display: flex;
  align-items: center;
}

.login-text-btn {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-regular, #606266);
}

.login-text-btn:hover {
  color: var(--primary-color, #409eff);
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.avatar-circle {
  background-color: var(--primary-color, #409eff);
  color: #fff;
  transition: transform 0.2s;
}

.user-info:hover .avatar-circle {
  transform: scale(1.05);
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.5);
}

/* Content Area */
.page-content {
  flex: 1;
  width: 100%;
  max-width: var(--layout-max-width, 1440px);
  margin: 0 auto;
  padding: 30px 40px;
  background: var(--bg-base);
}

.footer {
  text-align: center;
  padding: 24px;
  color: var(--text-secondary);
  font-size: 14px;
  background: var(--bg-white, #fff);
  border-top: 1px solid var(--border-color-lighter);
}
</style>
