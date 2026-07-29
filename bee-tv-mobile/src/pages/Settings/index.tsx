import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div className="page-header">
        <div onClick={() => navigate(-1)} style={{ cursor: 'pointer', padding: 4 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth={2}>
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </div>
        <div className="page-header-title">设置</div>
        <div style={{ width: 24 }} />
      </div>

      <div className="page-container" style={{ padding: '16px 20px' }}>
        <div style={{
          background: 'var(--bg-white)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}>
          {[
            { label: '播放设置', desc: '画质、解码器偏好' },
            { label: '缓存管理', desc: '管理本地缓存数据' },
            { label: '关于我们', desc: '版本信息与用户协议' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: 15, color: 'var(--text)' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={2}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
