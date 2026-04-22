import request from '@/utils/request'

export const homeApi = {
  getHomeSections: () => request.get('/user/home/section')
}
