<template>
  <div class="category-page">
    <div class="category-layout">
      
      <!-- 左侧分类栏 -->
      <aside class="sidebar">
        <ul class="category-list">
          <li 
            v-for="cat in categories" 
            :key="cat.id"
            class="cat-item"
            :class="{ active: selectedCategory?.id === cat.id }"
            @click="selectedCategory = cat"
          >
            {{ cat.name }}
          </li>
        </ul>
      </aside>

      <!-- 右侧商品网格 -->
      <main class="content-area" v-loading="loading">
        <div class="content-header">
          <h2 class="current-cat-name">{{ selectedCategory?.name || '全部分类' }}</h2>
          <span class="product-count">共 {{ products.length }} 件商品</span>
          
          <div class="search-sort">
            <el-button 
              :type="sortBy === 'price' ? 'primary' : 'default'"
              :plain="sortBy !== 'price'"
              size="small"
              @click="toggleSort('price')"
            >
              价格{{ sortBy === 'price' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
            </el-button>
            <el-button 
              :type="sortBy === 'sales' ? 'primary' : 'default'"
              :plain="sortBy !== 'sales'"
              size="small"
              @click="toggleSort('sales')"
            >
              销量{{ sortBy === 'sales' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
            </el-button>
            <el-button 
              :type="sortBy === 'created_at' ? 'primary' : 'default'"
              :plain="sortBy !== 'created_at'"
              size="small"
              @click="toggleSort('created_at')"
            >
              新品{{ sortBy === 'created_at' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
            </el-button>
          </div>
          
          <div class="price-filter">
            <el-input-number 
              v-model="minPrice" 
              placeholder="最低价" 
              size="small" 
              :min="0" 
              :step="10"
              :controls="false"
              style="width: 80px; margin-right: 8px;"
            />
            <span class="price-separator">~</span>
            <el-input-number 
              v-model="maxPrice" 
              placeholder="最高价" 
              size="small" 
              :min="0" 
              :step="10"
              :controls="false"
              style="width: 80px; margin-right: 16px;"
            />
          </div>

          <div class="search-box">
            <el-input 
              v-model="keyword" 
              placeholder="搜索商品名" 
              size="small"
              style="width: 180px;"
              @keyup.enter="applyFilters"
            >
              <template #append>
                <el-button type="primary" size="small" @click="applyFilters"><el-icon><Search /></el-icon></el-button>
              </template>
            </el-input>
          </div>
        </div>
        
        <div class="product-grid">
          <div 
            class="item-card" v-for="item in products" :key="item.id"
            @click="$router.push(`/product/${item.id}`)"
          >
            <div class="item-img">
              <el-image :src="item.coverUrl" fit="cover" style="width:100%;height:100%">
                <template #placeholder>
                  <div class="mock-image" style="height:100%"><el-icon><Picture /></el-icon></div>
                </template>
              </el-image>
              <div v-if="item.status === 2" class="sold-out-mask">已售空</div>
              <div v-if="item.promotionName" class="promotion-badge">{{ item.promotionName }}</div>
            </div>
            <div class="item-info">
              <h3 class="item-name">{{ item.name }}</h3>
              <div class="item-sales">销量: {{ item.sales || 0 }}件</div>
              <div class="item-footer">
                <div class="price-wrapper">
                  <p class="item-price">¥{{ item.discountedPrice || item.price }}</p>
                  <p v-if="item.promotionName && item.discountedPrice" class="original-price-small">¥{{ item.price }}</p>
                </div>
                <el-button 
                  type="primary" :icon="ShoppingCart" circle size="small"
                  :disabled="item.status === 2"
                  @click.stop="addToCart(item)"
                />
              </div>
            </div>
          </div>
        </div>
        <el-empty v-if="!loading && products.length === 0" description="该分类下暂无商品" />
      </main>

    </div>

    <el-dialog
      v-model="specDialogVisible"
      width="420px"
      :append-to-body="true"
      class="spec-dialog"
    >
      <template #header>
        <span class="spec-dialog-title">选择规格</span>
      </template>
      <div v-loading="specLoading">
        <template v-if="specProduct">
          <div class="spec-product-header">
            <el-image :src="specProduct.coverUrl" fit="cover" class="spec-cover">
              <template #error>
                <div class="spec-cover placeholder">暂无图片</div>
              </template>
            </el-image>
            <div class="spec-product-info">
              <div class="spec-product-name">{{ specProduct.name }}</div>
              <div class="spec-product-price">¥{{ specProduct.price }}</div>
            </div>
          </div>

          <SpecSelector
            :specs="specProduct.productSpecList || []"
            v-model="selectedSpecId"
            v-model:quantity="specQuantity"
            :showQuantity="true"
            :showSpecStock="true"
            stock-label="总库存"
            :stockValue="specProduct.stock"
          />

          <div class="spec-actions">
            <el-button
              type="primary"
              :disabled="specAddDisabled"
              @click="confirmSpecAdd"
            >加入购物车</el-button>
          </div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { Picture, ShoppingCart, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { productApi } from '@/api/product'
import { categoryApi } from '@/api/category'
import { cartApi } from '@/api/cart'
import { useUserStore } from '@/stores/user'
import { useRoute, useRouter } from 'vue-router'
import SpecSelector from '@/components/SpecSelector.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const categories = ref([])
const selectedCategory = ref(null)
const products = ref([])
const specDialogVisible = ref(false)
const specLoading = ref(false)
const specProduct = ref(null)
const selectedSpecId = ref(null)
const specQuantity = ref(1)

// 搜索和筛选相关
const keyword = ref('')
const minPrice = ref(null)
const maxPrice = ref(null)
const sortBy = ref('')
const sortOrder = ref('desc')

const loadCategories = async () => {
  try {
    const res = await categoryApi.getList()
    categories.value = res.data || []
    if (categories.value.length > 0) {
      // Check for category ID in query param
      const queryId = route.query.id
      const target = categories.value.find(c => String(c.id) === String(queryId))
      selectedCategory.value = target || categories.value[0]
    }
  } catch (error) {
    ElMessage.error('加载分类失败')
  }
}

const loadProducts = async () => {
  if (!selectedCategory.value) return
  loading.value = true
  try {
    const params = {
      current: 1,
      size: 100, // Fetch more for simpler view
      categoryId: selectedCategory.value.id
    }
    if (keyword.value) params.keyword = keyword.value
    if (minPrice.value !== null && minPrice.value !== '') params.minPrice = minPrice.value
    if (maxPrice.value !== null && maxPrice.value !== '') params.maxPrice = maxPrice.value
    if (sortBy.value) params.sortBy = sortBy.value
    if (sortOrder.value) params.sortOrder = sortOrder.value

    const res = await productApi.getPage(params)
    products.value = res.data.records || []
  } catch (error) {
    ElMessage.error('加载商品失败')
  } finally {
    loading.value = false
  }
}

const addToCart = async (product) => {
  if (!userStore.isLoggedIn) {
    return ElMessage.warning('请先登录')
  }
  if (product.hasSpec === 1) {
    await openSpecDialog(product)
    return
  }
  try {
    await cartApi.add({ productId: product.id, quantity: 1 })
    ElMessage.success({ 
      message: '已加入购物车', 
      duration: 1500,
      offset: 80
    })
    userStore.loadCartCount()
  } catch (error) {}
}

const openSpecDialog = async (product) => {
  specDialogVisible.value = true
  specLoading.value = true
  specProduct.value = null
  selectedSpecId.value = null
  specQuantity.value = 1
  try {
    const res = await productApi.getDetail(product.id)
    specProduct.value = res.data
  } catch (error) {
    ElMessage.error('加载规格失败')
    specDialogVisible.value = false
  } finally {
    specLoading.value = false
  }
}

const specCurrentStock = computed(() => {
  if (!specProduct.value) return 0
  const spec = specProduct.value.productSpecList?.find(item => String(item.id) === String(selectedSpecId.value))
  return Number(spec?.stock || 0)
})

const specAddDisabled = computed(() => {
  if (!specProduct.value) return true
  if (!selectedSpecId.value) return true
  if (specCurrentStock.value === 0) return true
  if (specProduct.value.status === 2) return true
  return false
})

const confirmSpecAdd = async () => {
  if (specAddDisabled.value) return
  try {
    await cartApi.add({
      productId: specProduct.value.id,
      quantity: specQuantity.value,
      specId: selectedSpecId.value
    })
    ElMessage.success({
      message: '已加入购物车',
      duration: 1500,
      offset: 80
    })
    specDialogVisible.value = false
    userStore.loadCartCount()
  } catch (error) {}
}

const applyFilters = () => {
  loadProducts()
}

const resetFilters = () => {
  keyword.value = ''
  minPrice.value = null
  maxPrice.value = null
  sortBy.value = ''
  sortOrder.value = 'desc'
  loadProducts()
}

const toggleSort = (field) => {
  if (field === '') {
    // 默认排序
    sortBy.value = ''
    sortOrder.value = 'desc'
  } else if (sortBy.value === field) {
    // 切换当前排序的升序降序
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // 切换到新的排序字段，默认降序
    sortBy.value = field
    sortOrder.value = 'desc'
  }
  loadProducts()
}

watch(selectedCategory, (newCategory) => {
  if (newCategory) {
    // 更新路由参数，保持当前分类
    router.push({
      path: '/category',
      query: { id: newCategory.id }
    })
    loadProducts()
  }
})

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.category-page {
  height: calc(100vh - var(--nav-height, 64px) - 100px); /* Fill space between nav and footer roughly */
  min-height: 600px;
  background: var(--bg-white, #fff);
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-base);
  overflow: hidden;
}

.category-layout {
  display: flex;
  height: 100%;
}

/* Sidebar */
.sidebar {
  width: 200px;
  background: var(--bg-base, #f5f7fa);
  border-right: 1px solid var(--border-color-lighter);
  height: 100%;
  overflow-y: auto;
}

/* Hide scrollbar for sidebar but allow scroll */
.sidebar::-webkit-scrollbar {
  width: 6px;
}
.sidebar::-webkit-scrollbar-thumb {
  background-color: var(--border-color-light);
  border-radius: 4px;
}

.category-list {
  list-style: none;
  margin: 0;
  padding: 10px 0;
}

.cat-item {
  padding: 16px 20px;
  font-size: 15px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.cat-item:hover {
  background: #eef1f6;
}

.cat-item.active {
  background: #fff;
  color: var(--primary-color);
  font-weight: 600;
  border-left-color: var(--primary-color);
}

/* Main Content area */
.content-area {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color-lighter);
  flex-wrap: wrap;
  gap: 16px;
}

.current-cat-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.product-count {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  margin-right: 40px;
}

.search-box {
  display: flex;
  align-items: center;
}

.search-sort {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-sort .el-button {
  font-size: 14px;
  padding: 8px 16px;
}

.price-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-separator {
  margin: 0 4px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .content-header {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  
  .search-sort,
  .price-filter {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* Product Grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.item-card {
  background: var(--bg-white);
  border-radius: var(--border-radius-base);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: var(--transition-base);
  border: 1px solid var(--border-color-lighter);
  cursor: pointer;
}
.item-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--box-shadow-hover);
}

.item-img {
  height: 270px;
  width: 100%;
  position: relative;
}

.sold-out-mask {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold;
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

.item-info {
  padding: 12px;
}

.item-name {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0 0 4px;
  font-weight: 500;
  line-height: 1.4;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-sales {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 8px;
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.spec-dialog :deep(.el-dialog__body) {
  padding-top: 8px;
}

.spec-dialog-title {
  font-weight: 600;
  color: var(--text-primary);
}

.spec-product-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.spec-cover {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background: #f5f7fa;
  overflow: hidden;
  flex-shrink: 0;
}

.spec-cover.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  height: 64px;
}

.spec-product-info {
  flex: 1;
  min-width: 0;
}

.spec-product-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.spec-product-price {
  font-size: 16px;
  color: var(--danger-color);
  font-weight: 700;
}

.spec-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
