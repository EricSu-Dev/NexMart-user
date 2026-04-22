import request from '@/utils/request'

export const favoriteApi = {
  getList: (params) => request.get('/user/favorites', { params }),
  getStatus: (productId) => request.get(`/user/favorites/${productId}/status`),
  toggle: (productId) => request.post(`/user/favorites/${productId}/toggle`),
  removeBatch: (productIds) => request.delete('/user/favorites/batch', { data: productIds })
}
