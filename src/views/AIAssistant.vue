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
            <div class="text-inner" v-html="formatMessage(msg.content)"></div>
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
import { ChatLineRound, Promotion, Delete } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const userStore = useUserStore()
const inputText = ref('')
const isSending = ref(false)
const isTyping = ref(false)
const messages = ref([])
const messageListRef = ref(null)

// 自动滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTo({
      top: messageListRef.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

// 格式化消息内容 (支持简单换行等)
const formatMessage = (content) => {
  if (!content) return ''
  return content.replace(/\n/g, '<br>')
}

const handleClearHistory = () => {
  ElMessageBox.confirm(
    '确认要清空与 AI 助手的聊天历史吗？该操作不可撤销。',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await request.delete('/ai/chat/history')
      messages.value = []
      ElMessage.success('聊天记录已清空')
    } catch (error) {
      // request helper handled message already
    }
  }).catch(() => {})
}

const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || isSending.value) return

  // 添加用户消息
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  isSending.value = true
  isTyping.value = true
  await scrollToBottom()

  let aiMsgIndex = -1

  try {
    const token = localStorage.getItem('nexmart_token')
    const url = `/api/ai/chat?message=${encodeURIComponent(text)}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })

    if (!response.ok) {
      throw new Error('网络异常，请稍后再试')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    // 处理消息行的闭包，减少重复代码
    const processDataLine = (line) => {
      const trimmedLine = line.trim()
      if (!trimmedLine || !trimmedLine.startsWith('data:')) return false
      
      const content = trimmedLine.replace(/^data:\s?/, '')
      if (content.trim() === '[DONE]') return true

      // 首次收到有效数据时，隐藏加载动画并显示 AI 消息气泡
      if (aiMsgIndex === -1) {
        isTyping.value = false
        aiMsgIndex = messages.value.length
        messages.value.push({ role: 'ai', content: '' })
      }
      
      if (aiMsgIndex !== -1) {
        messages.value[aiMsgIndex].content += content
        scrollToBottom()
      }
      return false
    }

    // 持续读取流
    const timeoutSeconds = 15 // 15秒无响应自动断开保护
    let timeoutId = null

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        console.warn('AI 响应超时，强制结束')
        // 如果卡在 reader.read()，我们没法直接中断它，但我们可以强制进入 finally 并解锁 UI
        throw new Error('AI 响应超时，请稍后再试')
      }, timeoutSeconds * 1000)
    }

    resetTimeout()

    while (true) {
      const { done, value } = await reader.read()
      resetTimeout() // 每次有新数据都重置超时

      if (value) {
        buffer += decoder.decode(value, { stream: true })
        
        // 循环处理缓冲区中的完整行
        let lineEndIndex
        while ((lineEndIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, lineEndIndex)
          buffer = buffer.slice(lineEndIndex + 1)
          if (processDataLine(line)) {
            if (timeoutId) clearTimeout(timeoutId)
            return 
          }
        }

        // 安全检查：如果缓冲区中已经包含了 [DONE]，即使没有换行符也提前处理
        if (buffer.includes('[DONE]')) {
          const doneIndex = buffer.indexOf('[DONE]')
          const beforeDone = buffer.slice(0, doneIndex)
          if (beforeDone.includes('data:')) {
             processDataLine(beforeDone)
          }
          if (timeoutId) clearTimeout(timeoutId)
          return
        }
      }

      if (done) {
        if (timeoutId) clearTimeout(timeoutId)
        // 流结束后的最后处理：处理缓冲区残留内容
        if (buffer.trim()) {
          processDataLine(buffer)
        }
        break
      }
    }
  } catch (error) {
    console.error('AI Chat Error:', error)
    if (error.name !== 'AbortError') {
      ElMessage.error(error.message || '获取 AI 响应失败')
      if (aiMsgIndex === -1) {
        messages.value.push({ role: 'ai', content: '抱歉，目前服务遇到一点问题，请稍后再试。' })
      }
    }
  } finally {
    // 强制恢复状态，确保 UI 解锁
    isTyping.value = false
    isSending.value = false
    await scrollToBottom()
  }
}

const loadHistory = async () => {
  try {
    const res = await request.get('/ai/chat/history')
    if (res.data && Array.isArray(res.data)) {
      // 后端 role: 1 为用户, 2 为 AI
      messages.value = res.data.map(item => ({
        role: item.role === 2 ? 'ai' : 'user',
        content: item.content
      }))
      await scrollToBottom()
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
  }
}

onMounted(() => {
  loadHistory()
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
