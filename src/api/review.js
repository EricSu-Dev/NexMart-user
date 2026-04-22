import request from '@/utils/request'

export const reviewApi = {
  create: (data) => request.post('/user/reviews', data),
  list: (params) => request.get('/user/reviews', { params }),
  detail: (id) => request.get(`/user/reviews/${id}`),
  toggleLike: (id) => request.post(`/user/reviews/${id}/like`),
  getComments: (id) => request.get(`/user/reviews/${id}/comments`),
  addComment: (id, data) => request.post(`/user/reviews/${id}/comments`, data),
  deleteReview: (id) => request.delete(`/user/reviews/${id}`),
  deleteComment: (reviewId, commentId) => request.delete(`/user/reviews/${reviewId}/comments/${commentId}`)
}
