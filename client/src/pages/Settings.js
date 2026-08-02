import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiKey, FiCpu, FiCheck, FiX,
  FiEye, FiEyeOff, FiZap, FiShield
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Settings.css';

function Settings() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [config, setConfig] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem('novel_ai_api_key') || '');
    setSelectedProvider(localStorage.getItem('novel_ai_provider') || '');
    setSelectedModel(localStorage.getItem('novel_ai_model') || '');

    fetch('http://localhost:4000/api/providers')
      .then(r => r.json())
      .then(setProviders)
      .catch(() => {});

    fetch('http://localhost:4000/api/config/check')
      .then(r => r.json())
      .then(setConfig)
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
      const res = await fetch('http://localhost:4000/api/anti-ai/quick', {
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

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: '16px' }}>
        <FiArrowLeft /> Trang chủ
      </button>

      <div className="page-header">
        <h1>CÀI ĐẶT</h1>
        <p className="subtitle">Chọn AI Provider, nhập API Key, chọn Model</p>
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
    </div>
  );
}

export default Settings;