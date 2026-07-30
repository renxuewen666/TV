import api from './index';

export interface AppLayoutSection {
  id?: number;
  type: string;
  data?: Record<string, any>;
  style?: Record<string, any>;
}

export interface MobileAppConfig {
  system?: any;
  advertisements?: any[];
  marquees?: any[];
  notices?: any[];
  hotsearches?: any[];
  danmaku?: any[];
  repos?: any[];
  repoScripts?: any[];
  apiEndpoints?: any[];
  layout?: {
    mobile?: { sections?: AppLayoutSection[] } | null;
    tv?: { sections?: AppLayoutSection[] } | null;
  };
  version?: any;
  configVersion?: string;
  generatedAt?: string;
}

export const appConfigAPI = {
  getConfig: (appId = 'h5') => api.get<MobileAppConfig>('/app-config', { params: { appId } }),
  getSummary: (appId = 'h5') => api.get('/app-config/summary', { params: { appId } }),
};
