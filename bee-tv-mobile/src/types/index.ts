export interface User {
  id: number;
  email: string;
  nickname: string;
  avatar: string | null;
  memberLevel: number;
  memberExpireAt: string | null;
  score: number;
}

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

export interface VideoDetail extends VideoItem {
  playFrom: string[];
  episodeList: Record<string, Episode[]>;
}

export interface Episode {
  name: string;
  url: string;
}

export interface SignStatus {
  signed: boolean;
  consecutiveDays: number;
  todayReward: number;
}
