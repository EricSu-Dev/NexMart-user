import request from '@/utils/request'

export const seckillApi = {
  getActivityList: (activityType) => {
    const params = {}
    if (activityType !== undefined && activityType !== null) {
      params.activityType = activityType
    }
    return request.get('/user/seckill/activity/list', { params })
  },

  getProductItems: (activityId) =>
    request.get('/user/seckill/item/product/list', { params: { activityId } }),

  getCouponItems: (activityId) =>
    request.get('/user/seckill/item/coupon/list', { params: { activityId } }),

  createProductOrder: (data) =>
    request.post('/user/seckill/order/product', data),

  createCouponOrder: (seckillItemId) =>
    request.post('/user/seckill/order/coupon', null, { params: { seckillItemId } })
}
