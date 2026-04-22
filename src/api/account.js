import request from '@/utils/request'

export const accountApi = {
  updateProfile: (data) => request.put('/common/profile', data),
  updatePassword: (data) => request.put('/common/profile/password', data)
}
