<template>
  <div class="password-settings-page">
    <div class="page-container">
      <div class="breadcrumb-nav">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/profile' }">个人中心</el-breadcrumb-item>
          <el-breadcrumb-item>密码管理</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <el-card class="settings-card">
        <template #header><div class="card-header"><span>安全设置</span></div></template>
        <div class="security-intro">建议定期更换密码以保障账号安全。</div>
        <el-form ref="passwordRef" :model="passwordForm" :rules="passwordRules" label-position="top">
          <el-form-item label="当前密码" prop="oldPassword">
            <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="6-20 位字符" />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="6-20 位字符" />
          </el-form-item>
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
          </el-form-item>
          <div class="form-actions">
            <el-button type="danger" plain :loading="savingPassword" @click="handlePasswordSubmit">重置登录密码</el-button>
          </div>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { accountApi } from '@/api/account'

const router = useRouter()
const userStore = useUserStore()

const passwordRef = ref()
const savingPassword = ref(false)

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度 6-20 位', trigger: 'blur' }
  ],
  confirmPassword: [
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const handlePasswordSubmit = async () => {
  await passwordRef.value.validate()
  savingPassword.value = true
  try {
    await accountApi.updatePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    ElMessage.success({ message: '密码已修改，请重新登录', duration: 1500, offset: 80 })
    userStore.logout()
    router.push('/login')
  } catch (error) {
  } finally {
    savingPassword.value = false
  }
}
</script>

<style scoped>
.password-settings-page {
  padding: 30px 0 60px;
}

.page-container {
  max-width: 800px;
  margin: 0 auto;
}

.breadcrumb-nav {
  margin-bottom: 30px;
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

.security-intro {
  margin-bottom: 24px;
  color: var(--text-secondary);
  font-size: 14px;
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