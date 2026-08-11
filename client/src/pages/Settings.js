import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiKey, FiCpu, FiCheck, FiX,
  FiEye, FiEyeOff, FiZap, FiShield, FiSun, FiMoon,
  FiUser, FiLock, FiDownload, FiTrash2, FiAlertTriangle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Settings.css';
import API_URL, { apiFetch, getTheme, setTheme, clearSession } from '../config';

function Settings() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [config, setConfig] = useState(null);
  const [testing, setTesting] = useState(false);

  // Giao diện
  const [theme, setThemeState] = useState(getTheme());

  // Tài khoản
  const [account, setAccount] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPw, setSavingPw] = useState(false);

  // Xóa tài khoản
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem('novel_ai_api_key') || '');
    setSelectedProvider(localStorage.getItem('novel_ai_provider') || '');
    setSelectedModel(localStorage.getItem('novel_ai_model') || '');

    apiFetch(`${API_URL}/api/providers`)
      .then(r => r.json())
      .then(setProviders)
      .catch(() => {});

    apiFetch(`${API_URL}/api/config/check`)
      .then(r => r.json())
      .then(setConfig)
      .catch(() => {});

    apiFetch(`${API_URL}/api/account`)
      .then(r => r.json())
      .then(setAccount)
      .catch(() => {});
  }, []);

  const currentProvider = providers.find(p => p.id === selectedProvider);
  const currentModels = currentProvider?.models || [];

  const handleProviderChange = (providerId) => {
    setSelectedProvider(providerId);
    const provider = providers.find(p => p.id === providerId);
    setSelectedModel(provider?.models?.[0]?.id || '');
  };

  const handleSave = () => {
    if (apiKey.trim()) localStorage.setItem('novel_ai_api_key', apiKey.trim());
    else localStorage.removeItem('novel_ai_api_key');
    if (selectedProvider) localStorage.setItem('novel_ai_provider', selectedProvider);
    else localStorage.removeItem('novel_ai_provider');
    if (selectedModel) localStorage.setItem('novel_ai_model', selectedModel);
    else localStorage.removeItem('novel_ai_model');
    toast.success('Đã lưu cài đặt!');
  };

  const handleClear = () => {
    setApiKey('');
    setSelectedProvider('');
    setSelectedModel('');
    localStorage.removeItem('novel_ai_api_key');
    localStorage.removeItem('novel_ai_provider');
    localStorage.removeItem('novel_ai_model');
    toast.success('Đã xóa cài đặt');
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) { toast.error('Nhập API key'); return; }
    if (!selectedProvider) { toast.error('Chọn provider'); return; }
    setTesting(true);
    try {
      const model = selectedModel || currentModels[0]?.id;
      const res = await apiFetch(`${API_URL}/api/anti-ai/quick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'x-ai-provider': selectedProvider,
          'x-ai-model': model,
        },
        body: JSON.stringify({ text: 'Xin chào, đây là bài test.' }),
      });
      if (res.ok) toast.success('Kết nối thành công!');
      else toast.error('Lỗi kết nối');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    }
    setTesting(false);
  };

  const getTierBadge = (tier) => {
    const map = {
      free: { label: 'MIỄN PHÍ', color: 'var(--green)' },
      basic: { label: 'CƠ BẢN', color: 'var(--cyan)' },
      standard: { label: 'TIÊU CHUẨN', color: 'var(--yellow)' },
      premium: { label: 'CAO CẤP', color: '#ff00aa' },
    };
    return map[tier] || { label: tier, color: 'var(--text-muted)' };
  };

  const handleThemeChange = (value) => {
    setThemeState(value);
    setTheme(value);
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) { toast.error('Nhập đầy đủ thông tin'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Mật khẩu mới cần tối thiểu 6 ký tự'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Mật khẩu xác nhận không khớp'); return; }
    setSavingPw(true);
    try {
      const res = await apiFetch(`${API_URL}/api/account/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Lỗi'); setSavingPw(false); return; }
      toast.success('Đã đổi mật khẩu');
      setShowPasswordForm(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error('Lỗi khi đổi mật khẩu'); }
    setSavingPw(false);
  };

  const handleExportAll = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/account/export`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `novel-ai-backup-${account?.username || 'data'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Đã tải xuống bản sao lưu');
    } catch (err) { toast.error('Lỗi khi tải bản sao lưu'); }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) { toast.error('Nhập mật khẩu để xác nhận'); return; }
    setDeleting(true);
    try {
      const res = await apiFetch(`${API_URL}/api/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Lỗi'); setDeleting(false); return; }
      toast.success('Đã xóa tài khoản');
      clearSession();
      window.location.href = '/login';
    } catch (err) { toast.error('Lỗi khi xóa tài khoản'); setDeleting(false); }
  };

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: '16px' }}>
        <FiArrowLeft /> Trang chủ
      </button>

      <div className="page-header">
        <h1>CÀI ĐẶT</h1>
        <p className="subtitle">Tài khoản, giao diện và AI Provider</p>
      </div>

      {/* ====== TÀI KHOẢN ====== */}
      <div className="settings-card">
        <div className="settings-card-header"><FiUser /><span>TÀI KHOẢN</span></div>
        <div className="settings-card-body">
          {account && (
            <p className="settings-note" style={{ marginBottom: '12px' }}>
              Đăng nhập với <strong>{account.username}</strong> · {account.bookCount} truyện · tạo lúc {new Date(account.created_at).toLocaleDateString('vi-VN')}
            </p>
          )}
          {!showPasswordForm ? (
            <button className="btn btn-ghost" onClick={() => setShowPasswordForm(true)}>
              <FiLock /> ĐỔI MẬT KHẨU
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px' }}>
              <input type="password" className="form-input" placeholder="Mật khẩu hiện tại"
                value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
              <input type="password" className="form-input" placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} />
              <input type="password" className="form-input" placeholder="Xác nhận mật khẩu mới"
                value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-ghost" onClick={() => { setShowPasswordForm(false); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>
                  <FiX /> HỦY
                </button>
                <button className="btn btn-cyber" onClick={handleChangePassword} disabled={savingPw}>
                  {savingPw ? <span className="loading-spinner" /> : <FiCheck />} LƯU MẬT KHẨU
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====== GIAO DIỆN ====== */}
      <div className="settings-card">
        <div className="settings-card-header"><FiSun /><span>GIAO DIỆN</span></div>
        <div className="settings-card-body">
          <div className="settings-providers-grid">
            <div className={`settings-provider-card ${theme === 'dark' ? 'selected' : ''}`} onClick={() => handleThemeChange('dark')}>
              <div className="settings-provider-radio">{theme === 'dark' && <div className="settings-model-dot" />}</div>
              <div className="settings-provider-info">
                <span className="settings-provider-name"><FiMoon style={{ marginRight: '6px' }} />Tối (Cyberpunk)</span>
                <span className="settings-provider-models">Mặc định</span>
              </div>
            </div>
            <div className={`settings-provider-card ${theme === 'light' ? 'selected' : ''}`} onClick={() => handleThemeChange('light')}>
              <div className="settings-provider-radio">{theme === 'light' && <div className="settings-model-dot" />}</div>
              <div className="settings-provider-info">
                <span className="settings-provider-name"><FiSun style={{ marginRight: '6px' }} />Sáng</span>
                <span className="settings-provider-models">Dễ đọc khi viết lâu</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {config && (
        <div className="settings-status">
          <div className="status-icon" style={{ color: config.hasDefaultKey ? 'var(--green)' : 'var(--yellow)' }}>
            {config.hasDefaultKey ? <FiCheck /> : <FiShield />}
          </div>
          <div className="status-info">
            <span className="status-label">SERVER</span>
            <p>
              {config.hasDefaultKey
                ? `Server có key mặc định (${config.provider}/${config.model}). Nhập key riêng để dùng model xịn hơn.`
                : 'Server chưa có key. Bạn PHẢI nhập API key.'}
            </p>
          </div>
        </div>
      )}

      <div className="settings-card">
        <div className="settings-card-header"><FiCpu /><span>AI PROVIDER</span></div>
        <div className="settings-card-body">
          <div className="settings-providers-grid">
            {providers.map(p => (
              <div key={p.id} className={`settings-provider-card ${selectedProvider === p.id ? 'selected' : ''}`} onClick={() => handleProviderChange(p.id)}>
                <div className="settings-provider-radio">
                  {selectedProvider === p.id && <div className="settings-model-dot" />}
                </div>
                <div className="settings-provider-info">
                  <span className="settings-provider-name">{p.name}</span>
                  <span className="settings-provider-models">{p.models.length} models</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <FiKey /><span>API KEY {currentProvider && `— ${currentProvider.name}`}</span>
        </div>
        <div className="settings-card-body">
          <div className="settings-key-row">
            <div className="settings-key-input-wrap">
              <input
                type={showKey ? 'text' : 'password'}
                className="form-input settings-key-input"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={currentProvider ? `Nhập ${currentProvider.name} API Key...` : 'Chọn provider trước...'}
              />
              <button className="btn btn-ghost settings-eye" onClick={() => setShowKey(!showKey)}>
                {showKey ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <button className="btn btn-ghost" onClick={handleTestKey} disabled={testing}>
              {testing ? <span className="loading-spinner" /> : <FiZap />} TEST
            </button>
          </div>
          {currentProvider && (
            <p className="settings-note">
              Key thường bắt đầu bằng: <code>{currentProvider.keyPrefix || '(bất kỳ)'}</code>
            </p>
          )}
        </div>
      </div>

      {currentModels.length > 0 && (
        <div className="settings-card">
          <div className="settings-card-header"><FiCpu /><span>MODEL — {currentProvider.name}</span></div>
          <div className="settings-card-body">
            <div className="settings-models-grid">
              {currentModels.map(model => {
                const tier = getTierBadge(model.tier);
                const isSelected = selectedModel === model.id;
                return (
                  <div key={model.id} className={`settings-model-card ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedModel(model.id)}>
                    <div className="settings-model-top">
                      <div className="settings-model-radio">
                        {isSelected && <div className="settings-model-dot" />}
                      </div>
                      <span className="settings-model-name">{model.name}</span>
                      <span className="settings-model-tier" style={{ color: tier.color, borderColor: `${tier.color}40` }}>{tier.label}</span>
                    </div>
                    <p className="settings-model-desc">{model.description}</p>
                    <span className="settings-model-id">{model.id}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="settings-actions">
        <button className="btn btn-cyber" onClick={handleSave}><FiCheck /> LƯU CÀI ĐẶT</button>
        <button className="btn btn-ghost" onClick={handleClear}><FiX /> XÓA & DÙNG MẶC ĐỊNH</button>
      </div>

      {/* ====== SAO LƯU / XÓA TÀI KHOẢN ====== */}
      <div className="settings-card" style={{ marginTop: '32px' }}>
        <div className="settings-card-header"><FiDownload /><span>SAO LƯU DỮ LIỆU</span></div>
        <div className="settings-card-body">
          <p className="settings-note" style={{ marginBottom: '12px' }}>
            Tải xuống toàn bộ truyện, chương, nhân vật, kế hoạch của bạn dưới dạng 1 file JSON.
          </p>
          <button className="btn btn-ghost" onClick={handleExportAll}><FiDownload /> TẢI TOÀN BỘ DỮ LIỆU</button>
        </div>
      </div>

      <div className="settings-card" style={{ borderColor: 'rgba(255,51,102,0.4)' }}>
        <div className="settings-card-header" style={{ color: 'var(--red)' }}><FiAlertTriangle /><span>VÙNG NGUY HIỂM</span></div>
        <div className="settings-card-body">
          {!showDeleteAccount ? (
            <button className="btn btn-ghost" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => setShowDeleteAccount(true)}>
              <FiTrash2 /> XÓA TÀI KHOẢN
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px' }}>
              <p className="settings-note">
                Toàn bộ truyện, chương, nhân vật sẽ bị xóa vĩnh viễn, không khôi phục được. Nhập mật khẩu để xác nhận.
              </p>
              <input type="password" className="form-input" placeholder="Mật khẩu"
                value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-ghost" onClick={() => { setShowDeleteAccount(false); setDeletePassword(''); }}>
                  <FiX /> HỦY
                </button>
                <button className="btn btn-cyber" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} onClick={handleDeleteAccount} disabled={deleting}>
                  {deleting ? <span className="loading-spinner" /> : <FiTrash2 />} XÓA VĨNH VIỄN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
