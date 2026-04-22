<template>
  <div class="checkout-page">
    <div class="container">
      <el-breadcrumb separator="/" class="checkout-breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>确认订单</el-breadcrumb-item>
      </el-breadcrumb>

      <div class="checkout-layout">
        <!-- 1. 收货信息 -->
        <div class="receiver-card card">
          <div class="card-header">
            <h3>收货信息</h3>
            <el-button v-if="addressList.length > 0" link type="primary" @click="showAddressDialog = true">切换地址</el-button>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
            <div v-if="addressList.length > 0" class="selected-address">
              <div class="addr-row">
                <span class="addr-name">{{ form.receiverName }}</span>
                <span class="addr-phone">{{ form.receiverPhone }}</span>
              </div>
              <div class="addr-detail">
                {{ form.address }}
              </div>
            </div>

            <template v-else>
              <el-form-item label="收货人" prop="receiverName">
                <el-input v-model="form.receiverName" placeholder="请输入收货人姓名" />
              </el-form-item>
              <el-form-item label="手机号" prop="receiverPhone">
                <el-input v-model="form.receiverPhone" placeholder="请输入手机号" />
              </el-form-item>
              <el-form-item label="收货地址" prop="address">
                <el-input v-model="form.address" type="textarea" :rows="2" placeholder="请输入详细地址" />
              </el-form-item>
            </template>
          </el-form>
        </div>

        <!-- 2. 商品清单 -->
        <div class="order-items card">
          <h3>商品清单</h3>
          <div v-for="item in orderItems" :key="item.id" class="order-item">
            <el-image :src="item.coverUrl" fit="cover"
              style="width:64px;height:64px;border-radius:6px;flex-shrink:0" />
            <div class="item-info">
              <div class="name-row">
                <p class="item-name">{{ item.productName }}</p>
                <el-tag v-if="item.promotionName" type="danger" size="small" effect="light" class="promotion-tag">
                  {{ item.promotionName }}
                </el-tag>
                <el-tag v-if="item.seckillName" type="warning" size="small" effect="dark" class="seckill-tag">
                  {{ item.seckillName }}
                </el-tag>
              </div>
              <p class="item-meta" v-if="item.specName">规格：{{ item.specName }}</p>
              <p class="item-meta">
                <!-- 只要有活动名称或优惠价，就尝试显示折后单价 -->
                <template v-if="item.seckillPrice">
                  <span class="discounted-price">¥{{ item.seckillPrice }}</span>
                  <span class="original-price">¥{{ item.price }}</span>
                </template>
                <template v-else-if="item.promotionalPrice && Number(item.promotionalPrice) < Number(item.price)">
                  <span class="discounted-price">¥{{ item.promotionalPrice }}</span>
                  <span class="original-price">¥{{ item.price }}</span>
                </template>
                <template v-else-if="item.promotionalPrice">
                  ¥{{ item.promotionalPrice }}
                </template>
                <template v-else>¥{{ item.price }}</template>
                × {{ item.quantity }}
              </p>
            </div>
            <!-- 商品优惠券选择区域 (移动到右侧空白处) -->
            <div class="item-coupon-column">
              <div v-if="getUsableProductCouponsCount(item) > 0" class="item-coupon-entry" @click="openProductCouponDialog(item)">
                <el-icon><Ticket /></el-icon>
                <span class="coupon-text">
                  <template v-if="selectedProductCouponsMap[item.id]">
                    {{ selectedProductCouponsMap[item.id].name }}
                  </template>
                  <template v-else>可用优惠券: {{ getUsableProductCouponsCount(item) }}张</template>
                </span>
                <el-icon class="arrow"><ArrowRight /></el-icon>
              </div>
            </div>
            <div class="item-sub">
              <div class="item-price-detail">
                <div class="price-detail-row">
                  <span class="label">商品原价:</span>
                  <span class="value">¥{{ item.originalAmount }}</span>
                </div>
                <div v-if="item.promotionName && item.promotionalPrice" class="price-detail-row promo">
                  <span class="label">活动优惠:</span>
                  <span class="value">-¥{{ (Number(item.originalAmount) - Number(item.promotionalPrice * item.quantity)).toFixed(2) }}</span>
                </div>
                <!-- 商品券优惠 (终极加固匹配逻辑) -->
                <div v-if="getProductCouponDiscount(item) > 0" class="price-detail-row coupon">
                  <span class="label">商品券优惠:</span>
                  <span class="value">-¥{{ getProductCouponDiscount(item).toFixed(2) }}</span>
                </div>
                <div class="price-detail-row final">
                  <span class="label">实付金额:</span>
                  <span class="value">¥{{ 
                    (Number(item.finalAmount || (Number(item.promotionalPrice || item.price) * item.quantity)) - getProductCouponDiscount(item)).toFixed(2) 
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 优惠券选择 -->
        <div 
          :class="['coupon-card', 'card', { 'disabled-card': orderCouponDisabled }]" 
          @click="!orderCouponDisabled && availableOrderCoupons.length > 0 && openOrderCouponDialog()"
        >
          <div class="coupon-header">
            <div class="header-left">
              <el-icon><Ticket /></el-icon>
              <span>订单优惠券</span>
              <span v-if="orderCouponDisabled" class="header-disabled-hint">
                ({{ previewData.orderCouponUsableReason || '当前有活动优惠，不可使用订单券' }})
              </span>
            </div>
            <div class="header-right">
              <template v-if="orderCouponDisabled">
                <span class="no-coupon">订单券当前不可用</span>
              </template>
              <template v-else-if="orderUsableCount === 0">
                <span class="no-coupon">暂无可用订单券</span>
              </template>
              <template v-else>
                <div v-if="selectedOrderCoupon" class="selected-coupon-box" @click.stop="clearSelectedOrderCoupon">
                  <span class="coupon-name">{{ selectedOrderCoupon.name }}</span>
                  <el-icon class="close-icon"><CircleClose /></el-icon>
                </div>
                <template v-else>
                  <span class="available-count">{{ orderUsableCount }} 张可用</span>
                  <el-icon><ArrowRight /></el-icon>
                </template>
              </template>
            </div>
          </div>
        </div>

        <!-- 4. 备注 -->
        <div class="remark-card card">
          <h3>订单备注</h3>
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填，可以填写您的特殊需求" maxlength="200" show-word-limit />
        </div>

        <!-- 5. 价格汇总 & 提交 -->
        <div class="submit-section card">
          <div class="summary-info">
            <div class="summary-row">
              <span>订单原价</span>
              <span class="summary-val">¥{{ previewData.originalAmount.toFixed(2) }}</span>
            </div>
            <div v-if="Number(previewData.promotionTotalDiscount || 0) > 0" class="summary-row promo">
              <span>活动优惠</span>
              <span class="summary-val">-¥{{ Number(previewData.promotionTotalDiscount || 0).toFixed(2) }}</span>
            </div>
            <div v-if="Number(previewData.seckillDiscount || 0) > 0" class="summary-row promo seckill">
              <span>秒杀优惠</span>
              <span class="summary-val">-¥{{ Number(previewData.seckillDiscount || 0).toFixed(2) }}</span>
            </div>
            <div v-if="Number(previewData.productCouponTotalDiscount || 0) > 0" class="summary-row coupon">
              <span>商品券优惠</span>
              <span class="summary-val">-¥{{ Number(previewData.productCouponTotalDiscount || 0).toFixed(2) }}</span>
            </div>
            <div v-if="Number(previewData.orderCouponDiscount || 0) > 0" class="summary-row coupon">
              <span>订单券优惠</span>
              <span class="summary-val">-¥{{ Number(previewData.orderCouponDiscount || 0).toFixed(2) }}</span>
            </div>
            <el-divider style="margin: 12px 0;" />
            <div class="summary-row total">
              <span>实付金额</span>
              <div class="price-container">
                <span class="pay-price">¥{{ previewData.finalAmount.toFixed(2) }}</span>
              </div>
            </div>
          </div>
          <el-button
            type="primary" size="large" class="submit-btn"
            :loading="submitting" @click="submitOrder"
          >提交订单</el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="showAddressDialog" title="选择收货地址" width="650px">
      <div class="address-dialog-content">
        <!-- 地址列表 -->
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

        <!-- 添加/编辑地址表单 -->
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
          <el-button @click="cancelAddAddress">{{ isEditingAddr ? '返回列表' : '返回列表' }}</el-button>
          <el-button type="primary" :loading="savingAddress" @click="saveNewAddress">{{ isEditingAddr ? '保存修改' : '保存地址' }}</el-button>
        </template>
      </template>
    </el-dialog>

    <!-- 优惠券选择弹窗 -->
    <el-dialog v-model="showCouponDialog" :title="couponDialogMode === 'order' ? '选择订单优惠券' : '选择商品优惠券'" width="500px" custom-class="coupon-dialog">
      <div v-loading="couponLoading" class="coupon-list-container">
        <!-- 新增：不使用优惠券选项 -->
        <div 
          class="coupon-item none-item" 
          :class="{ 'active': !currentSelectedCouponId }"
          @click="handleSelectNone"
        >
          <div class="none-icon">
            <el-icon><CircleClose /></el-icon>
          </div>
          <div class="none-text">不使用优惠券</div>
        </div>

        <div 
          v-for="coupon in dialogCouponList" 
          :key="coupon.userCouponId" 
          :class="['coupon-item', { 'disabled': !coupon.usable || isOccupied(coupon), 'active': currentSelectedCouponId === coupon.userCouponId }]"
          @click="handleSelectCoupon(coupon)"
        >
          <div class="coupon-item-left">
            <div class="coupon-value">
              <template v-if="coupon.discountType === 1 || coupon.discountType === 3">
                <span class="unit">¥</span>
                <span class="num">{{ coupon.discountAmount }}</span>
              </template>
              <template v-else-if="coupon.discountType === 2">
                <span class="num">{{ parseFloat((coupon.discountRate * 10).toFixed(2)) }}</span>
                <span class="unit">折</span>
              </template>
            </div>
            <div class="coupon-limit">
              {{ coupon.discountType === 3 ? '无门槛' : `满${coupon.minAmount}可用` }}
            </div>
          </div>
          <div class="coupon-item-right">
            <h4 class="coupon-title">{{ coupon.name }}</h4>
            <div class="coupon-scope">{{ coupon.scopeDesc }} / {{ coupon.scopeName || '全场' }}</div>
            <div class="coupon-time">有效期至：{{ dayjs(coupon.expireAt).format('YYYY.MM.DD HH:mm') }}</div>
          </div>
          <div v-if="!coupon.usable" class="unusable-tag">不可用</div>
          <div v-else-if="isOccupied(coupon)" class="unusable-tag">已被其他商品选用</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Ticket, ArrowRight, InfoFilled, CircleClose } from '@element-plus/icons-vue'
import { cartApi } from '@/api/cart'
import { orderApi } from '@/api/order'
import { addressApi } from '@/api/address'
import { couponApi } from '@/api/coupon'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { pcaTextArr } from 'element-china-area-data'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const submitting = ref(false)
const orderItems = ref([])
const cartItemIds = ref([])
const addressList = ref([])
const showAddressDialog = ref(false)
const selectedAddressId = ref(null)

const showAddAddressForm = ref(false)
const addrFormRef = ref()
const savingAddress = ref(false)
const selectedRegion = ref([])
const isEditingAddr = ref(false)

// 临时购物车相关
const isTemporary = ref(false)
const orderSubmitted = ref(false)

// 优惠券相关
const availableOrderCoupons = ref([])
const allProductCouponsMap = ref({}) // key: cartItemId, value: availableCoupons[]
const selectedOrderCoupon = ref(null)
const selectedProductCouponsMap = ref({})
const showCouponDialog = ref(false)
const couponLoading = ref(false)
const couponDialogMode = ref('order') // 'order' | 'product'
const currentProductItemId = ref(null)

// 价格预检数据
const previewData = ref({
  originalAmount: 0,
  promotionTotalDiscount: 0,
  seckillDiscount: 0,
  orderCouponDiscount: 0,
  productCouponTotalDiscount: 0,
  finalAmount: 0,
  orderCouponUsable: true,
  orderCouponUsableReason: '',
  productCouponDiscountMap: {}
})

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

const form = ref({
  receiverName: '',
  receiverPhone: '',
  address: '',
  remark: ''
})

const rules = {
  receiverName: [{ required: true, message: '请输入收货人', trigger: 'blur' }],
  receiverPhone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  address: [{ required: true, message: '请输入收货地址', trigger: 'blur' }]
}

const totalPrice = computed(() =>
  orderItems.value.reduce((sum, i) => sum + Number(i.discountedAmount || i.subtotal), 0).toFixed(2)
)

const originalTotalPrice = computed(() =>
  orderItems.value.reduce((sum, i) => sum + Number(i.originalAmount), 0).toFixed(2)
)

// 订单券是否禁用
const orderCouponDisabled = computed(() => {
  // 如果当前参与了活动优惠 (promotionTotalDiscount > 0) 或 后端明确标记不可用
  const isUsable = previewData.value.orderCouponUsable ?? true;
  return Number(previewData.value.promotionTotalDiscount || 0) > 0 || !isUsable
})

const orderUsableCount = computed(() => 
  availableOrderCoupons.value.filter(c => c.usable).length
)

// 过滤当前弹窗显示的优惠券列表
const dialogCouponList = computed(() => {
  if (couponDialogMode.value === 'order') {
    return availableOrderCoupons.value
  } else {
    // 这里的商品券可能需要根据商品 ID (productCoupon 中的 scopeId) 或 分类 ID 进行过滤
    // 根据后台逻辑，通常 getAvailableProductCoupons 返回的是针对这些 cartItemIds 的所有可能券
    // 前端需要匹配该 item 真正可用的券
    const item = orderItems.value.find(i => i.id === currentProductItemId.value)
    if (!item) return []
    // 后端已按 cartItemId 过滤，这里直接返回该商品的券列表
    return allProductCouponsMap.value[item.id] || []
  }
})

// 检查券是否已被其他商品占用
const isOccupied = (coupon) => {
  if (couponDialogMode.value !== 'product') return false
  const entries = Object.entries(selectedProductCouponsMap.value)
  return entries.some(([id, c]) => Number(id) !== currentProductItemId.value && c.userCouponId === coupon.userCouponId)
}

// 当前选中的券 ID（用于弹窗高亮）
const currentSelectedCouponId = computed(() => {
  if (couponDialogMode.value === 'order') {
    return selectedOrderCoupon.value?.userCouponId
  } else {
    return selectedProductCouponsMap.value[currentProductItemId.value]?.userCouponId
  }
})

// 获取某个商品的可用优惠券数量
const getUsableProductCouponsCount = (item) => {
  const coupons = allProductCouponsMap.value[item.id] || []
  return coupons.filter(c => c.usable).length
}

// 终极加固：获取特定项的优惠券扣减金额
const getProductCouponDiscount = (item) => {
  if (!previewData.value.productCouponDiscountMap) return 0
  const map = previewData.value.productCouponDiscountMap
  // 尝试匹配购物车项 ID (item.id) 或 商品 ID (item.productId)
  // 同时兼顾 Number 和 String 类型
  const val = map[item.id] ?? map[String(item.id)] ?? 
              map[item.productId] ?? map[String(item.productId)] ?? 0
  return Number(val)
}

// 对应 template 也要改动传参

const loadItems = async () => {
  const ids = route.query.ids?.split(',').map(Number) || []
  cartItemIds.value = ids
  if (ids.length === 0) { router.push('/cart'); return }

  // 检查是否是临时购物车项
  isTemporary.value = route.query.isTemporary === 'true'

  if (isTemporary.value && route.query.cartItem) {
    // 如果是临时购物车项，直接使用传递过来的购物车项信息
    try {
      const cartItem = JSON.parse(decodeURIComponent(route.query.cartItem))
      // 极致兼容：依次尝试新旧字段名，并确保 0 能被正确捕获
      const promotionalPrice = cartItem.promotionalPrice ?? cartItem.actualPrice ?? cartItem.discountedPrice ?? null
      const originalAmount = cartItem.originalAmount ?? cartItem.subtotal ?? (Number(cartItem.price) * cartItem.quantity).toFixed(2)
      const finalAmount = cartItem.finalAmount ?? cartItem.totalDiscountAmount ?? ((promotionalPrice || cartItem.price) * cartItem.quantity).toFixed(2)

      orderItems.value = [{
        ...cartItem,
        promotionalPrice,
        originalAmount,
        finalAmount
      }]
    } catch (e) {
      console.error('解析购物车项信息失败:', e)
      orderItems.value = []
    }
  } else {
    // 非临时购物车项，使用原接口
    try {
      const res = await cartApi.getList()
      orderItems.value = (res.data || [])
        .filter(i => ids.includes(i.id))
        .map(i => {
          // 极致兼容：依次尝试新的项字段名、旧的项字段名、以及通用的单价字段名
          // 用 ?? 确保 0 也能被正确捕获，而不是变成 null
          const promotionalPrice = i.promotionalPrice ?? i.actualPrice ?? i.discountedPrice ?? null
          const originalAmount = i.originalAmount ?? i.subtotal ?? (Number(i.price) * i.quantity).toFixed(2)
          const finalAmount = i.finalAmount ?? i.totalDiscountAmount ?? ((promotionalPrice || i.price) * i.quantity).toFixed(2)
          
          return { 
            ...i, 
            promotionalPrice,
            originalAmount,
            finalAmount
          }
        })
    } catch (error) {
      console.error('加载购物车列表失败:', error)
      orderItems.value = []
    }
  }
  
  // 加载可用优惠券并初始试算
  await loadAvailableCoupons()
  fetchPricePreview()
}

const loadAvailableCoupons = async () => {
  if (cartItemIds.value.length === 0) return
  couponLoading.value = true
  try {
    // 1. 加载订单优惠券
    const orderRes = await couponApi.getAvailableOrderCoupons(cartItemIds.value)
    if (orderRes.code === 200) {
      availableOrderCoupons.value = orderRes.data || []
    }

    // 2. 为每个商品加载商品优惠券
    const productCouponPromises = orderItems.value.map(item => 
      couponApi.getAvailableProductCoupons(item.id)
    )
    
    const productResults = await Promise.all(productCouponPromises)
    
    // 将结果存入 Map
    const newMap = {}
    orderItems.value.forEach((item, index) => {
      const res = productResults[index]
      if (res.code === 200) {
        newMap[item.id] = res.data || []
      }
    })
    allProductCouponsMap.value = newMap
  } catch (error) {
    console.error('加载优惠券失败:', error)
  } finally {
    couponLoading.value = false
  }
}

const openOrderCouponDialog = () => {
  couponDialogMode.value = 'order'
  showCouponDialog.value = true
}

const openProductCouponDialog = (item) => {
  couponDialogMode.value = 'product'
  currentProductItemId.value = item.id
  showCouponDialog.value = true
}

const handleSelectCoupon = (coupon) => {
  if (!coupon.usable || isOccupied(coupon)) return
  
  const isAlreadySelected = currentSelectedCouponId.value === coupon.userCouponId
  
  if (couponDialogMode.value === 'order') {
    // 如果点击的是已选中的券，则取消选中
    selectedOrderCoupon.value = isAlreadySelected ? null : coupon
  } else {
    // 如果点击的是已选中的商品券，则取消选中
    if (isAlreadySelected) {
      delete selectedProductCouponsMap.value[currentProductItemId.value]
    } else {
      selectedProductCouponsMap.value[currentProductItemId.value] = coupon
    }
  }
  showCouponDialog.value = false
  fetchPricePreview()
}

// “不使用优惠券”点击处理
const handleSelectNone = () => {
  if (couponDialogMode.value === 'order') {
    selectedOrderCoupon.value = null
  } else {
    delete selectedProductCouponsMap.value[currentProductItemId.value]
  }
  showCouponDialog.value = false
  fetchPricePreview()
}

const clearSelectedOrderCoupon = () => {
  selectedOrderCoupon.value = null
  fetchPricePreview()
}

const clearSelectedProductCoupon = (itemId) => {
  delete selectedProductCouponsMap.value[itemId]
  fetchPricePreview()
}

// 核心价格预检接口
const fetchPricePreview = async () => {
  try {
    const productCouponMap = {}
    Object.entries(selectedProductCouponsMap.value).forEach(([id, c]) => {
      productCouponMap[id] = c.userCouponId
    })

    const payload = {
      cartItemIds: cartItemIds.value,
      orderUserCouponId: selectedOrderCoupon.value?.userCouponId || null,
      productCouponMap
    }

    const res = await orderApi.preview(payload)
    if (res.code === 200) {
      previewData.value = res.data
      
      // 业务逻辑补充：如果当前有了活动优惠且已经选了订单券，需要考虑撤销选中的订单券（取决于后端是否强制）
      // 这里根据规则，如果 previewData.promotionTotalDiscount > 0 且 selectedOrderCoupon 存在，则清空
      if (Number(previewData.value.promotionTotalDiscount || 0) > 0 && selectedOrderCoupon.value) {
        selectedOrderCoupon.value = null
        // 重新请求一次以确保计算正确
        fetchPricePreview()
      }
    }
  } catch (error) {
    console.error('价格重算失败:', error)
  }
}

const loadAddresses = async () => {
  try {
    const res = await addressApi.list()
    addressList.value = res.data || []
    
    if (addressList.value.length === 0) {
      await ElMessageBox.confirm('你还没有添加收货地址，请先添加地址', '提示', {
        confirmButtonText: '去添加',
        cancelButtonText: '取消',
        type: 'warning'
      })
      router.push('/address')
      return
    }

    const defaultAddr = addressList.value.find(a => a.isDefault) || addressList.value[0]
    selectAddress(defaultAddr)
  } catch (error) {
    console.error(error)
  }
}

const selectAddress = (addr) => {
  selectedAddressId.value = addr.id
  form.value.receiverName = addr.receiverName
  form.value.receiverPhone = addr.receiverPhone
  form.value.address = `${addr.province}${addr.city}${addr.district}${addr.detailAddress}`
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

const submitOrder = async () => {
  try {
    if (formRef.value) {
      await formRef.value.validate()
    }
  } catch (err) {
    ElMessage.warning('请完善收货信息')
    return
  }

  submitting.value = true
  try {
    const productCouponMap = {}
    Object.entries(selectedProductCouponsMap.value).forEach(([id, c]) => {
      productCouponMap[id] = c.userCouponId
    })

    const submitData = {
      cartItemIds: cartItemIds.value,
      addressId: selectedAddressId.value,
      orderUserCouponId: selectedOrderCoupon.value?.userCouponId || null,
      productCouponMap,
      ...form.value
    }
    await orderApi.create(submitData)
    ElMessage.success('下单成功！')
    
    // 标记订单已提交
    orderSubmitted.value = true
    
    // 如果是临时购物车项，清理临时购物车
    if (isTemporary.value) {
      try {
        await cartApi.clearAllTemporary()
      } catch (e) {
        console.warn('清理临时购物车失败', e)
      }
    }
    
    try {
      await userStore.loadCartCount()
    } catch (e) {
      console.warn('同步购物车数量失败', e)
    }
    
    router.push('/orders')
  } catch (error) {
    console.error('下单失败:', error)
    ElMessage.error('订单创建失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadItems()
  loadAddresses()
})

// 组件卸载时清理临时购物车项（如果没有提交订单）
onBeforeUnmount(async () => {
  if (isTemporary.value && !orderSubmitted.value) {
    try {
      await cartApi.clearAllTemporary()
      console.log('已清理临时购物车项')
    } catch (e) {
      console.warn('清理临时购物车失败', e)
    }
  }
})
</script>

<style scoped>
.checkout-page { padding: 24px 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

.checkout-breadcrumb {
  margin-bottom: 24px;
  font-size: 16px;
}

.checkout-layout { display: flex; flex-direction: column; gap: 20px; }

.card { background: #fff; border-radius: 10px; padding: 24px; }
.card h3 { font-size: 16px; color: #303133; margin: 0 0 18px; font-weight: 700; }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.card-header h3 { margin: 0; }

.selected-address {
  background: #fdf6ec; border: 1px dashed #e6a23c; border-radius: 8px;
  padding: 15px;
}
.addr-row { margin-bottom: 8px; }
.addr-name { font-size: 16px; font-weight: 700; color: #303133; margin-right: 12px; }
.addr-phone { color: #606266; }
.addr-detail { font-size: 14px; color: #303133; line-height: 1.5; }

.order-item { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
.order-item:last-child { border-bottom: none; }
.item-info { flex: 1; }

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.promotion-tag {
  flex-shrink: 0;
}

.item-name { font-size: 14px; color: #303133; margin: 0; font-weight: 500; }
.item-meta { font-size: 13px; color: #909399; margin: 0; }

.seckill-tag {
  flex-shrink: 0;
  font-weight: 600;
}

.summary-row.promo.seckill .summary-val {
  color: #e6a23c;
}

.discounted-price {
  color: #f56c6c;
  font-weight: 600;
  margin-right: 8px;
}

.original-price {
  color: #909399;
  text-decoration: line-through;
  font-size: 12px;
}

.item-sub {
  min-width: 160px;
  display: flex;
  justify-content: flex-end;
}

.item-price-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: right;
}

.price-detail-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.price-detail-row.promo,
.price-detail-row.coupon {
  color: #f56c6c;
}

.price-detail-row.final {
  margin-top: 4px;
  font-weight: 700;
  color: #f56c6c;
  font-size: 14px;
}

.price-detail-row .label {
  color: #909399;
  font-weight: normal;
}

.submit-section { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.summary-info { width: 100%; }
.summary-row { display: flex; justify-content: space-between; font-size: 14px; color: #606266; padding: 4px 0; }
.summary-row.total { font-size: 16px; font-weight: 600; color: #303133; }
.pay-price { color: #f56c6c; font-size: 22px; font-weight: 700; }

.price-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-container .discounted-price {
  color: #f56c6c;
  font-weight: 600;
}

.price-container .original-price {
  color: #909399;
  text-decoration: line-through;
  font-size: 12px;
}

.summary-row.total .price-container {
  align-items: baseline;
}

.summary-row.total .original-price {
  font-size: 14px;
}
.submit-btn { width: 280px; height: 46px; font-size: 16px; border-radius: 8px; }

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
.add-address-btn:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.add-address-form {
  max-height: 450px;
  overflow-y: auto;
}
.addr-item {
  border: 1px solid #ebeef5; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s;
  display: flex;
  align-items: flex-start;
}
.addr-item:hover { border-color: #409eff; background: #ecf5ff; }
.addr-item.active { border-color: #409eff; background: #ecf5ff; position: relative; }
.addr-item.active::after {
  content: "√"; position: absolute; right: 0; bottom: 0;
  width: 24px; height: 24px; background: #409eff; color: #fff;
  border-radius: 8px 0 8px 0; display: flex; align-items: center; justify-content: center; font-size: 12px;
}

.addr-item-main {
  flex: 1;
}

.addr-item-actions {
  display: flex;
  gap: 4px;
  align-items: center;
  padding-left: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.addr-item:hover .addr-item-actions {
  opacity: 1;
}
.addr-item-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.addr-item-header .name { font-weight: 700; color: #303133; }
.addr-item-header .phone { color: #606266; font-size: 14px; }
.addr-item-content { font-size: 13px; color: #606266; line-height: 1.4; }

/* 优惠券入口样式 */
.coupon-card {
  cursor: pointer;
  padding: 18px 24px !important;
  transition: all 0.2s;
}
.coupon-card:hover { border-color: #409eff; }
.coupon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 14px;
}
.no-coupon { color: #c0c4cc; }
.available-count { color: #6c5ce7; font-weight: 600; }
.selected-coupon-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f3f0ff;
  color: #6c5ce7;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 600;
}
.close-icon {
  cursor: pointer;
  font-size: 16px;
  transition: color 0.2s;
}
.close-icon:hover { color: #f56c6c; }

/* 订单券不可用状态 */
.disabled-card {
  background-color: #fcfcfc !important;
  border: 1px dashed #dcdfe6 !important;
  cursor: not-allowed !important;
}

.header-disabled-hint {
  margin-left: 8px;
  color: #f56c6c;
  font-size: 13px;
  font-weight: normal;
}

.summary-row.promo .summary-val { color: #f56c6c; font-weight: 600; }
.summary-row.coupon .summary-val { color: #f56c6c; font-weight: 600; }

/* 商品券入口样式 */
.item-coupon-column {
  min-width: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.item-coupon-entry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: #f8f7ff;
  border: 1px solid #e0dbff;
  border-radius: 18px; /* 圆角胶囊形状 */
  color: #6c5ce7;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  max-width: 180px;
}

.item-coupon-entry .coupon-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.item-coupon-entry:hover {
  background: #f3f0ff;
  border-color: #6c5ce7;
}

.item-coupon-entry .arrow {
  font-size: 12px;
  margin-left: 2px;
}

/* 优惠券弹窗列表样式 */
.coupon-list-container {
  max-height: 450px;
  overflow-y: auto;
  padding: 10px 5px;
}
.coupon-item {
  position: relative;
  display: flex;
  height: 100px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(108, 92, 231, 0.08);
  cursor: pointer;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  transition: all 0.2s;
}
.coupon-item:hover { transform: translateY(-2px); border-color: #6c5ce7; }
.coupon-item.active { border-color: #6c5ce7; border-width: 2px; }
.coupon-item.disabled {
  cursor: not-allowed;
  filter: grayscale(1);
  opacity: 0.6;
}
.coupon-item-left {
  width: 120px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px;
}
.coupon-value .unit { font-size: 14px; margin-right: 2px; font-weight: 600; }
.coupon-value .num { font-size: 28px; font-weight: 800; }
.coupon-limit { font-size: 12px; opacity: 0.9; margin-top: 4px; }

.coupon-item-right {
  flex: 1;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.coupon-title { margin: 0 0 6px; font-size: 16px; color: #303133; }
.coupon-scope { font-size: 12px; color: #606266; margin-bottom: 4px; }
.coupon-time { font-size: 11px; color: #909399; }

.unusable-tag {
  position: absolute;
  top: 0;
  right: 0;
  background: #909399;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-bottom-left-radius: 8px;
}

/* “不使用优惠券”项样式 */
.none-item {
  height: 60px !important;
  display: flex !important;
  align-items: center !important;
  padding: 0 20px !important;
  border: 1px dashed #dcdfe6 !important;
  background: #fafafa !important;
  margin-bottom: 20px !important;
}

.none-icon {
  font-size: 24px;
  color: #909399;
  margin-right: 15px;
  display: flex;
  align-items: center;
}

.none-text {
  font-size: 15px;
  color: #606266;
  font-weight: 500;
}

.none-item.active {
  border: 2px solid #6c5ce7 !important;
  background: #f3f0ff !important;
}

.none-item.active .none-icon,
.none-item.active .none-text {
  color: #6c5ce7;
}
</style>
