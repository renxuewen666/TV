import request from './request'
import axios from 'axios'

export const authApi = {
  login: (data: { username: string; password: string }) => request.post('/auth/login', data),
  getProfile: () => request.get('/auth/profile'),
}

export const dashboardApi = {
  getStats: () => request.get('/dashboard/stats'),
}

export const userApi = {
  list: () => request.get('/users'),
  create: (data: any) => request.post('/users', data),
  update: (id: number, data: any) => request.put(`/users/${id}`, data),
  remove: (id: number) => request.delete(`/users/${id}`),
}

export const systemApi = {
  list: () => request.get('/system'),
  getValue: (key: string) => request.get(`/system/${key}`),
  update: (key: string, data: { value: string; remark?: string }) => request.put(`/system/${key}`, data),
  exportConfig: async () => {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/system/data/export', {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },
  importConfig: (data: any) => request.post('/system/data/import', data),
}

export const memberApi = {
  getLevels: () => request.get('/member/levels'),
  createLevel: (data: any) => request.post('/member/levels', data),
  updateLevel: (id: number, data: any) => request.put(`/member/levels/${id}`, data),
  deleteLevel: (id: number) => request.delete(`/member/levels/${id}`),
  getMembers: (params?: any) => request.get('/member/users', { params }),
  generateCodes: (data: { levelId: number; count: number }) => request.post('/member/codes/generate', data),
  getCodes: (params?: any) => request.get('/member/codes', { params }),
}

export const paymentApi = {
  getConfigs: () => request.get('/payment/configs'),
  saveConfig: (channel: string, data: any) => request.put(`/payment/configs/${channel}`, data),
  updateStatus: (channel: string, status: number) => request.put(`/payment/configs/${channel}/status`, { status }),
  getOrders: (params?: any) => request.get('/payment/orders', { params }),
}

export const apiManageApi = {
  list: (type?: number) => request.get('/api-manage', { params: type !== undefined ? { type } : {} }),
  create: (data: any) => request.post('/api-manage', data),
  update: (id: number, data: any) => request.put(`/api-manage/${id}`, data),
  remove: (id: number) => request.delete(`/api-manage/${id}`),
  test: (id: number) => request.post(`/api-manage/${id}/test`),
}

export const repoApi = {
  list: () => request.get('/repo'),
  create: (data: any) => request.post('/repo', data),
  update: (id: number, data: any) => request.put(`/repo/${id}`, data),
  remove: (id: number) => request.delete(`/repo/${id}`),
  uploadJar: (id: number, data: FormData) => request.post(`/repo/${id}/upload`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  test: (id: number, data: { action: string; params?: string }) => request.post(`/repo/${id}/test`, data),
}

export const homeLayoutApi = {
  list: (type?: string) => request.get('/home-layout', { params: type ? { type } : {} }),
  create: (data: any) => request.post('/home-layout', data),
  update: (id: number, data: any) => request.put(`/home-layout/${id}`, data),
  remove: (id: number) => request.delete(`/home-layout/${id}`),
}

export const appManageApi = {
  getVersions: (channel?: string) => request.get('/app-manage/versions', { params: channel ? { channel } : {} }),
  createVersion: (data: any) => request.post('/app-manage/versions', data),
  updateVersion: (id: number, data: any) => request.put(`/app-manage/versions/${id}`, data),
  deleteVersion: (id: number) => request.delete(`/app-manage/versions/${id}`),
  getChannels: () => request.get('/app-manage/channels'),
  createChannel: (data: any) => request.post('/app-manage/channels', data),
  deleteChannel: (id: number) => request.delete(`/app-manage/channels/${id}`),
}

export const epayApi = {
  getConfigs: () => request.get('/epay/configs'),
  createConfig: (data: any) => request.post('/epay/configs', data),
  updateConfig: (id: number, data: any) => request.put(`/epay/configs/${id}`, data),
  deleteConfig: (id: number) => request.delete(`/epay/configs/${id}`),
  getOrders: (params?: any) => request.get('/epay/orders', { params }),
}

export const noticeApi = {
  list: (params?: any) => request.get('/notice', { params }),
  active: () => request.get('/notice/active'),
  create: (data: any) => request.post('/notice', data),
  update: (id: number, data: any) => request.put(`/notice/${id}`, data),
  remove: (id: number) => request.delete(`/notice/${id}`),
}

export const hotsearchApi = {
  list: () => request.get('/hotsearch'),
  active: () => request.get('/hotsearch/active'),
  create: (data: any) => request.post('/hotsearch', data),
  update: (id: number, data: any) => request.put(`/hotsearch/${id}`, data),
  remove: (id: number) => request.delete(`/hotsearch/${id}`),
}

export const signinApi = {
  getLogs: (params?: any) => request.get('/signin/logs', { params }),
  getScores: (params?: any) => request.get('/signin/scores', { params }),
}

export const databaseApi = {
  listBackups: () => request.get('/database/backups'),
  backup: () => request.post('/database/backup'),
  restore: (filename: string) => request.post(`/database/restore/${filename}`),
  deleteBackup: (filename: string) => request.delete(`/database/backups/${filename}`),
  downloadUrl: (filename: string) => `/api/database/backups/${filename}/download`,
}

export const compileApi = {
  list: (params?: any) => request.get('/compile', { params }),
  create: (data: any) => request.post('/compile', data),
  trigger: (id: number) => request.post(`/compile/${id}/trigger`),
  checkStatus: (id: number) => request.get(`/compile/${id}/status`),
  remove: (id: number) => request.delete(`/compile/${id}`),
}

export const scoreApi = {
  getProducts: () => request.get('/score/products'),
  createProduct: (data: any) => request.post('/score/products', data),
  updateProduct: (id: number, data: any) => request.put(`/score/products/${id}`, data),
  deleteProduct: (id: number) => request.delete(`/score/products/${id}`),
  getExchanges: (params?: any) => request.get('/score/exchanges', { params }),
}
