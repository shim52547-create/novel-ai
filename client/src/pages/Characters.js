import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit3, FiTrash2, FiUser, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Characters.css';
import API_URL, { apiFetch } from '../config';

function Characters() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState([]);
  const [bookTitle, setBookTitle] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());

  function emptyForm() {
    return { name: '', age: '', appearance: '', personality: '', relationships: '', backstory: '', status: 'alive' };
  }

  const load = async () => {
    const res = await apiFetch(`${API_URL}/api/books/${id}`);
    const data = await res.json();
    setCharacters(data.characters);
    setBookTitle(data.book.title);
  };

  useEffect(() => { load(); }, [id]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Nhập tên nhân vật'); return; }
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/api/characters/${editingId}` : `${API_URL}/api/books/${id}/characters`;
    await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    toast.success(editingId ? 'Đã cập nhật!' : 'Đã thêm!');
    setForm(emptyForm()); setShowForm(false); setEditingId(null); load();
  };

  const handleDelete = async (cid) => {
    if (!window.confirm('Xóa nhân vật này?')) return;
    await apiFetch(`${API_URL}/api/characters/${cid}`, { method: 'DELETE' });
    toast.success('Đã xóa'); load();
  };

  const statusMap = {
    alive: { label: 'SỐNG', cls: 'tag-green' },
    dead: { label: 'ĐÃ CHẾT', cls: 'tag-red' },
    missing: { label: 'MẤT TÍCH', cls: 'tag-yellow' },
  };

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate(`/book/${id}`)} style={{ marginBottom: '16px' }}>
        <FiArrowLeft /> {bookTitle}
      </button>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>NHÂN VẬT</h1>
          <p className="subtitle">Quản lý nhân vật — AI sẽ dựa vào đây để giữ tính cách nhất quán</p>
        </div>
        <button className="btn btn-cyber" onClick={() => { setForm(emptyForm()); setEditingId(null); setShowForm(true); }}>
          <FiPlus /> THÊM NHÂN VẬT
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="empty-state">
          <div className="icon">⬡</div>
          <p>Chưa có nhân vật nào</p>
          <button className="btn btn-cyber" onClick={() => { setForm(emptyForm()); setEditingId(null); setShowForm(true); }}>
            <FiPlus /> THÊM NHÂN VẬT ĐẦU TIÊN
          </button>
        </div>
      ) : (
        <div className="char-grid">
          {characters.map((c, i) => (
            <div key={c.id} className="char-card cyber-border" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="char-header">
                <div className="char-avatar"><FiUser /></div>
                <div className="char-name-block">
                  <h3>{c.name}</h3>
                  <span className={`tag ${statusMap[c.status]?.cls || ''}`}>
                    {statusMap[c.status]?.label || c.status}
                  </span>
                </div>
                <div className="char-actions">
                  <button className="btn btn-ghost" onClick={() => { setForm(c); setEditingId(c.id); setShowForm(true); }}><FiEdit3 /></button>
                  <button className="btn btn-danger" onClick={() => handleDelete(c.id)}><FiTrash2 /></button>
                </div>
              </div>
              {c.age && <div className="char-field"><span>TUỔI</span> {c.age}</div>}
              {c.appearance && <div className="char-field"><span>NGOẠI HÌNH</span> {c.appearance}</div>}
              {c.personality && <div className="char-field"><span>TÍNH CÁCH</span> {c.personality}</div>}
              {c.relationships && <div className="char-field"><span>QUAN HỆ</span> {c.relationships}</div>}
              {c.backstory && <div className="char-field"><span>QUÁ KHỨ</span> {c.backstory}</div>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingId ? 'SỬA NHÂN VẬT' : 'THÊM NHÂN VẬT'}</h2>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Tên *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Tuổi</label>
                <input className="form-input" type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Ngoại hình</label>
              <textarea className="form-textarea" placeholder="Chiều cao, tóc, mắt, sẹo..." value={form.appearance} onChange={e => setForm({...form, appearance: e.target.value})} rows={2} />
            </div>
            <div className="form-group">
              <label className="form-label">Tính cách</label>
              <textarea className="form-textarea" placeholder="Nhút nhát, kiên quyết, hài hước..." value={form.personality} onChange={e => setForm({...form, personality: e.target.value})} rows={2} />
            </div>
            <div className="form-group">
              <label className="form-label">Mối quan hệ</label>
              <textarea className="form-textarea" placeholder="Bạn thân A, thù địch B..." value={form.relationships} onChange={e => setForm({...form, relationships: e.target.value})} rows={2} />
            </div>
            <div className="form-group">
              <label className="form-label">Quá khứ</label>
              <textarea className="form-textarea" placeholder="Tiểu sử nhân vật..." value={form.backstory} onChange={e => setForm({...form, backstory: e.target.value})} rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="alive">Sống</option>
                <option value="dead">Đã chết</option>
                <option value="missing">Mất tích</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>HỦY</button>
              <button className="btn btn-cyber" onClick={handleSubmit}>{editingId ? 'CẬP NHẬT' : 'THÊM'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Characters;