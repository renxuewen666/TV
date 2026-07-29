import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import UserAvatar from '../../components/UserAvatar';

const menuItems = [
  { label: '观看历史', icon: '⏱', path: '/history' },
  { label: '我的收藏', icon: '⭐', path: '/favorites' },
  { label: '签到积分', icon: '🎁', path: '/signin' },
  { label: '会员中心', icon: '👑', path: '/member' },
  { label: '设置', path: '/settings', icon: '' },
];

export default function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const renderMenuIcon = (icon: string) => {
    if (!icon) {
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth={2}>
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      );
    }
    return <span style={{ fontSize: 20 }}>{icon}</span>;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        padding: '32px 20px 24px',
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <UserAvatar nickname={user?.nickname} avatar={user?.avatar} size={56} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{user?.nickname || '用户'}</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
              {user?.email}
            </div>
            {user?.memberLevel ? (
              <div style={{
                marginTop: 6,
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.2)',
                fontSize: 12,
              }}>
                VIP {user.memberLevel}
              </div>
            ) : null}
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: 20, gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.score || 0}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>积分</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {user?.memberLevel ? `Lv${user.memberLevel}` : '-'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>会员</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, background: 'var(--bg-white)', borderRadius: 'var(--radius) 0 0 0' }}>
        {menuItems.map((item, i) => (
          <div
            key={i}
            onClick={() => item.path ? navigate(item.path) : null}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 20px',
              gap: 12,
              borderBottom: i < menuItems.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {renderMenuIcon(item.icon)}
            </div>
            <span style={{ flex: 1, fontSize: 15, color: 'var(--text)' }}>{item.label}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={2}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        ))}
      </div>

      <div style={{
        margin: '24px 20px',
        padding: 14,
        background: 'var(--bg-white)',
        borderRadius: 'var(--radius)',
        textAlign: 'center',
        color: 'var(--danger)',
        fontSize: 15,
        cursor: 'pointer',
      }} onClick={handleLogout}>
        退出登录
      </div>
    </div>
  );
}
