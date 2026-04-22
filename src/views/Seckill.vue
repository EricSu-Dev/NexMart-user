<template>
  <div class="seckill-page">
    <div class="container">
      <el-breadcrumb separator="/" class="seckill-breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>限时秒杀</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="tab-bar">
        <div
          :class="['tab-item', { active: activeTab === 'product' }]"
          @click="switchTab('product')"
        >
          <el-icon><Goods /></el-icon>
          <span>商品秒杀</span>
        </div>
        <div
          :class="['tab-item', { active: activeTab === 'coupon' }]"
          @click="switchTab('coupon')"
        >
          <el-icon><Ticket /></el-icon>
          <span>券秒杀</span>
        </div>
      </div>

      <div class="activity-banner" v-if="currentActivity">
        <div class="banner-bg"></div>
        <div class="banner-content">
          <div class="banner-left">
            <h2 class="banner-title">{{ currentActivity.name }}</h2>
            <div class="banner-status" v-if="currentActivity.phase === 2">
              <span class="status-label">抢购中</span>
              <span class="countdown-label">距结束</span>
              <div class="countdown-boxes">
                <span class="countdown-box">{{ countdown.days }}</span>
                <span class="countdown-sep">天</span>
                <span class="countdown-box">{{ countdown.hours }}</span>
                <span class="countdown-sep">:</span>
                <span class="countdown-box">{{ countdown.minutes }}</span>
                <span class="countdown-sep">:</span>
                <span class="countdown-box">{{ countdown.seconds }}</span>
              </div>
            </div>
            <div class="banner-status" v-else-if="currentActivity.phase === 1">
              <span class="status-label status-upcoming">即将开始</span>
              <span class="countdown-label">距开始</span>
              <div class="countdown-boxes">
                <span class="countdown-box">{{ countdown.days }}</span>
                <span class="countdown-sep">天</span>
                <span class="countdown-box">{{ countdown.hours }}</span>
                <span class="countdown-sep">:</span>
                <span class="countdown-box">{{ countdown.minutes }}</span>
                <span class="countdown-sep">:</span>
                <span class="countdown-box">{{ countdown.seconds }}</span>
              </div>
            </div>
            <div class="banner-status" v-else>
              <span class="status-label status-ended">已结束</span>
            </div>
          </div>
        </div>
        <div class="activity-tabs" v-if="activityList.length > 1">
          <div
            v-for="act in activityList"
            :key="act.id"
            :class="['activity-tab-item', {
              'is-active': selectedActivityId === act.id,
              'is-ended': act.phase === 3,
            }]"
            @click="onActivityChange(act.id, $event)"
          >
            <div class="act-status-indicator">
              <span class="act-status-dot" :class="statusDotClass(act.phase)"></span>
              <span class="act-name">{{ act.name }}</span>
            </div>
            <span class="act-status-badge" :class="statusBadgeClass(act.phase)">
              {{ statusLabel(act.phase) }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'product'" class="address-bar card">
        <div class="address-bar-header">
          <h3><el-icon><Location /></el-icon> 收货地址</h3>
          <el-button v-if="addressList.length > 0" link type="primary" @click="showAddressDialog = true">切换地址</el-button>
        </div>
        <div v-if="selectedAddressId" class="selected-address-compact">
          <span class="addr-name">{{ selectedAddressInfo?.receiverName }}</span>
          <span class="addr-phone">{{ selectedAddressInfo?.receiverPhone }}</span>
          <span class="addr-detail">{{ selectedAddressInfo?.province }}{{ selectedAddressInfo?.city }}{{ selectedAddressInfo?.district }}{{ selectedAddressInfo?.detailAddress }}</span>
        </div>
        <div v-else class="no-address-hint">
          <span>请先选择收货地址</span>
          <el-button type="primary" size="small" @click="showAddressDialog = true">选择地址</el-button>
        </div>
      </div>

      <div class="items-section" v-loading="itemsLoading">
        <template v-if="activeTab === 'product'">
          <div v-if="productItems.length === 0 && !itemsLoading" class="empty-hint">
            <el-empty description="暂无商品秒杀活动" />
          </div>
          <div class="product-grid">
            <div
              v-for="item in productItems"
              :key="item.id"
              :class="['product-card', { 'card-sold-out': isProductSoldOut(item), 'card-purchased': item.purchased }]"
            >
              <div class="product-img">
                <div class="discount-tag" v-if="item.originalPrice && item.seckillPrice < item.originalPrice">
                  {{ formatDiscount(item.seckillPrice / item.originalPrice) }}折
                </div>
                <el-image :src="item.productImage" fit="cover" style="width:100%;height:100%;">
                  <template #error><div class="img-fallback"><el-icon :size="32"><Picture /></el-icon></div></template>
                </el-image>
                <div v-if="item.purchased" class="card-mask"><span>已抢到</span></div>
                <div v-else-if="isProductSoldOut(item)" class="card-mask"><span>已抢光</span></div>
              </div>
              <div class="product-body">
                <h4 class="product-name" :title="item.productName">{{ item.productName }}</h4>
                <div class="price-row">
                  <span class="seckill-price">{{ item.seckillPrice }}</span>
                  <span class="original-price" v-if="item.originalPrice">¥{{ item.originalPrice }}</span>
                  <div class="stock-display">
                    <span class="stock-text stock-available" v-if="item.seckillStock > 0">仅剩 {{ item.seckillStock }} 件</span>
                    <span class="stock-text stock-empty" v-else>已抢光</span>
                  </div>
                </div>
                <div class="per-limit-info" v-if="item.perLimit">
                  <el-icon><Warning /></el-icon>
                  <span>每人限购 {{ item.perLimit }} 件</span>
                </div>
                <div class="spec-section" v-if="item.specName">
                  <div class="spec-label">规格：</div>
                  <div class="spec-value-tag">{{ item.specName }}</div>
                </div>
                <el-button
                  type="primary"
                  class="buy-btn"
                  :disabled="item.purchased || isProductSoldOut(item) || submitting"
                  :loading="submittingItemId === item.id"
                  @click="handleBuyProduct(item)"
                >
                  {{ item.purchased ? '已抢到' : (isProductSoldOut(item) ? '已抢光' : '立即抢购') }}
                </el-button>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div v-if="couponItems.length === 0 && !itemsLoading" class="empty-hint">
            <el-empty description="暂无券秒杀活动" />
          </div>
          <div class="coupon-grid">
            <div
              v-for="item in couponItems"
              :key="item.id"
              :class="['coupon-card', { 'is-disabled': item.purchased || isCouponSoldOut(item) }]"
            >
              <!-- 左侧：主要金额/折扣 -->
              <div class="coupon-left">
                <div class="value-box">
                  <template v-if="item.couponDiscountType === 1"> <!-- 满减 -->
                    <span class="unit">¥</span>
                    <span class="value">{{ item.couponDiscountAmount }}</span>
                  </template>
                  <template v-else-if="item.couponDiscountType === 2"> <!-- 折扣 -->
                    <span class="value">{{ formatDiscount(item.couponDiscountRate) }}</span>
                    <span class="unit">折</span>
                  </template>
                  <template v-else-if="item.couponDiscountType === 3"> <!-- 无门槛 -->
                    <span class="unit">¥</span>
                    <span class="value">{{ item.couponDiscountAmount }}</span>
                  </template>
                </div>
                <div class="condition">
                  {{ item.couponDiscountType === 1 ? `满${item.couponMinAmount || 0}元可用` : (item.couponDiscountType === 2 ? '折扣券' : '无门槛') }}
                </div>
                <div class="stock-info left-stock">
                  {{ item.couponRemained >= 100000000 ? '不限量' : '剩余 ' + item.couponRemained + ' 张' }}
                </div>
              </div>

              <!-- 中间：详细信息 -->
              <div class="coupon-info">
                <h3 class="name">{{ item.couponName }}</h3>
                <p class="scope">适用范围：{{ item.couponScope === 1 ? '全场通用' : (item.couponScopeName || '全场通用') }}</p>
                <p class="expiry">截止时间：{{ formatDate(item.couponReceiveEnd) }}</p>
                <p class="limit">每人限领：{{ item.couponPerLimit }}张</p>
              </div>

              <!-- 右侧：按钮或印章 -->
              <div class="coupon-action">
                <template v-if="!item.purchased && !isCouponSoldOut(item)">
                  <el-button
                    type="primary"
                    round
                    :loading="submittingItemId === item.id"
                    @click="handleBuyCoupon(item)"
                  >
                    立即抢购
                  </el-button>
                </template>
                <template v-else>
                  <div :class="['stamp', item.purchased ? 'received' : 'sold-out']">
                    {{ item.purchased ? '已抢到' : '已抢光' }}
                  </div>
                </template>
              </div>
              
              <div class="decoration line"></div>
              <div class="decoration circle top"></div>
              <div class="decoration circle bottom"></div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <el-dialog v-model="showAddressDialog" title="选择收货地址" width="650px">
      <div class="address-dialog-content">
        <div v-if="!showAddAddressForm" class="address-selector">
          <div
            v-for="addr in addressList"
            :key="addr.id"
            class="addr-item"
            :class="{ active: selectedAddressId === addr.id }"
          >
            <div class="addr-item-main" @click="selectAddress(addr)">
              <div class="addr-item-header">
                <span class="name">{{ addr.receiverName }}</span>
                <span class="phone">{{ addr.receiverPhone }}</span>
                <el-tag v-if="addr.isDefault" size="small" type="danger">默认</el-tag>
              </div>
              <div class="addr-item-content">
                {{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detailAddress }}
              </div>
            </div>
            <div class="addr-item-actions" @click.stop>
              <el-button v-if="!addr.isDefault" link type="primary" size="small" @click="handleSetDefault(addr.id)">设为默认</el-button>
              <el-button link type="primary" size="small" @click="handleEditAddress(addr)">编辑</el-button>
              <el-popconfirm title="确定删除该地址吗？" @confirm="handleDeleteAddress(addr.id)" confirm-button-text="确定" cancel-button-text="取消">
                <template #reference>
                  <el-button link type="danger" size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>

          <div class="add-address-btn" @click="openAddForm">
            <el-icon :size="20"><Plus /></el-icon>
            <span>添加新地址</span>
          </div>
        </div>

        <div v-else class="add-address-form">
          <el-form ref="addrFormRef" :model="addrForm" :rules="addrRules" label-width="80px" size="default">
            <el-form-item label="收货人" prop="receiverName">
              <el-input v-model="addrForm.receiverName" placeholder="请输入收货人姓名" />
            </el-form-item>
            <el-form-item label="手机号" prop="receiverPhone">
              <el-input v-model="addrForm.receiverPhone" placeholder="请输入手机号" maxlength="11" />
            </el-form-item>
            <el-form-item label="所在地区" prop="province">
              <el-cascader
                v-model="selectedRegion"
                :options="regionOptions"
                placeholder="请选择省/市/区"
                style="width: 100%"
                filterable
                clearable
                @change="handleAreaChange"
              />
            </el-form-item>
            <el-form-item label="详细地址" prop="detailAddress">
              <el-input v-model="addrForm.detailAddress" type="textarea" :rows="2" placeholder="请输入详细地址（街道、门牌号等）" />
            </el-form-item>
            <el-form-item label="设为默认">
              <el-switch v-model="addrForm.isDefault" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <template v-if="!showAddAddressForm">
          <el-button @click="showAddressDialog = false">取消</el-button>
          <el-button type="primary" @click="showAddressDialog = false">确定</el-button>
        </template>
        <template v-else>
          <el-button @click="cancelAddAddress">返回列表</el-button>
          <el-button type="primary" :loading="savingAddress" @click="saveNewAddress">{{ isEditingAddr ? '保存修改' : '保存地址' }}</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Goods, Ticket, Location, Plus, Picture, Warning } from '@element-plus/icons-vue'
import { seckillApi } from '@/api/seckill'
import { addressApi } from '@/api/address'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pcaTextArr } from 'element-china-area-data'
import dayjs from 'dayjs'

const router = useRouter()

const activeTab = ref('product')
const activityList = ref([])
const selectedActivityId = ref(null)
const productItems = ref([])
const couponItems = ref([])
const itemsLoading = ref(false)
const submitting = ref(false)
const submittingItemId = ref(null)

const addressList = ref([])
const selectedAddressId = ref(null)
const showAddressDialog = ref(false)
const showAddAddressForm = ref(false)
const addrFormRef = ref()
const savingAddress = ref(false)
const selectedRegion = ref([])
const isEditingAddr = ref(false)
const regionOptions = pcaTextArr

const addrForm = ref({
  receiverName: '',
  receiverPhone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  isDefault: 0
})

const addrRules = {
  receiverName: [{ required: true, message: '请输入收货人', trigger: 'blur' }],
  receiverPhone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  province: [{
    validator: (rule, value, callback) => {
      if (selectedRegion.value.length === 0) {
        callback(new Error('请选择所在地区'))
      } else {
        callback()
      }
    },
    trigger: 'change'
  }],
  detailAddress: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

const countdown = reactive({ days: '00', hours: '00', minutes: '00', seconds: '00' })
let countdownTimer = null

const currentActivity = computed(() => {
  return activityList.value.find(a => a.id === selectedActivityId.value) || null
})

const selectedAddressInfo = computed(() => {
  return addressList.value.find(a => a.id === selectedAddressId.value) || null
})

const productStockPercent = (item) => {
  if (!item.seckillStock && item.seckillStock !== 0) return 100
  return 100 // Simplified since we are using individual items
}

const isProductSoldOut = (item) => {
  return item.seckillStock <= 0
}

const couponStockPercent = (item) => {
  if (!item.couponTotal || item.couponTotal === 0) return 0
  return Math.round((item.couponRemained / item.couponTotal) * 100)
}

const isCouponSoldOut = (item) => {
  return item.couponRemained <= 0
}

const formatDiscount = (rate) => {
  if (!rate || rate <= 0) return '0'
  return parseFloat((rate * 10).toFixed(2)).toString()
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

const statusLabel = (phase) => {
  if (phase === 2) return '进行中'
  if (phase === 1) return '即将开始'
  return '已结束'
}

const statusDotClass = (phase) => {
  if (phase === 2) return 'dot-active'
  if (phase === 1) return 'dot-upcoming'
  return 'dot-ended'
}

const statusBadgeClass = (phase) => {
  if (phase === 2) return 'badge-active'
  if (phase === 1) return 'badge-upcoming'
  return 'badge-ended'
}

const startCountdown = () => {
  if (countdownTimer) clearInterval(countdownTimer)
  const updateCountdown = () => {
    const act = currentActivity.value
    if (!act) return
    let targetTime
    if (act.phase === 2) {
      targetTime = new Date(act.endTime).getTime()
    } else if (act.phase === 1) {
      targetTime = new Date(act.startTime).getTime()
    } else {
      countdown.days = '00'
      countdown.hours = '00'
      countdown.minutes = '00'
      countdown.seconds = '00'
      return
    }
    const now = Date.now()
    let diff = Math.max(0, targetTime - now)
    const d = Math.floor(diff / 86400000)
    diff %= 86400000
    const h = Math.floor(diff / 3600000)
    diff %= 3600000
    const m = Math.floor(diff / 60000)
    diff %= 60000
    const s = Math.floor(diff / 1000)
    countdown.days = String(d).padStart(2, '0')
    countdown.hours = String(h).padStart(2, '0')
    countdown.minutes = String(m).padStart(2, '0')
    countdown.seconds = String(s).padStart(2, '0')
  }
  updateCountdown()
  countdownTimer = setInterval(updateCountdown, 1000)
}

const loadActivities = async () => {
  try {
    const typeMap = { product: 1, coupon: 2 }
    const res = await seckillApi.getActivityList(typeMap[activeTab.value])
    activityList.value = (res.data || []).sort((a, b) => a.phase - b.phase)
    if (activityList.value.length > 0) {
      const activeAct = activityList.value.find(a => a.phase === 2) || activityList.value[0]
      selectedActivityId.value = activeAct.id
      startCountdown()
      await loadItems()
    } else {
      selectedActivityId.value = null
      productItems.value = []
      couponItems.value = []
    }
  } catch (error) {
    console.error('加载活动列表失败:', error)
  }
}

const onActivityChange = (id, event) => {
  selectedActivityId.value = id
  if (event && event.currentTarget) {
    event.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }
  startCountdown()
  loadItems()
}

const switchTab = (tab) => {
  if (activeTab.value === tab) return
  activeTab.value = tab
  productItems.value = []
  couponItems.value = []
  loadActivities()
}

const loadItems = async () => {
  if (!selectedActivityId.value) return
  itemsLoading.value = true
  try {
    if (activeTab.value === 'product') {
      const res = await seckillApi.getProductItems(selectedActivityId.value)
      productItems.value = res.data || []
    } else {
      const res = await seckillApi.getCouponItems(selectedActivityId.value)
      couponItems.value = res.data || []
    }
  } catch (error) {
    console.error('加载秒杀项失败:', error)
  } finally {
    itemsLoading.value = false
  }
}

const handleBuyProduct = async (item) => {
  if (item.purchased || isProductSoldOut(item)) return

  if (!selectedAddressId.value) {
    ElMessage.warning('请先选择收货地址')
    showAddressDialog.value = true
    return
  }

  submitting.value = true
  submittingItemId.value = item.id
  try {
    const data = {
      seckillItemId: item.id,
      addressId: selectedAddressId.value
    }
    await seckillApi.createProductOrder(data)
    ElMessage.success('抢购请求已提交，排队中...')
  } catch (error) {
    console.error('抢购失败:', error)
  } finally {
    submitting.value = false
    submittingItemId.value = null
  }
}

const handleBuyCoupon = async (item) => {
  if (item.purchased || isCouponSoldOut(item)) return

  submitting.value = true
  submittingItemId.value = item.id
  try {
    await seckillApi.createCouponOrder(item.id)
    ElMessage.success('抢券请求已提交，排队中...')
  } catch (error) {
    console.error('抢券失败:', error)
  } finally {
    submitting.value = false
    submittingItemId.value = null
  }
}

const loadAddresses = async () => {
  try {
    const res = await addressApi.list()
    addressList.value = res.data || []
    if (addressList.value.length > 0) {
      const defaultAddr = addressList.value.find(a => a.isDefault) || addressList.value[0]
      selectAddress(defaultAddr)
    }
  } catch (error) {
    console.error('加载地址失败:', error)
  }
}

const selectAddress = (addr) => {
  selectedAddressId.value = addr.id
}

const handleAreaChange = (value) => {
  if (value && value.length === 3) {
    addrForm.value.province = value[0]
    addrForm.value.city = value[1]
    addrForm.value.district = value[2]
  } else {
    addrForm.value.province = ''
    addrForm.value.city = ''
    addrForm.value.district = ''
  }
}

const openAddForm = () => {
  isEditingAddr.value = false
  resetAddrForm()
  showAddAddressForm.value = true
}

const handleEditAddress = (addr) => {
  isEditingAddr.value = true
  addrForm.value = {
    id: addr.id,
    receiverName: addr.receiverName,
    receiverPhone: addr.receiverPhone,
    province: addr.province,
    city: addr.city,
    district: addr.district,
    detailAddress: addr.detailAddress,
    isDefault: addr.isDefault || 0
  }
  selectedRegion.value = [addr.province, addr.city, addr.district].filter(Boolean)
  showAddAddressForm.value = true
}

const handleDeleteAddress = async (id) => {
  try {
    await addressApi.remove(id)
    ElMessage.success('删除成功')
    if (selectedAddressId.value === id) {
      selectedAddressId.value = null
    }
    await loadAddresses()
  } catch (error) {
    console.error('删除地址失败:', error)
    ElMessage.error('删除失败')
  }
}

const handleSetDefault = async (id) => {
  try {
    await addressApi.setDefault(id)
    ElMessage.success('已设为默认地址')
    await loadAddresses()
  } catch (error) {
    console.error('设置默认地址失败:', error)
    ElMessage.error('设置失败')
  }
}

const cancelAddAddress = () => {
  showAddAddressForm.value = false
  isEditingAddr.value = false
  resetAddrForm()
}

const resetAddrForm = () => {
  addrForm.value = {
    receiverName: '',
    receiverPhone: '',
    province: '',
    city: '',
    district: '',
    detailAddress: '',
    isDefault: 0
  }
  selectedRegion.value = []
}

const saveNewAddress = async () => {
  try {
    await addrFormRef.value.validate()
  } catch (err) {
    return
  }

  savingAddress.value = true
  try {
    const addressData = {
      ...addrForm.value,
      province: selectedRegion.value[0] || addrForm.value.province || '',
      city: selectedRegion.value[1] || addrForm.value.city || '',
      district: selectedRegion.value[2] || addrForm.value.district || ''
    }

    if (isEditingAddr.value) {
      await addressApi.update(addressData)
      ElMessage.success('修改成功')
    } else {
      await addressApi.add(addressData)
      ElMessage.success('地址保存成功')
    }

    await loadAddresses()

    if (isEditingAddr.value && addrForm.value.id) {
      selectAddress(addressList.value.find(a => a.id === addrForm.value.id))
    }

    showAddAddressForm.value = false
    isEditingAddr.value = false
    resetAddrForm()
  } catch (error) {
    console.error('保存地址失败:', error)
    ElMessage.error('保存地址失败')
  } finally {
    savingAddress.value = false
  }
}

const handleSeckillResult = (e) => {
  if (e.detail && e.detail.success === true) {
    loadItems()
  }
}

onMounted(() => {
  loadActivities()
  loadAddresses()
  window.addEventListener('seckill-result', handleSeckillResult)
})

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  window.removeEventListener('seckill-result', handleSeckillResult)
})
</script>

<style scoped>
.seckill-page { padding: 24px 0; min-height: 100vh; background: #f5f5f5; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

.seckill-breadcrumb { margin-bottom: 24px; font-size: 16px; }

.activity-banner {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  min-height: 120px;
}
.banner-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #ff4757, #ff6b35);
  z-index: 0;
}
.banner-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 32px;
  color: #fff;
}
.banner-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 12px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.banner-status {
  display: flex;
  align-items: center;
  gap: 12px;
}
.status-label {
  background: rgba(255,255,255,0.25);
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}
.status-upcoming { background: rgba(255,255,255,0.15); }
.status-ended { background: rgba(0,0,0,0.2); }
.countdown-label { font-size: 14px; opacity: 0.9; }
.countdown-boxes {
  display: flex;
  align-items: center;
  gap: 4px;
}
.countdown-box {
  background: rgba(0,0,0,0.35);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 20px;
  font-weight: 700;
  min-width: 36px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.countdown-sep {
  font-size: 18px;
  font-weight: 700;
  opacity: 0.8;
}
.activity-tabs {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding: 0 32px 20px;
  scrollbar-width: none; /* Firefox */
  mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
}
.activity-tabs::-webkit-scrollbar { display: none; } /* Safari and Chrome */

.activity-tab-item {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 180px;
}

.activity-tab-item:active:not(.is-ended) {
  transform: scale(0.96);
}

.activity-tab-item.is-active {
  background: #fff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  border-color: #fff;
}

.activity-tab-item.is-active .act-name {
  color: #1a1a1a;
}

.activity-tab-item.is-ended {
  opacity: 0.6;
  cursor: not-allowed;
  background: rgba(0, 0, 0, 0.1);
}

.act-status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.act-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: relative;
}

.dot-active {
  background: #52c41a;
  box-shadow: 0 0 8px #52c41a;
}

.dot-active::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 2px solid #52c41a;
  animation: pulse 1.5s infinite;
}

.dot-upcoming { background: #faad14; }
.dot-ended { background: #bfbfbf; }

.act-name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.act-status-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  text-transform: uppercase;
}

.badge-active { color: #52c41a; background: rgba(82, 196, 26, 0.15); }
.badge-upcoming { color: #faad14; background: rgba(250, 173, 20, 0.15); }
.badge-ended { color: #8c8c8c; background: rgba(0, 0, 0, 0.1); }

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2); opacity: 0; }
}

.tab-bar {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #606266;
  cursor: pointer;
  transition: all 0.25s;
  border-bottom: 3px solid transparent;
}
.tab-item:hover { color: #ff4757; background: #fff5f5; }
.tab-item.active {
  color: #ff4757;
  border-bottom-color: #ff4757;
  background: linear-gradient(180deg, #fff5f5, #fff);
}

.card {
  background: #fff;
  border-radius: 10px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.address-bar h3 {
  font-size: 16px;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.address-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.selected-address-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fdf6ec;
  border: 1px dashed #e6a23c;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
}
.addr-name { font-weight: 700; color: #303133; }
.addr-phone { color: #606266; }
.addr-detail { color: #606266; flex: 1; }
.no-address-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fef0f0;
  border: 1px dashed #f56c6c;
  border-radius: 8px;
  color: #f56c6c;
  font-size: 14px;
}

.items-section { min-height: 200px; }

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}
@media (max-width: 992px) {
  .product-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
}
@media (max-width: 576px) {
  .product-grid { grid-template-columns: 1fr; gap: 16px; }
}
.product-card {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
}
.product-card:hover:not(.card-sold-out):not(.card-purchased) {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(255,71,87,0.12);
  border-color: rgba(255,107,53,0.2);
}
.product-card.card-sold-out,
.product-card.card-purchased {
  filter: grayscale(0.8);
  opacity: 0.85;
}
.product-img {
  position: relative;
  margin: 12px 12px 0;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 12px;
}
.product-img .discount-tag {
  position: absolute;
  top: 15px;
  left: 15px;
  background: linear-gradient(135deg, #ff4757, #ff6b35);
  color: #fff;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 800;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
}
.img-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  color: #cbd5e1;
}
.card-mask {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  backdrop-filter: blur(3px);
}
.card-mask span {
  background: rgba(255,255,255,0.9);
  color: #1e293b;
  padding: 10px 28px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 1px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
}
.product-body {
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.product-name {
  font-size: 17px;
  color: #1e293b;
  margin: 0 0 4px;
  font-weight: 700;
  line-height: 1.5;
  height: 51px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.price-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.seckill-price {
  font-size: 32px;
  font-weight: 900;
  color: #ff4757;
  letter-spacing: -0.5px;
}
.seckill-price::before {
  content: '¥';
  font-size: 18px;
  margin-right: 2px;
  font-weight: 700;
}
.original-price {
  font-size: 15px;
  color: #94a3b8;
  text-decoration: line-through;
  opacity: 0.8;
}
.stock-display {
}
.stock-text {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
}
.stock-available {
  color: #ff4757;
  background: #fff5f5;
  border: 1px solid rgba(255, 71, 87, 0.1);
}
.stock-empty {
  color: #94a3b8;
  background: #f1f5f9;
}
.per-limit-info {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 16px;
  background: rgba(241, 245, 249, 0.6);
  padding: 4px 10px;
  border-radius: 8px;
}
.per-limit-info .el-icon {
  color: #f59e0b;
}
.spec-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}
.spec-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}
.spec-value-tag {
  font-size: 13px;
  color: #1e293b;
  font-weight: 700;
  background: #f8fafc;
  padding: 2px 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}
.buy-btn {
  width: 100%;
  background: linear-gradient(135deg, #ff4757, #ff6b35);
  border: none;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 1px;
  height: 50px;
  border-radius: 25px;
  box-shadow: 0 8px 16px rgba(255, 71, 87, 0.2);
  transition: all 0.3s;
  margin-top: auto;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.buy-btn:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 24px rgba(255, 71, 87, 0.3);
  background: linear-gradient(135deg, #ff5c6c, #ff7e4a);
}
.buy-btn:active:not(:disabled) {
  transform: translateY(-1px) scale(0.98);
}
.buy-btn:disabled {
  background: #e2e8f0 !important;
  color: #94a3b8;
  box-shadow: none;
  cursor: not-allowed;
}

.coupon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 30px;
  margin-top: 20px;
}

/* 券卡片样式 */
.coupon-card {
  position: relative;
  display: flex;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  height: 170px;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.coupon-card:hover:not(.is-disabled) {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
}

.coupon-left {
  width: 170px;
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  flex-shrink: 0;
  position: relative;
}

.coupon-left::after {
  content: '';
  position: absolute;
  right: -1px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-image: linear-gradient(to bottom, #fff 50%, transparent 50%);
  background-size: 1px 12px;
  background-repeat: repeat-y;
  opacity: 0.3;
}

.value-box {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
}

.value-box .unit {
  font-size: 18px;
  font-weight: 600;
}

.value-box .value {
  font-size: 40px;
  font-weight: 800;
  margin: 0 2px;
}

.condition {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.left-stock {
  font-size: 11px;
  opacity: 0.75;
  background: rgba(255, 255, 255, 0.15);
  padding: 1px 8px;
  border-radius: 10px;
  margin-top: 4px;
}

.coupon-info {
  flex: 1;
  padding: 20px 10px 20px 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  min-width: 0;
}

.name {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 10px;
  color: #303133;
}

.scope, .expiry, .limit {
  font-size: 13px;
  color: #909399;
  margin: 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scope {
  line-height: 1.4;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
}

.coupon-action {
  width: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.coupon-action :deep(.el-button--primary) {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  border: none;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
}

.coupon-action :deep(.el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 77, 79, 0.3);
  opacity: 0.9;
}

/* 印章样式 */
.stamp {
  font-size: 14px;
  font-weight: 800;
  border: 2px solid;
  padding: 4px 8px;
  transform: rotate(-15deg);
  border-radius: 4px;
  text-transform: uppercase;
  user-select: none;
}

.stamp.received { border-color: #409eff; color: #409eff; }
.stamp.sold-out { border-color: #ffa39e; color: #f5222d; }

/* 装饰物 */
.decoration.line {
  position: absolute;
  left: 170px;
  top: 10px;
  bottom: 10px;
  border-left: 2px dashed #f0f0f0;
  z-index: 1;
}

.decoration.circle {
  position: absolute;
  left: 162px;
  width: 16px;
  height: 16px;
  background: #f5f5f5;
  border-radius: 50%;
  z-index: 2;
}

.decoration.circle.top {
  top: -8px;
}

.decoration.circle.bottom {
  bottom: -8px;
}

/* 禁用/已领取状态灰度 */
.coupon-card.is-disabled {
  filter: grayscale(1);
  opacity: 0.7;
}

.coupon-card.is-disabled .coupon-left {
  background: #d9d9d9;
}

.coupon-card.is-disabled .name,
.coupon-card.is-disabled .value,
.coupon-card.is-disabled .unit {
  color: #8c8c8c;
}

.empty-hint {
  padding: 60px 0;
}

.address-selector { max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
.add-address-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  color: #409eff;
  font-size: 14px;
  transition: all 0.2s;
}
.add-address-btn:hover { border-color: #409eff; background: #ecf5ff; }
.add-address-form { max-height: 450px; overflow-y: auto; }
.addr-item {
  border: 1px solid #ebeef5; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: flex-start;
}
.addr-item:hover { border-color: #409eff; background: #ecf5ff; }
.addr-item.active { border-color: #409eff; background: #ecf5ff; position: relative; }
.addr-item.active::after {
  content: "√"; position: absolute; right: 0; bottom: 0;
  width: 24px; height: 24px; background: #409eff; color: #fff;
  border-radius: 8px 0 8px 0; display: flex; align-items: center; justify-content: center; font-size: 12px;
}
.addr-item-main { flex: 1; }
.addr-item-actions {
  display: flex; gap: 4px; align-items: center; padding-left: 12px;
  opacity: 0; transition: opacity 0.2s;
}
.addr-item:hover .addr-item-actions { opacity: 1; }
.addr-item-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.addr-item-header .name { font-weight: 700; color: #303133; }
.addr-item-header .phone { color: #606266; font-size: 14px; }
.addr-item-content { font-size: 13px; color: #606266; line-height: 1.4; }
</style>
