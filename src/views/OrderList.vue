<template>
  <div class="orders-page">
    <div class="page-container">
      <h2 class="page-title">我的订单</h2>

      <!-- Tab 切换栏 -->
      <div class="tabs-header">
        <div class="tab-items">
          <div class="tab-item" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部</div>
          <div class="tab-item" :class="{ active: activeTab === 'paying' }" @click="activeTab = 'paying'">待付款</div>
          <div class="tab-item" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">待发货</div>
          <div class="tab-item" :class="{ active: activeTab === 'receiving' }" @click="activeTab = 'receiving'">待收货</div>
          <div class="tab-item" :class="{ active: activeTab === 'completed' }" @click="activeTab = 'completed'">已完成</div>
          <div class="tab-item" :class="{ active: activeTab === 'cancelled' }" @click="activeTab = 'cancelled'">已取消</div>
        </div>
        <div class="search-container">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索订单号"
            clearable
            @keyup.enter="handleSearch"
            @clear="handleSearch"
            style="max-width: 200px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="handleSearch" size="small">搜索</el-button>
        </div>
      </div>

      <!-- 订单列表 -->
      <div class="orders-list" v-loading="loading">
        <template v-if="orders.length > 0">
          <div v-for="order in orders" :key="order.id" class="order-card">
            
            <!-- 订单头部 -->
            <div class="order-header">
              <span class="order-time">{{ order.createdAt }}</span>
              <span class="order-no">订单号：{{ order.orderNo }}</span>
              <span class="order-qty">共 {{ order.totalQuantity }} 件商品</span>
              <el-tag :type="order.statusType" effect="plain" class="order-status-tag">
                {{ order.statusDesc }}
              </el-tag>
            </div>

            <!-- 商品列表 -->
            <div class="order-items">
              <div v-for="item in order.items" :key="item.id" class="order-item">
                <div class="item-img">
                  <el-image :src="item.coverUrl" fit="cover" style="width:100%;height:100%">
                    <template #error>
                      <div class="mock-image" style="height:100%"><el-icon><Picture /></el-icon></div>
                    </template>
                  </el-image>
                </div>
                <div class="item-info">
                  <el-tag v-if="item.promotionName" type="danger" size="small" effect="light" class="promotion-tag">
                    {{ item.promotionName }}
                  </el-tag>
                  <p class="item-name">{{ item.productName }}</p>
                  <div class="item-tags" v-if="item.seckillName" style="margin-bottom: 4px;">
                    <el-tag type="warning" size="small" effect="dark" class="seckill-tag">
                      {{ item.seckillName }}
                    </el-tag>
                  </div>
                  <p class="item-meta" v-if="item.specName">规格：{{ item.specName }}</p>
                  <div class="item-tags" v-if="Number(item.couponDiscount || 0) > 0" style="margin-top: 6px;">
                    <span class="item-discount-hint">
                      <el-icon class="icon-ticket"><Ticket /></el-icon>
                      商品券优惠 -¥{{ Number(item.couponDiscount || 0).toFixed(2) }}
                    </span>
                  </div>
                </div>
                <!-- 多商品评价入口 -->
                <div v-if="order.status === 4 && order.items?.length > 1" class="multi-item-review">
                  <el-button 
                    v-if="!item.returnOrder" 
                    type="danger" 
                    plain 
                    @click.stop="applyRefund(order, item)"
                  >
                    申请退款
                  </el-button>
                  <template v-else>
                    <el-button 
                      v-if="[0, 1].includes(item.returnOrder.status)" 
                      type="warning" 
                      plain 
                      @click.stop="cancelRefund(item.returnOrder.id)"
                    >
                      取消申请退款
                    </el-button>
                    <el-button 
                      type="primary" 
                      plain 
                      :class="{ 'gray-button': item.returnOrder.status === 5 }"
                      @click.stop="viewReturnDetail(item.returnOrder.id)"
                    >
                      {{ getReturnStatusDesc(item.returnOrder.status) }}
                    </el-button>
                  </template>
                  <el-button 
                    v-if="!item.reviewed" 
                    plain 
                    type="primary" 
                    @click.stop="$router.push({ path: '/review/write', query: { orderItemId: item.id, productId: item.productId } })"
                  >
                    评价
                  </el-button>
                  <el-button 
                    v-else 
                    plain 
                    @click.stop="$router.push(`/review/${item.reviewId}`)"
                  >
                    查看评价
                  </el-button>
                </div>

                <div class="item-price-qty">
                  <div class="price-container">
                    <span class="p-price">¥{{ item.price }}</span>
                  </div>
                  <span class="p-qty">x{{ item.quantity }}</span>
                  <div class="subtotal-container">
                    <template v-if="item.finalAmount && item.finalAmount !== item.originalAmount">
                      <div class="subtotal-row">
                        <span class="original-subtotal">¥{{ item.originalAmount }}</span>
                        <span class="actual-subtotal">¥{{ item.finalAmount }}</span>
                      </div>
                    </template>
                    <template v-else>
                      <span class="subtotal">¥{{ item.finalAmount || item.originalAmount }}</span>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- 订单底部操作 -->
            <div class="order-footer">
              <div class="total-info">
                <div class="final-pay">
                  实付金额：
                  <div class="price-container">
                    <template v-if="order.finalAmount && order.finalAmount !== order.originalAmount">
                      <div class="price-row">
                        <span class="original-price">¥{{ order.originalAmount }}</span>
                        <span class="actual-price">¥{{ order.finalAmount }}</span>
                      </div>
                    </template>
                    <template v-else>
                      <span class="p-price">¥{{ order.originalAmount }}</span>
                    </template>
                  </div>
                </div>
                <div class="discount-tags" v-if="Number(order.promotionTotalDiscount || 0) > 0 || Number(order.seckillDiscount || 0) > 0 || (Number(order.productCouponTotalDiscount || 0) + Number(order.orderCouponDiscount || 0)) > 0">
                  <span v-if="Number(order.promotionTotalDiscount || 0) > 0" class="discount-item activity">活动合计优惠 -¥{{ order.promotionTotalDiscount }}</span>
                  <span v-if="Number(order.seckillDiscount || 0) > 0" class="discount-item seckill">秒杀合计优惠 -¥{{ order.seckillDiscount }}</span>
                  <span v-if="(Number(order.productCouponTotalDiscount || 0) + Number(order.orderCouponDiscount || 0)) > 0" class="discount-item coupon">优惠券合计优惠 -¥{{ (Number(order.productCouponTotalDiscount || 0) + Number(order.orderCouponDiscount || 0)).toFixed(2) }}</span>
                </div>
              </div>
              <div class="order-actions">
                <!-- 待支付状态 -->
                <template v-if="order.status === 1 && order.payStatus === 0">
                  <div class="countdown-wrapper" v-if="getRemainingTime(order.createdAt)">
                    <el-icon><Clock /></el-icon>
                    <span>{{ getRemainingTime(order.createdAt) }}</span>
                  </div>
                  <el-button type="primary" plain @click="handlePay(order)">去支付</el-button>
                </template>
                <el-button v-if="order.status === 1" plain @click="cancelOrder(order)">取消订单</el-button>
                <!-- 待收货状态 -->
                <el-button v-if="order.status === 3" type="success" plain @click="confirmReceipt(order)">确认收货</el-button>
                
                <!-- 已完成状态：单商品评价入口 -->
                <template v-if="order.status === 4 && order.items?.length === 1">
                  <el-button 
                    v-if="!order.items[0].returnOrder" 
                    type="danger" 
                    plain 
                    @click="applyRefund(order, order.items[0])"
                  >
                    申请退款
                  </el-button>
                  <template v-else>
                    <el-button 
                      v-if="[0, 1].includes(order.items[0].returnOrder.status)" 
                      type="warning" 
                      plain 
                      @click="cancelRefund(order.items[0].returnOrder.id)"
                    >
                      取消申请退款
                    </el-button>
                    <el-button 
                      type="primary" 
                      plain 
                      :class="{ 'gray-button': order.items[0].returnOrder.status === 5 }"
                      @click="viewReturnDetail(order.items[0].returnOrder.id)"
                    >
                      {{ getReturnStatusDesc(order.items[0].returnOrder.status) }}
                    </el-button>
                  </template>
                  <el-button 
                    v-if="!order.items[0].reviewed" 
                    type="primary" 
                    plain 
                    @click="handleOrderReview(order)"
                  >
                    评价
                  </el-button>
                  <el-button 
                    v-else 
                    plain 
                    @click="handleViewOrderReviews(order)"
                  >
                    查看评价
                  </el-button>
                </template>

                <el-button plain @click="$router.push({ path: `/order/${order.id}`, query: { status: tabStatusMap[activeTab] } })">查看详情</el-button>
                <el-button v-if="order.status === 4 || order.status === 0" type="danger" @click="rebuyOrder(order.id)">再次购买</el-button>
              </div>
            </div>

          </div>
        </template>
        <el-empty v-else description="暂无相关订单" />
      </div>

      <!-- 分页 -->
      <div class="pagination-wrap" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20]"
          :total="total"
          layout="prev, pager, next, sizes"
          @current-change="loadOrders"
          @size-change="handleSizeChange"
        />
      </div>

      <!-- 退款申请对话框 -->
      <el-dialog
        v-model="refundDialogVisible"
        title="申请退款"
        width="400px"
      >
        <el-form :model="refundForm" label-width="80px">
          <el-form-item label="退款金额">
            <el-input-number
              v-model="refundForm.expectedRefundAmount"
              :precision="2"
              :step="0.1"
              :min="0"
              style="width: 100%"
              placeholder="请输入期望退款金额"
            />
            <div class="el-upload__tip" style="line-height: 1.4; margin-top: 4px;">
              最多可退 ¥{{ maxRefundAmount }}（商品实付金额）
            </div>
          </el-form-item>
          <el-form-item label="退款原因">
            <el-input
              v-model="refundForm.reason"
              type="textarea"
              :rows="4"
              placeholder="请详细描述退款原因"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="上传凭证">
            <el-upload
              class="upload-demo"
              action="/api/common/upload/image"
              :on-preview="handlePreview"
              :on-remove="handleRemove"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :headers="uploadHeaders"
              :file-list="fileList"
              list-type="picture"
            >
              <el-button type="primary">选择图片</el-button>
              <template #tip>
                <div class="el-upload__tip">
                  请上传退款相关凭证图片，最多3张
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="refundDialogVisible = false">取消</el-button>
            <el-button type="danger" :loading="refundLoading" @click="submitRefund">提交申请</el-button>
          </span>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Picture, Search, Clock } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElDialog, ElInput, ElUpload, ElButton, ElForm, ElFormItem } from 'element-plus'
import { orderApi } from '@/api/order'
import { paymentApi } from '@/api/payment'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeTab = ref('all')
const loading = ref(false)
const orders = ref([])
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)
const searchKeyword = ref('')

const now = ref(Date.now())
let countdownTimer = null
const expiredOrders = new Set()

const getRemainingTime = (createdAt) => {
  if (!createdAt) return null
  const createTime = new Date(createdAt.replace(/-/g, '/').replace('T', ' ')).getTime()
  const targetTime = createTime + 15 * 60 * 1000
  const diff = targetTime - now.value
  
  if (diff <= 0) return null
  
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const checkExpirations = () => {
  let needsReload = false
  orders.value.forEach(order => {
    if (order.status === 1 && order.payStatus === 0 && order.createdAt) {
      const createTime = new Date(order.createdAt.replace(/-/g, '/').replace('T', ' ')).getTime()
      const targetTime = createTime + 15 * 60 * 1000
      const diff = targetTime - now.value
      
      if (diff <= 0 && !expiredOrders.has(order.id)) {
        expiredOrders.add(order.id)
        needsReload = true
      }
    }
  })
  if (needsReload) {
    setTimeout(() => {
      loadOrders()
    }, 800)
  }
}

// 从URL查询参数中获取状态
onMounted(() => {
  const status = route.query.status
  if (status) {
    switch (status) {
      case '1': activeTab.value = 'paying'; break
      case '2': activeTab.value = 'pending'; break
      case '3': activeTab.value = 'receiving'; break
      case '4': activeTab.value = 'completed'; break
      case '0': activeTab.value = 'cancelled'; break
      default: activeTab.value = 'all'
    }
  }
  initUploadHeaders()
  loadOrders()
  
  countdownTimer = setInterval(() => {
    now.value = Date.now()
    checkExpirations()
  }, 1000)
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

// 退款相关状态
const refundDialogVisible = ref(false)
const refundLoading = ref(false)
const refundOrderId = ref(null)
const refundOrderItemId = ref(null)
const maxRefundAmount = ref(0) // 单个商品的退款上限
const orderTotalAmount = ref(0) // 整个订单的限额（用于单商品校验）
const isSingleItemOrder = ref(false) // 是否为单商品订单

const refundForm = ref({
  reason: '',
  images: '',
  expectedRefundAmount: 0
})
const fileList = ref([])
const uploadHeaders = ref({})

// 初始化上传头部信息
const initUploadHeaders = () => {
  if (userStore.token) {
    uploadHeaders.value = {
      'Authorization': `Bearer ${userStore.token}`
    }
  }
}

// Map tab name to backend status code
const tabStatusMap = {
  all: null,
  paying: 1,
  pending: 2,
  receiving: 3,
  completed: 4,
  cancelled: 0
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

// 加载订单列表
const loadOrders = async () => {
  loading.value = true
  try {
    const params = {
      current: currentPage.value,
      size: pageSize.value
    }
    const statusCode = tabStatusMap[activeTab.value]
    if (statusCode !== null) params.status = statusCode
    if (searchKeyword.value.trim()) params.keyword = searchKeyword.value.trim()

    const res = await orderApi.getMyOrders(params)
    orders.value = (res.data.records || []).map(order => ({
      ...order,
      statusType: order.status === 1 ? 'danger' : order.status === 4 ? 'success' : 'primary'
    }))
    total.value = res.data.total || 0
  } catch (error) {
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}



const handleSearch = () => {
  currentPage.value = 1
  loadOrders()
}

const handleSizeChange = (size) => {
  currentPage.value = 1
  pageSize.value = size
  loadOrders()
}

const cancelOrder = async (order) => {
  try {
    await ElMessageBox.confirm('确定取消该订单吗？', '提示', { type: 'warning' })
    await orderApi.cancel(order.id)
    ElMessage.success({ message: '订单已取消', duration: 1500, offset: 80 })
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('取消失败')
  }
}

const confirmReceipt = async (order) => {
  try {
    await ElMessageBox.confirm('确认已收到商品？', '提示', { type: 'warning' })
    await orderApi.confirm(order.id)
    ElMessage.success({ message: '已确认收货', duration: 1500, offset: 80 })
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('确认失败')
  }
}

const handlePay = async (order) => {
  try {
    const html = await paymentApi.pay(order.id)
    const div = document.createElement('div')
    div.innerHTML = html
    document.body.appendChild(div)
    div.querySelector('form').submit()
  } catch (error) {
    ElMessage.error('支付跳转失败')
  }
}

// 评价相关逻辑
const hasUnreviewed = (order) => {
  return order.items?.some(item => !item.reviewed)
}

const handleOrderReview = (order) => {
  const items = order.items || []
  const unreviewedItems = items.filter(item => !item.reviewed)
  
  if (unreviewedItems.length === 1) {
    // 只有一个待评价商品，直接去
    router.push({
      path: '/review/write',
      query: { 
        orderItemId: unreviewedItems[0].id, 
        productId: unreviewedItems[0].productId 
      }
    })
  } else {
    // 多个待评价商品，去详情页
    router.push({ path: `/order/${order.id}`, query: { status: tabStatusMap[activeTab] } })
    ElMessage.info('请在订单详情中选择要评价的商品')
  }
}

const handleViewOrderReviews = (order) => {
  const items = order.items || []
  const reviewedItems = items.filter(item => item.reviewed)
  
  if (reviewedItems.length === 1 && reviewedItems[0].reviewId) {
    // 只有一个评价，直接看
    router.push(`/review/${reviewedItems[0].reviewId}`)
  } else {
    // 多个或者没有评价ID，去详情页
    router.push({ path: `/order/${order.id}`, query: { status: tabStatusMap[activeTab] } })
  }
}

// 申请退款
const applyRefund = (order, item) => {
  refundOrderId.value = order.id
  refundOrderItemId.value = item.id
  maxRefundAmount.value = Number(item.finalAmount || 0)
  orderTotalAmount.value = Number(order.finalAmount || 0)
  isSingleItemOrder.value = order.items?.length === 1
  
  refundForm.value = {
    reason: '',
    images: '',
    expectedRefundAmount: maxRefundAmount.value // 默认填入最大可退金额
  }
  fileList.value = [] // 重置文件列表
  refundDialogVisible.value = true
}

// 查看退款进度
const viewReturnDetail = (returnOrderId) => {
  router.push(`/return/${returnOrderId}`)
}

// 取消申请退款
const cancelRefund = async (returnOrderId) => {
  try {
    await ElMessageBox.confirm('确定取消退款申请吗？', '提示', { type: 'warning' })
    // 调用取消退款的API
    await orderApi.cancelRefund(returnOrderId)
    ElMessage.success({ message: '退款申请已取消', duration: 1500, offset: 80 })
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('取消失败')
  }
}

// 再次购买
const rebuyOrder = async (orderId) => {
  try {
    // 调用再次购买的API
    await orderApi.rebuy(orderId)
    ElMessage.success({ message: '已添加到购物车', duration: 1500, offset: 80 })
    // 更新购物车数量
    userStore.loadCartCount()
    // 跳转到购物车页面
    router.push('/cart')
  } catch (error) {
    ElMessage.error('再次购买失败')
  }
}

// 提交退款申请
const submitRefund = async () => {
  const amount = Number(refundForm.value.expectedRefundAmount || 0)
  
  if (amount <= 0) {
    ElMessage.warning('退款金额必须大于 0')
    return
  }
  
  if (amount > maxRefundAmount.value) {
    ElMessage.warning(`退款金额不能超过商品实付金额 ¥${maxRefundAmount.value}`)
    return
  }
  
  if (isSingleItemOrder.value && amount > orderTotalAmount.value) {
    ElMessage.warning(`退款金额不能超过订单总金额 ¥${orderTotalAmount.value}`)
    return
  }

  if (!refundForm.value.reason) {
    ElMessage.warning('请填写退款原因')
    return
  }
  
  refundLoading.value = true
  try {
    await orderApi.applyRefund({
      orderId: refundOrderId.value,
      orderItemId: refundOrderItemId.value,
      reason: refundForm.value.reason,
      images: refundForm.value.images,
      expectedRefundAmount: amount
    })
    ElMessage.success({ message: '退款申请已提交', duration: 1500, offset: 80 })
    refundDialogVisible.value = false
    loadOrders()
  } catch (error) {
    // 移除前端错误信息，让后端错误信息显示
    console.error('退款申请失败:', error)
  } finally {
    refundLoading.value = false
  }
}

// 文件上传相关方法
const handlePreview = (file) => {
  console.log(file)
}

const handleRemove = (file, fileList) => {
  console.log(file, fileList)
  // 从退款表单中移除被删除的图片
  if (file.response && file.response.data) {
    const imageUrl = file.response.data
    const images = refundForm.value.images.split(',').filter(url => url !== imageUrl)
    refundForm.value.images = images.join(',')
  }
}

const handleUploadSuccess = (response, file, fileList) => {
  // 上传成功后，将图片URL添加到退款表单中
  if (response && response.data) {
    const imageUrl = response.data
    if (refundForm.value.images) {
      refundForm.value.images += ',' + imageUrl
    } else {
      refundForm.value.images = imageUrl
    }
  }
}

const handleUploadError = (error, file, fileList) => {
  ElMessage.error('图片上传失败，请重试')
  console.error('上传失败:', error)
}

watch(activeTab, () => {
  currentPage.value = 1
  loadOrders()
})
</script>

<style scoped>
.orders-page {
  padding: 40px 0 60px;
}

/* 限制上传文件名称长度 */
:deep(.el-upload-list__item-name) {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-container {
  max-width: 1000px;
  margin: 0 auto;
  background: var(--bg-white);
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-base);
  padding: 30px 40px;
}

.page-title {
  font-size: 24px;
  color: var(--text-primary);
  margin: 0 0 30px;
  font-weight: 700;
}

/* Tabs */
.tabs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid var(--border-color-lighter);
  margin-bottom: 20px;
  padding-bottom: 16px;
}

.tab-items {
  display: flex;
  gap: 40px;
}

.search-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tab-item {
  font-size: 16px;
  color: var(--text-regular);
  padding: 0 10px 16px;
  cursor: pointer;
  position: relative;
  transition: var(--transition-base);
  font-weight: 500;
}

.tab-item:hover {
  color: var(--primary-color);
}

.tab-item.active {
  color: var(--primary-color);
  font-weight: 700;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--primary-color);
  border-radius: 3px 3px 0 0;
}

/* Order Cards */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.order-card {
  border: 1px solid var(--border-color-lighter);
  border-radius: var(--border-radius-base);
  transition: var(--transition-base);
}

.order-card:hover {
  border-color: var(--border-color-light);
  box-shadow: 0 4px 16px rgba(0,0,0,0.03);
}

.order-header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: #fdfdfd;
  border-bottom: 1px solid var(--border-color-lighter);
  color: var(--text-secondary);
  font-size: 14px;
}

.order-time {
  margin-right: 24px;
  font-weight: 500;
  color: var(--text-primary);
}

.order-no {
  margin-right: 24px;
}

.order-qty {
  margin-right: auto;
  color: var(--text-secondary);
}

.order-status-tag {
  font-weight: 600;
}

.order-items {
  padding: 16px 24px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 0;
  border-bottom: 1px dashed var(--border-color-lighter);
}
.order-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.item-img {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 15px;
  color: var(--text-primary);
  margin: 8px 0;
  line-height: 1.4;
}

.promotion-tag {
  margin-bottom: 4px;
  display: inline-block;
  vertical-align: middle;
  line-height: 20px;
}

.price-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.price-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.actual-price {
  font-size: 15px;
  color: var(--danger-color);
  font-weight: 600;
}

.original-price {
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: line-through;
}

.original-total {
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: line-through;
  margin-left: 8px;
}

.total-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 14px;
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
  font-weight: 500;
  border: 1px solid rgba(125, 86, 246, 0.1);
  width: fit-content;
}

.icon-ticket {
  font-size: 12px;
}

.discount-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.discount-item {
  display: inline-block;
  font-size: 11px;
  padding: 1px 10px;
  border-radius: 4px;
  width: fit-content;
  font-weight: 500;
}

.discount-item.activity {
  color: #f56c6c;
  background: #fef0f0;
}

.discount-item.coupon {
  color: #6c5ce7;
  background: #f3f0ff;
}

.discount-item.seckill {
  color: #e6a23c;
  background: #fdf6ec;
}

.final-pay {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-left: auto;
}

.item-price-qty {
  text-align: right;
  min-width: 150px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.subtotal-container {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
}

.subtotal-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.actual-subtotal {
  font-size: 16px;
  color: var(--danger-color);
  font-weight: 700;
}

.original-subtotal {
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: line-through;
}

.p-subtotal {
  font-size: 16px;
  color: var(--danger-color);
  font-weight: 700;
}

.item-meta {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.item-price-qty {
  text-align: right;
  min-width: 100px;
}

.p-price {
  display: block;
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 4px;
}

.p-qty {
  font-size: 13px;
  color: var(--text-secondary);
}

.item-review-btn {
  margin-top: 8px;
}

.multi-item-review {
  display: flex;
  gap: 12px;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #fdfdfd;
  border-top: 1px solid var(--border-color-lighter);
}

.total-info {
  font-size: 14px;
  color: var(--text-regular);
}

.total-info span {
  font-weight: 600;
}

.final-pay {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.final-pay .price-container {
  flex-direction: row;
  gap: 6px;
  align-items: baseline;
}

.final-pay .actual-price {
  font-size: 20px !important;
  color: var(--danger-color);
  font-weight: 700;
}

.final-pay .original-price {
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: line-through;
}

.order-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.countdown-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--danger-color, #f56c6c);
  font-size: 13px;
  font-weight: 500;
  background: var(--el-color-danger-light-9, #fef0f0);
  padding: 6px 10px;
  border-radius: 4px;
}

.countdown-wrapper .el-icon {
  font-size: 15px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 24px 0 8px;
}

/* 灰色按钮样式 */
:deep(.gray-button) {
  color: #999 !important;
  border-color: #d9d9d9 !important;
}

:deep(.gray-button:hover) {
  color: #999 !important;
  border-color: #d9d9d9 !important;
  background-color: #f5f5f5 !important;
}
</style>
