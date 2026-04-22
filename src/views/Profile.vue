<template>
  <div class="user-center-page">
    <div class="page-container">
      
      <!-- 顶部用户信息 (Clickable Header) -->
      <div class="user-header clickable-header" @click="$router.push('/profile/edit')">
        <div class="avatar-wrapper">
          <el-avatar :size="80" class="hero-avatar" :src="userStore.userInfo?.avatarUrl">
            {{ userStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
          </el-avatar>
        </div>
        <div class="user-info">
          <div class="nickname-row">
            <h2 class="nickname">{{ userStore.userInfo?.username || '未登录用户' }}</h2>
            <el-icon class="edit-icon"><Edit /></el-icon>
          </div>
          <p class="user-desc">{{ userStore.userInfo?.profileSignature || '暂无个性签名' }}</p>
        </div>
      </div>

      <!-- 第一组功能菜单 -->
      <div class="menu-group">
        <div class="menu-list">
          <!-- 商品收藏 -->
          <div class="menu-row" @click="$router.push('/favorites')">
            <div class="row-left">
              <el-icon :size="20"><Star /></el-icon>
              <span>商品收藏</span>
            </div>
            <el-icon color="#c0c4cc"><ArrowRight /></el-icon>
          </div>

          <!-- 浏览记录 -->
          <div class="menu-row" @click="$router.push('/history')">
            <div class="row-left">
              <el-icon :size="20"><Clock /></el-icon>
              <span>浏览记录</span>
            </div>
            <el-icon color="#c0c4cc"><ArrowRight /></el-icon>
          </div>

          <!-- 我的券包 -->
          <div class="menu-row" @click="$router.push('/coupon/my')">
            <div class="row-left">
              <el-icon :size="20"><Ticket /></el-icon>
              <span>我的券包</span>
            </div>
            <el-icon color="#c0c4cc"><ArrowRight /></el-icon>
          </div>

          <!-- 积分商城  -->
          <div class="menu-row" @click="$router.push('/points/mall')">
            <div class="row-left">
              <el-icon :size="20"><Shop /></el-icon>
              <span>积分商城</span>
            </div>
            <el-icon color="#c0c4cc"><ArrowRight /></el-icon>
          </div>

          <!-- 地址管理 (下移) -->
          <div class="menu-row" @click="$router.push('/address')">
            <div class="row-left">
              <el-icon :size="20"><Location /></el-icon>
              <span>地址管理</span>
            </div>
            <el-icon color="#c0c4cc"><ArrowRight /></el-icon>
          </div>
          
          <!-- 密码管理 (下移) -->
          <div class="menu-row" @click="$router.push('/password')">
            <div class="row-left">
              <el-icon :size="20"><Lock /></el-icon>
              <span>密码管理</span>
            </div>
            <el-icon color="#c0c4cc"><ArrowRight /></el-icon>
          </div>

          <!-- 关于我们 -->
          <div class="menu-row" @click="$router.push('/about')">
            <div class="row-left">
              <el-icon :size="20"><InfoFilled /></el-icon>
              <span>关于我们</span>
            </div>
            <el-icon color="#c0c4cc"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <!-- 退出登录 -->
      <el-button type="danger" plain class="logout-btn" @click="handleLogout">退出登录</el-button>

    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  Location, Star, Clock, Ticket, Shop,
  InfoFilled, ArrowRight, Edit, Lock
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    userStore.logout()
    router.push('/login')
  } catch (error) {
    // 用户取消
  }
}

/* =========================================
   REAL API IMPORTS COMMENTED OUT
   =========================================
// import { accountApi } from '@/api/account'
// import { uploadApi } from '@/api/upload'
*/

/* =========================================
   REAL METHODS COMMENTED OUT
   =========================================
// const loadFromStore = () => { ... }
// const handleAvatarUpload = async (file) => { ... }
// const handleProfileSubmit = async () => { ... }
// const handlePasswordSubmit = async () => { ... }
*/
</script>

<style scoped>
.user-center-page {
  padding: 40px 0 60px;
}

.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
.user-header {
  display: flex;
  align-items: center;
  gap: 24px;
  background: var(--bg-white);
  padding: 40px;
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-base);
  margin-bottom: 30px;
  transition: all 0.3s ease;
}

.clickable-header {
  cursor: pointer;
}

.clickable-header:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

.nickname-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.edit-icon {
  color: var(--text-secondary);
  font-size: 18px;
  opacity: 0.6;
}

.clickable-header:hover .edit-icon {
  color: var(--primary-color);
  opacity: 1;
}

.hero-avatar {
  background: var(--primary-color);
  color: #fff;
  font-size: 32px;
  border: 4px solid var(--border-color-lighter);
}

.nickname {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.user-desc {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
}

/* Menu List */
.menu-group {
  background: var(--bg-white);
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-base);
  margin-bottom: 20px;
  overflow: hidden;
}

.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color-lighter);
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-row:last-child {
  border-bottom: none;
}

.menu-row:not(.disabled-feature):hover {
  background-color: var(--border-color-lighter);
}

.row-left {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
}

.row-left .el-icon {
  color: var(--primary-color);
  background: var(--bg-base);
  padding: 8px;
  border-radius: 8px;
  box-sizing: content-box;
}

.logout-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  border-radius: var(--border-radius-large);
  margin-top: 10px;
}
</style>
