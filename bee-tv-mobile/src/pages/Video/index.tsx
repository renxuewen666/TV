import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentAPI, VideoItem } from '../../api/content';

export default function Video() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<VideoItem[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    contentAPI.getDetail(id).then(res => {
      setVideo(res.data?.detail || res.data || null);
      setRelated(res.data?.related || []);
    }).catch(() => {
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#999' }}>
        加载中...
      </div>
    );
  }

  if (!video) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <div className="empty-state">视频不存在</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{
        position: 'relative',
        width: '100%',
        background: '#000',
        aspectRatio: '16/9',
      }}>
        <div
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 10,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </div>
        {video.pic && (
          <img src={video.pic} alt={video.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        )}
        <div style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        </div>
      </div>

      <div className="page-container" style={{ flex: 1 }}>
        <div style={{ padding: 16, background: 'var(--bg-white)', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{video.name}</h2>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {[video.year, video.area, video.type, video.lang].filter(Boolean).join(' / ')}
          </div>
          {video.actor && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              主演: {video.actor}
            </div>
          )}
          {video.director && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              导演: {video.director}
            </div>
          )}
          {video.desc && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
              {video.desc}
            </div>
          )}
        </div>

        {related.length > 0 && (
          <div style={{ padding: '0 16px 16px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>相关推荐</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
            }}>
              {related.map(v => (
                <div
                  key={v.id}
                  className="video-card"
                  onClick={() => navigate(`/video/${v.id}`, { replace: true })}
                >
                  <div className="video-card-thumb">
                    {v.pic && <img src={v.pic} alt={v.name} loading="lazy" />}
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
