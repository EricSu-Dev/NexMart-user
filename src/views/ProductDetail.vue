<template>
  <div class="detail-page">
    <div class="container" v-loading="loading">
      <template v-if="product">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/category', query: { id: product.categoryId } }">
            <span class="category-link">{{ product.categoryName }}</span>
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ product.name }}</el-breadcrumb-item>
        </el-breadcrumb>

        <div class="product-main">
          <!-- 左侧图片 -->
          <div class="product-gallery">
            <el-image
              :src="product.coverUrl" fit="contain"
              style="width:400px; height:400px; border-radius:8px; background:#f5f7fa"
            >
              <template #error>
                <div style="width:100%;height:400px;display:flex;align-items:center;justify-content:center;background:#f5f7fa;color:#c0c4cc">
                  暂无图片
                </div>
              </template>
            </el-image>
          </div>

          <!-- 右侧信息 -->
          <div class="product-info">
            <div class="name-row">
              <h1 class="product-name">{{ product.name }}</h1>
              <el-tag v-if="product.promotionName" type="danger" effect="dark" size="large" class="name-tag">
                {{ product.promotionName }}
              </el-tag>
            </div>
            
            <!-- 价格展示 -->
            <div class="product-price-wrapper">
              <template v-if="product.promotionName && product.discountedPrice">
                <span class="product-price discounted">¥{{ product.discountedPrice }}</span>
                <span class="original-price">¥{{ product.price }}</span>
              </template>
              <template v-else>
                <span class="product-price">¥{{ product.price }}</span>
              </template>
            </div>
            
            <div class="spec-section" v-if="product.hasSpec === 1">
              <SpecSelector
                :specs="product.productSpecList"
                v-model="selectedSpecId"
                :showSpecStock="true"
                :showSpecItemStock="false"
                stock-label="库存"
              />
            </div>

            <el-divider />

            <div class="stock-info">
              <span class="label">{{ totalStockLabel }}：</span>
              <span :class="product.stock > 0 && product.status !== 2 ? 'in-stock' : 'out-stock'">
                {{ product.stock > 0 && product.status !== 2 ? `${product.stock} 件` : '已售空' }}
              </span>
            </div>

            <div class="sales-info">
              <span class="label">销量：</span>
              <span>{{ product.sales || 0 }} 件</span>
            </div>

            <div class="quantity-row">
              <span class="label">数量：</span>
              <el-input-number
                v-model="quantity" 
                :min="currentStock > 0 ? 1 : 0" 
                :disabled="currentStock === 0 || product.status === 2"
              />
            </div>

            <div class="action-row">
              <el-button
                type="primary" size="large"
                :icon="ShoppingCart"
                :disabled="currentStock === 0 || product.status === 2"
                class="cart-btn"
                @click="addToCart"
              >加入购物车</el-button>
              <el-button
                type="danger" size="large"
                :disabled="currentStock === 0 || product.status === 2"
                class="buy-now-btn"
                @click="buyNow"
              >立即购买</el-button>
              <el-button
                :icon="isFavorited ? StarFilled : Star"
                :type="isFavorited ? 'warning' : 'default'"
                circle
                size="large"
                :loading="favLoading"
                @click="toggleFavorite"
              />
            </div>
          </div>
        </div>

        <!-- 商品描述 -->
        <div class="product-desc" v-if="product.description">
          <h3>商品详情</h3>
          <el-divider />
          <p>{{ product.description }}</p>
        </div>

        <!-- 评价列表 -->
        <div class="review-section">
          <div class="review-header">
            <h3>商品评价</h3>
            <div class="review-summary">
              <el-rate v-model="avgRating" disabled />
              <span class="review-count">{{ reviewTotal }} 条评价</span>
            </div>
          </div>

          <el-card v-loading="reviewLoading" class="review-card">
            <template v-if="reviews.length">
              <div v-for="rev in reviews" :key="rev.id" class="review-item">
                <div class="review-user">
                  <el-avatar :size="36" :src="rev.avatarUrl" style="background:#409eff">
                    {{ rev.username?.charAt(0)?.toUpperCase() }}
                  </el-avatar>
                  <div class="review-meta">
                    <div class="review-name">{{ rev.username }}</div>
                    <div class="review-time">{{ rev.createdAt }}</div>
                  </div>
                  <el-button text class="like-btn" @click="toggleLike(rev)">
                    <span :class="['like', rev.liked ? 'liked' : '']">👍</span>
                    {{ rev.likeCount || 0 }}
                  </el-button>
                </div>
                <el-rate v-model="rev.rating" disabled />
                <p class="review-content">{{ rev.content }}</p>

                <div class="media-list" v-if="rev.mediaUrls?.length">
                  <div v-for="url in rev.mediaUrls" :key="url" class="media-item">
                    <el-image v-if="isImage(url)" :src="url" fit="cover" style="width:80px;height:80px;border-radius:6px" />
                    <div v-else class="video-tag">视频</div>
                  </div>
                </div>

                <div class="review-actions">
                  <el-button text size="small" @click="$router.push(`/review/${rev.id}`)">
                    评论({{ rev.commentCount || 0 }})
                  </el-button>
                  <el-button 
                    v-if="userStore.userInfo?.id === rev.userId" 
                    text 
                    type="danger" 
                    size="small" 
                    @click="handleDeleteReview(rev.id)"
                  >
                    删除
                  </el-button>
                </div>
              </div>

              <div class="pagination">
                <el-pagination
                  v-model:current-page="reviewPage.current"
                  v-model:page-size="reviewPage.size"
                  :total="reviewTotal"
                  layout="prev, pager, next"
                  @current-change="loadReviews"
                />
              </div>
            </template>

            <el-empty v-else description="暂无评价" />
          </el-card>
        </div>
      </template>
      
      <el-empty v-else-if="!loading" description="商品不存在或已被删除">
        <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ShoppingCart, Star, StarFilled } from '@element-plus/icons-vue'
import { productApi } from '@/api/product'
import { cartApi } from '@/api/cart'
import { reviewApi } from '@/api/review'
import { favoriteApi } from '@/api/favorite'
import { historyApi } from '@/api/history'
import { useUserStore } from '@/stores/user'
import SpecSelector from '@/components/SpecSelector.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const product = ref(null)
const quantity = ref(1)
const selectedSpecId = ref(null)

const isFavorited = ref(false)
const favLoading = ref(false)

const reviewLoading = ref(false)
const reviews = ref([])
const reviewPage = ref({ current: 1, size: 5 })
const reviewTotal = ref(0)
const avgRating = ref(0)

const isImage = (url) => /\.(png|jpe?g|gif|webp|bmp)$/i.test(url)

const loadProduct = async () => {
  loading.value = true
  try {
    const res = await productApi.getDetail(route.params.id)
    if (res.data) {
      product.value = res.data

      // 记录浏览历史 (仅登录用户且有商品ID时记录)
      if (userStore.isLoggedIn && route.params.id) {
        historyApi.record(route.params.id).catch(err => {
          console.error('记录浏览历史失败:', err)
        })
      }
    } else {
      product.value = null
    }
  } catch (error) {
    console.error('加载商品详情失败:', error)
    product.value = null
  } finally {
    loading.value = false
  }
}

const loadFavoriteStatus = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await favoriteApi.getStatus(route.params.id)
    isFavorited.value = res.data
  } catch (error) {
    console.error('获取收藏状态失败:', error)
  }
}

const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning({ message: '请先登录', duration: 1500 })
    return
  }
  favLoading.value = true
  try {
    const res = await favoriteApi.toggle(route.params.id)
    isFavorited.value = res.data
    ElMessage.success(isFavorited.value ? '已收藏' : '已取消收藏')
  } catch (error) {
    console.error('收藏操作失败:', error)
  } finally {
    favLoading.value = false
  }
}

const totalStockLabel = computed(() => {
  return product.value?.hasSpec === 1 ? '总库存' : '库存'
})

const currentStock = computed(() => {
  if (!product.value) return 0
  if (product.value.hasSpec === 1) {
    const spec = product.value.productSpecList?.find(item => String(item.id) === String(selectedSpecId.value))
    return Number(spec?.stock || 0)
  }
  return Number(product.value.stock || 0)
})

watch(currentStock, (val) => {
  if (val === 0) {
    quantity.value = 0
    return
  }
  if (quantity.value < 1) quantity.value = 1
}, { immediate: true })

const loadReviews = async () => {
  reviewLoading.value = true
  try {
    const res = await reviewApi.list({
      product_id: route.params.id,
      page: reviewPage.value.current,
      size: reviewPage.value.size
    })
    reviews.value = res.data.records || []
    reviewTotal.value = res.data.total || 0
    avgRating.value = res.data.avgRating || 0
  } finally {
    reviewLoading.value = false
  }
}

const handleDeleteReview = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评价吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await reviewApi.deleteReview(id)
    ElMessage.success({ message: '评价已删除', duration: 1500 })
    loadReviews()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除评价失败:', error)
    }
  }
}

const toggleLike = async (rev) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning({ message: '请先登录', duration: 1500 })
    return
  }
  const res = await reviewApi.toggleLike(rev.id)
  rev.likeCount = res.data.likeCount
  rev.liked = res.data.liked
}

const addToCart = async () => {
  if (!userStore.isLoggedIn) { 
    ElMessage.warning({ message: '请先登录', duration: 1500 })
    return 
  }
  if (currentStock.value === 0) {
    return
  }
  if (product.value.hasSpec === 1 && !selectedSpecId.value) {
    ElMessage.warning({ message: '请选择商品规格', duration: 1500 })
    return
  }
  try {
    await cartApi.add({ 
      productId: product.value.id, 
      quantity: quantity.value,
      specId: selectedSpecId.value
    })
    ElMessage.success({ 
      message: '已加入购物车', 
      duration: 1500,
      offset: 80
    })
    userStore.loadCartCount()
  } catch (error) {}
}

const buyNow = async () => {
  if (!userStore.isLoggedIn) { 
    ElMessage.warning({ message: '请先登录', duration: 1500 })
    return 
  }
  if (currentStock.value === 0) {
    return
  }
  if (product.value.hasSpec === 1 && !selectedSpecId.value) {
    ElMessage.warning({ message: '请选择商品规格', duration: 1500 })
    return
  }
  
  try {
    // 使用临时购物车接口，返回购物车项列表
    const res = await cartApi.addTemporary(
      product.value.id, 
      quantity.value,
      selectedSpecId.value
    )
    
    const cartItems = res.data || []
    const cartItem = cartItems[0]
    
    if (cartItem && cartItem.id) {
      // 将购物车项信息编码后传递给确认订单页
      const cartItemStr = JSON.stringify(cartItem)
      router.push({
        path: '/checkout',
        query: { 
          ids: cartItem.id.toString(),
          isTemporary: 'true',
          cartItem: encodeURIComponent(cartItemStr)
        }
      })
    } else {
      ElMessage.error('获取商品信息失败')
    }
  } catch (error) {
    console.error('立即购买失败:', error)
  }
}

onMounted(() => {
  loadProduct()
  loadReviews()
  loadFavoriteStatus()
})
</script>

<style scoped>
.detail-page { padding: 24px 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.category-link { color: var(--primary-color); font-weight: 600; cursor: pointer; }
.category-link:hover { text-decoration: underline; }

.product-main {
  display: grid; grid-template-columns: 480px 1fr;
  gap: 40px; margin-top: 20px;
  background: #fff; padding: 30px; border-radius: 10px;
}

.spec-section {
  margin-bottom: 16px;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.product-name {
  font-size: 22px;
  color: #303133;
  margin: 0;
  line-height: 1.4;
  font-weight: 700;
  flex: 1;
  min-width: 0;
}

.name-tag {
  flex-shrink: 0;
}

.name-tag .el-tag {
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 4px;
}

.product-price-wrapper {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.product-price { 
  font-size: 32px; 
  font-weight: 700; 
  color: #f56c6c; 
}

.product-price.discounted {
  font-size: 36px;
}

.original-price {
  font-size: 18px;
  color: #909399;
  text-decoration: line-through;
  font-weight: 400;
}

.label { color: #909399; font-size: 14px; }
.in-stock { color: #67c23a; }
.out-stock { color: #f56c6c; }

.stock-info, .sales-info, .quantity-row { display: flex; align-items: center; gap: 12px; margin: 16px 0; }
.action-row { display: flex; align-items: center; justify-content: flex-start; gap: 16px; margin-top: 40px; }

.spec-row {
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.spec-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.spec-list .el-button {
  border: 1px solid var(--border-color-base);
}
.spec-list .el-button.active {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background-color: var(--primary-color-light);
}
.cart-btn { width: 200px; height: 50px; font-size: 18px; font-weight: 700; border-radius: 25px; }
.buy-now-btn { width: 200px; height: 50px; font-size: 18px; font-weight: 700; border-radius: 25px; }

.product-desc {
  background: #fff; border-radius: 10px;
  padding: 24px 30px; margin-top: 20px;
}
.product-desc h3 { font-size: 16px; color: #303133; margin: 0; }
.product-desc p { color: #606266; line-height: 1.8; }

.review-section { margin-top: 20px; }
.review-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.review-summary { display: flex; align-items: center; gap: 10px; }
.review-count { color: #909399; font-size: 13px; }
.review-card { border-radius: 10px; }
.review-item { padding: 14px 0; border-bottom: 1px solid #f0f0f0; }
.review-item:last-child { border-bottom: none; }
.review-user { display: flex; align-items: center; gap: 10px; }
.review-meta { flex: 1; }
.review-name { font-weight: 600; color: #303133; }
.review-time { font-size: 12px; color: #909399; }
.review-content { margin: 8px 0; color: #303133; }
.like-btn { margin-left: auto; }
.like { font-size: 14px; margin-right: 4px; }
.liked { color: #f56c6c; }
.media-list { display: flex; gap: 10px; flex-wrap: wrap; }
.media-item { display: flex; }
.video-tag { width:80px; height:80px; border-radius:6px; background:#f5f7fa; display:flex; align-items:center; justify-content:center; color:#909399; font-size:12px; }
.review-actions { margin-top: 8px; }
.pagination { display: flex; justify-content: center; margin-top: 16px; }
</style>
