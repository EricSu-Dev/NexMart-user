<template>
  <div class="my-coupons">
    <!-- 顶部导航栏 -->
    <div class="top-nav-bar">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/profile' }">个人中心</el-breadcrumb-item>
        <el-breadcrumb-item>我的券包</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="page-header">
      <h1 class="title">我的券包</h1>
      <p class="subtitle">记录你的每一份优惠</p>
      
      <!-- 跳转领券中心 -->
      <div class="coupon-center-link" @click="$router.push('/coupon/center')">
        <span>领券中心</span>
        <el-icon><Ticket /></el-icon>
      </div>
    </div>

    <div class="tabs-container">
      <div class="filter-group">
        <label class="filter-label">类型：</label>
        <el-tabs v-model="activeCouponType" @tab-change="handleTabChange">
          <el-tab-pane label="全部" name="all" />
          <el-tab-pane label="商品券" name="1" />
          <el-tab-pane label="订单券" name="2" />
        </el-tabs>
      </div>
      <div class="filter-group">
        <label class="filter-label">状态：</label>
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="全部" name="all" />
          <el-tab-pane label="未使用" name="0" />
          <el-tab-pane label="已使用" name="1" />
          <el-tab-pane label="已过期" name="2" />
        </el-tabs>
      </div>
    </div>

    <div v-loading="loading" class="coupon-container">
      <div v-if="coupons.length > 0" class="coupon-grid">
        <div 
          v-for="coupon in coupons" 
          :key="coupon.id" 
          :class="['coupon-card', { 'is-inactive': coupon.status !== 0 }]"
        >
          <!-- 左侧：主要金额/折扣 -->
          <div class="coupon-left">
            <div class="value-box">
              <template v-if="coupon.discountType === 1"> <!-- 满减 -->
                <span class="unit">¥</span>
                <span class="value">{{ coupon.discountAmount }}</span>
              </template>
              <template v-else-if="coupon.discountType === 2"> <!-- 折扣 -->
                <span class="value">{{ parseFloat((coupon.discountRate * 10).toFixed(2)) }}</span>
                <span class="unit">折</span>
              </template>
              <template v-else-if="coupon.discountType === 3"> <!-- 无门槛 -->
                <span class="unit">¥</span>
                <span class="value">{{ coupon.discountAmount }}</span>
              </template>
            </div>
            <div class="condition">
              {{ coupon.discountType === 1 ? `满${coupon.minAmount}元可用` : (coupon.discountType === 3 ? '无门槛' : `满${coupon.minAmount}元可用`) }}
            </div>
          </div>

          <!-- 中间：详细信息 -->
          <div class="coupon-info">
            <div class="coupon-header">
              <span class="coupon-tag">{{ coupon.discountTypeDesc }}</span>
              <span v-if="coupon.status === 1" class="status-badge used">已使用</span>
              <span v-else-if="coupon.status === 2" class="status-badge expired">已过期</span>
            </div>
            <h3 class="name">{{ coupon.name }}</h3>
            <p class="scope">适用范围：{{ coupon.scopeDesc || '全场通用' }}</p>
            <p class="expiry">有效期至：{{ formatDate(coupon.expireAt) }}</p>
          </div>

          <!-- 右侧装饰/动作 -->
          <div class="coupon-action">
            <el-button 
              v-if="coupon.status === 0" 
              type="danger" 
              round 
              class="use-btn"
              @click="handleUse(coupon)"
            >
              去使用
            </el-button>
            <div v-else-if="coupon.status === 1" class="stamp used">已使用</div>
            <div v-else-if="coupon.status === 2" class="stamp expired">已过期</div>
          </div>

          <div class="decoration line"></div>
          <div class="decoration circle top"></div>
          <div class="decoration circle bottom"></div>
        </div>
      </div>

      <el-empty v-else-if="!loading" description="空空如也，快去领券中心看看吧">
        <el-button class="empty-btn" @click="$router.push('/coupon/center')">去领券</el-button>
      </el-empty>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { couponApi } from '@/api/coupon'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const coupons = ref([])
const activeTab = ref('all') // all, 0, 1, 2
const activeCouponType = ref('all') // all, 1, 2

const loadCoupons = async () => {
  loading.value = true
  try {
    const params = {}
    if (activeTab.value !== 'all') {
      params.status = parseInt(activeTab.value)
    }
    if (activeCouponType.value !== 'all') {
      params.couponType = parseInt(activeCouponType.value)
    }
    const res = await couponApi.getMyCoupons(params)
    if (res.code === 200) {
      coupons.value = res.data || []
    }
  } catch (error) {
    console.error('加载优惠券失败:', error)
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  loadCoupons()
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

const handleUse = (coupon) => {
  if (coupon.scope === 1) {
    router.push('/')
  } else if (coupon.scope === 2) {
    // 跳转至特定分类
    router.push({ path: '/category', query: { id: coupon.scopeId } })
  } else if (coupon.scope === 3) {
    // 跳转至商品详情页
    router.push(`/product/${coupon.scopeId}`)
  } else {
    // 默认跳转首页
    router.push('/')
  }
}

onMounted(() => {
  // 处理从其他页面跳转而来的类型参数
  if (route.query.type) {
    activeCouponType.value = route.query.type.toString()
  }
  loadCoupons()
})
</script>

<style scoped>
.my-coupons {
  max-width: 1100px;
  margin: 0 auto;
  padding: 10px 20px 40px;
}

.top-nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header {
  position: relative;
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 8px;
  text-align: center;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 16px;
  letter-spacing: 1px;
}

.coupon-center-link {
  position: absolute;
  right: 0;
  top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #6c5ce7;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  padding: 10px 20px;
  border-radius: 24px;
  background: #fff;
  border: 1px solid #f3f0ff;
  box-shadow: 0 4px 12px rgba(108, 92, 231, 0.1);
}

.coupon-center-link:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 20px rgba(108, 92, 231, 0.2);
  background: #f3f0ff;
}

.coupon-center-link .el-icon {
  font-size: 20px;
}

.tabs-container {
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #8c8c8c;
  min-width: 48px;
}

:deep(.el-tabs__header) {
  margin: 0;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__item) {
  font-size: 15px;
  padding: 0 20px !important;
}

:deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 3px;
  background-color: #6c5ce7;
}

.coupon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 24px;
}

@media (max-width: 600px) {
  .coupon-grid {
    grid-template-columns: 1fr;
  }
}

.coupon-card {
  position: relative;
  display: flex;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  height: 150px;
}

.coupon-left {
  width: 150px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  flex-shrink: 0;
}

.value-box {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
}

.unit {
  font-size: 16px;
  font-weight: 600;
}

.value {
  font-size: 36px;
  font-weight: 800;
  margin: 0 2px;
}

.condition {
  font-size: 12px;
  opacity: 0.9;
}

.coupon-info {
  flex: 1;
  padding: 16px 10px 16px 24px; /* 减小右侧边距 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0; /* 防止长文本撑开容器 */
}

.coupon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.coupon-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: #f3f0ff;
  color: #6c5ce7;
  border-radius: 4px;
}

.name {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--text-primary);
}

.scope {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 1px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}

.expiry {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 1px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.coupon-action {
  width: 100px; /* 缩小按钮区域宽度 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.use-btn, .empty-btn {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  border: none;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(108, 92, 231, 0.2);
}

.use-btn:hover, .empty-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(108, 92, 231, 0.3);
}

/* 装饰物 */
.decoration.line {
  position: absolute;
  left: 150px;
  top: 10px;
  bottom: 10px;
  border-left: 2px dashed #f0f0f0;
  z-index: 1;
}

.decoration.circle {
  position: absolute;
  left: 142px;
  width: 16px;
  height: 16px;
  background: var(--bg-base);
  border-radius: 50%;
  z-index: 2;
}

.decoration.circle.top { top: -8px; }
.decoration.circle.bottom { bottom: -8px; }

/* 状态样式 */
.is-inactive {
  filter: grayscale(1);
  opacity: 0.7;
}

.is-inactive .coupon-left {
  background: #bfbfbf;
}

.status-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-badge.used { background: #f5f5f5; color: #8c8c8c; }
.status-badge.expired { background: #fff1f0; color: #f5222d; }

.stamp {
  font-size: 14px;
  font-weight: 800;
  border: 2px solid;
  padding: 4px 8px;
  transform: rotate(-15deg);
  border-radius: 4px;
  text-transform: uppercase;
}

.stamp.used { border-color: #bfbfbf; color: #bfbfbf; }
.stamp.expired { border-color: #ffa39e; color: #f5222d; }

</style>
