import request from '@/utils/request'

export const historyApi = {
  // 记录浏览
  record: (productId) => request.post('/user/browse-history', null, { params: { productId } }),
  
  // 获取浏览记录列表
  getList: (params) => request.get('/user/browse-history', { params }),
  
  // 删除单条浏览记录
  remove: (id) => request.delete(`/user/browse-history/${id}`),
  
  // 清空全部浏览记录
  clear: () => request.delete('/user/browse-history')
}
