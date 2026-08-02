import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiCheckCircle, FiClock, FiZap, FiEye, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Write.css';
import API_URL from '../config';

const AGENT_INFO = {
  ARCHITECT:   { icon: '🏗️', label: 'ARCHITECT',   color: '#aa44ff' },
  PLANNER:     { icon: '📋', label: 'PLANNER',     color: '#00f0ff' },
  COMPOSER:    { icon: '🎵', label: 'COMPOSER',    color: '#ffe44d' },
  WRITER:      { icon: '✍️',  label: 'WRITER',      color: '#ff00aa' },
  OBSERVER:    { icon: '👁️', label: 'OBSERVER',    color: '#00ff88' },
  AUDITOR:     { icon: '🔍', label: 'AUDITOR',     color: '#ff3366' },
  REVISER:     { icon: '🔧', label: 'REVISER',     color: '#ff8800' },
  SUMMARIZE:   { icon: '📝', label: 'SUMMARIZE',   color: '#88aaff' },
};

function AgentPipeline({ progress, currentTime }) {
  const allAgents = ['ARCHITECT','PLANNER','COMPOSER','WRITER','OBSERVER','AUDITOR','REVISER','SUMMARIZE'];

  return (
    <div className="agent-pipeline">
      <div className="pipeline-header">
        <span className="pipeline-title">MULTI-AGENT PIPELINE</span>
        <span className="pipeline-time"><FiClock /> {currentTime}s</span>
      </div>
      <div className="pipeline-agents">
        {allAgents.map((agentKey, i) => {
          const info = AGENT_INFO[agentKey];
          const progressItem = progress.find(p => p.agent === agentKey);
          const isActive = progressItem?.status === 'running';
          const isDone = progressItem?.status === 'done';
          const isPending = !progressItem && !isActive;

          if (agentKey === 'REVISER' && isPending && progress.find(p => p.agent === 'AUDITOR')?.status === 'done') {
            if (!progress.find(p => p.agent === 'REVISER')) return null;
          }

          return (
            <React.Fragment key={agentKey}>
              <div className={`agent-node ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${isPending ? 'pending' : ''}`}>
                <div className="agent-icon" style={{
                  borderColor: isDone ? info.color : isActive ? info.color : 'var(--border)',
                  boxShadow: isActive ? `0 0 20px ${info.color}40` : isDone ? `0 0 10px ${info.color}20` : 'none',
                }}>
                  {isDone ? <FiCheck style={{ color: info.color }} /> : <span>{info.icon}</span>}
                </div>
                <span className="agent-label">{info.label}</span>
                {isActive && <span className="agent-status running">RUNNING</span>}
                {isDone && <span className="agent-status done" style={{ color: info.color }}>DONE</span>}
              </div>
              {i < allAgents.length - 1 && (
                <div className={`agent-connector ${isDone ? 'active' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function Write() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [chapterNumber, setChapterNumber] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [result, setResult] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState([]);
  const timerRef = useRef(null);

  const load = async () => {
    const res = await fetch(`${API_URL}/api/books/${id}`);
    const d = await res.json();
    setData(d);
    setChapterNumber(d.chapters.length + 1);
  };

  useEffect(() => { load(); }, [id]);

  const handleWrite = async () => {
    setLoading(true);
    setElapsed(0);
    setResult(null);
    setProgress([]);
    timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);

    try {
      const res = await fetch(`${API_URL}/api/books/${id}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNumber, instructions }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setResult(d);
      setEditedContent(d.content);
      setProgress(d.progress || []);
      toast.success(`Hoàn thành trong ${d.totalTime}s — Điểm: ${d.consistencyScore}/100`);
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    }

    clearInterval(timerRef.current);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/chapters/${result.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Chương ${chapterNumber}`,
          content: editedContent,
          summary: result.summary,
        }),
      });
      toast.success('Đã lưu chương!');
      setResult(null);
      setProgress([]);
      load();
    } catch (err) {
      toast.error('Lỗi lưu');
    }
    setSaving(false);
  };

  const handleDelete = async (ch) => {
    if (!window.confirm(`Xóa chương ${ch.chapter_number}?`)) return;
    try {
      await fetch(`${API_URL}/api/chapters/${ch.id}`, { method: 'DELETE' });
      toast.success(`Đã xóa chương ${ch.chapter_number}`);
      load();
    } catch (err) {
      toast.error('Lỗi xóa');
    }
  };

  if (!data) return <div className="loading-page"><span className="loading-spinner" /> LOADING...</div>;

  const { book, characters, chapters, storyEvents } = data;

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate(`/book/${id}`)} style={{ marginBottom: '16px' }}>
        <FiArrowLeft /> {book.title}
      </button>

      <div className="page-header">
        <h1>VIẾT TRUYỆN</h1>
        <p className="subtitle">Multi-Agent System — 7 AI agents phối hợp để viết chương chất lượng cao</p>
      </div>

      {/* Context bar */}
      <div className="ctx-bar">
        <div className="ctx-item">
          <span className="ctx-label">NHÂN VẬT</span>
          <span className="ctx-value">{characters.length}</span>
        </div>
        <div className="ctx-div" />
        <div className="ctx-item">
          <span className="ctx-label">ĐÃ VIẾT</span>
          <span className="ctx-value">{chapters.length}</span>
        </div>
        <div className="ctx-div" />
        <div className="ctx-item">
          <span className="ctx-label">SỰ KIỆN</span>
          <span className="ctx-value">{storyEvents?.length || 0}</span>
        </div>
        <div className="ctx-div" />
        <div className="ctx-item">
          <span className="ctx-label">TIẾP THEO</span>
          <span className="ctx-value accent">{chapterNumber}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="write-controls">
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Chương số</label>
            <input
              className="form-input"
              type="number"
              value={chapterNumber}
              onChange={e => setChapterNumber(parseInt(e.target.value) || 1)}
              min={1}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Yêu cầu (tùy chọn)</label>
            <input
              className="form-input"
              placeholder="VD: Tập trung không khí rùng rợn..."
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
            />
          </div>
        </div>

        <button
          className="btn btn-cyber btn-generate"
          onClick={handleWrite}
          disabled={loading}
        >
          {loading ? (
            <><span className="loading-spinner" /> ĐANG XỬ LÝ... {elapsed}s</>
          ) : (
            <><FiZap /> MULTI-AGENT GENERATE CHƯƠNG {chapterNumber}</>
          )}
        </button>
      </div>

      {/* Pipeline Progress */}
      {loading && <AgentPipeline progress={progress} currentTime={elapsed} />}

      {/* Result */}
      {result && (
        <div className="write-result">
          {/* Pipeline Summary */}
          <AgentPipeline progress={result.progress || []} currentTime={result.totalTime} />

          {/* Consistency Score */}
          <div className="score-bar">
            <div className="score-label">
              <FiCheckCircle /> ĐIỂM NHẤT QUÁN
            </div>
            <div className="score-track">
              <div
                className="score-fill"
                style={{
                  width: `${result.consistencyScore}%`,
                  background: result.consistencyScore >= 80
                    ? 'linear-gradient(90deg, #00ff88, #00f0ff)'
                    : result.consistencyScore >= 60
                      ? 'linear-gradient(90deg, #ffe44d, #ff8800)'
                      : 'linear-gradient(90deg, #ff3366, #ff00aa)',
                }}
              />
            </div>
            <span className="score-number">{result.consistencyScore}/100</span>
          </div>

          {/* Audit Details */}
          <details className="audit-details">
            <summary className="audit-summary">
              <FiEye /> Chi tiết Audit
            </summary>
            <pre className="audit-body">{result.auditResult}</pre>
          </details>

          {/* Summary */}
          {result.summary && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="form-label" style={{ marginBottom: '8px' }}>TÓM TẮT CHƯƠNG</div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontStyle: 'italic' }}>
                {result.summary}
              </p>
            </div>
          )}

          {/* Editor */}
          <div className="editor-head">
            <h2>CHƯƠNG {chapterNumber}</h2>
            <span className="editor-count">
              <FiClock /> {editedContent.length.toLocaleString()} ký tự
            </span>
          </div>

          <textarea
            className="story-editor"
            value={editedContent}
            onChange={e => setEditedContent(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="btn btn-ghost" onClick={() => { setResult(null); setProgress([]); }}>
              HỦY
            </button>
            <button className="btn btn-cyber" onClick={handleSave} disabled={saving}>
              {saving ? (
                <><span className="loading-spinner" /> ĐANG LƯU...</>
              ) : (
                <><FiSave /> LƯU CHƯƠNG</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Previous chapters */}
      {chapters.length > 0 && !result && (
        <>
          <div className="separator" />
          <div className="section-header">
            <h2>
              <span className="section-bracket">[</span>
              CHƯƠNG ĐÃ VIẾT
              <span className="section-bracket">]</span>
            </h2>
          </div>

          {chapters.slice().reverse().map((ch, i) => (
            <div key={ch.id} className="chapter-card" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="chapter-num">CH.{ch.chapter_number}</div>
              <div className="chapter-info">
                <h4>{ch.title}</h4>
                <p className="chapter-summary">{ch.summary}</p>
                {ch.consistency_score && (
                  <span
                    className="tag"
                    style={{
                      marginTop: '8px',
                      color: ch.consistency_score >= 80
                        ? 'var(--green)'
                        : ch.consistency_score >= 60
                          ? 'var(--yellow)'
                          : 'var(--red)',
                    }}
                  >
                    {ch.consistency_score}/100
                  </span>
                )}
              </div>
              <button
                className="btn btn-danger btn-delete-chapter"
                onClick={() => handleDelete(ch)}
              >
                XÓA
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default Write;