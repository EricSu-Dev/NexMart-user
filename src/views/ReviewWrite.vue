<template>
  <div class="review-write">
    <div class="container">
      <div class="page-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/orders' }">我的订单</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/orders', query: { status: 4 } }">已完成</el-breadcrumb-item>
          <el-breadcrumb-item>写评价</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <h2 class="page-title">写评价</h2>

      <el-card class="card">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <el-form-item label="评分" prop="rating">
            <el-rate v-model="form.rating" />
          </el-form-item>

          <el-form-item label="评价内容" prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="4"
              placeholder="说说你的使用感受..."
            />
          </el-form-item>

          <el-form-item label="图片/视频（可选）">
            <div class="media-uploader">
              <el-upload
                :show-file-list="false"
                accept="image/*,video/*"
                :before-upload="handleUpload"
              >
                <el-button :loading="uploading" :icon="Upload">上传媒体</el-button>
              </el-upload>
              <div class="media-list" v-if="form.mediaUrls.length">
                <div v-for="(url, idx) in form.mediaUrls" :key="url" class="media-item">
                  <el-image
                    v-if="isImage(url)"
                    :src="url"
                    fit="cover"
                    style="width:72px;height:72px;border-radius:6px"
                  />
                  <div v-else class="video-tag">视频</div>
                  <el-button text type="danger" size="small" @click="removeMedia(idx)">移除</el-button>
                </div>
              </div>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">提交评价</el-button>
            <el-button @click="$router.back()">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import { reviewApi } from '@/api/review'
import { uploadApi } from '@/api/upload'

const route = useRoute()
const router = useRouter()

const orderItemId = Number(route.query.orderItemId)
const productId = Number(route.query.productId)

const formRef = ref()
const uploading = ref(false)
const submitting = ref(false)
const form = ref({
  rating: 5,
  content: '',
  mediaUrls: []
})

const rules = {
  rating: [{ required: true, message: '请评分', trigger: 'change' }],
  content: [{ required: true, message: '请输入评价内容', trigger: 'blur' }]
}

const isImage = (url) => /\.(png|jpe?g|gif|webp|bmp)$/i.test(url)

const handleUpload = async (file) => {
  uploading.value = true
  try {
    const res = await uploadApi.image(file)
    form.value.mediaUrls.push(res.data)
    ElMessage.success('上传成功')
  } finally {
    uploading.value = false
  }
  return false
}

const removeMedia = (idx) => {
  form.value.mediaUrls.splice(idx, 1)
}

const handleSubmit = async () => {
  if (!orderItemId || !productId) {
    ElMessage.error('缺少订单项或商品信息')
    return
  }
  await formRef.value.validate()
  submitting.value = true
  try {
    await reviewApi.create({
      orderItemId,
      productId,
      rating: form.value.rating,
      content: form.value.content.trim(),
      mediaUrls: form.value.mediaUrls
    })
    ElMessage.success('评价提交成功')
    router.back()
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.review-write { padding: 24px 0; }
.container { max-width: 900px; margin: 0 auto; padding: 0 20px; }
.page-header {
  margin-bottom: 24px;
}
.page-title { font-size: 22px; color: #303133; margin-bottom: 20px; }
.card { border-radius: 10px; }
.media-uploader { display: flex; flex-direction: column; gap: 10px; }
.media-list { display: flex; flex-wrap: wrap; gap: 12px; }
.media-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.video-tag { width:72px; height:72px; border-radius:6px; background:#f5f7fa; display:flex; align-items:center; justify-content:center; color:#909399; font-size:12px; }
</style>
