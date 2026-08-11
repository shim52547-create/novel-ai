import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiArrowLeft, FiCheck, FiCircle, FiEdit3, FiTrash2, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './PlotPlan.css';
import API_URL, { apiFetch } from '../config';

function PlotPlan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ chapter_number: '', event: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ chapter_number: '', event: '', status: 'planned' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await apiFetch(`${API_URL}/api/books/${id}`);
    setData(await res.json());
  };

  useEffect(() => { load(); }, [id]);

  const addPlot = async () => {
    if (!form.event.trim()) { toast.error('Nhập nội dung'); return; }
    await apiFetch(`${API_URL}/api/books/${id}/plot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapter_number: parseInt(form.chapter_number) || 0, event: form.event }),
    });
    toast.success('Đã thêm!');
    setForm({ chapter_number: '', event: '' });
    setShowForm(false);
    load();
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setEditForm({ chapter_number: p.chapter_number, event: p.event, status: p.status || 'planned' });
  };

  const saveEdit = async () => {
    if (!editForm.event.trim()) { toast.error('Nhập nội dung'); return; }
    setSaving(true);
    try {
      const res = await apiFetch(`${API_URL}/api/plot/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, chapter_number: parseInt(editForm.chapter_number) || 0 }),
      });
      if (!res.ok) throw new Error();
      toast.success('Đã lưu');
      setEditingId(null);
      load();
    } catch (err) { toast.error('Lỗi khi lưu'); }
    setSaving(false);
  };

  const deletePlot = async (p) => {
    if (!window.confirm(`Xóa mốc "CH.${p.chapter_number}"? Không khôi phục được.`)) return;
    try {
      const res = await apiFetch(`${API_URL}/api/plot/${p.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Đã xóa');
      load();
    } catch (err) { toast.error('Lỗi khi xóa'); }
  };

  if (!data) return <div className="loading-page"><span className="loading-spinner" /></div>;

  const { book, plotPoints, chapters } = data;
  const writtenSet = new Set(chapters.map(c => c.chapter_number));

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate(`/book/${id}`)} style={{ marginBottom: '16px' }}>
        <FiArrowLeft /> {book.title}
      </button>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>KẾ HOẠCH</h1>
          <p className="subtitle">Lập outline — AI sẽ tuân theo khi viết</p>
        </div>
        <button className="btn btn-cyber" onClick={() => setShowForm(true)}>
          <FiPlus /> THÊM KẾ HOẠCH
        </button>
      </div>

      {plotPoints.length === 0 ? (
        <div className="empty-state">
          <div className="icon">⬡</div>
          <p>Chưa có kế hoạch nào</p>
        </div>
      ) : (
        <div className="plot-timeline">
          <div className="timeline-line" />
          {plotPoints.map((p, i) => {
            const written = writtenSet.has(p.chapter_number);
            return (
              <div key={p.id} className={`plot-item ${written ? 'written' : ''}`} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="plot-node">{written ? <FiCheck /> : <FiCircle />}</div>
                <div className="plot-card">
                  <div className="plot-header">
                    <span className="plot-ch">CH.{p.chapter_number}</span>
                    <span className={`tag ${written ? 'tag-green' : ''}`}>{written ? 'ĐÃ VIẾT' : 'CHỜ VIẾT'}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                      <button className="btn btn-ghost" style={{ padding: '4px 8px' }} title="Sửa" onClick={() => openEdit(p)}><FiEdit3 /></button>
                      <button className="btn btn-ghost" style={{ padding: '4px 8px' }} title="Xóa" onClick={() => deletePlot(p)}><FiTrash2 /></button>
                    </div>
                  </div>
                  <p className="plot-text">{p.event}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>THÊM KẾ HOẠCH</h2>
            <div className="form-group">
              <label className="form-label">Số chương</label>
              <input className="form-input" type="number" placeholder="VD: 3" value={form.chapter_number} onChange={e => setForm({...form, chapter_number: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Nội dung chương</label>
              <textarea className="form-textarea" placeholder="Mô tả sự kiện xảy ra..." value={form.event} onChange={e => setForm({...form, event: e.target.value})} rows={4} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>HỦY</button>
              <button className="btn btn-cyber" onClick={addPlot}><FiPlus /> THÊM</button>
            </div>
          </div>
        </div>
      )}

      {editingId && (
        <div className="modal-overlay" onClick={() => setEditingId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>SỬA KẾ HOẠCH</h2>
            <div className="form-group">
              <label className="form-label">Số chương</label>
              <input className="form-input" type="number" value={editForm.chapter_number} onChange={e => setEditForm({ ...editForm, chapter_number: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Nội dung chương</label>
              <textarea className="form-textarea" value={editForm.event} onChange={e => setEditForm({ ...editForm, event: e.target.value })} rows={4} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select className="form-input" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="planned">Chờ viết</option>
                <option value="done">Đã xong</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setEditingId(null)}><FiX /> HỦY</button>
              <button className="btn btn-cyber" onClick={saveEdit} disabled={saving}>
                {saving ? <span className="loading-spinner" /> : <FiCheck />} LƯU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlotPlan;
