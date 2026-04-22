<template>
  <div class="address-container">
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/profile' }">个人中心</el-breadcrumb-item>
        <el-breadcrumb-item>地址管理</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <el-card class="address-card">
      <template #header>
        <div class="card-header">
          <span class="title">地址管理</span>
          <el-button type="primary" @click="handleAdd">新增地址</el-button>
        </div>
      </template>

      <!-- 地址列表 -->
      <el-table :data="addressList" style="width: 100%" v-loading="loading">
        <el-table-column prop="receiverName" label="收货人" width="120" />
        <el-table-column prop="receiverPhone" label="手机号码" width="150" />
        <el-table-column label="详细地址">
          <template #default="{ row }">
            {{ row.province }}{{ row.city }}{{ row.district }}{{ row.detailAddress }}
            <el-tag v-if="row.isDefault" type="danger" size="small" class="default-tag">默认</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              link 
              type="success" 
              :disabled="row.isDefault === 1" 
              @click="handleSetDefault(row.id)"
            >设为默认</el-button>
            <el-popconfirm title="确定删除该地址吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑地址' : '新增地址'"
      width="500px"
      @closed="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="收货人" prop="receiverName">
          <el-input v-model="form.receiverName" placeholder="请填写收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号码" prop="receiverPhone">
          <el-input v-model="form.receiverPhone" placeholder="请填写手机号码" />
        </el-form-item>
        <el-form-item label="所在地区" prop="area">
           <el-cascader
             v-model="selectedArea"
             :options="pcaTextArr"
             placeholder="请选择省/市/区"
             @change="handleAreaChange"
             style="width: 100%"
           />
        </el-form-item>
        <el-form-item label="详细地址" prop="detailAddress">
          <el-input 
            v-model="form.detailAddress" 
            type="textarea" 
            placeholder="请填写详细地址，如街道、门牌号等" 
          />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { addressApi } from '@/api/address'
// 需要安装：npm install element-china-area-data
import { pcaTextArr } from 'element-china-area-data'

const loading = ref(false)
const submitLoading = ref(false)
const addressList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

// 用于级联选择器的绑定值 [省, 市, 区]
const selectedArea = ref([])

const form = reactive({
  id: null,
  receiverName: '',
  receiverPhone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  isDefault: 0
})

// 监听编辑时的初始值，同步给级联选择器
watch(() => form.id, (newVal) => {
  if (newVal && isEdit.value) {
    selectedArea.value = [form.province, form.city, form.district]
  }
})

const handleAreaChange = (value) => {
  if (value && value.length === 3) {
    form.province = value[0]
    form.city = value[1]
    form.district = value[2]
  } else {
    form.province = ''
    form.city = ''
    form.district = ''
  }
}

const rules = {
  receiverName: [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
  receiverPhone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  area: [{ 
    validator: (rule, value, callback) => {
      if (selectedArea.value.length === 0) {
        callback(new Error('请选择所在地区'))
      } else {
        callback()
      }
    }, 
    trigger: 'change' 
  }],
  detailAddress: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

const loadAddresses = async () => {
  loading.value = true
  try {
    const res = await addressApi.list()
    addressList.value = res.data || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = async (id) => {
  try {
    await addressApi.remove(id)
    ElMessage.success('删除成功')
    loadAddresses()
  } catch (error) {}
}

const handleSetDefault = async (id) => {
  try {
    await addressApi.setDefault(id)
    ElMessage.success('设置成功')
    loadAddresses()
  } catch (error) {}
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value) {
          await addressApi.update(form)
          ElMessage.success('修改成功')
        } else {
          await addressApi.add(form)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        loadAddresses()
      } catch (error) {
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const resetForm = () => {
  form.id = null
  form.receiverName = ''
  form.receiverPhone = ''
  form.province = ''
  form.city = ''
  form.district = ''
  form.detailAddress = ''
  form.isDefault = 0
  selectedArea.value = [] // 清空级联选择器
  if (formRef.value) formRef.value.resetFields()
}

onMounted(() => {
  loadAddresses()
})
</script>

<style scoped>
.address-container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 20px;
}

.page-header {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 18px;
  font-weight: bold;
}
.default-tag {
  margin-left: 10px;
}
.area-inputs {
  display: flex;
  width: 100%;
}
</style>
