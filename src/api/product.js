import request from '@/utils/request'

export const productApi = {
  getPage: (params) => request.get('/user/product/page', { params }),
  getDetail: (id) => request.get(`/user/product/${id}`)
}
