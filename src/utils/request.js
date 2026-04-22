import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// -------- 请求拦截器：自动带上 Token --------
request.interceptors.request.use(
  config => {
    // 从localStorage中获取token，避免在拦截器中使用useUserStore
    const token = localStorage.getItem('nexmart_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// -------- 响应拦截器：统一处理错误 --------
request.interceptors.response.use(
  response => {
    const res = response.data
    // 如果返回的是直接的流、文本或二进制，或者配置了非json解析，直接放行
    if (
      response.config.responseType === 'blob' ||
      response.config.responseType === 'arraybuffer' ||
      response.config.responseType === 'text' ||
      typeof res === 'string'
    ) {
      return res
    }

    // JSON业务失败
    if (res.code !== 200) {
      ElMessage.error({ message: res.msg || '操作失败', duration: 1500 })
      return Promise.reject(new Error(res.msg || 'Error'))
    }
    return res
  },
  error => {
    const status = error.response?.status
    if (status === 401) {
      ElMessage.warning({ message: '登录已过期，请重新登录', duration: 1500 })
      // 直接清除localStorage中的token
      localStorage.removeItem('nexmart_token')
      localStorage.removeItem('nexmart_user')
      router.push('/login')
    } else if (status === 403) {
      ElMessage.error({ message: '无权限访问', duration: 1500 })
    } else {
      ElMessage.error({ message: error.response?.data?.msg || '网络错误，请稍后重试', duration: 1500 })
    }
    return Promise.reject(error)
  }
)

export default request
