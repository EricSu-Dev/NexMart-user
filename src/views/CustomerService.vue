<template>
  <div class="customer-service-page">
    <div class="chat-container">
      <div class="chat-header">
        <h2>客服中心</h2>
        <span class="status" :class="{ connected: wsConnected }">
          {{ wsConnected ? '已连接' : '连接中...' }}
        </span>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div v-if="loading" class="loading-wrapper">
          <el-icon class="is-loading" :size="32"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <div v-else-if="messages.length === 0" class="empty-messages">
          <el-icon :size="48"><ChatDotRound /></el-icon>
          <p>暂无消息，开始与客服对话吧</p>
        </div>

        <div v-else class="message-list">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message-item"
            :class="{ 'self-message': msg.senderType === 1 }"
          >
            <div class="message-avatar">
              <el-avatar
                v-if="msg.senderType === 1"
                :size="36"
                :src="userStore.userInfo?.avatarUrl"
                class="user-avatar"
              >
                {{ userStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
              </el-avatar>
              <el-avatar
                v-else
                :size="36"
                style="background-color: #67c23a;"
              >
                客服
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-body">
                <template v-if="msg.type === 1">
                  <div class="message-text">{{ msg.content }}</div>
                </template>
                <template v-else-if="msg.type === 2">
                  <div class="message-images">
                    <el-image
                      v-for="(img, idx) in msg.imageList"
                      :key="idx"
                      :src="img"
                      :preview-src-list="msg.imageList"
                      :initial-index="idx"
                      fit="cover"
                      class="message-image"
                    />
                  </div>
                </template>
                <template v-else-if="msg.type === 3 && msg.productCard">
                  <div class="message-card product-card" @click="goToProduct(msg.productCard.productId)">
                    <img :src="msg.productCard.coverImage" class="card-image" />
                    <div class="card-info">
                      <div class="card-name">{{ msg.productCard.name }}</div>
                      <div v-if="msg.productCard.promotionName" class="promotion-tag">{{ msg.productCard.promotionName }}</div>
                      <div class="price-container">
                        <div v-if="msg.productCard.discountedPrice" class="discounted-price">
                          ¥{{ msg.productCard.discountedPrice }}
                        </div>
                        <div class="price-row">
                          <span class="original-price">¥{{ msg.productCard.price }}</span>
                          <span v-if="msg.productCard.sales" class="sales">已售{{ msg.productCard.sales }}件</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="msg.content" class="message-text">{{ msg.content }}</div>
                </template>
                <template v-else-if="msg.type === 4 && msg.orderCard">
                  <div class="message-card order-card" @click="goToOrder(msg.orderCard.orderId)">
                    <img :src="msg.orderCard.firstItemImage" class="card-image" />
                    <div class="card-info">
                      <div class="order-no">订单号: {{ msg.orderCard.orderNo }}</div>
                      <div class="card-name-row">
                        <div class="card-name">{{ msg.orderCard.firstItemName }}</div>
                        <el-tag v-if="msg.orderCard.promotionName && msg.orderCard.actualTotalAmount && msg.orderCard.actualTotalAmount !== msg.orderCard.totalAmount" type="danger" size="small" effect="light" class="promotion-tag">
                          {{ msg.orderCard.promotionName }}
                        </el-tag>
                      </div>
                      <div class="card-meta">
                        <span class="order-status">{{ msg.orderCard.statusDesc }}</span>
                        <span class="order-items">{{ msg.orderCard.itemCount > 1 ? '等' : '共' }}{{ msg.orderCard.itemCount }}件</span>
                      </div>
                      <div class="price-container">
                        <template v-if="msg.orderCard.actualTotalAmount && msg.orderCard.actualTotalAmount !== msg.orderCard.totalAmount">
                          <div class="price-row">
                            <span class="discounted-price">¥{{ msg.orderCard.actualTotalAmount }}</span>
                            <span class="original-price">¥{{ msg.orderCard.totalAmount }}</span>
                          </div>
                        </template>
                        <template v-else>
                          <div class="card-price">¥{{ msg.orderCard.totalAmount }}</div>
                        </template>
                      </div>
                    </div>
                  </div>
                  <div v-if="msg.content" class="message-text">{{ msg.content }}</div>
                </template>
              </div>
              <div class="message-footer">
                <span v-if="msg.senderType === 1" class="read-status" :class="{ 'is-read': msg.isRead === 1 }">
                  {{ msg.isRead === 1 ? '已读' : '未读' }}
                </span>
                <div class="message-time">{{ formatTime(msg.createdAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <div class="input-wrapper">
          <el-input
            v-model="inputMessage"
            placeholder="请输入消息..."
            :disabled="!wsConnected || !session"
            @keyup.enter="sendMessage"
            class="message-input"
          >
            <template #append>
              <el-button
                type="primary"
                :disabled="!inputMessage.trim() || !wsConnected || !session"
                @click="sendMessage"
              >
                发送
              </el-button>
            </template>
          </el-input>
          <el-popover
            placement="top"
            :width="320"
            trigger="click"
            v-model:visible="showEmojiPicker"
          >
            <template #reference>
              <el-button
                class="emoji-btn"
                :disabled="!wsConnected || !session"
              >
                😊
              </el-button>
            </template>
            <div class="emoji-picker">
              <span
                v-for="emoji in emojiList"
                :key="emoji"
                class="emoji-item"
                @click="insertEmoji(emoji)"
              >
                {{ emoji }}
              </span>
            </div>
          </el-popover>
          <el-popover
            placement="top"
            :width="160"
            trigger="click"
            v-model:visible="showActionPopover"
          >
            <template #reference>
              <el-button
                class="action-btn"
                :icon="Plus"
                circle
                :disabled="!wsConnected || !session"
              />
            </template>
            <div class="action-menu">
              <div class="action-item" @click="handleSelectImage">
                <el-icon><Picture /></el-icon>
                <span>添加图片</span>
              </div>
              <div class="action-item" @click="handleSelectProduct">
                <el-icon><Goods /></el-icon>
                <span>选择商品</span>
              </div>
              <div class="action-item" @click="handleSelectOrder">
                <el-icon><Document /></el-icon>
                <span>选择订单</span>
              </div>
            </div>
          </el-popover>
        </div>
      </div>
    </div>
    <input
      ref="imageInput"
      type="file"
      accept="image/*"
      multiple
      style="display: none;"
      @change="handleImageChange"
    />

    <el-dialog
      v-model="showProductDialog"
      title="选择商品"
      width="700px"
      destroy-on-close
    >
      <div class="product-dialog">
        <div class="filter-bar">
          <el-input
            v-model="productKeyword"
            placeholder="搜索商品名称"
            :prefix-icon="Search"
            clearable
            style="width: 200px;"
            @keyup.enter="searchProducts"
          />
          <el-select
            v-model="productCategoryId"
            placeholder="商品分类"
            clearable
            style="width: 150px; margin-left: 12px;"
            @change="searchProducts"
          >
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
          <el-button type="primary" style="margin-left: 12px;" @click="searchProducts">搜索</el-button>
        </div>

        <div v-if="productLoading" class="loading-container">
          <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        </div>

        <el-empty v-else-if="productList.length === 0" description="暂无浏览记录" />

        <div v-else class="product-grid">
          <div
            v-for="item in productList"
            :key="item.id"
            class="product-card"
            @click="selectProduct(item)"
          >
            <el-image :src="item.coverUrl" fit="cover" class="product-img">
              <template #error>
                <div class="img-placeholder">
                  <el-icon :size="32"><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="product-info">
              <el-tag v-if="item.promotionName" type="danger" size="small" effect="light" class="product-promotion-tag">
                {{ item.promotionName }}
              </el-tag>
              <p class="product-name">{{ item.name }}</p>
              <div class="product-price-container">
                <template v-if="item.discountedPrice && item.discountedPrice !== item.price">
                  <span class="discounted-price">¥{{ item.discountedPrice }}</span>
                  <span class="original-price">¥{{ item.price }}</span>
                </template>
                <template v-else>
                  <span class="product-price">¥{{ item.price }}</span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <el-pagination
          v-if="productTotal > productPageSize"
          class="pagination"
          background
          layout="prev, pager, next"
          :total="productTotal"
          :page-size="productPageSize"
          v-model:current-page="productPage"
          @current-change="loadProducts"
        />
      </div>
    </el-dialog>

    <el-dialog
      v-model="showOrderDialog"
      title="选择订单"
      width="700px"
      destroy-on-close
    >
      <div class="order-dialog">
        <div class="filter-bar">
          <el-input
            v-model="orderKeyword"
            placeholder="搜索订单号"
            :prefix-icon="Search"
            clearable
            style="width: 200px;"
            @keyup.enter="searchOrders"
          />
          <el-select
            v-model="orderStatus"
            placeholder="订单状态"
            clearable
            style="width: 150px; margin-left: 12px;"
            @change="searchOrders"
          >
            <el-option label="已取消" :value="0" />
            <el-option label="待付款" :value="1" />
            <el-option label="待发货" :value="2" />
            <el-option label="待收货" :value="3" />
            <el-option label="已完成" :value="4" />
          </el-select>
          <el-button type="primary" style="margin-left: 12px;" @click="searchOrders">搜索</el-button>
        </div>

        <div v-if="orderLoading" class="loading-container">
          <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        </div>

        <el-empty v-else-if="orderList.length === 0" description="暂无订单" />

        <div v-else class="order-list">
          <div
            v-for="item in orderList"
            :key="item.orderId"
            class="order-card"
            @click="selectOrder(item)"
          >
            <el-image :src="item.firstItemImage" fit="cover" class="order-img">
              <template #error>
                <div class="img-placeholder">
                  <el-icon :size="32"><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="order-info">
              <div class="order-header">
                <span class="order-no">订单号: {{ item.orderNo }}</span>
                <span class="order-status-tag" :class="'status-' + item.status">{{ item.statusDesc }}</span>
              </div>
              <div class="order-name-row">
                <p class="order-name">{{ item.firstItemName }}<span v-if="item.itemCount > 1"> 等{{ item.itemCount }}件商品</span></p>
                <el-tag v-if="item.promotionName && item.actualTotalAmount && item.actualTotalAmount !== item.totalAmount" type="danger" size="small" effect="light" class="order-promotion-tag">
                  {{ item.promotionName }}
                </el-tag>
              </div>
              <div class="order-footer">
                <div class="order-price-container">
                  <template v-if="item.actualTotalAmount && item.actualTotalAmount !== item.totalAmount">
                    <span class="actual-amount">¥{{ item.actualTotalAmount }}</span>
                    <span class="original-amount">¥{{ item.totalAmount }}</span>
                  </template>
                  <template v-else>
                    <span class="order-amount">¥{{ item.totalAmount }}</span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <el-pagination
          v-if="orderTotal > orderPageSize"
          class="pagination"
          background
          layout="prev, pager, next"
          :total="orderTotal"
          :page-size="orderPageSize"
          v-model:current-page="orderPage"
          @current-change="loadOrders"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, ChatDotRound, Plus, Picture, Goods, Document, Search } from '@element-plus/icons-vue'
import { customerServiceApi } from '@/api/customerService'
import { uploadApi } from '@/api/upload'
import { historyApi } from '@/api/history'
import { categoryApi } from '@/api/category'
import { useUserStore } from '@/stores/user'
import { useCustomerServiceStore } from '@/stores/customerService'

const router = useRouter()
const userStore = useUserStore()
const csStore = useCustomerServiceStore()

const messagesContainer = ref(null)
const loading = ref(true)
const messages = ref([])
const inputMessage = ref('')
const session = ref(null)
const wsConnected = computed(() => csStore.wsConnected)
const showActionPopover = ref(false)
const showEmojiPicker = ref(false)
const uploading = ref(false)
const imageInput = ref(null)

const emojiList = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
  '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
  '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔',
  '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵',
  '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕',
  '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧',
  '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓',
  '👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '❤️', '💔', '💯'
]

const showProductDialog = ref(false)
const productLoading = ref(false)
const productList = ref([])
const productTotal = ref(0)
const productPage = ref(1)
const productPageSize = ref(8)
const productKeyword = ref('')
const productCategoryId = ref(null)
const categories = ref([])

const showOrderDialog = ref(false)
const orderLoading = ref(false)
const orderList = ref([])
const orderTotal = ref(0)
const orderPage = ref(1)
const orderPageSize = ref(8)
const orderKeyword = ref('')
const orderStatus = ref(null)

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  if (isToday) {
    return `${hours}:${minutes}`
  } else {
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const goToProduct = (productId) => {
  router.push(`/product/${productId}`)
}

const goToOrder = (orderId) => {
  router.push(`/order/${orderId}`)
}

const legacyConnectWebSocket = (sessionId) => {
  csStore.connectWebSocket(sessionId)
  
  // 设置消息回调
  csStore.setOnMessageCallback((msg) => {
    try {
      // 处理已读回执
      if (msg.action === 'READ_ACK' && msg.sessionId) {
        if (session.value && String(msg.sessionId) === String(session.value.id)) {
          messages.value.forEach(m => {
            if (m.senderType === 1) m.isRead = 1
          })
        }
      }

      // 处理收到的入库真实消息（有id）
      if (msg.id && msg.senderType !== 1) {
        messages.value.push(msg)
        scrollToBottom()
      }
    } catch (e) {
      console.error('解析消息失败:', e)
    }
  })
  
  // 同步连接状态
  csStore.ws.onopen = () => {
    wsConnected.value = true
    console.log('WebSocket 连接成功')
  }
  
  csStore.ws.onerror = (error) => {
    console.error('WebSocket 错误:', error)
    wsConnected.value = false
    ElMessage.error('连接失败，请刷新页面重试')
  }
  
  csStore.ws.onclose = () => {
    wsConnected.value = false
    console.log('WebSocket 连接关闭')
  }
}

const legacyInitSession = async () => {
  try {
    loading.value = true
    const res = await customerServiceApi.createOrGetSession()
    session.value = res.data

    const historyRes = await customerServiceApi.getMessages(session.value.id)
    messages.value = historyRes.data || []
  } catch (error) {
    console.error('初始化会话失败:', error)
    ElMessage.error('初始化会话失败，请刷新页面重试')
  } finally {
    loading.value = false
    scrollToBottom()
    connectWebSocket(session.value.id)
  }
}

const insertEmoji = (emoji) => {
  inputMessage.value += emoji
}

const legacySendMessage = () => {
  const content = inputMessage.value.trim()
  if (!content || !wsConnected.value || !session.value) return

  const messageData = {
    action: 'MESSAGE',
    sessionId: session.value.id,
    type: 1,
    content: content,
    images: null,
    productId: null,
    orderId: null
  }

  const localMessage = {
    id: Date.now(),
    sessionId: session.value.id,
    senderType: 1,
    senderId: userStore.userInfo?.id,
    type: 1,
    content: content,
    imageList: null,
    productCard: null,
    orderCard: null,
    isRead: 0,
    createdAt: new Date().toISOString()
  }

  messages.value.push(localMessage)
  scrollToBottom()

  ws.send(JSON.stringify(messageData))
  inputMessage.value = ''
}

const handleSelectImage = () => {
  showActionPopover.value = false
  if (imageInput.value) {
    imageInput.value.value = ''
    imageInput.value.click()
  }
}

const legacyHandleImageChange = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  if (files.length > 5) {
    ElMessage.warning('最多只能选择5张图片')
    return
  }

  if (!wsConnected.value || !session.value) {
    ElMessage.warning('连接未建立，请稍后重试')
    return
  }

  uploading.value = true
  const uploadedUrls = []

  const loadingMsg = ElMessage({
    message: '正在上传图片...',
    type: 'info',
    duration: 0
  })

  try {
    for (const file of files) {
      const res = await uploadApi.image(file)
      if (res.data) {
        uploadedUrls.push(res.data)
      }
    }

    if (uploadedUrls.length > 0) {
      sendImageMessage(uploadedUrls)
      ElMessage.success(`成功发送${uploadedUrls.length}张图片`)
    }
  } catch (error) {
    console.error('上传图片失败:', error)
    ElMessage.error('上传图片失败')
  } finally {
    loadingMsg.close()
    uploading.value = false
  }
}

const legacySendImageMessage = (imageUrls) => {
  const messageData = {
    action: 'MESSAGE',
    sessionId: session.value.id,
    type: 2,
    content: null,
    images: imageUrls.join(','),
    productId: null,
    orderId: null
  }

  const localMessage = {
    id: Date.now(),
    sessionId: session.value.id,
    senderType: 1,
    senderId: userStore.userInfo?.id,
    type: 2,
    content: null,
    imageList: imageUrls,
    productCard: null,
    orderCard: null,
    isRead: 0,
    createdAt: new Date().toISOString()
  }

  messages.value.push(localMessage)
  scrollToBottom()

  ws.send(JSON.stringify(messageData))
}

const legacyHandleSelectProduct = () => {
  showActionPopover.value = false
  showProductDialog.value = true
  loadCategories()
  loadProducts()
}

const legacyLoadCategories = async () => {
  if (categories.value.length > 0) return
  try {
    const res = await categoryApi.getList()
    categories.value = res.data || []
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const legacyLoadProducts = async () => {
  productLoading.value = true
  try {
    const res = await historyApi.getList({
      page: productPage.value,
      size: productPageSize.value,
      keyword: productKeyword.value || undefined,
      categoryId: productCategoryId.value || undefined
    })
    productList.value = res.data.records || []
    productTotal.value = res.data.total || 0
  } catch (error) {
    console.error('加载浏览记录失败:', error)
  } finally {
    productLoading.value = false
  }
}

const legacySearchProducts = () => {
  productPage.value = 1
  loadProducts()
}

const legacySelectProduct = (product) => {
  showProductDialog.value = false
  if (product && product.productId) {
    sendProductMessage(product)
  } else {
    ElMessage.error('商品信息错误，请重试')
  }
}

const legacySendProductMessage = (product) => {
  const messageData = {
    action: 'MESSAGE',
    sessionId: session.value.id,
    type: 3,
    content: null,
    images: null,
    productId: Number(product.productId),
    orderId: null
  }

  const localMessage = {
    id: Date.now(),
    sessionId: session.value.id,
    senderType: 1,
    senderId: userStore.userInfo?.id,
    type: 3,
    content: null,
    imageList: null,
    productCard: {
      productId: product.productId,
      name: product.name,
      coverImage: product.coverUrl,
      price: product.price,
      promotionName: product.promotionName,
      discountedPrice: product.discountedPrice,
      sales: null
    },
    orderCard: null,
    isRead: 0,
    createdAt: new Date().toISOString()
  }

  messages.value.push(localMessage)
  scrollToBottom()

  ws.send(JSON.stringify(messageData))
}

const legacyHandleSelectOrder = () => {
  showActionPopover.value = false
  showOrderDialog.value = true
  loadOrders()
}

const legacyLoadOrders = async () => {
  orderLoading.value = true
  try {
    const res = await customerServiceApi.getOrderCards({
      current: orderPage.value,
      size: orderPageSize.value,
      keyword: orderKeyword.value || undefined,
      status: orderStatus.value
    })
    orderList.value = res.data.records || []
    orderTotal.value = res.data.total || 0
  } catch (error) {
    console.error('加载订单失败:', error)
  } finally {
    orderLoading.value = false
  }
}

const legacySearchOrders = () => {
  orderPage.value = 1
  loadOrders()
}

const legacySelectOrder = (order) => {
  showOrderDialog.value = false
  sendOrderMessage(order)
}

const legacySendOrderMessage = (order) => {
  const messageData = {
    action: 'MESSAGE',
    sessionId: session.value.id,
    type: 4,
    content: null,
    images: null,
    productId: null,
    orderId: order.orderId
  }

  const localMessage = {
    id: Date.now(),
    sessionId: session.value.id,
    senderType: 1,
    senderId: userStore.userInfo?.id,
    type: 4,
    content: null,
    imageList: null,
    productCard: null,
    orderCard: {
      orderId: order.orderId,
      orderNo: order.orderNo,
      status: order.status,
      statusDesc: order.statusDesc,
      totalAmount: order.totalAmount,
      actualTotalAmount: order.actualTotalAmount,
      promotionName: order.promotionName,
      firstItemName: order.firstItemName,
      firstItemImage: order.firstItemImage,
      itemCount: order.itemCount
    },
    isRead: 0,
    createdAt: new Date().toISOString()
  }

  messages.value.push(localMessage)
  scrollToBottom()

  ws.send(JSON.stringify(messageData))
}

const connectWebSocket = (sessionId) => {
  csStore.connectWebSocket(sessionId)
  csStore.setOnMessageCallback((msg) => {
    try {
      const isCurrentSession =
        !msg?.sessionId ||
        !session.value ||
        String(msg.sessionId) === String(session.value.id)

      if (!isCurrentSession) {
        return
      }

      if (msg.action === 'READ_ACK') {
        messages.value.forEach((item) => {
          if (item.senderType === 1) {
            item.isRead = 1
          }
        })
        return
      }

      if (msg.id && msg.senderType !== 1) {
        const exists = messages.value.some((item) => String(item.id) === String(msg.id))
        if (!exists) {
          messages.value.push(msg)
        }
        scrollToBottom()
      }
    } catch (error) {
      console.error('Failed to handle customer service websocket message:', error)
    }
  })
}

const initSession = async () => {
  try {
    loading.value = true
    const currentSession = await csStore.initSession()
    if (!currentSession?.id) {
      throw new Error('Customer service session not found')
    }

    session.value = currentSession
    const historyRes = await customerServiceApi.getMessages(currentSession.id)
    messages.value = historyRes.data || []

    connectWebSocket(currentSession.id)
    csStore.clearUnreadCount()
    csStore.sendReadAck(currentSession.id)
  } catch (error) {
    console.error('Failed to initialize customer service session:', error)
    ElMessage.error('初始化客服会话失败，请刷新页面后重试')
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

const sendSocketMessage = (messageData, localMessage) => {
  messages.value.push(localMessage)
  scrollToBottom()

  if (!csStore.sendWsMessage(messageData)) {
    ElMessage.error('消息发送失败，请稍后重试')
  }
}

const sendMessage = () => {
  const content = inputMessage.value.trim()
  if (!content || !wsConnected.value || !session.value) return

  const messageData = {
    action: 'MESSAGE',
    sessionId: session.value.id,
    type: 1,
    content,
    images: null,
    productId: null,
    orderId: null
  }

  const localMessage = {
    id: Date.now(),
    sessionId: session.value.id,
    senderType: 1,
    senderId: userStore.userInfo?.id,
    type: 1,
    content,
    imageList: null,
    productCard: null,
    orderCard: null,
    isRead: 0,
    createdAt: new Date().toISOString()
  }

  sendSocketMessage(messageData, localMessage)
  inputMessage.value = ''
}

const handleImageChange = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  if (files.length > 5) {
    ElMessage.warning('最多只能选择 5 张图片')
    return
  }

  if (!wsConnected.value || !session.value) {
    ElMessage.warning('连接尚未建立，请稍后重试')
    return
  }

  uploading.value = true
  const uploadedUrls = []

  const loadingMsg = ElMessage({
    message: '正在上传图片...',
    type: 'info',
    duration: 0
  })

  try {
    for (const file of files) {
      const res = await uploadApi.image(file)
      if (res.data) {
        uploadedUrls.push(res.data)
      }
    }

    if (uploadedUrls.length > 0) {
      sendImageMessage(uploadedUrls)
      ElMessage.success(`成功发送 ${uploadedUrls.length} 张图片`)
    }
  } catch (error) {
    console.error('Failed to upload customer service images:', error)
    ElMessage.error('上传图片失败')
  } finally {
    loadingMsg.close()
    uploading.value = false
  }
}

const sendImageMessage = (imageUrls) => {
  const messageData = {
    action: 'MESSAGE',
    sessionId: session.value.id,
    type: 2,
    content: null,
    images: imageUrls.join(','),
    productId: null,
    orderId: null
  }

  const localMessage = {
    id: Date.now(),
    sessionId: session.value.id,
    senderType: 1,
    senderId: userStore.userInfo?.id,
    type: 2,
    content: null,
    imageList: imageUrls,
    productCard: null,
    orderCard: null,
    isRead: 0,
    createdAt: new Date().toISOString()
  }

  sendSocketMessage(messageData, localMessage)
}

const handleSelectProduct = () => {
  showActionPopover.value = false
  showProductDialog.value = true
  loadCategories()
  loadProducts()
}

const loadCategories = async () => {
  if (categories.value.length > 0) return

  try {
    const res = await categoryApi.getList()
    categories.value = res.data || []
  } catch (error) {
    console.error('Failed to load categories for customer service:', error)
  }
}

const loadProducts = async () => {
  productLoading.value = true
  try {
    const res = await historyApi.getList({
      page: productPage.value,
      size: productPageSize.value,
      keyword: productKeyword.value || undefined,
      categoryId: productCategoryId.value || undefined
    })
    productList.value = res.data.records || []
    productTotal.value = res.data.total || 0
  } catch (error) {
    console.error('Failed to load product history for customer service:', error)
  } finally {
    productLoading.value = false
  }
}

const searchProducts = () => {
  productPage.value = 1
  loadProducts()
}

const selectProduct = (product) => {
  showProductDialog.value = false
  if (product && product.productId) {
    sendProductMessage(product)
  } else {
    ElMessage.error('商品信息异常，请稍后重试')
  }
}

const sendProductMessage = (product) => {
  const messageData = {
    action: 'MESSAGE',
    sessionId: session.value.id,
    type: 3,
    content: null,
    images: null,
    productId: Number(product.productId),
    orderId: null
  }

  const localMessage = {
    id: Date.now(),
    sessionId: session.value.id,
    senderType: 1,
    senderId: userStore.userInfo?.id,
    type: 3,
    content: null,
    imageList: null,
    productCard: {
      productId: product.productId,
      name: product.name,
      coverImage: product.coverUrl,
      price: product.price,
      promotionName: product.promotionName,
      discountedPrice: product.discountedPrice,
      sales: null
    },
    orderCard: null,
    isRead: 0,
    createdAt: new Date().toISOString()
  }

  sendSocketMessage(messageData, localMessage)
}

const handleSelectOrder = () => {
  showActionPopover.value = false
  showOrderDialog.value = true
  loadOrders()
}

const loadOrders = async () => {
  orderLoading.value = true
  try {
    const res = await customerServiceApi.getOrderCards({
      current: orderPage.value,
      size: orderPageSize.value,
      keyword: orderKeyword.value || undefined,
      status: orderStatus.value
    })
    orderList.value = res.data.records || []
    orderTotal.value = res.data.total || 0
  } catch (error) {
    console.error('Failed to load order cards for customer service:', error)
  } finally {
    orderLoading.value = false
  }
}

const searchOrders = () => {
  orderPage.value = 1
  loadOrders()
}

const selectOrder = (order) => {
  showOrderDialog.value = false
  sendOrderMessage(order)
}

const sendOrderMessage = (order) => {
  const messageData = {
    action: 'MESSAGE',
    sessionId: session.value.id,
    type: 4,
    content: null,
    images: null,
    productId: null,
    orderId: order.orderId
  }

  const localMessage = {
    id: Date.now(),
    sessionId: session.value.id,
    senderType: 1,
    senderId: userStore.userInfo?.id,
    type: 4,
    content: null,
    imageList: null,
    productCard: null,
    orderCard: {
      orderId: order.orderId,
      orderNo: order.orderNo,
      status: order.status,
      statusDesc: order.statusDesc,
      totalAmount: order.totalAmount,
      actualTotalAmount: order.actualTotalAmount,
      promotionName: order.promotionName,
      firstItemName: order.firstItemName,
      firstItemImage: order.firstItemImage,
      itemCount: order.itemCount
    },
    isRead: 0,
    createdAt: new Date().toISOString()
  }

  sendSocketMessage(messageData, localMessage)
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  csStore.setChatActive(true)
  initSession()
})

onUnmounted(() => {
  csStore.setOnMessageCallback(null)
  csStore.setChatActive(false)
})
</script>

<style scoped>
.customer-service-page {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.chat-container {
  width: 100%;
  max-width: 800px;
  height: calc(100vh - var(--nav-height) - 120px);
  display: flex;
  flex-direction: column;
  background: var(--bg-white);
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-base);
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color-lighter);
  background: var(--bg-white);
}

.chat-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.status {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 4px 12px;
  border-radius: 12px;
  background: var(--border-color-lighter);
}

.status.connected {
  color: #67c23a;
  background: #f0f9eb;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--text-secondary);
}

.empty-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

.empty-messages p {
  margin-top: 16px;
  font-size: 14px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 70%;
}

.message-item.self-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.user-avatar {
  background: var(--primary-color, #409eff) !important;
  color: #fff !important;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--bg-white);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  word-break: break-word;
  line-height: 1.5;
}

.self-message .message-text {
  background: #409eff;
  color: #fff;
}

.message-images {
  display: flex;
  flex-wrap: wrap-reverse;
  gap: 8px;
  justify-content: flex-end;
}

.self-message .message-images {
  justify-content: flex-start;
}

.message-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  cursor: pointer;
  object-fit: cover;
}

.message-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background: var(--bg-white);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
  max-width: 350px;
}

.message-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.order-no {
  font-size: 12px;
  color: var(--text-secondary);
}

.card-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
  flex-wrap: wrap;
}

.card-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.promotion-tag {
  flex-shrink: 0;
  vertical-align: middle;
  line-height: 20px;
  margin-bottom: 0;
}

.card-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
}

.promotion-tag {
  font-size: 12px;
  color: #f56c6c;
  margin-bottom: 4px;
}

.price-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.discounted-price {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}

.price-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.original-price {
  font-size: 14px;
  color: #909399;
  text-decoration: line-through;
}

.sales {
  font-size: 12px;
  color: #909399;
  text-decoration: none;
}

.order-items {
  color: var(--text-secondary);
}

.card-price {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}

.message-time {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 0 4px;
}

.message-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.self-message .message-footer {
  justify-content: flex-end;
}

.read-status {
  font-size: 11px;
  color: var(--text-secondary);
}

.read-status.is-read {
  color: #409eff;
}

.self-message .message-time {
  text-align: right;
}

.chat-input {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color-lighter);
  background: var(--bg-white);
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.emoji-btn {
  flex-shrink: 0;
  font-size: 20px;
  padding: 8px 12px;
}

.emoji-picker {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.emoji-item {
  font-size: 20px;
  padding: 6px;
  cursor: pointer;
  border-radius: 4px;
  text-align: center;
  transition: background-color 0.2s;
}

.emoji-item:hover {
  background-color: #f0f0f0;
}

.action-btn {
  flex-shrink: 0;
}

.message-input {
  flex: 1;
}

.chat-input :deep(.el-input-group__append) {
  padding: 0;
}

.chat-input :deep(.el-input-group__append .el-button) {
  margin: 0;
  border: none;
  padding: 0 20px;
  background-color: #409eff !important;
  color: #fff !important;
}

.action-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.action-item:hover {
  background-color: #f5f7fa;
}

.action-item .el-icon {
  font-size: 18px;
  color: #409eff;
}

.action-item span {
  font-size: 14px;
  color: var(--text-primary);
}

.product-dialog .filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.product-dialog .loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.product-dialog .product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.product-dialog .product-card {
  border: 1px solid var(--border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.product-dialog .product-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.product-dialog .product-img {
  width: 100%;
  height: 100px;
}

.product-dialog .img-placeholder {
  width: 100%;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #c0c4cc;
}

.product-dialog .product-info {
  padding: 8px;
}

.product-dialog .product-promotion-tag {
  margin-bottom: 4px;
  display: inline-block;
  vertical-align: middle;
  line-height: 20px;
}

.product-dialog .product-name {
  font-size: 12px;
  color: var(--text-primary);
  margin: 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-dialog .product-price-container {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.product-dialog .product-price {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 600;
  margin: 0;
}

.product-dialog .discounted-price {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 600;
}

.product-dialog .original-price {
  font-size: 12px;
  color: #909399;
  text-decoration: line-through;
}

.product-dialog .pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.order-dialog .filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.order-dialog .loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.order-dialog .order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.order-dialog .order-card {
  display: flex;
  gap: 20px;
  padding: 20px;
  border: 1px solid var(--border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.order-dialog .order-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.order-dialog .order-img {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  flex-shrink: 0;
}

.order-dialog .img-placeholder {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #c0c4cc;
}

.order-dialog .order-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-dialog .order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-dialog .order-no {
  font-size: 13px;
  color: var(--text-secondary);
}

.order-dialog .order-status-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.order-dialog .order-status-tag.status-0 {
  background: #f4f4f5;
  color: #909399;
}

.order-dialog .order-status-tag.status-1 {
  background: #fef0f0;
  color: #f56c6c;
}

.order-dialog .order-status-tag.status-2 {
  background: #fdf6ec;
  color: #e6a23c;
}

.order-dialog .order-status-tag.status-3 {
  background: #ecf5ff;
  color: #409eff;
}

.order-dialog .order-status-tag.status-4 {
  background: #f0f9eb;
  color: #67c23a;
}

.order-dialog .order-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  flex-wrap: wrap;
}

.order-dialog .order-name {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.order-dialog .order-promotion-tag {
  flex-shrink: 0;
  vertical-align: middle;
  line-height: 20px;
}

.order-dialog .order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-dialog .order-price-container {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.order-dialog .order-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.order-dialog .order-amount {
  font-size: 16px;
  color: #f56c6c;
  font-weight: 600;
}

.order-dialog .actual-amount {
  font-size: 16px;
  color: #f56c6c;
  font-weight: 600;
}

.order-dialog .original-amount {
  font-size: 14px;
  color: #909399;
  text-decoration: line-through;
}

.order-dialog .pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
