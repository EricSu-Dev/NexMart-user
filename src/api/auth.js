import request from '@/utils/request'

export const authApi = {
  login: (data) => request.post('/common/auth/login', data),
  register: (data) => request.post('/common/auth/register', data),
  getInfo: () => request.get('/common/auth/info'),
  sendResetCode: (phone) => request.post(`/common/auth/reset-code?phone=${phone}`),
  resetPassword: (data) => request.post('/common/auth/reset-password', data),
  sendChangePhoneCode: (originPhone, newPhone) => request.post('/common/profile/change-phone-code', null, { params: { originPhone, newPhone } }),
  changePhone: (data) => request.post('/common/profile/change-phone', data)
}
