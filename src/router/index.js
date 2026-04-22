import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Login.vue'),
    meta: { title: '注册', guest: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/Login.vue'),
    meta: { title: '重置密码', guest: true }
  },
  {
    // 主布局（含导航栏）
    path: '/',
    component: () => import('@/components/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: 'NexMart - 首页' }
      },
      {
        path: 'category',
        name: 'Category',
        component: () => import('@/views/Category.vue'),
        meta: { title: '商品分类' }
      },
      {
        path: 'search',
        name: 'Search',
        component: () => import('@/views/Search.vue'),
        meta: { title: '搜索结果' }
      },
      {
        path: 'product/:id',
        name: 'ProductDetail',
        component: () => import('@/views/ProductDetail.vue'),
        meta: { title: '商品详情' }
      },
      {
        path: 'cart',
        name: 'Cart',
        component: () => import('@/views/Cart.vue'),
        meta: { title: '购物车', requireAuth: true }
      },
      {
        path: 'checkout',
        name: 'Checkout',
        component: () => import('@/views/Checkout.vue'),
        meta: { title: '提交订单', requireAuth: true }
      },
      {
        path: 'orders',
        name: 'OrderList',
        component: () => import('@/views/OrderList.vue'),
        meta: { title: '我的订单', requireAuth: true }
      },
      {
        path: 'order/:id',
        name: 'OrderDetail',
        component: () => import('@/views/OrderDetail.vue'),
        meta: { title: '订单详情', requireAuth: true }
      },
      {
        path: 'review/write',
        name: 'ReviewWrite',
        component: () => import('@/views/ReviewWrite.vue'),
        meta: { title: '写评价', requireAuth: true }
      },
      {
        path: 'review/:id',
        name: 'ReviewDetail',
        component: () => import('@/views/ReviewDetail.vue'),
        meta: { title: '评价详情' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心', requireAuth: true }
      },
      {
        path: 'profile/edit',
        name: 'EditProfile',
        component: () => import('@/views/EditProfile.vue'),
        meta: { title: '个人资料修改', requireAuth: true }
      },
      {
        path: 'password',
        name: 'Password',
        component: () => import('@/views/Password.vue'),
        meta: { title: '密码管理', requireAuth: true }
      },
      {
        path: 'return/:id',
        name: 'ReturnDetail',
        component: () => import('@/views/ReturnDetail.vue'),
        meta: { title: '退款详情', requireAuth: true }
      },
      {
        path: 'address',
        name: 'Address',
        component: () => import('@/views/Address.vue'),
        meta: { title: '地址管理', requireAuth: true }
      },
      {
        path: 'favorites',
        name: 'Favorites',
        component: () => import('@/views/Favorites.vue'),
        meta: { title: '我的收藏', requireAuth: true }
      },
      {
        path: 'history',
        name: 'BrowseHistory',
        component: () => import('@/views/History.vue'),
        meta: { title: '浏览记录', requireAuth: true }
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/About.vue'),
        meta: { title: '关于我们' }
      },
      {
        path: 'customer-service',
        name: 'CustomerService',
        component: () => import('@/views/CustomerService.vue'),
        meta: { title: '客服中心' }
      },
      {
        path: 'ai-assistant',
        name: 'AIAssistant',
        component: () => import('@/views/AIAssistant.vue'),
        meta: { title: 'AI 小助手' }
      },
      {
        path: 'coupon/center',
        name: 'CouponCenter',
        component: () => import('@/views/coupon/CouponCenter.vue'),
        meta: { title: '领券中心' }
      },
      {
        path: 'coupon/my',
        name: 'MyCoupons',
        component: () => import('@/views/coupon/MyCoupons.vue'),
        meta: { title: '我的券包', requireAuth: true }
      },
      {
        path: 'points',
        name: 'Points',
        component: () => import('@/views/Points.vue'),
        meta: { title: '积分中心', requireAuth: true }
      },
      {
        path: 'points/mall',
        name: 'PointsMall',
        component: () => import('@/views/PointsMall.vue'),
        meta: { title: '积分商城', requireAuth: true }
      },
      {
        path: 'points/logs',
        name: 'PointsLogs',
        component: () => import('@/views/PointsLogs.vue'),
        meta: { title: '积分明细', requireAuth: true }
      },
      {
        path: 'seckill',
        name: 'Seckill',
        component: () => import('@/views/Seckill.vue'),
        meta: { title: '限时秒杀', requireAuth: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// 路由守卫：未登录时跳转到登录页
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'NexMart'

  const userStore = useUserStore()
  if (to.meta.requireAuth && !userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (to.meta.guest && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
