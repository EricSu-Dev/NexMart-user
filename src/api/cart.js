import request from '@/utils/request'

export const cartApi = {
  getList: () => request.get('/user/cart/list'),
  add: (data) => request.post('/user/cart', data),
  update: (id, quantity) => request.put(`/user/cart/${id}`, null, { params: { quantity } }),
  remove: (id) => request.delete(`/user/cart/${id}`),
  
  // 临时购物车相关接口
  addTemporary: (productId, quantity, specId) => 
    request.post('/user/cart/temporary', null, { 
      params: { productId, quantity, specId } 
    }),
  removeTemporary: (cartItemId) => 
    request.delete(`/user/cart/temporary/${cartItemId}`),
  clearAllTemporary: () => 
    request.delete('/user/cart/temporary/clearAll')
}
