import request from '@/utils/request'

export const orderApi = {
  create: (data) => request.post('/user/order/create', data),
  preview: (data) => request.post('/user/order/preview', data),
  getMyOrders: (params) => request.get('/user/order/my', { params }),
  getDetail: (id) => request.get(`/user/order/${id}`),
  cancel: (id) => request.put(`/user/order/${id}/cancel`),
  confirm: (id) => request.put(`/user/order/${id}/confirm`),
  applyRefund: (data) => request.post(`/user/refund/${data.orderId}/apply`, {
    orderItemId: data.orderItemId,
    reason: data.reason,
    images: data.images,
    expectedRefundAmount: data.expectedRefundAmount
  }),
  getReturnDetail: (id) => request.get(`/user/refund/detail/${id}`),
  cancelRefund: (returnOrderId) => request.put(`/user/refund/${returnOrderId}/cancelApply`),
  rebuy: (orderId) => request.post(`/user/order/${orderId}/rebuy`)
}
