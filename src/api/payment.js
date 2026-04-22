import request from '@/utils/request'

export const paymentApi = {
  // 发起支付，返回支付宝表单 HTML
  pay: (orderId) => request.post(`/user/payment/pay/${orderId}`, null, {
    responseType: 'text'   // 返回的是 HTML 字符串，不是 JSON
  })
}
