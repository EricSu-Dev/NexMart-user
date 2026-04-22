<template>
  <div class="favorites-page">
    <div class="page-container">
      <div class="page-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/profile' }">个人中心</el-breadcrumb-item>
          <el-breadcrumb-item>我的收藏</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div class="content-card">
        <div class="header-row">
          <h2 class="title">我的收藏</h2>
          <el-button
            v-if="selectedIds.length > 0"
            type="danger"
            plain
            size="small"
            @click="removeBatch"
          >
            删除所选 ({{ selectedIds.length }})
          </el-button>
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
          <el-form :inline="true" size="default">
            <el-form-item>
              <el-input
                v-model="keyword"
                placeholder="搜索商品名称"
                :prefix-icon="Search"
                clearable
                @clear="handleSearch"
                @keyup.enter="handleSearch"
                style="width: 220px;"
              />
            </el-form-item>
            <el-form-item>
              <el-select
                v-model="categoryId"
                placeholder="商品分类"
                clearable
                @change="handleSearch"
                @clear="handleSearch"
                style="width: 160px;"
              >
                <el-option
                  v-for="cat in categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-empty v-if="!loading && list.length === 0" description="还没有收藏任何商品" />

        <div v-else class="product-grid" v-loading="loading">
          <div
            v-for="item in list"
            :key="item.id"
            class="product-card"
            :class="{ selected: selectedIds.includes(item.productId) }"
          >
            <el-checkbox
              class="card-checkbox"
              :model-value="selectedIds.includes(item.productId)"
              @change="toggleSelect(item.productId)"
            />

            <div class="img-container">
              <el-image
                :src="item.coverUrl"
                fit="cover"
                class="product-img"
                @click="goDetail(item.productId)"
              >
                <template #error>
                  <div class="img-placeholder">
                    <el-icon :size="40"><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div v-if="item.promotionName" class="promotion-badge">{{ item.promotionName }}</div>
            </div>

            <div class="product-info" @click="goDetail(item.productId)">
              <p class="product-name">{{ item.name }}</p>
              <div class="price-wrapper">
                <p class="product-price">¥{{ item.discountedPrice || item.price }}</p>
                <p v-if="item.promotionName && item.discountedPrice" class="original-price-small">¥{{ item.price }}</p>
              </div>
              <p class="fav-time">收藏于 {{ formatTime(item.createdAt) }}</p>
            </div>

            <el-button
              type="danger"
              text
              size="small"
              class="remove-btn"
              @click.stop="removeSingle(item.productId)"
            >
              取消收藏
            </el-button>
          </div>
        </div>

        <el-pagination
          v-if="total > pageSize"
          class="pagination"
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, Search } from '@element-plus/icons-vue'
import { favoriteApi } from '@/api/favorite'
import { categoryApi } from '@/api/category'

const router = useRouter()
const list = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)
const loading = ref(false)
const selectedIds = ref([])
const keyword = ref('')
const categoryId = ref(null)
const categories = ref([])

const loadCategories = async () => {
  try {
    const res = await categoryApi.getList()
    categories.value = res.data || []
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

async function fetchList() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      keyword: keyword.value || undefined,
      categoryId: categoryId.value || undefined
    }
    const res = await favoriteApi.getList(params)
    list.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取收藏列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  selectedIds.value = []
  fetchList()
}

function handleReset() {
  keyword.value = ''
  categoryId.value = null
  currentPage.value = 1
  selectedIds.value = []
  fetchList()
}

function toggleSelect(productId) {
  const idx = selectedIds.value.indexOf(productId)
  if (idx === -1) {
    selectedIds.value.push(productId)
  } else {
    selectedIds.value.splice(idx, 1)
  }
}

async function removeSingle(productId) {
  try {
    await favoriteApi.removeBatch([productId])
    ElMessage.success('已取消收藏')
    fetchList()
  } catch (error) {
    console.error('取消收藏失败:', error)
  }
}

async function removeBatch() {
  try {
    await ElMessageBox.confirm(
      `确定取消收藏这 ${selectedIds.value.length} 件商品？`,
      '提示',
      { type: 'warning' }
    )
    await favoriteApi.removeBatch(selectedIds.value)
    ElMessage.success('已批量取消收藏')
    selectedIds.value = []
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量取消收藏失败:', error)
    }
  }
}

function goDetail(productId) {
  router.push(`/product/${productId}`)
}

function formatTime(t) {
  if (!t) return ''
  const date = new Date(t)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function handlePageChange(page) {
  currentPage.value = page
  fetchList()
}

onMounted(() => {
  fetchList()
  loadCategories()
})
</script>

<style scoped>
.favorites-page {
  padding: 24px 0;
  min-height: calc(100vh - 60px);
  background: var(--bg-base);
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  margin-bottom: 32px;
}

.content-card {
  background: var(--bg-white);
  border-radius: var(--border-radius-large);
  padding: 24px;
  box-shadow: var(--box-shadow-base);
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.filter-bar {
  margin-bottom: 20px;
  padding: 18px 20px;
  background: #fff;
  border-radius: var(--border-radius-base);
}

.filter-bar :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 16px;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  min-height: 200px;
}

.product-card {
  position: relative;
  border: 2px solid transparent;
  border-radius: var(--border-radius-base);
  overflow: hidden;
  background: var(--bg-white);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}

.product-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14);
  transform: translateY(-2px);
}

.product-card.selected {
  border-color: var(--primary-color);
}

.card-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
}

.img-container {
  position: relative;
  width: 100%;
  height: 180px;
}

.product-img {
  width: 100%;
  height: 100%;
  cursor: pointer;
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

.img-placeholder {
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
  color: var(--text-placeholder);
}

.product-info {
  padding: 10px 12px;
  cursor: pointer;
}

.product-name {
  font-size: 13px;
  color: var(--text-primary);
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.price-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.product-price {
  font-size: 16px;
  color: #f5222d;
  font-weight: bold;
  margin: 0;
}

.original-price-small {
  font-size: 12px;
  color: #909399;
  text-decoration: line-through;
  margin: 0;
  font-weight: 400;
}

.fav-time {
  font-size: 11px;
  color: var(--text-secondary);
  margin: 4px 0 0;
}

.remove-btn {
  width: 100%;
  border-radius: 0;
}

.pagination {
  margin-top: 24px;
  justify-content: center;
  display: flex;
}
</style>
