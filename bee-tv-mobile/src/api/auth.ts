import api from './index';

export interface LoginParams {
  account: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  nickname: string;
  password: string;
}

export const authAPI = {
  login: (params: LoginParams) => api.post('/member-auth/login', params),
  register: (params: RegisterParams) => api.post('/member-auth/register', params),
  getMe: () => api.get('/member-auth/me'),
};
