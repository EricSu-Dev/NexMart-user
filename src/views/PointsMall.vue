<template>
  <div class="points-mall">
    <!-- Breadcrumb navigation -->
    <div class="top-nav-bar">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/points' }">签到领积分</el-breadcrumb-item>
        <el-breadcrumb-item>积分商城</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- Header Section -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-box">
          <h1 class="title">积分商城</h1>
          <p class="subtitle">小积分兑出大惊喜</p>
        </div>
        
        <!-- My Points Highlight -->
        <div class="my-points-card">
          <span class="label">可用积分</span>
          <div class="point-value">
            <span class="num">{{ totalPoints }}</span>
            <el-icon class="coin-icon"><Coin /></el-icon>
          </div>
          <el-button type="text" class="link-btn" @click="$router.push('/points/logs')">查看积分明细</el-button>
        </div>
      </div>
    </div>

    <!-- Mall Section -->
    <div v-loading="loading.mall" class="section-container">
      <div class="section-title">
        <el-icon><ShoppingBag /></el-icon>
        精选好券兑换
      </div>

      <div v-if="mallItems.length > 0" class="coupon-grid">
        <div 
          v-for="item in mallItems" 
          :key="item.id" 
          :class="['coupon-card', { 'is-disabled': item.remained === 0 || totalPoints < item.pointsCost }]"
        >
          <!-- Left: Coupon Value -->
          <div class="coupon-left">
            <div class="value-box">
              <template v-if="item.discountType === 1 || item.discountType === 3"> <!-- 满减 or 无门槛 -->
                <span class="unit">¥</span>
                <span class="value">{{ item.discountAmount }}</span>
              </template>
              <template v-else-if="item.discountType === 2"> <!-- 折扣 -->
                <span class="value">{{ parseFloat((item.discountRate * 10).toFixed(2)) }}</span>
                <span class="unit">折</span>
              </template>
            </div>
            <div class="condition">
              {{ getConditionText(item) }}
            </div>
            <div class="stock-info left-stock">
              {{ (item.remained === -1 || item.remained >= 1000000000) ? '不限量' : '剩余 ' + item.remained + ' 份' }}
            </div>
          </div>

          <!-- Middle: Coupon Info -->
          <div class="coupon-info">
            <h3 class="name">{{ item.couponName }}</h3>
            <p class="scope">领取后全场通用</p>
            <p class="expiry">兑换截止：{{ formatDate(item.receiveEnd) }}</p>
            <div class="limit-info">
              每人限领：{{ item.perLimit || 1 }}张
            </div>
          </div>

          <!-- Right: Action Area -->
          <div class="coupon-action">
            <div class="action-wrapper">
              <div v-if="item.remained !== 0" class="points-cost-hint sidebar-hint">
                <el-icon><Coin /></el-icon>
                {{ item.pointsCost }} 积分兑换
              </div>
              
              <template v-if="item.remained !== 0">
                <el-button 
                  type="primary" 
                  round 
                  :disabled="totalPoints < item.pointsCost"
                  @click="handleExchange(item)"
                >
                  {{ totalPoints < item.pointsCost ? '积分不足' : '立即兑换' }}
                </el-button>
              </template>
              <template v-else>
                <div class="stamp sold-out">已抢光</div>
              </template>
            </div>
          </div>
          
          <!-- Decoration -->
          <div class="decoration line"></div>
          <div class="decoration circle top"></div>
          <div class="decoration circle bottom"></div>
        </div>
      </div>
      <el-empty v-else-if="!loading.mall" description="暂无可兑换的券" />
    </div>


    <!-- Success Dialog -->
    <el-dialog
      v-model="successDialog.visible"
      title="兑换成功"
      width="360px"
      center
      custom-class="success-dialog"
    >
      <div class="success-result">
        <div class="icon-box">
          <el-icon color="#67C23A" size="64"><CircleCheckFilled /></el-icon>
        </div>
        <p class="success-msg">恭喜！兑换成功</p>
        <div class="result-details">
          <div class="detail-item">
            <span class="lbl">获得券：</span>
            <span class="val">{{ successDialog.data.couponName }}</span>
          </div>
          <div class="detail-item">
            <span class="lbl">扣除积分：</span>
            <span class="val highlight">-{{ successDialog.data.pointsUsed }}</span>
          </div>
          <div class="detail-item">
            <span class="lbl">剩余积分：</span>
            <span class="val">{{ successDialog.data.remainPoints }}</span>
          </div>
          <div class="detail-item">
            <span class="lbl">有效期至：</span>
            <span class="val">{{ formatDate(successDialog.data.expireAt) }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" round @click="successDialog.visible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { 
  Coin, ShoppingBag, List, CirclePlus, Remove, 
  CircleCheckFilled, Ticket, ArrowRight 
} from '@element-plus/icons-vue'
import { pointsApi } from '@/api/points'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const loading = reactive({
  mall: false
})

const totalPoints = ref(0)
const mallItems = ref([])


const successDialog = reactive({
  visible: false,
  data: {}
})

const loadMallData = async () => {
  loading.mall = true
  try {
    const res = await pointsApi.getMallList()
    if (res.code === 200) {
      totalPoints.value = res.data.totalPoints
      mallItems.value = res.data.items || []
    }
  } catch (error) {
    console.error('Failed to load points mall:', error)
  } finally {
    loading.mall = false
  }
}


const handleExchange = async (item) => {
  try {
    await ElMessageBox.confirm(`确定消耗 ${item.pointsCost} 积分兑换「${item.couponName}」吗？`, '积分兑换', {
      confirmButtonText: '立即兑换',
      cancelButtonText: '取消',
      type: 'info',
      roundButton: true
    })

    const res = await pointsApi.exchangePoints(item.id)
    if (res.code === 200) {
      successDialog.data = res.data
      successDialog.visible = true
      // Update balance immediately
      totalPoints.value = res.data.remainPoints
      // Refresh list and logs
      loadMallData()
    } else {
      ElMessage.error(res.message || '兑换失败')
    }
  } catch (err) {
    // User canceled
  }
}

const getConditionText = (item) => {
  if (item.discountType === 1) return '满减券'
  if (item.discountType === 2) return '折扣券'
  if (item.discountType === 3) return '无门槛'
  return '优惠券'
}

const formatDate = (dateStr, format = 'YYYY-MM-DD HH:mm') => {
  if (!dateStr) return '-'
  return dayjs(dateStr).format(format)
}


onMounted(() => {
  loadMallData()
})
</script>

<style scoped>
.points-mall {
  max-width: 1100px;
  margin: 0 auto;
  padding: 10px 20px 60px;
}

.top-nav-bar {
  margin-bottom: 20px;
}

/* Header styling similar to CouponCenter but with points card */
.page-header {
  margin-bottom: 40px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #fff 0%, #fffaf0 100%);
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  border: 1px solid #ffecec;
}

.title {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #94a3b8;
  font-size: 15px;
}

.my-points-card {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.my-points-card .label {
  font-size: 13px;
  color: #64748b;
}

.point-value {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.point-value .num {
  font-size: 36px;
  font-weight: 900;
  color: #ff8e53;
  line-height: 1;
}

.coin-icon {
  font-size: 24px;
  color: #ffb100;
}

.link-btn {
  padding: 0;
  font-size: 13px;
  color: #ff6b6b;
}

/* Section Title */
.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 24px;
}

.section-title .el-icon {
  color: #ff6b6b;
}

.section-container {
  margin-top: 40px;
}

/* Coupon Card Styling - Exact replica of CouponCenter.vue style */
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
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
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

.value {
  font-size: 40px;
  font-weight: 800;
  margin-right: 4px;
}

.unit {
  font-size: 14px;
  font-weight: 600;
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
  padding: 20px 10px 20px 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  min-width: 0;
}

.name {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 10px;
  color: #1e293b;
}

.scope, .expiry, .limit-info {
  font-size: 12px;
  color: #64748b;
  margin: 2px 0;
}

.limit-info {
  margin-top: 8px;
  color: #94a3b8;
}

.action-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.points-cost-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #ff8e53;
}

.sidebar-hint {
  margin-bottom: 0;
}

.coupon-action {
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 15px;
}

.coupon-action :deep(.el-button--primary) {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  border: none;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
}

.coupon-action :deep(.el-button--primary.is-disabled) {
  background: #e2e8f0;
  color: #94a3b8;
  box-shadow: none;
}

/* Decorations */
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
  background: #f8fafc; /* Match page background */
  border-radius: 50%;
  z-index: 2;
}

.decoration.circle.top { top: -8px; }
.decoration.circle.bottom { bottom: -8px; }

/* Disabled state */
.coupon-card.is-disabled .coupon-left {
  background: #cbd5e1;
}

.coupon-card.is-disabled .name,
.coupon-card.is-disabled .value,
.coupon-card.is-disabled .unit {
  color: #94a3b8;
}

.stamp {
  font-size: 14px;
  font-weight: 700;
  border: 2px solid;
  padding: 4px 8px;
  transform: rotate(-15deg);
  border-radius: 4px;
}

.stamp.sold-out { border-color: #fca5a5; color: #ef4444; }

/* Log Section */
.log-section {
  background: #fff;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
  border: 1px solid #f1f5f9;
}

.log-table-wrapper {
  margin-top: 20px;
}

.type-cell {
  display: flex;
  align-items: center;
}

.delta-text {
  font-size: 16px;
  font-weight: 700;
}

.plus { color: #10b981; }
.minus { color: #ef4444; }

.pagination-box {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

/* Success Dialog Styling */
.success-result {
  text-align: center;
  padding: 20px 0;
}

.success-msg {
  font-size: 20px;
  font-weight: 700;
  margin: 16px 0 24px;
  color: #1e293b;
}

.result-details {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  text-align: left;
}

.detail-item {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}

.detail-item:last-child { margin-bottom: 0; }

.detail-item .lbl { color: #64748b; }
.detail-item .val { font-weight: 600; color: #1e293b; }
.detail-item .val.highlight { color: #ef4444; }

:deep(.log-header-cell) {
  background-color: #f8fafc !important;
  color: #475569;
  font-weight: 700;
}
</style>
