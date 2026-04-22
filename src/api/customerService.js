import request from '@/utils/request'

export const customerServiceApi = {
  createOrGetSession: () => request.post('/user/cs/session/create'),
  getMessages: (sessionId) => request.get(`/user/cs/session/${sessionId}/history`),
  getOrderCards: (params) => request.get('/user/cs/session/orderCards', { params }),
  getUnreadCount: (sessionId) => request.get('/user/cs/unreadCount', { params: { sessionId } })
}
