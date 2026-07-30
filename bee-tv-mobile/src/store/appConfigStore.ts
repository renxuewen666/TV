import { create } from 'zustand';
import { appConfigAPI, MobileAppConfig } from '../api/appConfig';

interface AppConfigState {
  config: MobileAppConfig | null;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
}

const cacheKey = 'bee_tv_app_config';

const readCache = (): MobileAppConfig | null => {
  try {
    const raw = localStorage.getItem(cacheKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAppConfigStore = create<AppConfigState>((set) => ({
  config: readCache(),
  loading: false,
  error: null,
  fetchConfig: async () => {
    set({ loading: true, error: null });
    try {
      const res = await appConfigAPI.getConfig('h5');
      const config = res.data;
      localStorage.setItem(cacheKey, JSON.stringify(config));
      set({ config, loading: false });
    } catch (e: any) {
      set({ error: e?.message || '配置加载失败', loading: false });
    }
  },
}));
