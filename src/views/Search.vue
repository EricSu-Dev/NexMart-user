<template>
  <div class="search-page">
    <el-breadcrumb separator="/" class="search-breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>搜索</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="search-header-v2">
      <div class="search-header-container">
        <div class="header-search-box">
          <el-input
            v-model="searchInput"
            placeholder="搜索更多精彩商品..."
            size="large"
            clearable
            class="premium-search-input"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>
        <div class="search-stats">共 <span class="highlight">{{ totalCount }}</span> 件商品</div>
      </div>
    </div>
    
    <div class="search-sort-container" v-if="products.length > 0">
      <div class="category-selector">
        <el-select 
          v-model="selectedCategoryId" 
          placeholder="全部分类" 
          size="small"
          @change="selectCategory"
          style="width: 120px; margin-right: 16px;"
        >
          <el-option label="全部分类" :value="null" />
          <el-option 
            v-for="category in categories" 
            :key="category.id" 
            :label="category.name" 
            :value="String(category.id)" 
          />
        </el-select>
      </div>
      <div class="search-sort">
        <el-button 
          :type="sortBy === '' ? 'primary' : 'default'"
          :plain="sortBy !== ''"
          size="small"
          @click="toggleSort('')"
        >
          默认
        </el-button>
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
        <div class="price-inputs">
          <el-input-number 
            v-model="minPrice" 
            placeholder="最低价" 
            size="small" 
            :min="0" 
            :step="10"
            :controls="false"
            class="price-input"
          />
          <span class="price-separator">~</span>
          <el-input-number 
            v-model="maxPrice" 
            placeholder="最高价" 
            size="small" 
            :min="0" 
            :step="10"
            :controls="false"
            class="price-input"
          />
        </div>
        <div class="filter-actions">
          <el-button type="primary" size="small" @click="applyFilters">应用筛选</el-button>
          <el-button size="small" @click="resetFilters">重置</el-button>
        </div>
      </div>
    </div>

    <div class="search-body">
      <main class="result-panel">
        <el-skeleton :loading="loading" animated>
          <template #template>
            <div class="product-grid">
              <div class="item-card" v-for="n in skeletonCount" :key="n">
                <el-skeleton-item variant="image" style="height:180px" />
                <div class="item-info">
                  <el-skeleton-item variant="text" style="width:80%" />
                  <el-skeleton-item variant="text" style="width:40%" />
                </div>
              </div>
            </div>
          </template>
          <template #default>
            <div class="product-grid" v-if="products.length > 0">
              <div
                class="item-card"
                v-for="item in products"
                :key="item.id"
                @click="goDetail(item.id)"
              >
                <div class="item-img">
                  <el-image :src="item.coverUrl" fit="cover" style="width:100%;height:100%">
                    <template #placeholder>
                      <div class="mock-image"><el-icon><Picture /></el-icon></div>
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

            <!-- AI 智能推荐区域 -->
            <div v-else class="ai-suggestion-area">
              <div v-if="aiLoading" class="ai-loading-tip">
                <el-icon class="is-loading"><LoadingIcon /></el-icon>
                <span>未搜索到该商品,AI 为您智能推荐中...</span>
              </div>
              <div v-else-if="aiProducts.length > 0">
                <div class="ai-suggest-tip">{{ aiSuggestMessage }}</div>
                <div class="product-grid">
                  <div
                    class="item-card"
                    v-for="item in aiProducts"
                    :key="item.id"
                    @click="goDetail(item.id)"
                  >
                    <div class="item-img">
                      <el-image :src="item.coverUrl" fit="cover" style="width:100%;height:100%">
                        <template #placeholder>
                          <div class="mock-image"><el-icon><Picture /></el-icon></div>
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
              </div>
              <el-empty v-else-if="!loading" :description="keyword ? `未找到与「${keyword}」相关的商品` : '暂无商品'" />
            </div>

            <div class="pagination" v-if="total > 0 && products.length > 0">
              <el-pagination
                v-model:current-page="current"
                v-model:page-size="size"
                :total="total"
                layout="prev, pager, next"
                @current-change="onPageChange"
              />
            </div>
          </template>
        </el-skeleton>
      </main>
    </div>

    <!-- 规格选择对话框 -->
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Picture, ShoppingCart, Loading as LoadingIcon, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { productApi } from '@/api/product'
import { categoryApi } from '@/api/category'
import { cartApi } from '@/api/cart'
import { useUserStore } from '@/stores/user'
import SpecSelector from '@/components/SpecSelector.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const aiLoading = ref(false)
const aiSuggestMessage = ref('')
const aiProducts = ref([])
const categories = ref([])
const products = ref([])
const total = ref(0)

const totalCount = computed(() => {
  if (products.value.length > 0) {
    return total.value
  }
  return aiProducts.value.length
})

// 规格选择相关
const specDialogVisible = ref(false)
const specLoading = ref(false)
const specProduct = ref(null)
const selectedSpecId = ref(null)
const specQuantity = ref(1)

const keyword = ref('')
const searchInput = ref('')
const selectedCategoryId = ref(null)
const minPrice = ref(null)
const maxPrice = ref(null)
const sortBy = ref('')
const sortOrder = ref('desc')
const current = ref(1)
const size = ref(12)
const skeletonCount = 8

const headerTitle = computed(() => {
  if (keyword.value) return `${keyword.value} 的搜索结果`
  const cat = categories.value.find(c => String(c.id) === String(selectedCategoryId.value))
  if (cat) return `${cat.name} 的搜索结果`
  return '全部商品'
})

const loadCategories = async () => {
  try {
    const res = await categoryApi.getList()
    categories.value = res.data || []
  } catch (error) {
    categories.value = []
  }
}

const loadProducts = async () => {
  loading.value = true
  aiSuggestMessage.value = ''
  aiProducts.value = []
  try {
    const params = {
      current: current.value,
      size: size.value
    }
    if (keyword.value) params.keyword = keyword.value
    if (selectedCategoryId.value) params.categoryId = selectedCategoryId.value
    if (minPrice.value !== null && minPrice.value !== '') params.minPrice = minPrice.value
    if (maxPrice.value !== null && maxPrice.value !== '') params.maxPrice = maxPrice.value
    if (sortBy.value) params.sortBy = sortBy.value
    if (sortOrder.value) params.sortOrder = sortOrder.value

    const res = await productApi.getPage(params)
    products.value = res.data?.records || []
    total.value = res.data?.total || 0
    
    if (products.value.length === 0 && keyword.value) {
      loadAISuggestions()
    }
  } finally {
    loading.value = false
  }
}

const loadAISuggestions = async () => {
  if (!keyword.value) return
  aiLoading.value = true
  try {
    const res = await request.get('/ai/search-suggest', { params: { keyword: keyword.value } })
    aiSuggestMessage.value = res.data?.message || ''
    aiProducts.value = res.data?.products || []
  } catch (error) {
    console.error('Failed to load AI suggestions:', error)
  } finally {
    aiLoading.value = false
  }
}

const handleSearch = () => {
  const val = (searchInput.value || '').trim()
  if (!val) {
    return ElMessage.warning('请输入搜索关键词')
  }
  current.value = 1
  router.push({ path: '/search', query: { keyword: val } })
}

const updateRoute = () => {
  const query = {
    keyword: keyword.value || undefined,
    categoryId: selectedCategoryId.value || undefined,
    minPrice: minPrice.value ?? undefined,
    maxPrice: maxPrice.value ?? undefined,
    sortBy: sortBy.value || undefined,
    sortOrder: sortOrder.value || undefined,
    current: current.value,
    size: size.value
  }
  Object.keys(query).forEach(key => query[key] === undefined && delete query[key])
  router.push({ path: '/search', query })
}

const syncFromRoute = () => {
  const q = route.query
  keyword.value = q.keyword ? String(q.keyword) : ''
  selectedCategoryId.value = q.categoryId ? String(q.categoryId) : null
  minPrice.value = q.minPrice !== undefined ? Number(q.minPrice) : null
  maxPrice.value = q.maxPrice !== undefined ? Number(q.maxPrice) : null
  sortBy.value = q.sortBy ? String(q.sortBy) : ''
  sortOrder.value = q.sortOrder ? String(q.sortOrder) : 'desc'
  current.value = q.current !== undefined ? Number(q.current) : 1
  size.value = q.size !== undefined ? Number(q.size) : 20
  searchInput.value = keyword.value
  loadProducts()
}

const selectCategory = (id) => {
  selectedCategoryId.value = id
  current.value = 1
  updateRoute()
}

const applyFilters = () => {
  current.value = 1
  updateRoute()
}

const resetFilters = () => {
  minPrice.value = null
  maxPrice.value = null
  sortBy.value = ''
  sortOrder.value = 'desc'
  current.value = 1
  updateRoute()
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
  current.value = 1
  updateRoute()
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
  } catch (error) {
    ElMessage.error('添加购物车失败')
  }
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

const onPageChange = (page) => {
  current.value = page
  updateRoute()
}

const goDetail = (id) => {
  router.push(`/product/${id}`)
}

watch(() => route.query, syncFromRoute, { immediate: true })

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.search-page {
  padding: 24px 0 60px;
}

.search-breadcrumb {
  max-width: 1200px;
  margin: 0 auto 20px;
  padding: 0 20px;
  font-size: 16px;
}

.search-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 20px;
  background: var(--bg-white);
  border-radius: var(--border-radius-base);
  box-shadow: var(--box-shadow-base);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
}

.search-header-v2 {
  margin-bottom: 12px;
  


  padding: 12px 20px;
  max-width: 850px;
  margin-left: auto;
  margin-right: auto;
  transition: var(--transition-base);
  border: 1px solid var(--border-color);
}

.search-header-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.search-stats {
  font-size: 15px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.search-stats .highlight {
  color: var(--primary-color);
  font-weight: 700;
  font-size: 18px;
}

.header-search-box {
  max-width: 500px;
  min-width: 300px;
  width: 100%;
}

:deep(.premium-search-input .el-input__wrapper) {
  border-radius: var(--border-radius-base) 0 0 var(--border-radius-base);
  box-shadow: none;
  padding-left: 16px;
  border: 2px solid transparent;
  background: linear-gradient(white, white) padding-box, linear-gradient(90deg, #64b5f6, var(--primary-color)) border-box;
  transition: all 0.3s;
}

:deep(.premium-search-input .el-input__inner) {
  font-size: 14px;
  padding-left: 8px;
}

:deep(.premium-search-input .el-input__wrapper.is-focus) {
  border: 2px solid transparent;
  background: linear-gradient(white, white) padding-box, linear-gradient(90deg, #40c4ff, var(--primary-color)) border-box;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

:deep(.premium-search-input .el-input-group__append) {
  border-radius: 0 var(--border-radius-base) var(--border-radius-base) 0;
  background-color: var(--primary-color);
  color: #fff;
  border: none;
  font-weight: 600;
  padding: 0 16px;
}

@media (max-width: 850px) {
  .search-header-container {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .header-search-box {
    width: 100%;
    max-width: none;
    min-width: unset;
  }
  
  .search-stats {
    order: -1;
  }
}

.search-sort-container {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
  max-width: 850px;
  margin-left: auto;
  margin-right: auto;
  flex-wrap: wrap;
  gap: 16px;
  border: 1px solid var(--border-color);
}

.search-sort-container > div {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  flex: 1;
  text-align: center;
  margin: 0;
}

.search-meta {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  margin-left: 16px;
}

.search-sort {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 1;
  justify-content: center;
}

.price-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.price-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-input {
  width: 100px;
  border-radius: var(--border-radius-base);
  border: 1px solid var(--border-color);
  transition: all 0.3s;
}

.price-input:hover {
  border-color: var(--primary-color);
}

.price-separator {
  color: var(--text-secondary);
  font-weight: 500;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.filter-actions .el-button {
  border-radius: var(--border-radius-base);
  font-weight: 500;
  transition: all 0.3s;
}

.filter-actions .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .search-sort-container {
    flex-direction: column;
    align-items: stretch;
    max-width: 90%;
  }
  
  .search-sort-container > div {
    justify-content: center;
  }
  
  .category-selector {
    margin-bottom: 8px;
  }
  
  .search-sort {
    justify-content: center;
  }
  
  .price-filter {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-actions {
    justify-content: center;
  }
}

.search-body {
  display: block;
}

.result-panel {
  min-height: 400px;
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
  transform: translateY(-4px);
  box-shadow: var(--box-shadow-hover);
}

.item-img {
  height: 270px;
  width: 100%;
  position: relative;
}

.mock-image {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.sold-out-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
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
  padding: 12px 14px;
}

.item-name {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0 0 4px;
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* AI 推荐样式 */
.ai-suggestion-area {
  padding: 20px 0;
  min-height: 200px;
}

.ai-loading-tip {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--text-secondary);
  gap: 12px;
  text-align: center;
}

.ai-loading-tip .el-icon {
  font-size: 32px;
}

.ai-suggest-tip {
  text-align: center;
  color: var(--text-secondary);
  font-size: 15px;
  margin-bottom: 30px;
}

/* 规格选择对话框样式 */
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

@media (max-width: 1200px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 980px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .search-header {
    max-width: 90%;
    padding: 10px 16px;
  }
  
  .search-title {
    font-size: 18px;
  }
  
  .search-meta {
    font-size: 12px;
  }
}
</style>
