<template>
  <div class="home-page">
    
    <!-- 1. 置顶搜索区 -->
    <div class="search-section">
      <div class="search-wrapper">
        <el-input
          v-model="keyword"
          placeholder="探索你感兴趣的商品..."
          size="large"
          clearable
          class="home-search"
          @keyup.enter="goSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="goSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <div v-if="hotKeywords.length" class="hot-keywords">
        <span class="hot-label">热门搜索：</span>
        <el-tag
          v-for="word in hotKeywords"
          :key="word"
          class="hot-tag"
          @click="searchWithKeyword(word)"
        >{{ word }}</el-tag>
      </div>
    </div>

    <!-- 2. 推荐功能卡片 -->
    <div class="quick-navs">
      <div class="nav-card coupon-card" @click="$router.push('/coupon/center')">
        <div class="icon-box">
          <el-icon :size="32"><Ticket /></el-icon>
        </div>
        <div class="nav-info">
          <span class="nav-title">领券中心</span>
          <span class="nav-subtitle">大额优惠券限时领</span>
        </div>
      </div>

      <div class="nav-card seckill-card" @click="$router.push('/seckill')">
        <div class="icon-box">
          <el-icon :size="32"><Timer /></el-icon>
        </div>
        <div class="nav-info">
          <span class="nav-title">秒杀</span>
          <span class="nav-subtitle">爆款尖货整点抢</span>
        </div>
      </div>

      <div class="nav-card points-card" @click="openCheckin">
        <div class="icon-box">
          <el-icon :size="32"><Calendar /></el-icon>
        </div>
        <div class="nav-info">
          <span class="nav-title">签到领积分</span>
          <span class="nav-subtitle">每日签到换好礼</span>
        </div>
      </div>
    </div>

    <!-- 3. 轮播图 -->
    <div class="carousel-section">
      <el-carousel height="300px" trigger="click" arrow="always">
        <el-carousel-item v-for="banner in banners" :key="banner.id">
          <div class="carousel-link" @click="handleBannerClick(banner)">
            <div v-if="!banner.imageUrl" class="carousel-placeholder bg-color-1">
              <h2 class="banner-title">{{ banner.title || '活动推广' }}</h2>
            </div>
            <img v-else :src="banner.imageUrl" :alt="banner.title" class="carousel-image" />
          </div>
        </el-carousel-item>
        <!-- 降级处理：当没有轮播图时显示占位符 -->
        <el-carousel-item v-if="banners.length === 0">
          <div class="carousel-placeholder bg-color-1">
            <h2>品牌大促</h2>
            <p>轮播图加载中...</p>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 4. 各类模块：热销商品 -->
    <section v-if="hotSales.length > 0" class="product-block">
      <h2 class="section-title">热销商品</h2>
      <div class="product-grid">
        <div class="item-card" v-for="item in hotSales" :key="item.id" @click="goToProductDetail(item)">
          <div class="item-img">
            <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.name" />
            <div v-else class="mock-image">
              <el-icon :size="32"><Picture /></el-icon>
              <span>暂无图片</span>
            </div>
            <div v-if="item.promotionName" class="promotion-badge">{{ item.promotionName }}</div>
          </div>
          <div class="item-info">
            <h3 class="item-name">{{ item.name }}</h3>
            <p class="item-desc" v-if="item.description">{{ item.description }}</p>
            <div class="item-meta">
              <div class="price-wrapper">
                <p class="item-price">¥{{ item.discountedPrice || item.price }}</p>
                <p v-if="item.promotionName && item.discountedPrice" class="original-price-small">¥{{ item.price }}</p>
              </div>
              <p class="item-sales" v-if="item.sales">已售 {{ item.sales }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. 各类模块：新品上市 -->
    <section v-if="newArrivals.length > 0" class="product-block">
      <h2 class="section-title">新品上市</h2>
      <div class="product-grid">
        <div class="item-card" v-for="item in newArrivals" :key="item.id" @click="goToProductDetail(item)">
          <div class="item-img">
            <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.name" />
            <div v-else class="mock-image">
              <el-icon :size="32"><Picture /></el-icon>
              <span>暂无图片</span>
            </div>
            <div v-if="item.promotionName" class="promotion-badge">{{ item.promotionName }}</div>
          </div>
          <div class="item-info">
            <h3 class="item-name">{{ item.name }}</h3>
            <p class="item-desc" v-if="item.description">{{ item.description }}</p>
            <div class="item-meta">
              <div class="price-wrapper">
                <p class="item-price">¥{{ item.discountedPrice || item.price }}</p>
                <p v-if="item.promotionName && item.discountedPrice" class="original-price-small">¥{{ item.price }}</p>
              </div>
              <p class="item-sales" v-if="item.sales">已售 {{ item.sales }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. 各类模块：为你推荐 -->
    <section v-if="recommendations.length > 0" class="product-block">
      <h2 class="section-title">为你推荐</h2>
      <div class="product-grid">
        <div class="item-card" v-for="item in recommendations" :key="item.id" @click="goToProductDetail(item)">
          <div class="item-img">
            <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.name" />
            <div v-else class="mock-image">
              <el-icon :size="32"><Picture /></el-icon>
              <span>暂无图片</span>
            </div>
            <div v-if="item.promotionName" class="promotion-badge">{{ item.promotionName }}</div>
          </div>
          <div class="item-info">
            <h3 class="item-name">{{ item.name }}</h3>
            <p class="item-desc" v-if="item.description">{{ item.description }}</p>
            <div class="item-meta">
              <div class="price-wrapper">
                <p class="item-price">¥{{ item.discountedPrice || item.price }}</p>
                <p v-if="item.promotionName && item.discountedPrice" class="original-price-small">¥{{ item.price }}</p>
              </div>
              <p class="item-sales" v-if="item.sales">已售 {{ item.sales }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Ticket, Timer, Calendar, Picture } from '@element-plus/icons-vue'
import { productApi } from '@/api/product'
import { bannerApi } from '@/api/banner'
import { homeApi } from '@/api/home'
import { searchApi } from '@/api/search'

/* =========================================
   NOTE: ALL REAL API IMPORTS ARE COMMENTED OUT 
   PER USER REQUIREMENT FOR MOCK UI OVERHAUL.
   =========================================
// import { productApi } from '@/api/product'
// import { categoryApi } from '@/api/category'
// import { cartApi } from '@/api/cart'
*/

const keyword = ref('')
const router = useRouter()
const hotKeywords = ref([])
const banners = ref([])

const checkinDialogVisible = ref(false)
const openCheckin = () => {
  router.push('/points')
}

const fallbackHotKeywords = [
  '\u725b\u5976',
  '\u85af\u7247',
  '\u53ef\u4e50',
  '\u9762\u5305',
  '\u6c34\u679c'
]

const loadHotKeywords = async () => {
  try {
    const res = await searchApi.getHotKeywords()
    const keywords = res.data || []
    hotKeywords.value = keywords.length ? keywords : fallbackHotKeywords
  } catch (error) {
    hotKeywords.value = fallbackHotKeywords
  }
}

const goSearch = () => {
  const value = (keyword.value || '').trim()
  if (!value) {
    ElMessage.warning('\u8bf7\u8f93\u5165\u641c\u7d22\u5173\u952e\u8bcd')
    return
  }
  router.push({ path: '/search', query: { keyword: value } })
}

const searchWithKeyword = (word) => {
  keyword.value = word
  router.push({ path: '/search', query: { keyword: word } })
}

const loadBanners = async () => {
  try {
    const res = await bannerApi.getList()
    banners.value = res.data || []
  } catch (error) {
    console.error('Failed to load banners:', error)
    banners.value = []
  }
}

const handleBannerClick = (banner) => {
  if (banner.productId) {
    router.push(`/product/${banner.productId}`)
  } else if (banner.link) {
    window.open(banner.link, '_blank')
  }
}


const hotSales = ref([])
const newArrivals = ref([])
const recommendations = ref([])

const loadHomeSections = async () => {
  try {
    const res = await homeApi.getHomeSections()
    const data = res.data || {}
    hotSales.value = data.hotSales || []
    newArrivals.value = data.newArrivals || []
    recommendations.value = data.recommendations || []
  } catch (error) {
    console.error('Failed to load home sections:', error)
  }
}

const goToProductDetail = (product) => {
  if (product.id) {
    router.push(`/product/${product.id}`)
  }
}

onMounted(() => {
  loadHotKeywords()
  loadBanners()
  loadHomeSections()
})

/* =========================================
   REAL METHODS COMMENTED OUT
   =========================================
// const loadProducts = async () => { ... }
// const loadCategories = async () => { ... }
// const selectCategory = (id) => { ... }
// const applyFilters = () => { ... }
// const resetFilters = () => { ... }
// const addToCart = async (product) => { ... }
*/
</script>

<style scoped>
.home-page {
  padding-bottom: 60px;
}

/* 1. Search Section */
.search-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin: 40px 0 30px;
}

.search-wrapper {
  width: 100%;
  max-width: 600px;
}

:deep(.home-search .el-input__wrapper) {
  border-radius: 24px 0 0 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding-left: 20px;
}
:deep(.home-search .el-input-group__append) {
  border-radius: 0 24px 24px 0;
  background-color: var(--primary-color);
  color: #fff;
  border: none;
  font-weight: 600;
}

/* 2. Quick Navs */
.quick-navs {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 50px;
  padding: 0 20px;
  max-width: 960px;
  margin-left: auto;
  margin-right: auto;
}

.nav-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--bg-white);
  padding: 24px 28px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.nav-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
  z-index: 1;
}

.icon-box {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  transition: all 0.3s ease;
  z-index: 2;
}

.coupon-card .icon-box { background: #fff5f6; color: #ff6b81; }
.seckill-card .icon-box { background: #fff9ed; color: #feca57; }
.points-card .icon-box { background: #f0faff; color: #48dbfb; }

.nav-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 2;
}

.nav-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.nav-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  opacity: 0.8;
}

.nav-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.nav-card:hover .icon-box {
  transform: scale(1.1) rotate(5deg);
}

.coupon-card:hover { border-color: rgba(255, 107, 129, 0.3); }
.seckill-card:hover { border-color: rgba(254, 202, 87, 0.3); }
.points-card:hover { border-color: rgba(72, 219, 251, 0.3); }

.nav-card.disabled-feature {
  cursor: default;
}
.nav-card.disabled-feature:hover {
  transform: none;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

/* 3. Carousel */
.carousel-section {
  border-radius: var(--border-radius-large);
  overflow: hidden;
  margin-bottom: 60px;
  box-shadow: var(--box-shadow-base);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  padding: 0 20px;
  box-sizing: border-box;
}

.carousel-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-align: center;
}

.carousel-placeholder h2 { font-size: 28px; margin: 0 0 8px; font-weight: 800; letter-spacing: 2px;}
.carousel-placeholder p { font-size: 16px; opacity: 0.9; }

.bg-color-1 { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%); }
.bg-color-2 { background: linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%); }
.bg-color-3 { background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%); }
.bg-color-4 { background: linear-gradient(to right, #fa709a 0%, #fee140 100%); }

.carousel-link {
  display: block;
  width: 100%;
  height: 100%;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.carousel-link:hover {
  transform: scale(1.02);
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--border-radius-large);
}

.banner-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  text-align: center;
  color: #fff;
  letter-spacing: 2px;
}

/* Product Modules */
.product-block {
  margin-bottom: 50px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 24px;
  position: relative;
  padding-bottom: 12px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}
.section-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 88px;
  height: 5px;
  background: linear-gradient(90deg, var(--primary-color) 0%, transparent 100%);
  border-radius: 3px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.item-card {
  background: var(--bg-white);
  border-radius: var(--border-radius-base);
  overflow: hidden;
  box-shadow: var(--box-shadow-base);
  transition: var(--transition-base);
  cursor: pointer;
}
.item-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--box-shadow-hover);
}

.item-img {
  height: 270px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  overflow: hidden;
  position: relative;
}

.item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.item-card:hover .item-img img {
  transform: scale(1.05);
}

.promotion-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
  z-index: 1;
}

.mock-image {
  flex-direction: column;
  gap: 10px;
  color: #999;
}

.item-info {
  padding: 16px;
}

.item-name {
  font-size: 15px;
  color: var(--text-primary);
  margin: 0 0 8px;
  font-weight: 500;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 12px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.price-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-price {
  font-size: 18px;
  color: var(--danger-color);
  font-weight: 700;
  margin: 0;
}

.original-price-small {
  font-size: 12px;
  color: #909399;
  text-decoration: line-through;
  margin: 0;
  font-weight: 400;
}

.item-sales {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}


.hot-keywords {
  margin-top: 12px;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 600px;
  justify-content: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}

.hot-label {
  color: var(--text-secondary);
  font-size: 13px;
}

.hot-tag {
  cursor: pointer;
}

</style>
