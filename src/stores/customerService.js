import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { customerServiceApi } from '@/api/customerService'
import { ElMessage, ElMessageBox } from 'element-plus'

const RECONNECT_DELAY = 3000
const UNREAD_POLL_INTERVAL = 5000

export const useCustomerServiceStore = defineStore('customerService', () => {
  const session = ref(null)
  const unreadCount = ref(0)
  const wsConnected = ref(false)
  const currentSessionId = ref(null)
  const chatActive = ref(false)
  const socket = ref(null)

  let heartbeatTimer = null
  let unreadPollTimer = null
  let reconnectTimer = null
  let manualClose = false
  let onMessageCallback = null

  const getUnreadCount = computed(() => unreadCount.value)

  function getUserId() {
    try {
      const rawUser = localStorage.getItem('nexmart_user')
      return rawUser ? JSON.parse(rawUser).id : null
    } catch (error) {
      console.error('Failed to parse current user for customer service websocket:', error)
      return null
    }
  }

  async function initSession(force = false) {
    if (!force && session.value?.id) {
      currentSessionId.value = session.value.id
      return session.value
    }

    const res = await customerServiceApi.createOrGetSession()
    session.value = res.data || null
    currentSessionId.value = session.value?.id ?? null
    if (currentSessionId.value && !chatActive.value) {
      fetchUnreadCount(currentSessionId.value)
    }
    return session.value
  }

  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  function stopUnreadPolling() {
    if (unreadPollTimer) {
      clearInterval(unreadPollTimer)
      unreadPollTimer = null
    }
  }

  function sendWsMessage(data) {
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
      return false
    }

    try {
      socket.value.send(JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Failed to send customer service websocket message:', error)
      return false
    }
  }

  function clearUnreadCount() {
    unreadCount.value = 0
  }

  function setUnreadCount(count) {
    unreadCount.value = Math.max(0, Number(count) || 0)
  }

  function incrementUnreadCount(step = 1) {
    unreadCount.value += step
  }

  async function fetchUnreadCount(sessionId = currentSessionId.value) {
    if (!sessionId || chatActive.value) {
      return 0
    }

    try {
      const res = await customerServiceApi.getUnreadCount(sessionId)
      setUnreadCount(res.data)
      return unreadCount.value
    } catch (error) {
      console.error('Failed to fetch customer service unread count:', error)
      return unreadCount.value
    }
  }

  function startUnreadPolling() {
    if (chatActive.value || !currentSessionId.value) {
      stopUnreadPolling()
      return
    }

    stopUnreadPolling()
    fetchUnreadCount(currentSessionId.value)
    unreadPollTimer = setInterval(() => {
      fetchUnreadCount(currentSessionId.value)
    }, UNREAD_POLL_INTERVAL)
  }

  function sendReadAck(sessionId = currentSessionId.value) {
    if (!chatActive.value || !sessionId) {
      return false
    }

    const sent = sendWsMessage({
      action: 'READ_ACK',
      sessionId
    })

    if (sent) {
      clearUnreadCount()
    }

    return sent
  }

  function startHeartbeat() {
    if (!chatActive.value) {
      stopHeartbeat()
      return
    }

    stopHeartbeat()
    heartbeatTimer = setInterval(() => {
      sendReadAck()
    }, 3000)
  }

  function showSeckillPopup(msg) {
    const isSuccess = msg.success
    ElMessageBox.alert(
      isSuccess ? '恭喜您抢购成功！' : (msg.message || '很遗憾，抢购失败'),
      isSuccess ? '抢购成功' : '抢购失败',
      {
        type: isSuccess ? 'success' : 'error',
        confirmButtonText: '我知道了',
        showClose: true,
        closeOnClickModal: false,
        closeOnPressEscape: false,
      }
    ).then(() => {
      sessionStorage.removeItem('pendingSeckillResult')
    }).catch(() => {
      sessionStorage.removeItem('pendingSeckillResult')
    })
  }

  function checkPendingSeckillResult() {
    const pending = sessionStorage.getItem('pendingSeckillResult')
    if (pending) {
      try {
        showSeckillPopup(JSON.parse(pending))
      } catch (e) {
        sessionStorage.removeItem('pendingSeckillResult')
      }
    }
  }

  function handleIncomingMessage(msg) {
    if (msg?.type === 'SECKILL_RESULT' || msg?.action === 'SECKILL_RESULT') {
      sessionStorage.setItem('pendingSeckillResult', JSON.stringify(msg))
      showSeckillPopup(msg)
      window.dispatchEvent(new CustomEvent('seckill-result', { detail: msg }))
      return
    }

    const isCurrentSession =
      !msg?.sessionId ||
      !currentSessionId.value ||
      String(msg.sessionId) === String(currentSessionId.value)

    if (msg?.action === 'READ_ACK' && isCurrentSession) {
      clearUnreadCount()
    }

    if (msg?.id && msg.senderType !== 1 && isCurrentSession) {
      if (chatActive.value) {
        clearUnreadCount()
        setTimeout(() => {
          sendReadAck(msg.sessionId || currentSessionId.value)
        }, 0)
      } else {
        incrementUnreadCount()
        fetchUnreadCount(msg.sessionId || currentSessionId.value)
      }
    }

    if (onMessageCallback) {
      onMessageCallback(msg)
    }
  }

  function scheduleReconnect() {
    if (manualClose || reconnectTimer || !getUserId()) {
      return
    }

    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null
      try {
        if (!currentSessionId.value) {
          await initSession()
        }
        connectWebSocket(currentSessionId.value)
      } catch (error) {
        console.error('Failed to reconnect customer service websocket:', error)
        scheduleReconnect()
      }
    }, RECONNECT_DELAY)
  }

  function connectWebSocket(sessionId = currentSessionId.value) {
    const userId = getUserId()
    if (!userId) {
      return null
    }

    if (sessionId) {
      currentSessionId.value = sessionId
    }

    const currentSocket = socket.value
    if (currentSocket && (currentSocket.readyState === WebSocket.OPEN || currentSocket.readyState === WebSocket.CONNECTING)) {
      return currentSocket
    }

    manualClose = false
    clearReconnectTimer()

    const ws = new WebSocket(`ws://localhost:8087/ws/cs/websocket?userId=${userId}&role=ROLE_USER`)
    socket.value = ws

    ws.onopen = () => {
      wsConnected.value = true
      if (chatActive.value) {
        sendReadAck()
        startHeartbeat()
      } else {
        startUnreadPolling()
      }
    }

    ws.onerror = (error) => {
      console.error('Customer service websocket error:', error)
      wsConnected.value = false
    }

    ws.onclose = () => {
      if (socket.value === ws) {
        socket.value = null
      }
      wsConnected.value = false
      stopHeartbeat()
      stopUnreadPolling()

      if (!manualClose) {
        scheduleReconnect()
      }
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        console.log('【WebSocket】收到消息:', msg)
        handleIncomingMessage(msg)
      } catch (error) {
        console.error('Failed to parse customer service websocket message:', error)
      }
    }

    return ws
  }

  function setOnMessageCallback(callback) {
    onMessageCallback = typeof callback === 'function' ? callback : null
  }

  function setChatActive(active) {
    chatActive.value = active

    if (active) {
      stopUnreadPolling()
      clearUnreadCount()
      if (wsConnected.value) {
        sendReadAck()
        startHeartbeat()
      }
      return
    }

    stopHeartbeat()
    startUnreadPolling()
  }

  function disconnect() {
    manualClose = true
    clearReconnectTimer()
    stopHeartbeat()
    stopUnreadPolling()
    onMessageCallback = null
    clearUnreadCount()
    chatActive.value = false
    currentSessionId.value = null
    session.value = null

    if (socket.value) {
      const ws = socket.value
      socket.value = null
      ws.onopen = null
      ws.onmessage = null
      ws.onerror = null
      ws.onclose = null
      ws.close()
    }

    wsConnected.value = false
  }

  return {
    session,
    unreadCount,
    wsConnected,
    currentSessionId,
    socket,
    getUnreadCount,
    initSession,
    connectWebSocket,
    sendWsMessage,
    sendReadAck,
    fetchUnreadCount,
    startUnreadPolling,
    stopUnreadPolling,
    startHeartbeat,
    stopHeartbeat,
    incrementUnreadCount,
    clearUnreadCount,
    setOnMessageCallback,
    setChatActive,
    disconnect,
    checkPendingSeckillResult
  }
})
