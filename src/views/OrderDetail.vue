<template>
  <div class="order-detail-page">
    <div class="page-container" v-loading="loading">
      <div class="page-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/orders' }">我的订单</el-breadcrumb-item>
          <el-breadcrumb-item v-if="order && order.id" :to="{ path: `/order/${order.id}` }">订单详情</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/orders', query: { status: order?.status } }">
            {{ getStatusText(order?.status) }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>订单详情</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <template v-if="order">
        <!-- 状态卡片 -->
        <el-card class="status-card">
          <div class="status-section">
            <el-tag :type="statusType" size="large" effect="plain">{{ order.statusDesc }}</el-tag>
            <div class="order-meta">
              <span>订单号：<strong>{{ order.orderNo }}</strong></span>
              <span>下单时间：{{ order.createdAt }}</span>
              <span v-if="order.status === 4 && order.completeTime">完成时间：{{ order.completeTime }}</span>
            </div>
          </div>
          <div class="status-actions">
            <el-button v-if="order.status === 1 && order.payStatus === 0" type="primary" @click="handlePay">去支付</el-button>
            <el-button v-if="order.status === 1" plain @click="handleCancel">取消订单</el-button>
            <el-button v-if="order.status === 3" type="success" plain @click="handleConfirm">确认收货</el-button>
          </div>
        </el-card>

        <!-- 收货地址 -->
        <el-card class="address-card">
          <template #header><span class="card-title">收货信息</span></template>
          <div class="address-info">
            <div class="address-row">
              <span class="label">收货人：</span>
              <span>{{ order.receiverName || 'Eric' }}</span>
              <span class="label phone-label">联系电话：</span>
              <span>{{ order.receiverPhone || '18533333333' }}</span>
            </div>
            <div class="address-row">
              <span class="label">收货地址：</span>
              <span>{{ order.address || '江苏省无锡市滨湖区惠山路9号' }}</span>
            </div>
          </div>
        </el-card>

        <!-- 商品列表 -->
        <el-card class="items-card">
          <template #header><span class="card-title">商品清单</span></template>
          <div v-for="item in order.items" :key="item.id" class="order-item">
            <el-image :src="item.coverUrl" fit="cover" class="item-img">
              <template #error>
                <div class="img-placeholder"><el-icon><Picture /></el-icon></div>
              </template>
            </el-image>
            <div class="item-info">
              <el-tag v-if="item.promotionName" type="danger" size="small" effect="light" class="promotion-tag">
                {{ item.promotionName }}
              </el-tag>
              <p class="item-name" @click="$router.push(`/product/${item.productId}`)">{{ item.productName }}</p>
              <div v-if="item.couponName" class="item-coupon-tag">
                <el-icon><Ticket /></el-icon>
                <span>已用券：{{ item.couponName }}</span>
              </div>
              <p class="item-spec" v-if="item.specName">规格：{{ item.specName }}</p>
            </div>
            <div class="item-price">
              <div class="price-container">
                <span class="unit-price">¥{{ item.price }}</span>
              </div>
              <span class="qty">× {{ item.quantity }}</span>
              <div class="subtotal-container">
                <template v-if="item.finalAmount && item.finalAmount !== item.originalAmount">
                  <span v-if="Number(item.couponDiscount || 0) > 0" class="item-discount-hint">
                    <el-icon class="icon-ticket"><Ticket /></el-icon>
                    商品券优惠 -¥{{ Number(item.couponDiscount || 0).toFixed(2) }}
                  </span>
                  <div class="price-row">
                    <span class="original-subtotal">¥{{ item.originalAmount }}</span>
                    <span class="actual-subtotal">¥{{ item.finalAmount }}</span>
                  </div>
                </template>
                <template v-else>
                  <span class="subtotal">¥{{ item.finalAmount || item.originalAmount }}</span>
                </template>
              </div>
              <!-- 商品评价按钮 -->
              <div v-if="order.status === 4" class="item-review-btn">
                <el-button 
                  v-if="!item.reviewed" 
                  plain 
                  type="primary" 
                  size="default"
                  @click="$router.push({ path: '/review/write', query: { orderItemId: item.id, productId: item.productId } })"
                >
                  评价
                </el-button>
                <el-button 
                  v-else 
                  plain 
                  type="info" 
                  size="default"
                  @click="$router.push(`/review/${item.reviewId}`)"
                >
                  查看评价
                </el-button>
              </div>
              
              <!-- 查看退款进度按钮 -->
              <div v-if="item.returnOrder" class="item-return-btn">
                <el-button 
                  type="primary" 
                  plain 
                  size="default"
                  @click="viewReturnDetail(item.returnOrder.id)"
                >
                  {{ getReturnStatusDesc(item.returnOrder.status) }}
                </el-button>
              </div>
              
              <!-- 申请退货按钮 -->
              <div v-else-if="order.status === 4 && canApplyReturn(item)" class="item-return-btn">
                <el-button 
                  type="danger" 
                  plain 
                  size="default"
                  @click="applyReturn(item)"
                >
                  申请退货
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 金额汇总 -->
        <el-card class="summary-card">
          <div class="summary-row">
            <span class="label">订单原价</span>
            <span class="val">¥{{ order.originalAmount }}</span>
          </div>
          <div v-if="Number(order.promotionTotalDiscount || 0) > 0" class="summary-row promo">
            <span class="label">活动优惠合计</span>
            <span class="val">-¥{{ order.promotionTotalDiscount }}</span>
          </div>
          <div v-if="Number(order.seckillDiscount || 0) > 0" class="summary-row promo seckill">
            <span class="label">秒杀优惠合计</span>
            <span class="val">-¥{{ order.seckillDiscount }}</span>
          </div>
          <div v-if="Number(order.productCouponTotalDiscount || 0) > 0" class="summary-row coupon">
            <span class="label">商品券优惠 ({{ getFirstItemCouponName() || '商品券' }})</span>
            <span class="val">-¥{{ order.productCouponTotalDiscount }}</span>
          </div>
          <div v-if="Number(order.orderCouponDiscount || 0) > 0" class="summary-row coupon">
            <span class="label">订单券优惠 ({{ order.orderCouponName || '优惠券' }})</span>
            <span class="val">-¥{{ order.orderCouponDiscount }}</span>
          </div>
          <div class="summary-row">
            <span class="label">运费</span>
            <span class="val">免运费</span>
          </div>
          <div class="summary-row total-row">
            <span class="label">实付金额</span>
            <span class="total-price">¥{{ order.finalAmount }}</span>
          </div>
        </el-card>
      </template>

      <el-empty v-else-if="!loading" description="订单不存在或已被删除">
        <el-button type="primary" @click="$router.push('/orders')">返回订单列表</el-button>
      </el-empty>
      
      <!-- 退货申请对话框 -->
      <el-dialog
        v-model="returnDialogVisible"
        title="申请退货"
        width="400px"
      >
        <el-form :model="returnForm" label-width="80px">
          <el-form-item label="退款金额">
            <el-input-number
              v-model="returnForm.expectedRefundAmount"
              :precision="2"
              :step="0.1"
              :min="0"
              style="width: 100%"
              placeholder="请输入期望退款金额"
            />
            <div class="el-upload__tip" style="line-height: 1.4; margin-top: 4px;">
              最多可退 ¥{{ returnOrderItem ? (returnOrderItem.finalAmount || 0) : 0 }}（商品实付金额）
            </div>
          </el-form-item>
          <el-form-item label="退货原因">
            <el-input
              v-model="returnForm.reason"
              type="textarea"
              :rows="4"
              placeholder="请详细描述退货原因"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="上传凭证">
            <el-upload
              class="upload-demo"
              action="/api/common/upload/image"
              :on-preview="handleReturnPreview"
              :on-remove="handleReturnRemove"
              :on-success="handleReturnUploadSuccess"
              :on-error="handleReturnUploadError"
              :headers="uploadHeaders"
              :file-list="returnFileList"
              list-type="picture"
            >
              <el-button type="primary">选择图片</el-button>
              <template #tip>
                <div class="el-upload__tip">
                  请上传退货相关凭证图片，最多3张
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="returnDialogVisible = false">取消</el-button>
            <el-button type="danger" :loading="returnLoading" @click="submitReturn">提交申请</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElDialog, ElInput, ElUpload, ElButton, ElForm, ElFormItem } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { orderApi } from '@/api/order'
import { paymentApi } from '@/api/payment'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const order = ref(null)

// 退货相关状态
const returnDialogVisible = ref(false)
const returnOrderItem = ref(null)
const returnForm = ref({
  reason: '',
  images: '',
  expectedRefundAmount: 0
})
const returnLoading = ref(false)
const returnFileList = ref([])
const uploadHeaders = ref({})

// 初始化上传头部信息
const initUploadHeaders = () => {
  const userStore = useUserStore()
  if (userStore.token) {
    uploadHeaders.value = {
      'Authorization': `Bearer ${userStore.token}`
    }
  }
}

const statusType = computed(() => {
  const s = order.value?.status
  if (s === 1) return 'danger'
  if (s === 4) return 'success'
  if (s === 0) return 'info'
  return 'primary'
})

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 0: return '全部'
    case 1: return '待付款'
    case 2: return '待发货'
    case 3: return '待收货'
    case 4: return '已完成'
    default: return '全部'
  }
}

// 转换退款状态文字 (0申请中 1已批准 2已拒绝 3退款处理中 4已退款 5用户取消)
const getReturnStatusDesc = (status) => {
  const descMap = {
    0: '退款申请中',
    1: '商家已批准',
    2: '退款被拒绝',
    3: '退款处理中',
    4: '已完成退款',
    5: '退款已取消'
  }
  return descMap[status] || '退款处理中'
}

// 获取第一个订单项的优惠券名称
const getFirstItemCouponName = () => {
  if (order.value?.items && order.value.items.length > 0) {
    return order.value.items[0].couponName || ''
  }
  return ''
}

const loadOrder = async () => {
  loading.value = true
  try {
    const res = await orderApi.getDetail(route.params.id)
    if (res.data) {
      const data = res.data
      // 对订单项进行极致兼容映射，确保价格和金额在有/无活动、有/无优惠券的情况下都能正确显示
      data.items = (data.items || []).map(i => {
        // 1. 识别折后单价（优先级：promotionalPrice > actualPrice > discountedPrice）
        const promotionalPrice = i.promotionalPrice ?? i.actualPrice ?? i.discountedPrice ?? null
        
        // 2. 计算实付总额（核心修复：如果 finalAmount 缺失，使用单价 * 数量兜底，并增加 NaN 防护）
        const calcFinalAmount = i.finalAmount ?? (Number(promotionalPrice || i.price || 0) * (i.quantity || 0))
        const finalAmount = !isNaN(calcFinalAmount) ? Number(calcFinalAmount).toFixed(2) : (i.originalAmount || '0.00')

        // 3. 计算原价总额
        const calcOriginalAmount = i.originalAmount ?? (Number(i.price || 0) * (i.quantity || 0))
        const originalAmount = !isNaN(calcOriginalAmount) ? Number(calcOriginalAmount).toFixed(2) : '0.00'
        
        return {
          ...i,
          promotionalPrice,
          originalAmount,
          finalAmount
        }
      })
      order.value = data
    }
  } catch (error) {
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

const handlePay = async () => {
  try {
    const html = await paymentApi.pay(order.value.id)
    const div = document.createElement('div')
    div.innerHTML = html
    document.body.appendChild(div)
    div.querySelector('form').submit()
  } catch (error) {
    ElMessage.error('支付跳转失败')
  }
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('确定取消该订单吗？', '提示', { type: 'warning' })
    await orderApi.cancel(order.value.id)
    ElMessage.success({ message: '订单已取消', duration: 1500, offset: 80 })
    loadOrder()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('取消失败')
  }
}

const handleConfirm = async () => {
  try {
    await ElMessageBox.confirm('确认已收到商品？', '提示', { type: 'warning' })
    await orderApi.confirm(order.value.id)
    ElMessage.success({ message: '已确认收货', duration: 1500, offset: 80 })
    loadOrder()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('确认失败')
  }
}

// 获取退货状态类型
const getReturnStatusType = (status) => {
  switch (status) {
    case 1: return 'primary' // 待处理
    case 2: return 'success' // 已通过
    case 3: return 'danger'  // 已拒绝
    case 4: return 'info'    // 已退款
    default: return 'info'
  }
}

// 判断是否可以申请退货（7天内）
const canApplyReturn = (item) => {
  if (!order.value || !order.value.createdAt) return false
  
  const orderTime = new Date(order.value.createdAt)
  const now = new Date()
  const daysDiff = (now - orderTime) / (1000 * 60 * 60 * 24)
  
  return daysDiff <= 7
}

// 申请退货
const applyReturn = (item) => {
  returnOrderItem.value = item
  returnForm.value = {
    reason: '',
    images: '',
    expectedRefundAmount: Number(item.finalAmount || 0) // 默认填入最大可退金额
  }
  returnFileList.value = []
  returnDialogVisible.value = true
}

// 查看退款进度
const viewReturnDetail = (returnOrderId) => {
  if (!returnOrderId) {
    ElMessage.error('退款信息已丢失，请刷新页面重试')
    return
  }
  router.push(`/return/${returnOrderId}`)
}

// 提交退货申请
const submitReturn = async () => {
  const amount = Number(returnForm.value.expectedRefundAmount || 0)
  const itemFinalAmount = Number(returnOrderItem.value?.finalAmount || 0)
  const orderFinalAmount = Number(order.value?.finalAmount || 0)
  const isSingleItem = order.value?.items?.length === 1

  if (amount <= 0) {
    ElMessage.warning('退款金额必须大于 0')
    return
  }

  if (amount > itemFinalAmount) {
    ElMessage.warning(`退款金额不能超过商品实付金额 ¥${itemFinalAmount}`)
    return
  }

  if (isSingleItem && amount > orderFinalAmount) {
    ElMessage.warning(`退款金额不能超过订单总金额 ¥${orderFinalAmount}`)
    return
  }

  if (!returnForm.value.reason) {
    ElMessage.warning('请填写退货原因')
    return
  }
  
  returnLoading.value = true
  try {
    await orderApi.applyRefund({
      orderId: order.value.id,
      orderItemId: returnOrderItem.value.id,
      reason: returnForm.value.reason,
      images: returnForm.value.images,
      expectedRefundAmount: amount
    })
    ElMessage.success({ message: '退货申请已提交', duration: 1500, offset: 80 })
    returnDialogVisible.value = false
    loadOrder()
  } catch (error) {
    ElMessage.error('退货申请失败')
  } finally {
    returnLoading.value = false
  }
}

// 文件上传相关方法
const handleReturnPreview = (file) => {
  console.log(file)
}

const handleReturnRemove = (file, fileList) => {
  console.log(file, fileList)
  // 从退货表单中移除被删除的图片
  if (file.response && file.response.data) {
    const imageUrl = file.response.data
    const images = returnForm.value.images.split(',').filter(url => url !== imageUrl)
    returnForm.value.images = images.join(',')
  }
}

const handleReturnUploadSuccess = (response, file, fileList) => {
  // 上传成功后，将图片URL添加到退货表单中
  if (response && response.data) {
    const imageUrl = response.data
    if (returnForm.value.images) {
      returnForm.value.images += ',' + imageUrl
    } else {
      returnForm.value.images = imageUrl
    }
  }
}

const handleReturnUploadError = (error, file, fileList) => {
  ElMessage.error('图片上传失败，请重试')
  console.error('上传失败:', error)
}

onMounted(() => {
  // 先加载订单，再初始化上传头部信息
  loadOrder()
  initUploadHeaders()
})
</script>

<style scoped>
.order-detail-page { padding: 30px 0 60px; }

.page-container {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.status-card, .address-card, .items-card, .summary-card {
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-base);
  border: none;
  margin-bottom: 20px;
}

.status-section {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.order-meta {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: var(--text-secondary);
}

.status-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.card-title {
  font-weight: 700;
  font-size: 16px;
  color: var(--text-primary);
}

.order-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color-lighter);
}
.order-item:last-child { border-bottom: none; }

.item-img {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  flex-shrink: 0;
}

.img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
  color: var(--text-secondary);
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 8px 0 6px;
  cursor: pointer;
}
.item-name:hover { color: var(--primary-color); }

.promotion-tag {
  margin-bottom: 4px;
  display: inline-block;
  vertical-align: middle;
  line-height: 20px;
}

.price-container {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
}

.actual-price {
  font-size: 14px;
  color: var(--danger-color);
  font-weight: 600;
}

.original-price {
  font-size: 12px;
  color: var(--text-secondary);
  text-decoration: line-through;
}

.subtotal-container {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.price-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.actual-subtotal {
  font-size: 18px;
  color: var(--danger-color);
  font-weight: 700;
}

.original-subtotal {
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: line-through;
}

.original-total {
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: line-through;
  margin-left: 8px;
}

.summary-card .price-container {
  align-items: baseline;
  gap: 8px;
}

.item-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 120px;
}

.item-spec {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.item-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.unit-price { font-size: 14px; color: var(--text-secondary); }
.qty { font-size: 13px; color: var(--text-secondary); }
.subtotal { font-size: 16px; color: var(--danger-color); font-weight: 700; }

.item-review-btn {
  margin-top: 8px;
}

.item-return-btn {
  margin-top: 8px;
}

.return-status {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--border-color-lighter);
}

.return-info {
  padding-left: 16px;
}

.return-row {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}

.return-row .label {
  width: 80px;
  font-weight: 600;
  color: var(--text-regular);
  flex-shrink: 0;
}

.refund-amount {
  color: var(--danger-color);
  font-weight: 700;
}

.image-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.return-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
}

/* 限制上传文件名称长度 */
:deep(.el-upload-list__item-name) {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-card .summary-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 15px;
  color: #303133;
  border-bottom: 1px dashed var(--border-color-lighter);
}
.summary-card .summary-row:last-child { border-bottom: none; }
.summary-card .label { color: #606266; }
.summary-card .summary-row.promo .val,
.summary-card .summary-row.coupon .val {
  color: #f56c6c;
  font-weight: 600;
}

.summary-card .summary-row.promo.seckill .val {
  color: #e6a23c;
}
.total-row { padding-top: 16px !important; }
.total-row .label { font-weight: 700; font-size: 16px; color: var(--text-primary); }
.total-price { font-size: 24px; font-weight: 800; color: var(--danger-color); }

.item-coupon-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #6c5ce7;
  background: #f3f0ff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 6px;
}

.item-discount-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #7d56f6;
  background: #f4f0ff;
  padding: 1px 8px;
  border-radius: 4px;
  margin-right: 8px;
  font-weight: 500;
  border: 1px solid rgba(125, 86, 246, 0.1);
}

.icon-ticket {
  font-size: 12px;
}

.address-info {
  padding: 12px 0;
}

.address-row {
  display: flex;
  margin-bottom: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.address-row .label {
  width: 80px;
  font-weight: 600;
  color: var(--text-regular);
  flex-shrink: 0;
}

.address-row .phone-label {
  width: 80px;
  margin-left: 24px;
}

.address-row span:not(.label) {
  flex: 1;
  color: var(--text-primary);
  line-height: 1.4;
  min-width: 120px;
}
</style>
