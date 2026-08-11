import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiUsers, FiFeather, FiMap, FiArrowRight, FiClock, FiCpu, FiDownload, FiEdit3, FiBook, FiMessageSquare, FiSettings, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './BookDetail.css';
import API_URL, { apiFetch } from '../config';

function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', genre: '', setting: '', synopsis: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    apiFetch(`${API_URL}/api/books/${id}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  };

  useEffect(() => { load(); }, [id]);

  const openEdit = () => {
    setEditForm({
      title: data.book.title || '',
      genre: data.book.genre || '',
      setting: data.book.setting || '',
      synopsis: data.book.synopsis || '',
    });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) { toast.error('Nhập tên truyện'); return; }
    setSaving(true);
    try {
      const res = await apiFetch(`${API_URL}/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error();
      toast.success('Đã lưu thông tin truyện');
      setShowEdit(false);
      load();
    } catch (err) { toast.error('Lỗi khi lưu'); }
    setSaving(false);
  };

  if (!data) return <div className="loading-page"><span className="loading-spinner" /> LOADING...</div>;

  const { book, characters, chapters, plotPoints, agentLogs } = data;
  const totalChars = chapters.reduce((sum, ch) => sum + (ch.content?.length || 0), 0);
  const lastChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;
  const recentLogs = agentLogs.slice(0, 5);

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <h1>{book.title}</h1>
          <button className="btn btn-ghost" onClick={openEdit}><FiSettings /> SỬA THÔNG TIN</button>
        </div>
        <div className="page-header-meta">
          <span className="tag">{book.genre || 'UNCLASSIFIED'}</span>
          <span className="dot-sep">·</span>
          <span><FiClock /> {new Date(book.created_at).toLocaleDateString('vi-VN')}</span>
        </div>
        {book.synopsis && <p className="synopsis">{book.synopsis}</p>}
      </div>

      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2><FiSettings style={{ marginRight: '8px' }} />SỬA THÔNG TIN TRUYỆN</h2>

            <div className="form-group">
              <label className="form-label">Tên truyện *</label>
              <input className="form-input" value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })} autoFocus />
            </div>

            <div className="form-group">
              <label className="form-label">Thể loại</label>
              <input className="form-input" value={editForm.genre}
                onChange={e => setEditForm({ ...editForm, genre: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Bối cảnh</label>
              <textarea className="form-textarea" rows={3} value={editForm.setting}
                onChange={e => setEditForm({ ...editForm, setting: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Tóm tắt cốt truyện</label>
              <textarea className="form-textarea" rows={4} value={editForm.synopsis}
                onChange={e => setEditForm({ ...editForm, synopsis: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn btn-ghost" onClick={() => setShowEdit(false)}><FiX /> HỦY</button>
              <button className="btn btn-cyber" onClick={handleSaveEdit} disabled={saving}>
                {saving ? <span className="loading-spinner" /> : <FiCheck />} LƯU
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card"><span className="stat-num">{chapters.length}</span><span className="stat-label">CHƯƠNG</span></div>
        <div className="stat-card"><span className="stat-num">{characters.length}</span><span className="stat-label">NHÂN VẬT</span></div>
        <div className="stat-card"><span className="stat-num">{(totalChars / 1000).toFixed(1)}k</span><span className="stat-label">KÝ TỰ</span></div>
        <div className="stat-card"><span className="stat-num">{plotPoints.length}</span><span className="stat-label">KẾ HOẠCH</span></div>
      </div>

      <div className="section-header">
        <h2><span className="section-bracket">[</span>ĐIỀU KHIỂN<span className="section-bracket">]</span></h2>
      </div>

      <div className="grid-2" style={{ marginBottom: '32px' }}>
        <div className="action-card cyber-border" onClick={() => navigate(`/book/${id}/characters`)}>
          <div className="action-icon-wrap"><FiUsers /></div>
          <h3>NHÂN VẬT</h3>
          <p>Quản lý nhân vật, bối cảnh, mối quan hệ</p>
          <span className="action-count">{characters.length} NHÂN VẬT</span>
          <FiArrowRight className="action-arrow" />
        </div>

        <div className="action-card cyber-border" onClick={() => navigate(`/book/${id}/plot`)}>
          <div className="action-icon-wrap"><FiMap /></div>
          <h3>KẾ HOẠCH</h3>
          <p>Dàn ý chương, diễn biến cốt truyện</p>
          <span className="action-count">{plotPoints.length} ĐIỂM</span>
          <FiArrowRight className="action-arrow" />
        </div>

        <div className="action-card cyber-border" onClick={() => navigate(`/book/${id}/write`)}>
          <div className="action-icon-wrap"><FiFeather /></div>
          <h3>VIẾT TRUYỆN</h3>
          <p>Multi-agent pipeline viết và đánh giá</p>
          <span className="action-count">{chapters.length} CHƯƠNG</span>
          <FiArrowRight className="action-arrow" />
        </div>

        <div className="action-card cyber-border" onClick={() => navigate(`/book/${id}/storybible`)}>
          <div className="action-icon-wrap"><FiBook /></div>
          <h3>CẨM NANG</h3>
          <p>Tổng hợp toàn bộ thế giới và nhân vật</p>
          <span className="action-count">AUTO</span>
          <FiArrowRight className="action-arrow" />
        </div>

        <div className="action-card cyber-border" onClick={() => navigate(`/book/${id}/chat`)}>
          <div className="action-icon-wrap"><FiMessageSquare /></div>
          <h3>AI CHAT</h3>
          <p>Trò chuyện với nhân vật trong truyện</p>
          <span className="action-count">{characters.length} NHÂN VẬT</span>
          <FiArrowRight className="action-arrow" />
        </div>

        <div className="action-card cyber-border" onClick={() => navigate(`/book/${id}/revision`)}>
          <div className="action-icon-wrap"><FiEdit3 /></div>
          <h3>REVISION</h3>
          <p>Chỉnh sửa và nâng cao chất lượng chương</p>
          <span className="action-count">{chapters.length} CHƯƠNG</span>
          <FiArrowRight className="action-arrow" />
        </div>

        <div className="action-card cyber-border" onClick={() => navigate(`/book/${id}/export`)}>
          <div className="action-icon-wrap"><FiDownload /></div>
          <h3>XUẤT FILE</h3>
          <p>Export ra TXT, EPUB, PDF, Markdown</p>
          <span className="action-count">4 FORMATS</span>
          <FiArrowRight className="action-arrow" />
        </div>
      </div>

      {recentLogs.length > 0 && (
        <>
          <div className="separator" />
          <div className="section-header">
            <h2><span className="section-bracket">[</span>AGENT LOGS<span className="section-bracket">]</span></h2>
          </div>
          <div className="logs-list">
            {recentLogs.map(log => (
              <div key={log.id} className="log-card">
                <div className="log-header">
                  <FiCpu />
                  <span className="log-agent">{log.agent_name}</span>
                  <span className={`tag ${log.status === 'success' ? 'tag-green' : 'tag-red'}`}>
                    {log.status === 'success' ? 'SUCCESS' : 'ERROR'}
                  </span>
                  <span className="log-time">{log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : ''}</span>
                </div>
                <p className="log-summary">{log.output_summary}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {lastChapter && (
        <>
          <div className="separator" />
          <div className="section-header">
            <h2><span className="section-bracket">[</span>CHƯƠNG GẦN NHẤT<span className="section-bracket">]</span></h2>
          </div>
          <div className="chapter-preview">
            <div className="chapter-preview-header">
              <span className="chapter-num">CH.{lastChapter.chapter_number}</span>
              <h3>{lastChapter.title}</h3>
              {lastChapter.consistency_score && (
                <span className={`tag ${lastChapter.consistency_score >= 80 ? 'tag-green' : lastChapter.consistency_score >= 60 ? 'tag-yellow' : 'tag-red'}`}>
                  {lastChapter.consistency_score}/100
                </span>
              )}
            </div>
            {lastChapter.summary && <p className="chapter-summary">{lastChapter.summary}</p>}
            <p className="chapter-preview-text">{lastChapter.content?.substring(0, 500)}...</p>
          </div>
        </>
      )}
    </div>
  );
}

export default BookDetail;
