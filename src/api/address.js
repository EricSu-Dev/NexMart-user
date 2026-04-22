import request from '@/utils/request'

export const addressApi = {
  // 获取当前用户所有地址
  list: () => request.get('/user/address/list'),

  // 新增地址
  add: (data) => request.post('/user/address/add', data),

  // 修改地址
  update: (data) => request.put('/user/address/update', data),

  // 设置默认地址
  setDefault: (id) => request.put(`/user/address/default/${id}`),

  // 删除地址
  remove: (id) => request.delete(`/user/address/${id}`),

  // 获取地址详情
  getById: (id) => request.get(`/user/address/${id}`)
}
