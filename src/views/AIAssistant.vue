<template>
  <div class="ai-assistant-container">
    <!-- 顶部标题栏 -->
    <header class="chat-header">
      <div class="header-content">
        <el-icon class="nex-logo"><ChatLineRound /></el-icon>
        <span class="title">Nex</span>
        <el-tag size="small" type="primary" effect="dark" round class="status-tag">AI 助手</el-tag>
      </div>
      <el-button 
        link 
        type="info" 
        :icon="Delete" 
        :disabled="isSending"
        @click="handleClearHistory"
        class="clear-btn"
      >
        清空历史
      </el-button>
    </header>

    <!-- 消息滚动区 -->
    <main class="chat-messages" ref="messageListRef">
      <div v-if="messages.length === 0" class="welcome-section">
        <el-avatar :size="80" src="/logo.png" class="ai-large-avatar">Nex</el-avatar>
        <h3>你好，我是 Nex</h3>
        <p>你的智能购物助手，有什么我可以帮你的吗？</p>
      </div>
      
      <div 
        v-for="(msg, index) in messages" 
        :key="index" 
        :class="['message-item', msg.role === 'user' ? 'user-message' : 'ai-message']"
      >
        <div class="avatar-wrap">
          <el-avatar v-if="msg.role === 'ai'" :size="40" class="ai-avatar">Nex</el-avatar>
          <el-avatar v-else :size="40" :src="userStore.userInfo?.avatarUrl" class="user-avatar">
            {{ userStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
          </el-avatar>
        </div>
        <div class="bubble-content">
          <div class="bubble">
            <div class="text-inner">{{ msg.content }}</div>
          </div>
        </div>
      </div>

      <!-- 正在输入提示 -->
      <div v-if="isTyping" class="message-item ai-message typing-indicator">
        <div class="avatar-wrap">
          <el-avatar :size="40" class="ai-avatar">Nex</el-avatar>
        </div>
        <div class="bubble-content">
          <div class="bubble">
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部输入框区 -->
    <footer class="chat-footer">
      <div class="input-area">
        <el-input
          v-model="inputText"
          placeholder="输入您的问题..."
          maxlength="500"
          show-word-limit
          :disabled="isSending"
          @keyup.enter="handleSend"
          resize="none"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 4 }"
          class="custom-input"
        />
        <el-button 
          type="primary" 
          :icon="Promotion" 
          :disabled="!inputText.trim() || isSending"
          @click="handleSend"
          class="send-btn"
        >
          发送
        </el-button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChatLineRound, Promotion, Delete } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()
const inputText = ref('')
const isSending = ref(false)
const isTyping = ref(false)
const messages = ref([])
const messageListRef = ref(null)
let activeController = null
let historyVersion = 0
let mounted = false
let historyLoaded = false
let lastKnownHistoryId = 0

const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTo({ top: messageListRef.value.scrollHeight, behavior: 'smooth' })
  }
}

const showHistory = async (items) => {
  const ordered = [...items].sort((a, b) => Number(a.id) - Number(b.id))
  lastKnownHistoryId = ordered.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0)
  messages.value = ordered.map(item => ({
    role: item.role === 2 ? 'ai' : 'user',
    content: (item.content || '').replace(/\[DONE\]/g, '')
  }))
  await scrollToBottom()
}

const fetchSavedHistory = async (timeoutMs = 5000) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch('/api/ai/chat/history', {
      headers: { Authorization: `Bearer ${userStore.token}` },
      signal: controller.signal
    })
    if (!response.ok) return null
    const result = await response.json()
    return result.code === 200 && Array.isArray(result.data)
      ? result.data.sort((a, b) => Number(a.id) - Number(b.id)) : null
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

const recoverSavedReply = async (question, previousId, version) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!mounted || historyVersion !== version) return false
    const items = await fetchSavedHistory()
    if (items?.length >= 2) {
      const [savedQuestion, savedAnswer] = items.slice(-2)
      if (savedQuestion.role === 1 && savedQuestion.content === question &&
          savedAnswer.role === 2 && Number(savedQuestion.id) > previousId) {
        if (!mounted || historyVersion !== version) return false
        await showHistory(items)
        return true
      }
    }
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 750))
  }
  return false
}

const handleClearHistory = () => {
  ElMessageBox.confirm('确认要清空与 AI 助手的聊天历史吗？该操作不可撤销。', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(async () => {
    activeController?.abort()
    historyVersion++
    try {
      await request.delete('/ai/chat/history')
      messages.value = []
      lastKnownHistoryId = 0
      historyLoaded = true
      ElMessage.success('聊天记录已清空')
    } catch (error) {
      ElMessage.error('清空历史失败，请重试')
    }
  }).catch(() => {})
}

const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || isSending.value) return
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }

  const version = ++historyVersion
  const previousHistoryId = lastKnownHistoryId
  const canRecover = historyLoaded
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  isSending.value = true
  isTyping.value = true
  await scrollToBottom()

  const controller = new AbortController()
  activeController = controller
  let timeoutId = null
  let timedOut = false
  let aiMsgIndex = -1
  let completed = false
  let streamStarted = false
  const resetTimeout = (delay = 45000) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, delay)
  }

  const processEvent = (block) => {
    const lines = block.split(/\r?\n/)
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).replace(/^ /, ''))
    if (lines.length === 0) return false
    const raw = lines.join('\n')
    let content = raw
    try {
      const decoded = JSON.parse(raw)
      if (typeof decoded === 'string') content = decoded
    } catch {
      // Allow plain SSE text during a rolling backend update.
    }
    if (content === '[DONE]') return true
    if (content === '[ERROR]') throw new Error('AI 回复中断，请重试')
    if (aiMsgIndex === -1) {
      isTyping.value = false
      aiMsgIndex = messages.value.length
      messages.value.push({ role: 'ai', content: '' })
    }
    messages.value[aiMsgIndex].content += content
    scrollToBottom()
    return false
  }

  try {
    resetTimeout(30000)
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStore.token}`
      },
      body: JSON.stringify({ message: text }),
      signal: controller.signal
    })
    if (response.status === 401) {
      userStore.logout()
      router.push('/login')
      throw new Error('登录已过期，请重新登录')
    }
    if (response.status === 429) throw new Error('提问过于频繁，请稍后再试')
    if (!response.ok || !response.body || !response.headers.get('content-type')?.includes('text/event-stream')) {
      throw new Error('AI 服务暂时不可用，请稍后重试')
    }
    streamStarted = true

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        buffer += decoder.decode()
      } else {
        resetTimeout()
        buffer += decoder.decode(value, { stream: true })
      }
      let boundary
      while ((boundary = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const block = buffer.slice(0, boundary)
        const separator = buffer.slice(boundary).match(/^\r?\n\r?\n/)[0]
        buffer = buffer.slice(boundary + separator.length)
        if (processEvent(block)) {
          completed = true
          break
        }
      }
      if (completed) break
      if (done) {
        if (buffer.trim() && processEvent(buffer)) completed = true
        break
      }
    }
    if (!completed) throw new Error('AI 回复中断，请重试')
    const savedHistory = await fetchSavedHistory(3000)
    historyLoaded = Array.isArray(savedHistory)
    if (historyLoaded) {
      lastKnownHistoryId = savedHistory.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0)
    }
  } catch (error) {
    if (mounted && (!controller.signal.aborted || timedOut)) {
      const recovered = streamStarted && canRecover &&
        await recoverSavedReply(text, previousHistoryId, version)
      if (!recovered) {
        ElMessage.error(timedOut ? 'AI 响应超时，请重试' : error.message || '获取 AI 回复失败')
        if (aiMsgIndex === -1) {
          messages.value.push({ role: 'ai', content: '抱歉，本次回复失败，请稍后重试。' })
        } else if (!messages.value[aiMsgIndex].content.includes('[回复中断或历史保存失败')) {
          messages.value[aiMsgIndex].content += '\n\n[回复中断，请重试]'
        }
      }
    }
  } finally {
    clearTimeout(timeoutId)
    if (activeController === controller) activeController = null
    if (mounted) {
      isTyping.value = false
      isSending.value = false
      await scrollToBottom()
    }
  }
}

const loadHistory = async () => {
  const version = historyVersion
  try {
    const res = await request.get('/ai/chat/history')
    if (mounted && version === historyVersion && Array.isArray(res.data)) {
      await showHistory(res.data)
      historyLoaded = true
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
    historyLoaded = false
  }
}

onMounted(() => {
  mounted = true
  loadHistory()
})
onUnmounted(() => {
  mounted = false
  activeController?.abort()
})
</script>

<style scoped>
.ai-assistant-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--nav-height, 64px) - 60px);
  max-width: 800px;
  margin: 0 auto;
  background: #f8fafc;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #eaedf0;
}

/* Header */
.chat-header {
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #eaedf0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nex-logo {
  font-size: 24px;
  color: var(--primary-color, #409eff);
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.status-tag {
  font-weight: normal;
  padding: 0 8px;
}

.clear-btn {
  margin-left: auto;
  color: #94a3b8;
  transition: all 0.3s;
}

.clear-btn:hover {
  color: var(--danger-color, #f56c6c);
}

/* Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 60px;
  color: #64748b;
  text-align: center;
}

.ai-avatar, .ai-large-avatar {
  background: linear-gradient(135deg, #409eff 0%, #36a3f7 100%) !important;
  color: #fff !important;
  font-weight: bold;
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 2px 10px rgba(64, 158, 255, 0.3);
}

.ai-large-avatar {
  margin-bottom: 16px;
}

.user-avatar {
  background: var(--primary-color, #409eff) !important;
  color: #fff !important;
}

.welcome-section h3 {
  color: #1e293b;
  margin-bottom: 8px;
}

.message-item {
  display: flex;
  max-width: 85%;
  gap: 12px;
}

.ai-message {
  align-self: flex-start;
}

.user-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.avatar-wrap {
  flex-shrink: 0;
}

.bubble-content {
  display: flex;
  flex-direction: column;
}

.bubble {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.6;
  position: relative;
  word-break: break-word;
}

.ai-message .bubble {
  background: #fff;
  color: #1e293b;
  border-bottom-left-radius: 2px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  border: 1px solid #eaedf0;
}

.user-message .bubble {
  background: var(--primary-color, #409eff);
  color: #fff;
  border-bottom-right-radius: 2px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.text-inner {
  white-space: pre-wrap;
}

/* Typing Indicator */
.typing-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #94a3b8;
  border-radius: 50%;
  animation: typing 1s infinite ease-in-out;
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* Footer */
.chat-footer {
  padding: 20px 24px;
  background: #fff;
  border-top: 1px solid #eaedf0;
}

.input-area {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  max-width: 1000px;
  margin: 0 auto;
}

.custom-input :deep(.el-textarea__inner) {
  border-radius: 12px;
  padding: 10px 16px;
  background: #f1f5f9;
  border: 1px solid transparent;
  transition: all 0.3s;
}

.custom-input :deep(.el-textarea__inner:focus) {
  background: #fff;
  border-color: var(--primary-color, #409eff);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.send-btn {
  height: 40px;
  padding: 0 20px;
  border-radius: 10px;
  font-weight: 600;
}

/* 隐藏滚动条但保留功能 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}
</style>
