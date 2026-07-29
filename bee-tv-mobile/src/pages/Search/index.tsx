import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI, VideoItem } from '../../api/content';

export default function Search() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (kw: string) => {
    if (!kw.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await contentAPI.search(kw.trim());
      setResults(res.data?.list || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(keyword);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-white)' }}>
      <div className="page-header" style={{ gap: 8 }}>
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', gap: 8 }}>
          <input
            className="input-field"
            style={{ flex: 1 }}
            type="text"
            placeholder="搜索影视内容..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            style={{
              height: 48,
              padding: '0 20px',
              border: 'none',
              borderRadius: 'var(--radius)',
              background: 'var(--primary)',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            搜索
          </button>
        </form>
      </div>

      <div className="page-container" style={{ flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>搜索中...</div>
        ) : searched && results.length === 0 ? (
          <div className="empty-state">未找到相关内容</div>
        ) : (
          <div style={{ padding: 12 }}>
            {results.map(v => (
              <div
                key={v.id}
                onClick={() => navigate(`/video/${v.id}`)}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 120,
                  height: 72,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: 'var(--border)',
                  flexShrink: 0,
                }}>
                  {v.pic && (
                    <img src={v.pic} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.4, marginBottom: 6, color: 'var(--text)' }}>
                    {v.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {[v.year, v.area, v.type].filter(Boolean).join(' / ')}
                  </div>
                  {v.actor && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      主演: {v.actor}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
