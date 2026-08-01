import api from './index';

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  getMembershipPackages: () => api.get('/member/packages'),
  purchaseWithBalance: (groupId: number) => api.post('/member/purchase/balance', { groupId }),
  purchaseWithScore: (groupId: number) => api.post('/member/purchase/score', { groupId }),
  getPaymentOrders: (params?: { page?: number; size?: number; status?: number }) => api.get('/epay/orders', { params }),
  createPaymentOrder: (configId: number, levelId: number, payType = 'alipay') => api.post('/epay/order', { configId, levelId, payType }),
  queryPaymentOrder: (orderNo: string) => api.get(`/epay/query/${orderNo}`),
  activateCode: (code: string) => api.post('/member/activate', { code }),
  updateProfile: (data: { nickname?: string; avatar?: string }) =>
    api.put('/user/profile', data),
  getSignStatus: () => api.get('/user/signin/status'),
  signIn: () => api.post('/user/signin'),
  getScoreLogs: (params?: { p?: number }) => api.get('/user/signin/logs', { params }),
  getHistory: (params?: { p?: number }) => api.get('/user/history', { params }),
  getFavorites: (params?: { p?: number }) => api.get('/user/favorites', { params }),
  addHistory: (vodId: string, vodName: string, vodPic: string, remark: string) =>
    api.post('/user/history', { vodId, vodName, vodPic, remark }),
  addFavorite: (vodId: string, vodName: string, vodPic: string, type: string, remark: string) =>
    api.post('/user/favorites', { vodId, vodName, vodPic, type, remark }),
  removeFavorite: (vodId: string) => api.delete(`/user/favorites/${vodId}`),
};
