import request from '@/utils/request'

export const pointsApi = {
  // 查询积分商城列表
  getMallList: () => request.get('/user/points/mall'),

  // 执行积分兑换
  exchangePoints: (itemId) => request.post(`/user/points/exchange/${itemId}`),

  // 积分流水分页
  getPointsLogs: (params) => request.get('/user/points/logs', { params })
}
