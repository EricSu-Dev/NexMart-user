<template>
  <div class="coupon-center">
    <!-- 顶部导航栏 -->
    <div class="top-nav-bar">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>领券中心</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="page-header">
      <h1 class="title">领券中心</h1>
      <p class="subtitle">好券提前领，购物更省心</p>
      
      <!-- 我的券包跳转 -->
      <div class="my-coupons-link" @click="$router.push('/coupon/my')">
        <span>我的券包</span>
        <el-icon><Ticket /></el-icon>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-section">
      <div class="filter-group">
        <button 
          v-for="type in filterTypes" 
          :key="type.value"
          :class="['filter-btn', { active: selectedType === type.value }]"
          @click="handleFilter(type.value)"
        >
          {{ type.label }}
        </button>
      </div>
    </div>

    <div v-loading="loading" class="coupon-container">
      <div v-if="coupons.length > 0" class="coupon-grid">
        <div 
          v-for="coupon in coupons" 
          :key="coupon.id" 
          :class="['coupon-card', { 'is-disabled': !coupon.receivable || coupon.remained <= 0 }]"
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
            <!-- 剩余数量移动至左侧 -->
            <div class="stock-info left-stock">
              {{ coupon.remained >= 100000000 ? '不限量' : '剩余 ' + coupon.remained + ' 张' }}
            </div>
          </div>

          <!-- 中间：详细信息 -->
          <div class="coupon-info">
            <h3 class="name">{{ coupon.name }}</h3>
            <p class="scope">适用范围：{{ coupon.scope === 1 ? '全场通用' : (coupon.scopeName || coupon.scopeDesc) }}</p>
            <p class="expiry">截止时间：{{ formatDate(coupon.receiveEnd) }}</p>
            <p class="limit">每人限领：{{ coupon.perLimit }}张</p>
          </div>

          <!-- 右侧：按钮或印章 -->
          <div class="coupon-action">
            <template v-if="coupon.receivable && coupon.remained > 0">
              <el-button 
                type="primary" 
                round 
                @click="handleReceive(coupon)"
              >
                立即领取
              </el-button>
            </template>
            <template v-else>
              <div :class="['stamp', coupon.receivable ? 'sold-out' : 'received']">
                {{ coupon.receivable ? '已领完' : '已领取' }}
              </div>
            </template>
          </div>
          
          <div class="decoration line"></div>
          <div class="decoration circle top"></div>
          <div class="decoration circle bottom"></div>
        </div>
      </div>

      <el-empty v-else-if="!loading" description="暂无可领取的优惠券" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { couponApi } from '@/api/coupon'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const coupons = ref([])
const selectedType = ref(null)

const filterTypes = [
  { label: '全部', value: null },
  { label: '满减券', value: 1 },
  { label: '折扣券', value: 2 },
  { label: '无门槛券', value: 3 }
]

const loadCoupons = async () => {
  loading.value = true
  try {
    const params = selectedType.value !== null ? { discountType: selectedType.value } : {}
    const res = await couponApi.getReceivableList(params)
    if (res.code === 200) {
      coupons.value = res.data || []
    }
  } catch (error) {
    console.error('加载优惠券失败:', error)
  } finally {
    loading.value = false
  }
}

const handleFilter = (type) => {
  selectedType.value = type
  loadCoupons()
}

const handleReceive = async (coupon) => {
  try {
    const res = await couponApi.receiveCoupon(coupon.id)
    if (res.code === 200) {
      ElMessage.success('领取成功！')
      loadCoupons() // 刷新列表
    } else {
      ElMessage.error(res.msg || '领取失败')
    }
  } catch (error) {
    // 拦截器通常会处理错误，这里做兜底
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  loadCoupons()
})
</script>

<style scoped>
.coupon-center {
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
  margin-bottom: 50px;
}

.my-coupons-link {
  position: absolute;
  right: 0;
  top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #ff6b6b;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  padding: 10px 20px;
  border-radius: 24px;
  background: #fff;
  border: 1px solid #ffecec;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.1);
}

.my-coupons-link:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 20px rgba(255, 77, 79, 0.2);
  background: #fff1f0;
}

.my-coupons-link .el-icon {
  font-size: 20px;
}

.title {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 8px;
  text-align: center;
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 16px;
  letter-spacing: 1px;
}

/* 筛选栏样式 */
.filter-section {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.filter-group {
  display: flex;
  background: rgba(255, 255, 255, 0.8);
  padding: 6px;
  border-radius: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(240, 240, 240, 0.8);
}

.filter-btn {
  padding: 10px 24px;
  border-radius: 24px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-btn:hover {
  color: var(--primary-color);
}

.filter-btn.active {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.coupon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 30px;
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
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  height: 170px;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.coupon-card:hover:not(.is-disabled) {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
}

.coupon-left {
  width: 170px;
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  flex-shrink: 0;
  position: relative;
}

.coupon-left::after {
  content: '';
  position: absolute;
  right: -1px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-image: linear-gradient(to bottom, #fff 50%, transparent 50%);
  background-size: 1px 12px;
  background-repeat: repeat-y;
  opacity: 0.3;
}

.value-box {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
}

.unit {
  font-size: 18px;
  font-weight: 600;
}

.value {
  font-size: 40px;
  font-weight: 800;
  margin: 0 2px;
}

.condition {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.left-stock {
  font-size: 11px;
  opacity: 0.75;
  background: rgba(255, 255, 255, 0.15);
  padding: 1px 8px;
  border-radius: 10px;
  margin-top: 4px;
}

.coupon-info {
  flex: 1;
  padding: 20px 10px 20px 24px; /* 减小右侧边距 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  min-width: 0;
}

.coupon-tag {
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  background: #fff0f0;
  color: #ff4d4f;
  border-radius: 4px;
  margin-bottom: 8px;
  width: fit-content;
}

.name {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 10px;
  color: var(--text-primary);
}

.scope, .expiry, .limit {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scope {
  line-height: 1.4;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
}

.stock-info {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-placeholder);
}

.coupon-action {
  width: 110px; /* 略微调整宽度配合印章 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.coupon-action :deep(.el-button--primary) {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  border: none;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
}

.coupon-action :deep(.el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 77, 79, 0.3);
  opacity: 0.9;
}

/* 印章样式 */
.stamp {
  font-size: 14px;
  font-weight: 800;
  border: 2px solid;
  padding: 4px 8px;
  transform: rotate(-15deg);
  border-radius: 4px;
  text-transform: uppercase;
  user-select: none;
}

.stamp.received { border-color: #bfbfbf; color: #bfbfbf; }
.stamp.sold-out { border-color: #ffa39e; color: #f5222d; }

/* 装饰物 */
.decoration.line {
  position: absolute;
  left: 170px;
  top: 10px;
  bottom: 10px;
  border-left: 2px dashed #f0f0f0;
  z-index: 1;
}

.decoration.circle {
  position: absolute;
  left: 162px;
  width: 16px;
  height: 16px;
  background: var(--bg-base); /* 应该和页面背景一致 */
  border-radius: 50%;
  z-index: 2;
}

.decoration.circle.top {
  top: -8px;
}

.decoration.circle.bottom {
  bottom: -8px;
}

/* 禁用/已领取状态灰度 */
.coupon-card.is-disabled {
  filter: grayscale(1);
  opacity: 0.7;
}

.coupon-card.is-disabled .coupon-left {
  background: #d9d9d9;
}

.coupon-card.is-disabled .name,
.coupon-card.is-disabled .value,
.coupon-card.is-disabled .unit {
  color: #8c8c8c;
}
</style>
