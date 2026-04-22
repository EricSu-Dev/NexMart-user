<template>
  <div class="cart-page">
    <div class="page-container">
      <h2 class="page-title">购物车</h2>

      <div v-loading="loading">
        <template v-if="cartItems.length > 0">
          <!-- 购物车列表 -->
          <div class="cart-list">
            <div class="list-header">
              <div class="col-check">
                <el-checkbox :model-value="checkAll" @change="toggleAll" />
                <span class="label">全选</span>
              </div>
              <div class="col-info">商品信息</div>
              <div class="col-price">单价</div>
              <div class="col-qty">数量</div>
              <div class="col-subtotal">小计</div>
              <div class="col-action">操作</div>
            </div>

            <div v-for="item in cartItems" :key="item.id" class="cart-item">
              <div class="col-check">
                <el-checkbox v-model="item.checked" />
              </div>
              <div class="col-info">
                <el-image
                  :src="item.coverUrl"
                  fit="cover"
                  class="item-img"
                  @click="$router.push(`/product/${item.productId}`)"
                />
                <div class="item-detail">
                  <div class="name-row">
                    <p class="item-name" @click="$router.push(`/product/${item.productId}`)">
                      {{ item.productName }}
                    </p>
                    <el-tag v-if="item.promotionName" type="danger" size="small" effect="light" class="promotion-tag">
                      {{ item.promotionName }}
                    </el-tag>
                  </div>
                  <p class="item-spec" v-if="item.specName">规格：{{ item.specName }}</p>
                </div>
              </div>
              <div class="col-price">
                <template v-if="item.promotionName && item.discountedPrice">
                  <p class="discounted-price">¥{{ item.discountedPrice }}</p>
                  <p class="original-price">¥{{ item.price }}</p>
                </template>
                <template v-else>¥{{ item.price }}</template>
              </div>
              <div class="col-qty">
                <el-input-number
                  v-model="item.quantity"
                  :min="1"
                  :max="item.stock"
                  size="small"
                  @change="(val) => updateQuantity(item, val)"
                />
              </div>
              <div class="col-subtotal">
                <template v-if="item.promotionName && item.discountedAmount">
                  <p class="discounted-subtotal">¥{{ item.discountedAmount }}</p>
                  <p class="original-subtotal">¥{{ item.subtotal }}</p>
                </template>
                <template v-else>¥{{ item.subtotal }}</template>
              </div>
              <div class="col-action">
                <el-button
                  type="danger"
                  link
                  :icon="Delete"
                  @click="removeItem(item.id)"
                >删除</el-button>
              </div>
            </div>
          </div>

          <!-- 底部结算栏 -->
          <div class="checkout-bar">
            <div class="bar-left">
              <el-checkbox :model-value="checkAll" @change="toggleAll">全选</el-checkbox>
              <el-button type="danger" link @click="removeChecked">删除选中商品</el-button>
              <span class="selected-info">
                已选择 <strong>{{ checkedItems.length }}</strong> 件商品
              </span>
            </div>
            <div class="bar-right">
              <div class="price-summary">
                <span class="label">合计:</span>
                <div class="price-container">
                <span class="total-price">¥{{ totalPrice }}</span>
                <span v-if="totalPrice !== originalTotalPrice" class="original-total-price">¥{{ originalTotalPrice }}</span>
              </div>
              </div>
              <el-button
                type="primary"
                size="large"
                class="checkout-btn"
                :disabled="checkedItems.length === 0"
                @click="goCheckout"
              >去结算</el-button>
            </div>
          </div>
        </template>

        <!-- 空状态 -->
        <el-empty v-else description="您的购物车还没有商品">
          <el-button type="primary" size="large" @click="$router.push('/')">立即去购物</el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { cartApi } from '@/api/cart'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const loading = ref(false)
const cartItems = ref([])
const userStore = useUserStore()

const checkedItems = computed(() => cartItems.value.filter(i => i.checked))

const checkAll = computed(() => 
  cartItems.value.length > 0 && cartItems.value.every(i => i.checked)
)

const totalPrice = computed(() =>
  checkedItems.value.reduce((sum, i) => sum + Number(i.discountedAmount || i.subtotal), 0).toFixed(2)
)

const originalTotalPrice = computed(() =>
  checkedItems.value.reduce((sum, i) => sum + Number(i.subtotal), 0).toFixed(2)
)

const toggleAll = (val) => {
  cartItems.value.forEach(i => i.checked = val)
}

const loadCart = async () => {
  loading.value = true
  try {
    const res = await cartApi.getList()
    // Initialize checked status to false
    cartItems.value = (res.data || []).map(i => ({ ...i, checked: false }))
  } catch (error) {
    ElMessage.error({ message: '获取购物车列表失败', duration: 1500 })
  } finally {
    loading.value = false
  }
}

const updateQuantity = async (item, val) => {
  try {
    await cartApi.update(item.id, val)
    // 1. 更新原始小计 (始终使用原价)
    item.subtotal = (Number(item.price) * val).toFixed(2)
    // 2. 更新折后小计 (如果存在活动价)
    if (item.discountedPrice) {
      item.discountedAmount = (Number(item.discountedPrice) * val).toFixed(2)
    }
    userStore.loadCartCount()
  } catch (error) {
    console.error('更新数量失败:', error)
    // 失败时回滚或刷新
    loadCart()
  }
}

const removeItem = async (id) => {
  try {
    await ElMessageBox.confirm('确定将该商品从购物车中移除吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await cartApi.remove(id)
    cartItems.value = cartItems.value.filter(i => i.id !== id)
    userStore.loadCartCount()
    ElMessage.success({ message: '已移除商品', duration: 1500, offset: 80 })
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error({ message: '删除失败', duration: 1500 })
    }
  }
}

const removeChecked = async () => {
  if (checkedItems.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${checkedItems.value.length} 件商品吗？`, '提示', { type: 'warning' })
    const ids = checkedItems.value.map(i => i.id)
    // The backend might not have batch delete, so we do it one by one or explain why not
    // For simplicity with existing cartApi, we loop if batch is missing
    for (const id of ids) {
      await cartApi.remove(id)
    }
    cartItems.value = cartItems.value.filter(i => !i.checked)
    userStore.loadCartCount()
    ElMessage.success({ message: '批量删除成功', duration: 1500 })
  } catch (error) {
    if (error !== 'cancel') ElMessage.error({ message: '批量删除过程中出错', duration: 1500 })
  }
}

const goCheckout = () => {
  const ids = checkedItems.value.map(i => i.id)
  router.push({ path: '/checkout', query: { ids: ids.join(',') } })
}

onMounted(() => {
  loadCart()
})
</script>

<style scoped>
.cart-page {
  padding: 40px 0 60px;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 30px;
}

/* Table Header */
.list-header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: #fdfdfd;
  border-radius: var(--border-radius-large) var(--border-radius-large) 0 0;
  border: 1px solid var(--border-color-lighter);
  font-size: 14px;
  color: var(--text-secondary);
  border-bottom: none;
}

/* Common Column Widths */
.col-check { width: 80px; }
.col-info { flex: 1; display: flex; align-items: center; gap: 16px; }
.col-price { width: 120px; text-align: center; }
.col-qty { width: 160px; text-align: center; }
.col-subtotal { width: 120px; text-align: center; }
.col-action { width: 100px; text-align: center; }

.label { margin-left: 10px; }

/* Table Content */
.cart-list {
  background: var(--bg-white);
  box-shadow: var(--box-shadow-base);
  border-radius: var(--border-radius-large);
  margin-bottom: 30px;
  overflow: hidden;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 24px;
  border: 1px solid var(--border-color-lighter);
  border-top: none;
  transition: background-color 0.2s;
}

.cart-item:hover {
  background-color: #fafbfc;
}

.item-img {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  cursor: pointer;
}

.item-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.promotion-tag {
  flex-shrink: 0;
}

.item-name {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 600;
  margin: 0;
  cursor: pointer;
  line-height: 1.4;
}
.item-name:hover { color: var(--primary-color); }

.item-spec {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0;
}

.col-price { 
  font-size: 15px; 
  color: var(--text-regular); 
  font-weight: 500;
}

.col-price .discounted-price {
  color: var(--danger-color);
  font-weight: 700;
  margin: 0;
}

.col-price .original-price {
  color: #909399;
  text-decoration: line-through;
  font-size: 13px;
  margin: 2px 0 0;
}
.col-subtotal { font-size: 16px; color: var(--danger-color); font-weight: 700;}

.col-subtotal .discounted-subtotal {
  color: var(--danger-color);
  font-weight: 700;
  margin: 0;
}

.col-subtotal .original-subtotal {
  color: #909399;
  text-decoration: line-through;
  font-size: 13px;
  margin: 2px 0 0;
}

.price-container {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.original-total-price {
  color: #909399;
  text-decoration: line-through;
  font-size: 14px;
  font-weight: normal;
}

/* Checkout Bar */
.checkout-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-white);
  padding: 20px 30px;
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-base);
  position: sticky;
  bottom: 0px;
  border: 1px solid var(--border-color-lighter);
  z-index: 10;
}

.bar-left {
  display: flex;
  align-items: center;
  gap: 24px;
  color: var(--text-regular);
}

.selected-info strong {
  color: var(--primary-color);
  font-size: 18px;
  margin: 0 4px;
}

.bar-right {
  display: flex;
  align-items: center;
  gap: 40px;
}

.price-summary {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.price-summary .label {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
}

.total-price {
  font-size: 28px;
  color: var(--danger-color);
  font-weight: 800;
}

.checkout-btn {
  width: 160px;
  height: 50px;
  font-size: 18px;
  font-weight: 700;
  border-radius: 25px;
}
</style>
