import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../api/auth';

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !nickname.trim() || !password || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('邮箱格式不正确');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.register({ email: email.trim(), nickname: nickname.trim(), password });
      setAuth(res.data.token, res.data.user);
      navigate('/home', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-white)',
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
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>创建账号</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>注册蜜蜂影视会员</p>
        </div>

        <form onSubmit={handleSubmit} className="form-group">
          <input
            className="input-field"
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="input-field"
            type="text"
            placeholder="昵称"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            autoComplete="nickname"
          />
          <input
            className="input-field"
            type="password"
            placeholder="密码（至少6位）"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <input
            className="input-field"
            type="password"
            placeholder="确认密码"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            已有账号？
          </span>
          <Link to="/login" style={{ color: 'var(--primary)', fontSize: 14, marginLeft: 4 }}>
            立即登录
          </Link>
        </div>
      </div>
    </div>
  );
}
