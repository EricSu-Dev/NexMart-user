<template>
  <div class="return-detail-page">
    <div class="page-container">
      <div class="page-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/orders' }">我的订单</el-breadcrumb-item>
          <el-breadcrumb-item v-if="returnOrder" :to="{ path: `/order/${returnOrder.orderId}` }">订单详情</el-breadcrumb-item>
          <el-breadcrumb-item>退款详情</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div v-loading="loading">
        <template v-if="returnOrder">
          <!-- 仿订单详情样式的页头 -->
          <div class="header-banner">
            <div class="status-badge" :class="getStatusType(returnOrder.status)">
              {{ getStatusDesc(returnOrder.status) }}
            </div>
            <div class="meta-list">
              <span class="meta-item">订单号：<span class="val">{{ returnOrder.orderNo }}</span></span>
              <span class="meta-item">申请时间：<span class="val">{{ formatTime(returnOrder.createdAt) }}</span></span>
              <!-- 新增取消按钮 -->
              <el-button 
                v-if="[0, 1].includes(returnOrder.status)" 
                type="danger" 
                link 
                class="cancel-link-btn"
                @click="handleCancelRefund"
              >
                取消申请退款
              </el-button>
            </div>
          </div>

          <!-- 如果有通过/拒绝的额外通知 -->
          <div v-if="returnOrder.status === 2 || returnOrder.actualRefundAmount > 0" class="status-alert-wrap">
            <div v-if="returnOrder.status === 2" class="alert-item reject">
              <el-icon><Warning /></el-icon>
              <span>商家拒绝了您的退款申请。原因：{{ returnOrder.rejectReason }}</span>
            </div>
            <div v-if="returnOrder.actualRefundAmount > 0" class="alert-item success">
              <el-icon><CircleCheck /></el-icon>
              <span>商家已处理退款。实际退款金额：<span class="bold">¥{{ returnOrder.actualRefundAmount }}</span></span>
            </div>
          </div>

          <!-- 退款说明 -->
          <el-card class="info-card">
            <template #header><span class="card-title">退款说明</span></template>
            <div class="info-item">
              <span class="label">退款原因</span>
              <span class="value">{{ returnOrder.reason || '无' }}</span>
            </div>
            <div class="info-item">
              <span class="label">预期退款金额</span>
              <span class="value refund-amount">¥{{ returnOrder.expectedRefundAmount }}</span>
            </div>
          </el-card>

          <!-- 商品详情样式重选 -->
          <el-card class="product-card" v-if="orderItem">
            <template #header><span class="card-title">商品详情</span></template>
            <div class="product-item-wrap">
              <div class="product-main">
                <el-image :src="orderItem.coverUrl" fit="cover" class="product-img">
                  <template #error>
                    <div class="img-placeholder"><el-icon><Picture /></el-icon></div>
                  </template>
                </el-image>
                <div class="product-content">
                  <p class="product-name">{{ orderItem.productName }}</p>
                  <p class="product-spec" v-if="orderItem.specName">规格：{{ orderItem.specName }}</p>
                </div>
              </div>
              
              <div class="product-pricing">
                <div class="unit-price">
                  <span class="actual">¥{{ orderItem.promotionalPrice || orderItem.price }}</span>
                  <span class="original" v-if="orderItem.promotionalPrice && orderItem.promotionalPrice !== orderItem.price">¥{{ orderItem.price }}</span>
                </div>
                <div class="quantity">× {{ orderItem.quantity }}</div>
                <div class="subtotal-box">
                  <span v-if="Number(orderItem.couponDiscount || 0) > 0" class="mini-coupon-tag">
                    <el-icon><Ticket /></el-icon> 商品券优惠 -¥{{ Number(orderItem.couponDiscount).toFixed(2) }}
                  </span>
                  <div class="final-amt">
                    <span class="actual">¥{{ orderItem.finalAmount }}</span>
                    <span class="original" v-if="orderItem.finalAmount !== orderItem.originalAmount">¥{{ orderItem.originalAmount }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 凭证图片 -->
          <el-card class="images-card">
            <template #header><span class="card-title">申请凭证</span></template>
            <div v-if="imagesList.length > 0" class="image-list">
              <el-image 
                v-for="(img, index) in imagesList" 
                :key="index"
                :src="img"
                fit="cover"
                class="return-image"
                :preview-src-list="imagesList"
              />
            </div>
            <div v-else class="no-images">未上传凭证图片</div>
          </el-card>
        </template>

        <el-empty v-else-if="!loading" description="退款单不存在或已被撤销">
          <el-button type="primary" @click="$router.back()">返回</el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, Ticket, Warning, CircleCheck } from '@element-plus/icons-vue'
import { orderApi } from '@/api/order'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const returnOrder = ref(null)
const orderItem = ref(null)

// 转换图片列表
const imagesList = computed(() => {
  if (!returnOrder.value || !returnOrder.value.images) return []
  return returnOrder.value.images.split(',').filter(url => url && url.trim() !== '')
})

const formatTime = (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'

// 取消申请退款
const handleCancelRefund = async () => {
  try {
    await ElMessageBox.confirm('确定要取消该退款申请吗？', '提示', {
      confirmButtonText: '确定取消',
      cancelButtonText: '再想想',
      type: 'warning'
    })
    
    loading.value = true
    await orderApi.cancelRefund(returnOrder.value.id)
    ElMessage.success({ message: '退款申请已取消', duration: 1500, offset: 80 })
    // 取消成功后回到订单列表，或者刷新当前页
    // 此处选择重新加载数据以展示“已取消”状态
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Cancel refund failed:', error)
      ElMessage.error('取消失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const returnId = route.params.id
    
    // 一步到位：调用新接口拉取包含订单和商品信息的全量退款详情
    const res = await orderApi.getReturnDetail(returnId)
    if (!res.data) {
      ElMessage.error('该退款申请不存在')
      return
    }
    returnOrder.value = res.data
    // 关键：现在商品详情直接来自 VO 中的 orderItemVO
    orderItem.value = res.data.orderItemVO
    
  } catch (error) {
    console.error('Failed to load return detail:', error)
    ElMessage.error('加载详情失败，请检查网络或刷新重试')
  } finally {
    loading.value = false
  }
}

// 状态样式 (0申请中 1已批准 2已拒绝 3退款处理中 4已退款 5用户取消)
const getStatusType = (status) => {
  switch (status) {
    case 0: return 'info'    // 申请中
    case 1: return 'success' // 已批准
    case 2: return 'danger'  // 已拒绝
    case 3: return 'warning' // 退款处理中
    case 4: return 'success' // 已退款
    case 5: return 'info'    // 用户取消
    default: return 'info'
  }
}

// 状态文字描叙
const getStatusDesc = (status) => {
  const descMap = {
    0: '退款申请中',
    1: '商家已批准',
    2: '退款被拒绝',
    3: '退款处理中',
    4: '已完成退款',
    5: '退款已取消'
  }
  return descMap[status] || '未知状态'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.return-detail-page {
  padding: 24px 0 60px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  margin-bottom: 30px;
}

/* Header Banner 样式覆盖 */
.header-banner {
  background: white;
  padding: 18px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
}

.status-badge {
  padding: 6px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  background: #fff;
}

.status-badge.success { color: #67c23a; border-color: #e1f3d8; background: #f0f9eb; }
.status-badge.danger { color: #f56c6c; border-color: #fde2e2; background: #fef0f0; }
.status-badge.warning { color: #e6a23c; border-color: #faecd8; background: #fdf6ec; }
.status-badge.info { color: #909399; border-color: #e9e9eb; background: #f4f4f5; }

.meta-list {
  display: flex;
  align-items: center;
  gap: 32px;
  font-size: 14px;
  color: #909399;
}

.cancel-link-btn {
  font-size: 14px;
  text-decoration: underline;
  padding: 0;
  height: auto;
  margin-left: -12px;
}

.meta-item .val {
  color: #303133;
  margin-left: 4px;
}

/* 卡片通用 */
.info-card, .images-card, .product-card {
  border-radius: 8px;
  border: none;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.card-title {
  font-weight: 700;
  font-size: 16px;
  color: #303133;
}

/* 详情项 */
.info-item {
  display: flex;
  margin-bottom: 12px;
  font-size: 14px;
}
.info-item .label {
  width: 100px;
  color: #909399;
}
.info-item .value { color: #303133; }
.refund-amount { color: #f56c6c; font-weight: 700; font-size: 18px; }

/* 商品项布局 - 仿订单详情 */
.product-item-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-main {
  display: flex;
  gap: 16px;
  align-items: center;
}

.product-img {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.product-name {
  font-weight: 600;
  font-size: 15px;
  margin: 0 0 8px;
  color: #303133;
}

.product-spec {
  font-size: 13px;
  color: #909399;
  background: #f8f9fb;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

.product-pricing {
  text-align: right;
  min-width: 200px;
}

.unit-price {
  font-size: 14px;
  margin-bottom: 4px;
}
.unit-price .actual { color: #303133; font-weight: 500; }
.unit-price .original { color: #909399; text-decoration: line-through; margin-left: 6px; font-size: 12px; }

.quantity {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.subtotal-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.mini-coupon-tag {
  font-size: 11px;
  color: #7d56f6;
  background: #f4f0ff;
  padding: 1px 10px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.final-amt .actual {
  font-size: 16px;
  font-weight: 700;
  color: #f56c6c;
}
.final-amt .original {
  font-size: 13px;
  color: #c0c4cc;
  text-decoration: line-through;
  margin-left: 6px;
}

/* 提示通知排版 */
.status-alert-wrap { margin-bottom: 20px; }
.alert-item {
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.alert-item.reject { background: #fff1f0; border: 1px solid #ffa39e; color: #cf1322; }
.alert-item.success { background: #f6ffed; border: 1px solid #b7eb8f; color: #389e0d; }
.bold { font-weight: 700; font-size: 16px; }

.image-list { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px; }
.return-image { width: 100px; height: 100px; border-radius: 6px; border: 1px solid #eee; cursor: pointer; transition: 0.2s; }
.return-image:hover { transform: scale(1.03); }
.no-images { color: #909399; font-size: 14px; padding: 10px 0; }
</style>