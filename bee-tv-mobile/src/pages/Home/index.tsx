import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { contentAPI, VideoItem } from '../../api/content';

const categories = [
  { key: '', label: '推荐' },
  { key: '1', label: '电影' },
  { key: '2', label: '电视剧' },
  { key: '3', label: '综艺' },
  { key: '4', label: '动漫' },
];

export default function Home() {
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [trialLeft, setTrialLeft] = useState(300);
  const trialRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!token) {
      let remaining = 300;
      setTrialLeft(remaining);
      trialRef.current = setInterval(() => {
        remaining--;
        setTrialLeft(remaining);
        if (remaining <= 0) {
          clearInterval(trialRef.current);
        }
      }, 1000);
      return () => { if (trialRef.current) clearInterval(trialRef.current); };
    } else {
      setTrialLeft(0);
    }
  }, [token]);

  const loadVideos = useCallback(async (p: number, tab: string, append: boolean) => {
    setLoading(true);
    try {
      const res = await contentAPI.getHome({ p, t: tab || undefined });
      const list = (res.data?.list || res.data || []) as VideoItem[];
      const total = res.data?.total || list.length;
      if (append) {
        setVideos(prev => [...prev, ...list]);
      } else {
        setVideos(Array.isArray(list) ? list : []);
      }
      setHasMore(list.length > 0 && p * 20 < total);
    } catch {
      if (!append) setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos(1, activeTab, false);
    setPage(1);
  }, [activeTab, loadVideos]);

  useEffect(() => {
    const el = document.querySelector('.page-container');
    if (!el) return;
    const handleScroll = () => {
      if (!hasMore || loading) return;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
        const next = page + 1;
        setPage(next);
        loadVideos(next, activeTab, true);
      }
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, page, activeTab, loadVideos]);

  const fmtTrial = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 4 }}>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flex: 1, paddingBottom: 4 }}>
          {categories.map(cat => (
            <div
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: activeTab === cat.key ? 600 : 400,
                color: activeTab === cat.key ? 'white' : '#6b7280',
                background: activeTab === cat.key ? '#6366f1' : 'transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              {cat.label}
            </div>
          ))}
        </div>
        {!token && trialLeft > 0 && (
          <div style={{
            fontSize: 12,
            color: '#ef4444',
            background: '#fef2f2',
            padding: '4px 10px',
            borderRadius: 12,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            试看 {fmtTrial(trialLeft)}
          </div>
        )}
        {!token && (
          <div
            onClick={() => navigate('/login')}
            style={{
              fontSize: 12,
              color: '#6366f1',
              border: '1px solid #6366f1',
              padding: '4px 10px',
              borderRadius: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              fontWeight: 500,
            }}
          >
            登录
          </div>
        )}
      </div>

      <div className="page-container" style={{ flex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          padding: 12,
        }}>
          {videos.map((v, i) => {
            const id = v.id || `item-${i}`;
            return (
              <div
                key={id}
                className="video-card"
                onClick={() => navigate(`/video/${id}`)}
              >
                <div className="video-card-thumb">
                  {v.pic && (
                    <img src={v.pic} alt={v.name} loading="lazy" />
                  )}
                  {v.remark && (
                    <div style={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}>
                      {v.remark}
                    </div>
                  )}
                </div>
                <div className="video-card-info">
                  <div className="video-card-title">{v.name}</div>
                  <div className="video-card-meta">
                    {[v.year, v.area].filter(Boolean).join(' / ')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 13 }}>
            加载中...
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div className="empty-state">
            <div style={{ marginBottom: 12, color: '#d1d5db' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div style={{ marginBottom: 8 }}>暂无内容</div>
            <div style={{ fontSize: 12, color: '#d1d5db' }}>
              请先在后台配置接口源
            </div>
            {!token && (
              <button
                onClick={() => navigate('/login')}
                style={{
                  marginTop: 16,
                  padding: '8px 24px',
                  border: '1px solid #6366f1',
                  borderRadius: 20,
                  background: 'transparent',
                  color: '#6366f1',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                登录管理后台
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
