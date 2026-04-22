<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="brand-section">
          <div class="logo-wrapper">
            <span class="logo-icon">N</span>
          </div>
          <h1 class="brand-title">NexMart</h1>
          <p class="brand-subtitle">智能电商购物平台</p>
        </div>
        <div class="features">
          <div class="feature-item">
            <el-icon class="feature-icon"><Goods /></el-icon>
            <span>海量精选</span>
          </div>
          <div class="feature-item">
            <el-icon class="feature-icon"><Ticket /></el-icon>
            <span>优惠折扣</span>
          </div>
          <div class="feature-item">
            <el-icon class="feature-icon"><Service /></el-icon>
            <span>优质服务</span>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="login-header">
            <h2>{{ titleMap[mode] }}</h2>
            <p>{{ subtitleMap[mode] }}</p>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <!-- 登录模式 -->
            <template v-if="mode === 'login'">
              <el-form-item label="用户名 / 手机号" prop="username">
                <el-input
                  v-model="form.username"
                  placeholder="请输入用户名或手机号"
                  size="large"
                  :prefix-icon="User"
                />
              </el-form-item>
              <el-form-item label="密码" prop="password">
                <el-input
                  v-model="form.password"
                  type="password"
                  placeholder="请输入密码"
                  size="large"
                  show-password
                  :prefix-icon="Lock"
                  @keyup.enter="handleLogin"
                />
              </el-form-item>
              <el-form-item label="图形验证码" prop="captcha">
                <div class="captcha-wrapper">
                  <el-input
                    v-model="form.captcha"
                    placeholder="请输入验证码"
                    size="large"
                    maxlength="4"
                    class="captcha-input"
                    @keyup.enter="handleLogin"
                  />
                  <div class="captcha-image" @click="refreshCaptcha" title="点击刷新验证码">
                    <canvas ref="captchaCanvas" width="120" height="40"></canvas>
                  </div>
                </div>
              </el-form-item>
              <div class="form-actions">
                <el-button
                  type="primary"
                  size="large"
                  :loading="loading"
                  @click="handleLogin"
                >
                  登 录
                </el-button>
              </div>
              <div class="form-footer">
                <el-button type="text" @click="mode = 'register'">立即注册</el-button>
                <el-divider direction="vertical" />
                <el-button type="text" @click="mode = 'reset'">忘记密码？</el-button>
              </div>
            </template>

            <!-- 注册模式 -->
            <template v-else-if="mode === 'register'">
              <el-form-item label="用户名" prop="username">
                <el-input
                  v-model="form.username"
                  placeholder="3-20 位字符"
                  size="large"
                  :prefix-icon="User"
                />
              </el-form-item>
              <el-form-item label="手机号" prop="phone">
                <el-input
                  v-model="form.phone"
                  placeholder="11 位手机号"
                  size="large"
                  :prefix-icon="Phone"
                />
              </el-form-item>
              <el-form-item label="密码" prop="password">
                <el-input
                  v-model="form.password"
                  type="password"
                  placeholder="6-20 位"
                  size="large"
                  show-password
                  :prefix-icon="Lock"
                />
              </el-form-item>
              <el-form-item label="邮箱（选填）" prop="email">
                <el-input
                  v-model="form.email"
                  placeholder="请输入邮箱"
                  size="large"
                  :prefix-icon="Message"
                />
              </el-form-item>
              <div class="form-actions">
                <el-button
                  type="primary"
                  size="large"
                  :loading="loading"
                  @click="handleRegister"
                >
                  注 册
                </el-button>
              </div>
              <div class="form-footer">
                <span>已有账号？</span>
                <el-button type="text" @click="mode = 'login'">立即登录</el-button>
              </div>
            </template>

            <!-- 重置密码模式 -->
            <template v-else-if="mode === 'reset'">
              <el-form-item label="手机号" prop="phone">
                <el-input
                  v-model="form.phone"
                  placeholder="请输入注册手机号"
                  size="large"
                  :prefix-icon="Phone"
                />
              </el-form-item>
              <el-form-item label="验证码" prop="code">
                <div class="code-input-wrapper">
                  <el-input
                    v-model="form.code"
                    placeholder="请输入验证码"
                    size="large"
                    :prefix-icon="Message"
                    maxlength="6"
                  />
                  <el-button
                    type="primary"
                    size="large"
                    :disabled="countdown > 0"
                    :loading="sendingCode"
                    @click="handleSendCode"
                  >
                    {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                  </el-button>
                </div>
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input
                  v-model="form.newPassword"
                  type="password"
                  placeholder="请输入新密码（6-20位）"
                  size="large"
                  show-password
                  :prefix-icon="Lock"
                />
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  size="large"
                  show-password
                  :prefix-icon="Lock"
                  @keyup.enter="handleResetPassword"
                />
              </el-form-item>
              <div class="form-actions">
                <el-button
                  type="primary"
                  size="large"
                  :loading="loading"
                  @click="handleResetPassword"
                >
                  重置密码
                </el-button>
              </div>
              <div class="form-footer">
                <el-button type="text" @click="mode = 'login'">返回登录</el-button>
              </div>
            </template>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Phone, Message, Goods, Ticket, Service } from '@element-plus/icons-vue'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref()
const captchaCanvas = ref()
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const mode = ref('login') // login, register, reset

const titleMap = {
  login: '欢迎登录',
  register: '创建账号',
  reset: '找回密码'
}

const subtitleMap = {
  login: '登录 NexMart，开启您的购物之旅',
  register: '立即注册，享受更多便捷服务',
  reset: '输入您的注册手机号来重置密码'
}

const form = reactive({
  username: '',
  password: '',
  phone: '',
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
  captcha: ''
})

let captchaCode = ''

// 初始化 mode
onMounted(() => {
  if (route.name === 'Register') mode.value = 'register'
  else if (route.name === 'ForgotPassword') mode.value = 'reset'
  
  if (mode.value === 'login') {
    generateCaptcha()
  }
})

// 监听模式变化，重置表单和图形验证码
watch(mode, (newMode) => {
  formRef.value?.resetFields()
  if (newMode === 'login') {
    setTimeout(generateCaptcha, 0)
  }
})

// 验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度 3-20 位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度 6-20 位', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  captcha: [{ required: true, message: '请输入图形验证码', trigger: 'blur' }],
  email: [
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          callback(new Error('邮箱格式不正确'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度 6-20 位', trigger: 'blur' }
  ],
  confirmPassword: [
    {
      validator: (rule, value, callback) => {
        if (!value) callback(new Error('请再次输入密码'))
        else if (value !== form.newPassword) callback(new Error('两次密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

// 图形验证码逻辑
const generateCaptcha = () => {
  const canvas = captchaCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  
  ctx.fillStyle = '#f8f9fa'
  ctx.fillRect(0, 0, width, height)
  
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  captchaCode = ''
  for (let i = 0; i < 4; i++) {
    captchaCode += chars[Math.floor(Math.random() * chars.length)]
  }
  
  for (let i = 0; i < captchaCode.length; i++) {
    ctx.font = `${20 + Math.random() * 8}px Arial`
    ctx.fillStyle = `rgb(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100})`
    ctx.textBaseline = 'middle'
    const x = 15 + i * 26
    const y = height / 2 + (Math.random() - 0.5) * 10
    const deg = (Math.random() - 0.5) * 0.4
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(deg)
    ctx.fillText(captchaCode[i], 0, 0)
    ctx.restore()
  }
  
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.2)`
    ctx.beginPath()
    ctx.moveTo(Math.random() * width, Math.random() * height)
    ctx.lineTo(Math.random() * width, Math.random() * height)
    ctx.stroke()
  }
}

const refreshCaptcha = () => generateCaptcha()

// 登录
const handleLogin = async () => {
  await formRef.value.validate()
  
  if (form.captcha.toUpperCase() !== captchaCode) {
    ElMessage.error('图形验证码错误')
    refreshCaptcha()
    form.captcha = ''
    return
  }
  
  loading.value = true
  try {
    const res = await authApi.login({
      username: form.username,
      password: form.password
    })
    userStore.setToken(res.data.token)
    userStore.setUserInfo(res.data.userInfo)
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } finally {
    loading.value = false
  }
}

// 注册
const handleRegister = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    await authApi.register({
      username: form.username,
      phone: form.phone,
      password: form.password,
      email: form.email
    })
    ElMessage.success('注册成功，请登录')
    mode.value = 'login'
  } finally {
    loading.value = false
  }
}

// 发送验证码
const handleSendCode = async () => {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    return ElMessage.warning('请输入正确的手机号')
  }
  
  sendingCode.value = true
  try {
    await authApi.sendResetCode(form.phone)
    ElMessage.success('验证码已发送，请检查控制台')
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } finally {
    sendingCode.value = false
  }
}

// 重置密码
const handleResetPassword = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    await authApi.resetPassword({
      phone: form.phone,
      code: form.code,
      newPassword: form.newPassword
    })
    ElMessage.success('密码重置成功，请使用新密码登录')
    mode.value = 'login'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  display: flex;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  max-width: 900px;
  width: 100%;
  min-height: 580px;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 50px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.login-left::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%);
  animation: pulse 15s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(10%, 10%); }
}

.brand-section {
  text-align: center;
  position: relative;
  z-index: 1;
}

.logo-wrapper {
  display: inline-flex;
  margin-bottom: 20px;
}

.logo-icon {
  display: inline-flex;
  width: 70px;
  height: 70px;
  border-radius: 18px;
  background: #fff;
  align-items: center;
  justify-content: center;
  color: #667eea;
  font-size: 36px;
  font-weight: 800;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.brand-title {
  font-size: 34px;
  margin: 0 0 10px;
  font-weight: 700;
  letter-spacing: 2px;
}

.brand-subtitle {
  color: rgba(255, 255, 255, 0.85);
  font-size: 16px;
  margin: 0;
}

.features {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 60px;
  position: relative;
  z-index: 1;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.feature-icon {
  font-size: 28px;
  color: #fff;
}

.login-right {
  flex: 1;
  padding: 50px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.login-card {
  width: 100%;
  max-width: 360px;
}

.login-header {
  text-align: center;
  margin-bottom: 35px;
}

.login-header h2 {
  font-size: 28px;
  color: #2d3436;
  margin: 0 0 10px;
  font-weight: 600;
}

.login-header p {
  color: #636e72;
  font-size: 14px;
  margin: 0;
}

.form-actions {
  margin-top: 10px;
}

.form-actions .el-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #fff;
}

.form-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(102, 126, 234, 0.3);
  opacity: 0.9;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #636e72;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-footer .el-button--text {
  color: #667eea;
  padding: 0;
}

.form-footer .el-button--text:hover {
  color: #764ba2;
}

.captcha-wrapper, .code-input-wrapper {
  display: flex;
  gap: 12px;
  width: 100%;
}

.captcha-input, .code-input-wrapper .el-input {
  flex: 1;
}

.captcha-image {
  width: 120px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #e4e7ed;
  background: #f8f9fa;
  flex-shrink: 0;
}

.captcha-image canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.code-input-wrapper .el-button {
  width: 110px;
  height: 48px;
  border-radius: 10px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #2d3436;
  margin-bottom: 8px !important;
}

:deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 0 15px;
  background: #f9f9f9;
  box-shadow: none !important;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: #667eea;
  background: #fff;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
}

:deep(.el-input--large .el-input__inner) {
  height: 48px;
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    min-height: auto;
  }
  
  .login-left {
    padding: 40px 20px;
  }
  
  .features {
    display: none;
  }
  
  .login-right {
    padding: 40px 20px;
  }
}
</style>
