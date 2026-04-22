<template>
  <div class="history-page">
    <div class="page-container">
      <div class="page-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/profile' }">个人中心</el-breadcrumb-item>
          <el-breadcrumb-item>浏览记录</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div class="content-card">
        <div class="header-row">
          <h2 class="title">浏览记录</h2>
          <el-button
            v-if="list.length > 0"
            type="danger"
            plain
            size="small"
            @click="handleClearAll"
          >
            清空全部
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

        <el-empty v-if="!loading && list.length === 0" description="暂无浏览记录" />

        <div v-else class="product-grid" v-loading="loading">
          <div
            v-for="item in list"
            :key="item.id"
            class="product-card"
            @click="goDetail(item.productId)"
          >
            <el-button
              class="delete-btn"
              type="danger"
              icon="Delete"
              circle
              size="small"
              @click.stop="handleDelete(item.id)"
            />

            <div class="img-container">
              <el-image
                :src="item.coverUrl"
                fit="cover"
                class="product-img"
              >
                <template #error>
                  <div class="img-placeholder">
                    <el-icon :size="40"><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div v-if="item.promotionName" class="promotion-badge">{{ item.promotionName }}</div>
            </div>

            <div class="product-info">
              <p class="product-name">{{ item.name }}</p>
              <div class="price-wrapper">
                <p class="product-price">¥{{ item.discountedPrice || item.price }}</p>
                <p v-if="item.promotionName && item.discountedPrice" class="original-price-small">¥{{ item.price }}</p>
              </div>
              <p class="view-time">最后浏览: {{ formatDate(item.viewedAt) }}</p>
            </div>
          </div>
        </div>

        <el-pagination
          v-if="total > pageSize"
          class="pagination"
          background
          layout="prev, pager, next"
          :total="total"
          v-model:page-size="pageSize"
          v-model:current-page="currentPage"
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
import { Picture, Delete, Search } from '@element-plus/icons-vue'
import { historyApi } from '@/api/history'
import { categoryApi } from '@/api/category'
import dayjs from 'dayjs'

const router = useRouter()
const list = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

// 筛选相关
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

const fetchList = async () => {
  loading.value = true
  try {
    const res = await historyApi.getList({
      page: currentPage.value,
      size: pageSize.value,
      keyword: keyword.value || undefined,
      categoryId: categoryId.value || undefined
    })
    list.value = res.data.records || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取浏览记录失败:', error)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除这条浏览记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await historyApi.remove(id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除浏览记录失败:', error)
    }
  }
}

const handleClearAll = async () => {
  try {
    await ElMessageBox.confirm('确定清空所有浏览记录吗？此操作不可撤销。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await historyApi.clear()
    ElMessage.success('已清空浏览记录')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空浏览记录失败:', error)
    }
  }
}

const goDetail = (productId) => {
  router.push(`/product/${productId}`)
}

const formatDate = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchList()
}

const handleSearch = () => {
  currentPage.value = 1
  fetchList()
}

const handleReset = () => {
  keyword.value = ''
  categoryId.value = null
  currentPage.value = 1
  fetchList()
}

onMounted(() => {
  fetchList()
  loadCategories()
})
</script>

<style scoped>
.history-page {
  padding: 24px 0 60px;
  background: var(--bg-base);
  min-height: calc(100vh - 60px);
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  margin-bottom: 32px;
}

.filter-bar {
  margin-bottom: 20px;
  padding: 18px 20px;
  background: #fff;
  border-radius: var(--border-radius-base);
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
  margin-bottom: 30px;
}

.product-card {
  position: relative;
  background: var(--bg-white);
  border-radius: var(--border-radius-base);
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
  cursor: pointer;
}

.product-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14);
  transform: translateY(-2px);
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s;
}

.product-card:hover .delete-btn {
  opacity: 1;
}

.img-container {
  position: relative;
  width: 100%;
  height: 200px;
}

.product-img {
  width: 100%;
  height: 100%;
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
}

.product-name {
  font-size: 13px;
  color: var(--text-primary);
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
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

.view-time {
  font-size: 11px;
  color: var(--text-secondary);
  margin: 4px 0 0;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
  
  .product-img {
    height: 160px;
  }
}
</style>
