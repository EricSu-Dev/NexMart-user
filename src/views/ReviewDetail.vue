<template>
  <div class="review-detail">
    <div class="container" v-loading="loading">
      <div class="page-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/orders' }">我的订单</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/orders', query: { status: 4 } }">已完成</el-breadcrumb-item>
          <el-breadcrumb-item>查看评价</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <el-card v-if="review" class="card">
        <div class="review-header">
          <el-avatar :size="40" :src="review.avatarUrl" style="background:#409eff">
            {{ review.username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <div class="review-meta">
            <div class="review-user">{{ review.username }}</div>
            <div class="review-time">{{ review.createdAt }}</div>
          </div>
          <div class="review-actions">
            <el-button text @click="toggleLike">
              <span :class="['like', review.liked ? 'liked' : '']">👍</span>
              {{ review.likeCount || 0 }}
            </el-button>
            <el-button
              v-if="isOwner(review.userId)"
              text
              type="danger"
              @click="confirmDeleteReview"
            >删除</el-button>
          </div>
        </div>

        <el-rate v-model="review.rating" disabled />
        <p class="review-content">{{ review.content }}</p>

        <div class="media-list" v-if="review.mediaUrls?.length">
          <div v-for="url in review.mediaUrls" :key="url" class="media-item">
            <el-image v-if="isImage(url)" :src="url" fit="cover" style="width:90px;height:90px;border-radius:6px" />
            <div v-else class="video-tag">视频</div>
          </div>
        </div>
      </el-card>

      <el-card class="card" style="margin-top:16px">
        <template #header><span>评论</span></template>

        <div v-if="comments.length" class="comment-list">
          <div v-for="c in comments" :key="c.id" class="comment-item">
            <div class="comment-header">
              <el-avatar :size="28" :src="c.avatarUrl" style="background:#909399">
                {{ c.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <div class="comment-meta">
                <span class="comment-user">{{ c.username }}</span>
                <span class="comment-time">{{ c.createdAt }}</span>
              </div>
              <el-button text size="small" @click="setReply(c)">回复</el-button>
              <el-button
                v-if="isOwner(c.userId)"
                text
                type="danger"
                size="small"
                @click="confirmDeleteComment(c.id)"
              >删除</el-button>
            </div>
            <div class="comment-content">{{ c.content }}</div>

            <div class="reply-list" v-if="c.replies?.length">
              <div v-for="r in c.replies" :key="r.id" class="reply-item">
                <span class="reply-user">{{ r.username }}：</span>
                <span class="reply-content">{{ r.content }}</span>
                <span class="reply-time">{{ r.createdAt }}</span>
                <el-button
                  v-if="isOwner(r.userId)"
                  text
                  type="danger"
                  size="small"
                  @click="confirmDeleteComment(r.id)"
                >删除</el-button>
              </div>
            </div>
          </div>
        </div>

        <el-empty v-else description="暂无评论" />

        <div class="comment-form">
          <el-input
            v-model="commentForm.content"
            type="textarea"
            :rows="3"
            placeholder="写下你的评论..."
          />
          <div class="comment-actions">
            <span v-if="replyTo" class="reply-tip">回复 {{ replyTo.username }}</span>
            <div class="comment-btns">
              <el-button v-if="replyTo" @click="cancelReply">取消回复</el-button>
              <el-button type="primary" :loading="commentSubmitting" @click="submitComment">提交</el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reviewApi } from '@/api/review'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const review = ref(null)
const comments = ref([])
const replyTo = ref(null)
const commentSubmitting = ref(false)
const commentForm = ref({ content: '' })

const currentUserId = computed(() => userStore.userInfo?.id)
const isOwner = (userId) => currentUserId.value && String(currentUserId.value) === String(userId)

const isImage = (url) => /\.(png|jpe?g|gif|webp|bmp)$/i.test(url)

const loadDetail = async () => {
  loading.value = true
  try {
    const res = await reviewApi.detail(route.params.id)
    review.value = res.data
  } finally {
    loading.value = false
  }
}

const loadComments = async () => {
  const res = await reviewApi.getComments(route.params.id)
  comments.value = res.data || []
}

const toggleLike = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  const res = await reviewApi.toggleLike(route.params.id)
  review.value.likeCount = res.data.likeCount
  review.value.liked = res.data.liked
}

const setReply = (comment) => {
  replyTo.value = comment
  commentForm.value.content = `@${comment.username} `
}

const cancelReply = () => {
  replyTo.value = null
  commentForm.value.content = ''
}

const submitComment = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  if (!commentForm.value.content.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  commentSubmitting.value = true
  try {
    await reviewApi.addComment(route.params.id, {
      content: commentForm.value.content.trim(),
      parentId: replyTo.value?.id || null
    })
    ElMessage.success('评论成功')
    commentForm.value.content = ''
    replyTo.value = null
    loadComments()
    loadDetail()
  } finally {
    commentSubmitting.value = false
  }
}

const confirmDeleteReview = async () => {
  try {
    await ElMessageBox.confirm('确定删除这条评价吗？删除后不可恢复。', '删除评价', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await reviewApi.deleteReview(route.params.id)
    ElMessage.success('已删除')
    router.back()
  } catch (error) {}
}

const confirmDeleteComment = async (commentId) => {
  try {
    await ElMessageBox.confirm('确定删除这条评论吗？删除后不可恢复。', '删除评论', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await reviewApi.deleteComment(route.params.id, commentId)
    ElMessage.success('已删除')
    loadComments()
    loadDetail()
  } catch (error) {}
}

onMounted(() => {
  loadDetail()
  loadComments()
})
</script>

<style scoped>
.review-detail { padding: 24px 0; }
.container { max-width: 900px; margin: 0 auto; padding: 0 20px; }
.page-header {
  margin-bottom: 24px;
}
.card { border-radius: 10px; }
.review-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.review-meta { flex: 1; }
.review-user { font-weight: 600; color: #303133; }
.review-time { font-size: 12px; color: #909399; }
.review-content { margin: 10px 0; color: #303133; }
.review-actions { margin-left: auto; }
.like { font-size: 14px; margin-right: 4px; }
.liked { color: #f56c6c; }
.media-list { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
.media-item { display: flex; }
.video-tag { width:90px; height:90px; border-radius:6px; background:#f5f7fa; display:flex; align-items:center; justify-content:center; color:#909399; font-size:12px; }

.comment-list { display: flex; flex-direction: column; gap: 12px; }
.comment-item { border-bottom: 1px solid #f0f0f0; padding-bottom: 10px; }
.comment-header { display: flex; align-items: center; gap: 8px; }
.comment-meta { flex: 1; }
.comment-user { font-weight: 600; color: #303133; margin-right: 6px; }
.comment-time { font-size: 12px; color: #909399; }
.comment-content { margin: 6px 0 0 36px; color: #303133; }

.reply-list { margin-left: 36px; margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
.reply-item { font-size: 13px; color: #606266; }
.reply-user { font-weight: 600; margin-right: 4px; }
.reply-time { margin-left: 8px; color: #c0c4cc; }

.comment-form { margin-top: 16px; }
.comment-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.reply-tip { font-size: 12px; color: #909399; }
.comment-btns { display: flex; gap: 8px; }
</style>
