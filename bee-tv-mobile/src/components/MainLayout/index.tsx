import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const tabs = [
  { path: '/home', label: '首页', icon: 'home', guest: true },
  { path: '/search', label: '搜索', icon: 'search', guest: true },
  { path: '/profile', label: '我的', icon: 'profile', guest: false },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);

  const isActive = (path: string) => location.pathname === path;

  const renderIcon = (icon: string, active: boolean) => {
    const color = active ? '#6366f1' : '#9ca3af';
    switch (icon) {
      case 'home':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill={active ? '#6366f1' : 'none'} stroke={color} strokeWidth={active ? 0 : 2}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22" stroke={color} strokeWidth={active ? 0 : 2} fill={active ? 'white' : 'none'}/>
          </svg>
        );
      case 'search':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill={active ? '#6366f1' : 'none'} stroke={color} strokeWidth={active ? 0 : 2}>
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        );
      case 'profile':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill={active ? '#6366f1' : 'none'} stroke={color} strokeWidth={active ? 0 : 2}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        );
    }
  };

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (!tab.guest && !token) {
      navigate('/login');
      return;
    }
    navigate(tab.path);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Outlet />
      </div>
      <div className="tab-bar">
        {tabs.map((tab, i) => (
          <div
            key={tab.path}
            className={`tab-item ${isActive(tab.path) ? 'active' : ''}`}
            onClick={() => handleTabClick(tab)}
          >
            <div style={{ position: 'relative' }}>
              {renderIcon(tab.icon, isActive(tab.path))}
              {!tab.guest && !token && (
                <div style={{
                  position: 'absolute',
                  top: -2,
                  right: -8,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ef4444',
                }} />
              )}
            </div>
            <span>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
