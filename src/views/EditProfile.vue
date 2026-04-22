<template>
  <div class="account-settings-page">
    <div class="page-container">
      <div class="breadcrumb-nav">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/profile' }">个人中心</el-breadcrumb-item>
          <el-breadcrumb-item>个人信息</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div class="settings-layout">
        <!-- 基本信息修改 -->
        <el-card class="settings-card info-card">
          <template #header><div class="card-header"><span>基本资料</span></div></template>
          <el-form ref="profileRef" :model="profileForm" :rules="profileRules" label-position="top">
            <el-form-item label="我的头像">
              <div class="avatar-manager">
                <el-avatar :size="80" :src="profileForm.avatarUrl">
                  {{ profileForm.username?.charAt(0)?.toUpperCase() || 'U' }}
                </el-avatar>
                <div class="upload-actions">
                  <el-upload
                    :show-file-list="false"
                    accept="image/*"
                    :before-upload="handleAvatarUpload"
                  >
                    <el-button type="primary" plain :loading="uploading">更换新头像</el-button>
                  </el-upload>
                  <p class="upload-tip">支持 JPG, PNG 格式，建议尺寸 200x200</p>
                </div>
              </div>
            </el-form-item>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="用户昵称" prop="username">
                  <el-input v-model="profileForm.username" placeholder="请输入你的昵称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手机号码" prop="phone">
                  <el-input v-model="profileForm.phone" placeholder="11 位手机号" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="电子邮箱" prop="email">
              <el-input v-model="profileForm.email" placeholder="example@domain.com" />
            </el-form-item>
            
            <el-form-item label="个性签名" prop="profileSignature">
              <el-input 
                v-model="profileForm.profileSignature" 
                type="textarea" 
                :rows="3" 
                maxlength="100" 
                show-word-limit
                placeholder="这一刻的想法..." 
              />
            </el-form-item>

            <div class="form-actions">
              <el-button type="primary" :loading="savingProfile" @click="handleProfileSubmit">保存所有更改</el-button>
            </div>
          </el-form>
        </el-card>


      </div>
    </div>

    <!-- 验证码弹窗 -->
    <el-dialog
      v-model="codeDialogVisible"
      title="验证手机号"
      width="400px"
      append-to-body
      destroy-on-close
    >
      <div class="dialog-desc" style="margin-bottom: 20px; color: #666; font-size: 14px;">
        修改手机号需要验证您当前绑定的手机号身份。
      </div>
      <el-form ref="codeFormRef" :model="codeForm" :rules="codeRules" label-position="top">
        <el-form-item label="验证码" prop="code">
          <div class="code-input-wrapper" style="display: flex; gap: 12px;">
            <el-input
              v-model="codeForm.code"
              placeholder="请输入 6 位验证码"
              maxlength="6"
              :prefix-icon="Message"
            />
            <el-button
              type="primary"
              :disabled="countdown > 0"
              :loading="sendingCode"
              @click="handleSendCode"
              style="width: 120px;"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer" style="padding-top: 10px;">
          <el-button @click="codeDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="savingProfile" @click="handleVerifyCode">确认修改</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { accountApi } from '@/api/account'
import { uploadApi } from '@/api/upload'
import { authApi } from '@/api/auth'
import { Message } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const profileRef = ref()
const uploading = ref(false)
const savingProfile = ref(false)

const profileForm = ref({
  username: '',
  phone: '',
  email: '',
  avatarUrl: '',
  profileSignature: ''
})

const originalPhone = ref('')
const codeDialogVisible = ref(false)
const codeFormRef = ref()
const sendingCode = ref(false)
const countdown = ref(0)
const codeForm = ref({ code: '' })

const codeRules = {
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '验证码为6位数字', trigger: 'blur' }
  ]
}

const profileRules = {
  username: [
    { required: true, message: '昵称不能为空', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '手机号不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '格式不正确', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ]
}

const loadData = () => {
  const u = userStore.userInfo
  if (u) {
    profileForm.value = {
      username: u.username || '',
      phone: u.phone || '',
      email: u.email || '',
      avatarUrl: u.avatarUrl || '',
      profileSignature: u.profileSignature || ''
    }
    originalPhone.value = u.phone || ''
  }
}

const handleAvatarUpload = async (file) => {
  uploading.value = true
  try {
    const res = await uploadApi.image(file)
    profileForm.value.avatarUrl = res.data
    ElMessage.success({ message: '照片已上传', duration: 1500, offset: 80 })
  } catch (error) {
  } finally {
    uploading.value = false
  }
  return false
}

const handleProfileSubmit = async () => {
  await profileRef.value.validate()
  
  if (profileForm.value.phone !== originalPhone.value) {
    codeForm.value.code = ''
    countdown.value = 0
    codeDialogVisible.value = true
  } else {
    savingProfile.value = true
    try {
      const res = await accountApi.updateProfile(profileForm.value)
      if (res.data?.userInfo) {
        userStore.setUserInfo(res.data.userInfo)
      }
      ElMessage.success({ message: '资料已更新', duration: 1500, offset: 80 })
    } catch (error) {
    } finally {
      savingProfile.value = false
    }
  }
}

const handleSendCode = async () => {
  if (!profileForm.value.phone) return ElMessage.warning('请先输入新手机号')
  
  sendingCode.value = true
  try {
    await authApi.sendChangePhoneCode(originalPhone.value, profileForm.value.phone)
    ElMessage.success('验证码已发送，请查看控制台')
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } finally {
    sendingCode.value = false
  }
}

const handleVerifyCode = async () => {
  if (!codeFormRef.value) return
  await codeFormRef.value.validate()
  
  savingProfile.value = true
  try {
    // 1. 修改手机号
    await authApi.changePhone({
      originPhoneNumber: originalPhone.value,
      newPhoneNumber: profileForm.value.phone,
      code: codeForm.value.code
    })
    
    // 2. 更新其他资料
    const res = await accountApi.updateProfile(profileForm.value)
    if (res.data?.userInfo) {
      userStore.setUserInfo(res.data.userInfo)
    }
    ElMessage.success({ message: '资料及手机号已更新', duration: 1500, offset: 80 })
    codeDialogVisible.value = false
    originalPhone.value = profileForm.value.phone
  } finally {
    savingProfile.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.account-settings-page {
  padding: 30px 0 60px;
}

.page-container {
  max-width: 1000px;
  margin: 0 auto;
}

.breadcrumb-nav {
  margin-bottom: 30px;
}

.settings-layout {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.settings-card {
  border-radius: var(--border-radius-large);
  box-shadow: var(--box-shadow-base);
  border: none;
}

.card-header {
  font-weight: 700;
  font-size: 18px;
  color: var(--text-primary);
}

.avatar-manager {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 10px 0;
}

.upload-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-tip {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}



.form-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--text-regular);
}
</style>
