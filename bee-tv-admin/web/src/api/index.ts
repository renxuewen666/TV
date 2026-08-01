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
  grouped: () => request.get('/system/grouped'),
  getByGroup: (group: string) => request.get(`/system/group/${group}`),
  getValue: (key: string) => request.get(`/system/${key}`),
  update: (key: string, data: { value: string; remark?: string; group?: string }) => request.put(`/system/${key}`, data),
  batchUpdate: (items: Array<{ key: string; value: string; remark?: string; group?: string }>) => request.post('/system/config/batch', { items }),
  initDefaults: () => request.post('/system/config/init-defaults'),
  testEmail: (to: string) => request.post('/system/test-email', { to }),
  testWeather: (city: string) => request.post('/system/test-weather', { city }),
  getSourceRename: () => request.get('/system/source-rename'),
  updateSourceRename: (data: Record<string, string>) => request.put('/system/source-rename', data),
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
  createMember: (data: any) => request.post('/member/users', data),
  updateMember: (id: number, data: any) => request.put(`/member/users/${id}`, data),
  deleteMember: (id: number) => request.delete(`/member/users/${id}`),
  batchUpdateMembers: (data: { ids: number[]; action: string; levelId?: number; remark?: string }) => request.post('/member/users/batch', data),
  generateCodes: (data: { levelId: number; count: number }) => request.post('/member/codes/generate', data),
  getCodes: (params?: any) => request.get('/member/codes', { params }),
  updateCode: (id: number, data: any) => request.put(`/member/codes/${id}`, data),
  deleteCode: (id: number) => request.delete(`/member/codes/${id}`),
  batchDeleteCodes: (ids: number[]) => request.post('/member/codes/batch-delete', { ids }),
  exportableCodes: (params?: any) => request.get('/member/exportable-codes', { params }),
  activate: (data: { code: string }) => request.post('/member/activate', data),
  getBalanceLogs: (params?: any) => request.get('/member/balance-logs', { params }),
  getScoreLogs: (params?: any) => request.get('/member/score-logs', { params }),
  recharge: (userId: string, data: { amount: number; method: string; remark?: string }) => request.post(`/member/recharge/${userId}`, data),
  getRules: (params?: any) => request.get('/member/rules', { params }),
  createRule: (data: any) => request.post('/member/rules', data),
  updateRule: (id: number, data: any) => request.put(`/member/rules/${id}`, data),
  deleteRule: (id: number) => request.delete(`/member/rules/${id}`),
  // 会员分组
  getGroups: (params?: any) => request.get('/member/groups', { params }),
  createGroup: (data: any) => request.post('/member/groups', data),
  updateGroup: (id: number, data: any) => request.put(`/member/groups/${id}`, data),
  removeGroup: (id: number) => request.delete(`/member/groups/${id}`),
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
  getScripts: (params?: any) => request.get('/repo/scripts', { params }),
  createScript: (data: any) => request.post('/repo/scripts', data),
  updateScript: (id: number, data: any) => request.put(`/repo/scripts/${id}`, data),
  deleteScript: (id: number) => request.delete(`/repo/scripts/${id}`),
  getScriptsByRepo: (repoId: number) => request.get(`/repo/scripts/by-repo/${repoId}`),
  testScript: (id: number) => request.post(`/repo/scripts/${id}/test`),
}

export const homeLayoutApi = {
  list: (type?: string, page?: string) => request.get('/home-layout', { params: { ...(type ? { type } : {}), ...(page ? { page } : {}) } }),
  create: (data: any) => request.post('/home-layout', data),
  update: (id: number, data: any) => request.put(`/home-layout/${id}`, data),
  activate: (id: number) => request.put(`/home-layout/${id}`, { status: 1 }),
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

export const clientAppApi = {
  list: () => request.get('/client-apps'),
  create: (data: any) => request.post('/client-apps', data),
  update: (id: number, data: any) => request.put(`/client-apps/${id}`, data),
  remove: (id: number) => request.delete(`/client-apps/${id}`),
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

export const adminLogApi = {
  list: (params?: any) => request.get('/admin-logs', { params }),
  clear: () => request.delete('/admin-logs'),
}

export const databaseApi = {
  listBackups: () => request.get('/database/backups'),
  backup: () => request.post('/database/backup'),
  restore: (filename: string) => request.post(`/database/restore/${filename}`),
  deleteBackup: (filename: string) => request.delete(`/database/backups/${filename}`),
  downloadUrl: (filename: string) => `/api/database/backups/${filename}/download`,
  tables: () => request.get('/database/tables'),
  columns: (table: string) => request.get(`/database/tables/${table}/columns`),
  rows: (table: string, params?: any) => request.get(`/database/tables/${table}/rows`, { params }),
  query: (sql: string) => request.post('/database/query', { sql }),
  updateRow: (table: string, id: number, data: any) => request.put(`/database/tables/${table}/rows/${id}`, data),
  deleteRow: (table: string, id: number) => request.delete(`/database/tables/${table}/rows/${id}`),
  clearTable: (table: string) => request.delete(`/database/tables/${table}/rows`),
}

export const compileApi = {
  list: (params?: any) => request.get('/compile', { params }),
  create: (data: any) => request.post('/compile', data),
  trigger: (id: number) => request.post(`/compile/${id}/trigger`),
  checkStatus: (id: number) => request.get(`/compile/${id}/status`),
  download: async (taskId: number, artifactId: number) => {
    const token = localStorage.getItem('token')
    const response = await axios.get(`/api/compile/${taskId}/download/${artifactId}`, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  },
  remove: (id: number) => request.delete(`/compile/${id}`),
}

export const scoreApi = {
  getProducts: () => request.get('/score/products'),
  createProduct: (data: any) => request.post('/score/products', data),
  updateProduct: (id: number, data: any) => request.put(`/score/products/${id}`, data),
  deleteProduct: (id: number) => request.delete(`/score/products/${id}`),
  getExchanges: (params?: any) => request.get('/score/exchanges', { params }),
}

export const advertisementApi = {
  list: (params?: any) => request.get('/advertisement', { params }),
  active: (appId?: string) => request.get('/advertisement/active', { params: appId ? { appId } : {} }),
  create: (data: any) => request.post('/advertisement', data),
  update: (id: number, data: any) => request.put(`/advertisement/${id}`, data),
  remove: (id: number) => request.delete(`/advertisement/${id}`),
  updateSort: (id: number, sort: number) => request.put(`/advertisement/${id}/sort`, { sort }),
  batchDelete: (ids: number[]) => request.put('/advertisement/batch/delete', { ids }),
}

export const marqueeApi = {
  list: (params?: any) => request.get('/marquee', { params }),
  active: (appId?: string) => request.get('/marquee/active', { params: appId ? { appId } : {} }),
  create: (data: any) => request.post('/marquee', data),
  update: (id: number, data: any) => request.put(`/marquee/${id}`, data),
  remove: (id: number) => request.delete(`/marquee/${id}`),
  updateSort: (id: number, sort: number) => request.put(`/marquee/${id}/sort`, { sort }),
  batchDelete: (ids: number[]) => request.put('/marquee/batch/delete', { ids }),
}

export const danmakuApi = {
  list: (params?: any) => request.get('/danmaku', { params }),
  active: (appId?: string) => request.get('/danmaku/active', { params: appId ? { appId } : {} }),
  create: (data: any) => request.post('/danmaku', data),
  update: (id: number, data: any) => request.put(`/danmaku/${id}`, data),
  remove: (id: number) => request.delete(`/danmaku/${id}`),
  updateSort: (id: number, sort: number) => request.put(`/danmaku/${id}/sort`, { sort }),
  batchDelete: (ids: number[]) => request.put('/danmaku/batch/delete', { ids }),
  test: (id: number) => request.post(`/danmaku/${id}/test`),
}
