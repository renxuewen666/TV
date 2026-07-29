import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

const Splash = lazy(() => import('./pages/Splash'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const Video = lazy(() => import('./pages/Video'));
const Search = lazy(() => import('./pages/Search'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
import MainLayout from './components/MainLayout';

function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', color: '#9ca3af', fontSize: 14,
    }}>
      加载中...
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function TrialGate({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token);
  const [showLogin, setShowLogin] = useState(false);
  const [countdown, setCountdown] = useState(300);

  useEffect(() => {
    if (token) return;
    const trialSeconds = 300;
    let remaining = trialSeconds;
    setCountdown(remaining);

    const interval = setInterval(() => {
      remaining--;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setShowLogin(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [token]);

  return (
    <>
      {children}
      {showLogin && !token && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
          }} />
          <div style={{
            position: 'relative',
            background: 'white',
            borderRadius: 16,
            padding: '32px 24px',
            margin: '0 40px',
            textAlign: 'center',
            maxWidth: 320,
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>试看时间已结束</h3>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
              登录后即可畅享精彩影视内容
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              style={{
                width: '100%',
                height: 44,
                border: 'none',
                borderRadius: 12,
                background: '#6366f1',
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              立即登录
            </button>
            <button
              onClick={() => window.location.href = '/register'}
              style={{
                width: '100%',
                height: 44,
                border: '1px solid #6366f1',
                borderRadius: 12,
                background: 'transparent',
                color: '#6366f1',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              注册账号
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="/splash" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<MainLayout />}>
          <Route path="home" element={<TrialGate><Home /></TrialGate>} />
          <Route path="search" element={<TrialGate><Search /></TrialGate>} />
          <Route path="profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute><Settings /></ProtectedRoute>
          } />
        </Route>
        <Route path="/video/:id" element={<TrialGate><Video /></TrialGate>} />
      </Routes>
    </Suspense>
  );
}
