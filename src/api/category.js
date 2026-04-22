import request from '@/utils/request'

export const categoryApi = {
  getList: () => request.get('/user/category/list')
}
