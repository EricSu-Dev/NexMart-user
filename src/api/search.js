import request from '@/utils/request'

export const searchApi = {
  getHotKeywords: () => request.get('/user/search/hot')
}