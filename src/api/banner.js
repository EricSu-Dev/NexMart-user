import request from '@/utils/request'

export const bannerApi = {
  getList: () => request.get('/user/banner')
}