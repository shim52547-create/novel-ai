import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiSave, FiZap, FiSearch, FiEdit3,
  FiCheck, FiX, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Revision.css';
import API_URL, { apiFetch } from '../config';

function Revision() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [loading, setLoading] = useState('');
  const [revisionResult, setRevisionResult] = useState(null);
  const [antiAiResult, setAntiAiResult] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const load = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/books/${id}`);
      const data = await res.json();
      setBook(data.book);
      const enriched = data.chapters.map(ch => ({
        ...ch,
        word_count: (ch.content || '').split(/\s+/).filter(Boolean).length,
        char_count: (ch.content || '').length,
        para_count: (ch.content || '').split('\n').filter(p => p.trim()).length,
        has_draft: !!(ch.draft && ch.draft !== ch.content),
      }));
      setChapters(enriched);
    } catch (err) {
      console.error('Load error:', err);
    }
  };

  useEffect(() => { load(); }, [id]);

  const selectChapter = (ch) => {
    setSelected(ch);
    setEditTitle(ch.title);
    setEditContent(ch.content || '');
    setEditSummary(ch.summary || '');
    setRevisionResult(null);
    setAntiAiResult(null);
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    setLoading('save');
    try {
      await apiFetch(`${API_URL}/api/chapters/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          summary: editSummary,
        }),
      });
      toast.success('Đã lưu chương!');
      load();
    } catch (err) {
      toast.error('Lỗi lưu');
    }
    setLoading('');
  };

  const handleRevise = async () => {
    if (!selected) return;
    setLoading('revise');
    try {
      const res = await apiFetch(`${API_URL}/api/chapters/${selected.id}/revise`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRevisionResult(data);
      if (data.wasRevised) {
        toast.success(`Điểm: ${data.score}/100 — Đã tạo bản sửa`);
      } else {
        toast.success(`Điểm: ${data.score}/100 — Chất lượng tốt, không cần sửa`);
      }
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    }
    setLoading('');
  };

  const handleAntiAi = async () => {
    if (!editContent.trim()) { toast.error('Chưa có nội dung'); return; }
    setLoading('antiai');
    try {
      const res = await apiFetch(`${API_URL}/api/anti-ai/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editContent }),
      });
      const data = await res.json();
      setAntiAiResult(data);
      toast.success(`Anti-AI Score: ${data.quickScore}/100`);
    } catch (err) {
      toast.error('Lỗi kiểm tra');
    }
    setLoading('');
  };

  const acceptRevision = () => {
    if (revisionResult?.revised) {
      setEditContent(revisionResult.revised);
      setRevisionResult(null);
      toast.success('Đã áp dụng bản sửa — Nhớ bấm LƯU');
    }
  };

  const rejectRevision = () => {
    setRevisionResult(null);
  };

  const totalWords = chapters.reduce((s, c) => s + (c.word_count || 0), 0);
  const avgScore = chapters.length > 0
    ? Math.round(chapters.reduce((s, c) => s + (c.consistency_score || 70), 0) / chapters.length)
    : 0;
  const needRevision = chapters.filter(c => (c.consistency_score || 100) < 75).length;

  const getScoreClass = (score) => {
    if (!score || score >= 80) return 'score-good';
    if (score >= 60) return 'score-mid';
    return 'score-low';
  };

  if (!book) return <div className="loading-page"><span className="loading-spinner" /> LOADING...</div>;

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate(`/book/${id}`)} style={{ marginBottom: '16px' }}>
        <FiArrowLeft /> {book.title}
      </button>

      <div className="page-header">
        <h1>REVISION STUDIO</h1>
        <p className="subtitle">Chỉnh sửa, đánh giá và nâng cao chất lượng từng chương</p>
      </div>

      {/* Stats */}
      <div className="rev-stats">
        <div className="rev-stat">
          <span className="rev-stat-num">{chapters.length}</span>
          <span className="rev-stat-lbl">CHƯƠNG</span>
        </div>
        <div className="rev-stat">
          <span className="rev-stat-num">{(totalWords / 1000).toFixed(1)}k</span>
          <span className="rev-stat-lbl">TỪ</span>
        </div>
        <div className="rev-stat">
          <span className="rev-stat-num">{avgScore || '—'}</span>
          <span className="rev-stat-lbl">ĐIỂM TB</span>
        </div>
        <div className="rev-stat">
          <span className="rev-stat-num" style={{ color: needRevision > 0 ? 'var(--red)' : 'var(--green)' }}>
            {needRevision}
          </span>
          <span className="rev-stat-lbl">CẦN SỬA</span>
        </div>
      </div>

      {/* Chapter List */}
      <div className="section-header">
        <h2><span className="section-bracket">[</span>DANH SÁCH CHƯƠNG<span className="section-bracket">]</span></h2>
      </div>

      {chapters.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có chương nào. Hãy viết truyện trước.</p>
        </div>
      ) : (
        <div className="rev-chapter-list">
          {chapters.map((ch, i) => (
            <div
              key={ch.id}
              className={`rev-chapter-row ${selected?.id === ch.id ? 'active' : ''}`}
              onClick={() => selectChapter(ch)}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <span className="rev-ch-num">CH.{ch.chapter_number}</span>
              <span className="rev-ch-title">{ch.title}</span>
              <span className="rev-ch-meta">{(ch.word_count || 0).toLocaleString()} từ</span>
              <span className="rev-ch-meta">{ch.para_count || 0} đoạn</span>
              {ch.has_draft && <span className="rev-ch-draft">CÓ BẢN NHÁP</span>}
              <span className={`rev-ch-score ${getScoreClass(ch.consistency_score)}`}>
                {ch.consistency_score || '—'}/100
              </span>
              <span className="rev-ch-edit"><FiEdit3 /></span>
            </div>
          ))}
        </div>
      )}

      {/* Editor Panel */}
      {selected && editorOpen && (
        <div className="rev-editor-panel">
          {/* Header */}
          <div className="rev-editor-header">
            <div className="rev-editor-title-row">
              <span className="rev-editor-ch">CH.{selected.chapter_number}</span>
              <input
                className="rev-title-input"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Tên chương..."
              />
            </div>
            <div className="rev-editor-actions">
              <button className="btn btn-ghost" onClick={() => { setEditorOpen(false); setSelected(null); }}>
                <FiX /> ĐÓNG
              </button>
              <button className="btn btn-ghost" onClick={handleSave} disabled={!!loading}>
                {loading === 'save' ? <span className="loading-spinner" /> : <FiSave />} LƯU
              </button>
              <button
                className="btn btn-ghost"
                onClick={handleAntiAi}
                disabled={!!loading}
                style={{ color: 'var(--yellow)' }}
              >
                {loading === 'antiai' ? <span className="loading-spinner" /> : <FiSearch />} ANTI-AI
              </button>
              <button
                className="btn btn-cyber"
                onClick={handleRevise}
                disabled={!!loading}
                style={{ background: 'linear-gradient(135deg, #ff8800, #ff00aa)', borderColor: 'rgba(255,136,0,0.5)' }}
              >
                {loading === 'revise' ? <span className="loading-spinner" /> : <FiZap />} AI REVISE
              </button>
            </div>
          </div>

          {/* Editor */}
          <textarea
            className="rev-editor-textarea"
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            placeholder="Nội dung chương..."
          />

          {/* Footer stats */}
          <div className="rev-editor-footer">
            <span>{editContent.length.toLocaleString()} ký tự</span>
            <span className="rev-footer-sep">·</span>
            <span>{editContent.split(/\s+/).filter(Boolean).length.toLocaleString()} từ</span>
            <span className="rev-footer-sep">·</span>
            <span>{editContent.split('\n').filter(p => p.trim()).length} đoạn</span>
            {selected.consistency_score && (
              <>
                <span className="rev-footer-sep">·</span>
                <span style={{ color: 'var(--cyan)' }}>Score: {selected.consistency_score}/100</span>
              </>
            )}
          </div>

          {/* Summary */}
          {editSummary && (
            <div className="rev-summary-box">
              <span className="rev-summary-label">TÓM TẮT</span>
              <p>{editSummary}</p>
            </div>
          )}

          {/* Anti-AI Result */}
          {antiAiResult && (
            <div className="rev-result-card">
              <div className="rev-result-header">
                <span style={{
                  color: antiAiResult.quickScore >= 85 ? 'var(--green)' :
                         antiAiResult.quickScore >= 65 ? 'var(--yellow)' : 'var(--red)'
                }}>
                  ANTI-AI: {antiAiResult.quickScore}/100
                </span>
                <span className={`rev-smell-badge ${
                  antiAiResult.smellLevel === 'low' ? 'smell-good' :
                  antiAiResult.smellLevel === 'medium' ? 'smell-mid' : 'smell-bad'
                }`}>
                  {antiAiResult.smellLevel === 'low' ? 'SẠCH' :
                   antiAiResult.smellLevel === 'medium' ? 'TRUNG BÌNH' :
                   antiAiResult.smellLevel === 'high' ? 'NHIỄM CAO' : 'NHIỄM NẶNG'}
                </span>
                <button className="btn btn-ghost" onClick={() => setAntiAiResult(null)} style={{ marginLeft: 'auto', padding: '4px 8px' }}>
                  <FiX />
                </button>
              </div>

              <div className="rev-result-stats">
                <span>Đa dạng từ: <strong>{antiAiResult.uniqueRatio}%</strong></span>
                <span>TB từ/câu: <strong>{antiAiResult.avgSentenceLength}</strong></span>
                <span>Hội thoại: <strong>{antiAiResult.dialogueRatio}%</strong></span>
              </div>

              {antiAiResult.repeatedWords?.length > 0 && (
                <div className="rev-result-detail">
                  <span className="rev-detail-label">TỪ LẶP:</span>
                  {antiAiResult.repeatedWords.slice(0, 6).map(([word, count], i) => (
                    <span key={i} className="rev-tag-word">"{word}" ×{count}</span>
                  ))}
                </div>
              )}

              {antiAiResult.aiPhrases?.length > 0 && (
                <div className="rev-result-detail">
                  <span className="rev-detail-label" style={{ color: 'var(--red)' }}>CỤM TỪ AI:</span>
                  {antiAiResult.aiPhrases.map((item, i) => (
                    <span key={i} className="rev-tag-ai">"{item.phrase}" ×{item.count}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Revision Result */}
          {revisionResult && (
            <div className="rev-result-card rev-result-revision">
              <div className="rev-result-header">
                <span style={{ color: revisionResult.score >= 75 ? 'var(--green)' : 'var(--red)' }}>
                  AI REVISE: {revisionResult.score}/100
                </span>
                <span style={{
                  color: revisionResult.wasRevised ? '#ff8800' : 'var(--green)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                }}>
                  {revisionResult.wasRevised ? 'ĐÃ TẠO BẢN SỬA' : 'KHÔNG CẦN SỬA'}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  {revisionResult.wasRevised && (
                    <button className="btn btn-cyber" onClick={acceptRevision} style={{ padding: '6px 14px', fontSize: '0.7rem' }}>
                      <FiCheck /> ÁP DỤNG
                    </button>
                  )}
                  <button className="btn btn-ghost" onClick={rejectRevision} style={{ padding: '6px 14px', fontSize: '0.7rem' }}>
                    <FiX /> BỎ QUA
                  </button>
                </div>
              </div>

              {revisionResult.auditResult && (
                <pre className="rev-audit-text">{revisionResult.auditResult}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Revision;