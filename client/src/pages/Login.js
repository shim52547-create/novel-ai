import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API_URL, { apiFetch, setSession } from '../config';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await apiFetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Có lỗi xảy ra');
        return;
      }
      setSession(data.token, data.username);
      toast.success(mode === 'login' ? 'Đăng nhập thành công' : 'Tạo tài khoản thành công');
      navigate('/');
      window.location.reload();
    } catch (err) {
      toast.error('Không kết nối được tới server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-icon">墨</span>
          <span className="logo-text">NOVEL <span className="logo-ai">AI</span></span>
        </div>
        <div className="login-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Đăng nhập</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Tạo tài khoản</button>
        </div>
        <form onSubmit={submit} className="login-form">
          <label>
            Tên đăng nhập
            <input value={username} onChange={e => setUsername(e.target.value)} autoFocus autoComplete="username" />
          </label>
          <label>
            Mật khẩu
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>
        <p className="login-hint">Mỗi tài khoản chỉ nhìn thấy truyện của chính mình.</p>
      </div>
    </div>
  );
}

export default Login;
