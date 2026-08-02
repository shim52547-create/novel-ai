import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiArrowLeft, FiCheck, FiCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './PlotPlan.css';
import API_URL from '../config';

function PlotPlan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ chapter_number: '', event: '' });

  const load = async () => {
    const res = await fetch(`${API_URL}/api/books/${id}`);
    setData(await res.json());
  };

  useEffect(() => { load(); }, [id]);

  const addPlot = async () => {
    if (!form.event.trim()) { toast.error('Nhập nội dung'); return; }
    await fetch(`${API_URL}/api/books/${id}/plot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapter_number: parseInt(form.chapter_number) || 0, event: form.event }),
    });
    toast.success('Đã thêm!');
    setForm({ chapter_number: '', event: '' });
    setShowForm(false);
    load();
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
    </div>
  );
}

export default PlotPlan;