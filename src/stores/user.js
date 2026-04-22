import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartApi } from '@/api/cart'

export const useUserStore = defineStore('user', () => {
  // token 持久化到 localStorage
  const token = ref(localStorage.getItem('nexmart_token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('nexmart_user') || 'null'))
  const cartCount = ref(0) // 新增购物车计数状态
  const unreadMessageCount = ref(0) // 未读消息数

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 1)

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('nexmart_token', newToken)
  }

  function setUserInfo(info) {
    userInfo.value = info
    localStorage.setItem('nexmart_user', JSON.stringify(info))
  }

  // 加载购物车总数（累加所有商品的 quantity）
  async function loadCartCount() {
    if (!isLoggedIn.value) {
      cartCount.value = 0
      return
    }
    try {
      const res = await cartApi.getList()
      const list = res.data || []
      // 累加所有商品的数量
      cartCount.value = list.reduce((sum, item) => sum + (item.quantity || 0), 0)
      console.log('购物车数量更新成功:', cartCount.value)
    } catch (err) {
      console.error('加载购物车数量失败', err)
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    cartCount.value = 0
    unreadMessageCount.value = 0
    localStorage.removeItem('nexmart_token')
    localStorage.removeItem('nexmart_user')
  }

  function setUnreadMessageCount(count) {
    unreadMessageCount.value = count
  }

  function incrementUnreadMessage() {
    unreadMessageCount.value++
  }

  function clearUnreadMessage() {
    unreadMessageCount.value = 0
  }

  return { token, userInfo, cartCount, unreadMessageCount, isLoggedIn, isAdmin, setToken, setUserInfo, loadCartCount, setUnreadMessageCount, incrementUnreadMessage, clearUnreadMessage, logout }
})
