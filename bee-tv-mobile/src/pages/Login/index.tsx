import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../api/auth';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account.trim() || !password) {
      setError('请填写账号和密码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.login({ account: account.trim(), password });
      if (res.data?.token && res.data?.user) {
        setAuth(res.data.token, res.data.user);
        navigate('/home', { replace: true });
      } else {
        setError('登录响应异常，请重试');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '登录失败，请检查网络后重试';
      setError(msg);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/home', { replace: true });
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff',
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 32px',
        maxWidth: 400,
        margin: '0 auto',
        width: '100%',
      }}>
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1f2937' }}>蜜蜂影视</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>登录您的账号</p>
        </div>

        <form onSubmit={handleSubmit} className="form-group">
          <div>
            <input
              className="input-field"
              type="text"
              placeholder="邮箱 / 昵称"
              value={account}
              onChange={e => { setAccount(e.target.value); setError(''); }}
              style={{ background: '#f5f5f5' }}
            />
          </div>
          <div>
            <input
              className="input-field"
              type="password"
              placeholder="密码"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              style={{ background: '#f5f5f5' }}
            />
          </div>

          {error && (
            <div style={{
              color: '#ef4444',
              fontSize: 13,
              padding: '8px 12px',
              background: '#fef2f2',
              borderRadius: 8,
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: 20,
        }}>
          <span style={{ color: '#6b7280', fontSize: 14 }}>还没有账号？</span>
          <Link to="/register" style={{ color: '#6366f1', fontSize: 14, marginLeft: 4 }}>立即注册</Link>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: 16,
        }}>
          <button
            onClick={handleSkip}
            style={{
              border: 'none',
              background: 'none',
              color: '#9ca3af',
              fontSize: 13,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            跳过登录，先看看
          </button>
        </div>
      </div>
    </div>
  );
}
