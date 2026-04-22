import request from '@/utils/request'

export const uploadApi = {
  image: (file) => {
    const form = new FormData()
    form.append('file', file)
    return request.post('/common/upload/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}
