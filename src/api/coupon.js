import request from '@/utils/request'

export const couponApi = {
  // 获取可领券列表
  getReceivableList: (params) => request.get('/user/coupon/list', { params }),
  
  // 领取优惠券
  receiveCoupon: (id) => request.post(`/user/coupon/${id}/receive`),
  
  // 我的券包
  getMyCoupons: (params) => request.get('/user/coupon/my', { params }),

  // 获取结算页可用订单优惠券
  getAvailableOrderCoupons: (cartItemIds) => request.get('/user/coupon/available/orderCoupon', {
    params: { cartItemIds: cartItemIds.join(',') }
  }),

  // 获取结算页可用商品优惠券
  getAvailableProductCoupons: (cartItemId) => request.get('/user/coupon/available/productCoupon', {
    params: { cartItemId }
  })
}
