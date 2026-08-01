import api from './index';

const H5_APP_ID = '10001';
const deviceKey = 'bee_tv_h5_device_id';

const getDeviceId = () => {
  let deviceId = localStorage.getItem(deviceKey);
  if (!deviceId) {
    deviceId = `h5-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    localStorage.setItem(deviceKey, deviceId);
  }
  return deviceId;
};

export interface LoginParams {
  account: string;
  password: string;
}

export interface RegisterParams {
  username?: string;
  email?: string;
  nickname?: string;
  password: string;
}

export const authAPI = {
  login: (params: LoginParams) => api.post('/member-auth/login', { ...params, appId: H5_APP_ID, deviceId: getDeviceId() }),
  register: (params: RegisterParams) => api.post('/member-auth/register', { ...params, appId: H5_APP_ID, deviceId: getDeviceId() }),
  getMe: () => api.get('/member-auth/me'),
};
