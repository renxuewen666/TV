import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAppConfigStore } from '../../store/appConfigStore';
import { AppLayoutSection } from '../../api/appConfig';
import { contentAPI, VideoItem } from '../../api/content';

const defaultCategories = [
  { key: '', label: '推荐' },
  { key: '1', label: '电影' },
  { key: '2', label: '电视剧' },
  { key: '3', label: '综艺' },
  { key: '4', label: '动漫' },
];

export default function Home() {
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);
  const config = useAppConfigStore(s => s.config);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [trialLeft, setTrialLeft] = useState(300);
  const trialRef = useRef<ReturnType<typeof setInterval>>();

  const sections = config?.layout?.mobile?.sections || [];
  const marquees = config?.marquees || [];
  const ads = config?.advertisements || [];
  const hotsearches = config?.hotsearches || [];
  const categories = defaultCategories;
  const siteName = config?.system?.siteName || '蜜蜂影视';

  useEffect(() => {
    if (!token) {
      let remaining = 300;
      setTrialLeft(remaining);
      trialRef.current = setInterval(() => {
        remaining--;
        setTrialLeft(remaining);
        if (remaining <= 0) clearInterval(trialRef.current);
      }, 1000);
      return () => { if (trialRef.current) clearInterval(trialRef.current); };
    }
    setTrialLeft(0);
  }, [token]);

  const loadVideos = useCallback(async (p: number, tab: string, append: boolean) => {
    setLoading(true);
    try {
      const res = await contentAPI.getHome({ p, t: tab || undefined });
      const list = (res.data?.list || res.data || []) as VideoItem[];
      const total = res.data?.total || list.length;
      if (append) setVideos(prev => [...prev, ...list]);
      else setVideos(Array.isArray(list) ? list : []);
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

  const sectionStyle = (section: AppLayoutSection): CSSProperties => ({
    backgroundColor: section.style?.backgroundColor || undefined,
    borderRadius: section.style?.borderRadius !== undefined ? Number(section.style.borderRadius) : undefined,
    padding: section.style?.padding !== undefined ? Number(section.style.padding) : undefined,
    margin: '10px 12px',
  });

  const goSearch = (keyword?: string) => {
    navigate(keyword ? `/search?q=${encodeURIComponent(keyword)}` : '/search');
  };

  const renderVideoGrid = (count = 6) => (
    <div className="home-video-grid">
      {videos.slice(0, count).map((v, i) => renderVideoCard(v, i))}
    </div>
  );

  const renderVideoCard = (v: VideoItem, i: number) => {
    const id = v.id || `item-${i}`;
    return (
      <div key={id} className="video-card" onClick={() => navigate(`/video/${id}`)}>
        <div className="video-card-thumb">
          {v.pic && <img src={v.pic} alt={v.name} loading="lazy" />}
          {v.remark && <div className="video-remark">{v.remark}</div>}
        </div>
        <div className="video-card-info">
          <div className="video-card-title">{v.name}</div>
          <div className="video-card-meta">{[v.year, v.area].filter(Boolean).join(' / ')}</div>
        </div>
      </div>
    );
  };

  const renderSection = (section: AppLayoutSection, index: number) => {
    const data = section.data || {};
    switch (section.type) {
      case 'search_bar':
        return <div key={index} className="home-search-bar" style={sectionStyle(section)} onClick={() => goSearch()}>{data.placeholder || '搜索影视、演员、专题'}</div>;
      case 'banner': {
        const bannerAds = ads.filter(a => !a.position || a.position === 'home_banner' || a.position === 'banner');
        return <div key={index} className="home-banner" style={sectionStyle(section)}>{bannerAds[0]?.image ? <img src={bannerAds[0].image} alt={bannerAds[0].title} /> : <span>{siteName}</span>}</div>;
      }
      case 'ad_banner': {
        const ad = ads.find(a => a.position === 'home_ad') || ads[0];
        return <div key={index} className="home-ad" style={sectionStyle(section)}>{data.imageUrl || ad?.image ? <img src={data.imageUrl || ad?.image} alt={ad?.title || '广告'} /> : '广告位'}</div>;
      }
      case 'quick_entry':
        return <div key={index} className="quick-entry" style={sectionStyle(section)}>{['搜索', '历史', '收藏', '设置'].map((name) => <button key={name} onClick={() => name === '搜索' ? goSearch() : navigate(name === '设置' ? '/settings' : '/profile')}>{name}</button>)}</div>;
      case 'category_grid':
        return <div key={index} className="category-grid" style={sectionStyle(section)}>{categories.slice(1, Number(data.count || 8)).map(cat => <button key={cat.key} onClick={() => setActiveTab(cat.key)}>{cat.label}</button>)}</div>;
      case 'section_divider':
        return <h3 key={index} className="section-title" style={sectionStyle(section)}>{data.title || '为你推荐'}</h3>;
      case 'ranking_list':
        return <div key={index} style={sectionStyle(section)}><h3 className="section-title">{data.title || `${data.rankType || '日榜'}排行`}</h3>{videos.slice(0, Number(data.count || 5)).map((v, i) => <div key={v.id || i} className="ranking-item" onClick={() => navigate(`/video/${v.id}`)}><span>{i + 1}</span><b>{v.name}</b><em>{v.remark || v.year || ''}</em></div>)}</div>;
      case 'history_row':
        return <div key={index} style={sectionStyle(section)}><h3 className="section-title">{data.title || '观看历史'}</h3><div className="history-row">{videos.slice(0, Math.min(Number(data.count || 6), 6)).map((v, i) => renderVideoCard(v, i))}</div></div>;
      case 'recommend_list':
        return <div key={index} style={sectionStyle(section)}><h3 className="section-title">{data.title || '热门推荐'}</h3>{renderVideoGrid(Number(data.count || 9))}</div>;
      case 'live_wall':
        return <div key={index} className="live-wall" style={sectionStyle(section)}>直播频道暂未配置</div>;
      default:
        return null;
    }
  };

  const renderDefaultContent = () => (
    <>
      <div className="home-search-bar" onClick={() => goSearch()}>搜索影视、演员、专题</div>
      <div className="home-banner"><span>{siteName}</span></div>
      <h3 className="section-title">热门推荐</h3>
      {renderVideoGrid(30)}
    </>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 4 }}>
        <div className="page-header-title" style={{ marginRight: 8 }}>{siteName}</div>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flex: 1, paddingBottom: 4 }}>
          {categories.map(cat => (
            <div key={cat.key} onClick={() => setActiveTab(cat.key)} className={`home-tab ${activeTab === cat.key ? 'active' : ''}`}>{cat.label}</div>
          ))}
        </div>
        {!token && trialLeft > 0 && <div className="trial-badge">试看 {fmtTrial(trialLeft)}</div>}
        {!token && <div onClick={() => navigate('/login')} className="login-chip">登录</div>}
      </div>

      {marquees.length > 0 && <div className="marquee"><span>{marquees.map(m => m.content).join('　　')}</span></div>}

      <div className="page-container" style={{ flex: 1 }}>
        {hotsearches.length > 0 && (
          <div className="hotsearch-row">
            <span>热搜</span>
            {hotsearches.slice(0, 6).map(h => <button key={h.id} onClick={() => goSearch(h.title)}>{h.title}</button>)}
          </div>
        )}

        {sections.length > 0 ? sections.map(renderSection) : renderDefaultContent()}

        {loading && <div className="loading-state">加载中...</div>}

        {!loading && videos.length === 0 && (
          <div className="empty-state">
            <div style={{ marginBottom: 8 }}>暂无内容</div>
            <div style={{ fontSize: 12, color: '#d1d5db' }}>请先在后台配置接口源</div>
            {!token && <button onClick={() => navigate('/login')} className="empty-login">登录管理后台</button>}
          </div>
        )}
      </div>
    </div>
  );
}
