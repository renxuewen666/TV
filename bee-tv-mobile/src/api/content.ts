import api from './index';

export interface VideoItem {
  id: string;
  name: string;
  pic: string;
  type: string;
  remark: string;
  year: string;
  area: string;
  lang: string;
  actor: string;
  director: string;
  desc: string;
  last: string;
}

export interface VideoListResponse {
  list: VideoItem[];
  total: number;
  page: number;
  pagecount: number;
}

export const contentAPI = {
  getHome: (params?: { p?: number; t?: string; f?: string }) =>
    api.get('/content/home', { params }),
  getDetail: (id: string) => api.get(`/content/detail`, { params: { id } }),
  search: (keyword: string, params?: { p?: number }) =>
    api.get('/content/search', { params: { keyword, ...params } }),
  getTypes: () => api.get('/content/types'),
};
