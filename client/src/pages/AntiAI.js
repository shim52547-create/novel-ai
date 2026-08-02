import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiSearch, FiZap, FiCheckCircle, FiAlertTriangle,
  FiXCircle, FiCopy, FiRefreshCw, FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AntiAI.css';
import API_URL, { apiFetch, getHeaders } from '../config';

function AntiAI() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [quickResult, setQuickResult] = useState(null);
  const [detailedResult, setDetailedResult] = useState(null);
  const [fixedText, setFixedText] = useState('');
  const [loading, setLoading] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [showChapters, setShowChapters] = useState(false);

  const loadChapters = async () => {
    const res = await apiFetch(`${API_URL}/api/books/${id}`);
    const data = await res.json();
    setChapters(data.chapters);
    setShowChapters(true);
  };

  const loadChapterContent = (ch) => {
    setText(ch.content);
    setSelectedChapter(ch);
    setShowChapters(false);
    setQuickResult(null);
    setDetailedResult(null);
    setFixedText('');
  };

  const handleQuickAnalyze = async () => {
    if (!text.trim()) { toast.error('Nhập văn bản'); return; }
    setLoading('quick');
    try {
      const res = await apiFetch(`${API_URL}/api/anti-ai/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setQuickResult(data);
      toast.success(`Điểm: ${data.quickScore}/100 — Mức: ${data.smellLevel}`);
    } catch (err) {
      toast.error('Lỗi phân tích');
    }
    setLoading('');
  };

  const handleDeepAnalyze = async () => {
    if (!text.trim()) { toast.error('Nhập văn bản'); return; }
    setLoading('deep');
    try {
      const res = await apiFetch(`${API_URL}/api/anti-ai/analyze`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setDetailedResult(data);
      toast.success(`Điểm: ${data.overall_score}/100 — ${data.issues?.length || 0} vấn đề`);
    } catch (err) {
      toast.error('Lỗi phân tích');
    }
    setLoading('');
  };

  const handleFix = async () => {
    if (!text.trim()) { toast.error('Nhập văn bản'); return; }
    setLoading('fix');
    try {
      const res = await apiFetch(`${API_URL}/api/anti-ai/fix`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          text,
          issues: detailedResult?.issues || [],
        }),
      });
      const data = await res.json();
      setFixedText(data.fixed);
      toast.success('Đã sửa xong!');
    } catch (err) {
      toast.error('Lỗi sửa');
    }
    setLoading('');
  };

  const handleSaveToChapter = async () => {
    if (!selectedChapter || !fixedText) return;
    try {
      await apiFetch(`${API_URL}/api/chapters/${selectedChapter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedChapter.title,
          content: fixedText,
          summary: selectedChapter.summary,
        }),
      });
      toast.success('Đã lưu bản sửa vào chương!');
      setText(fixedText);
      setFixedText('');
    } catch (err) {
      toast.error('Lỗi lưu');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fixedText || text);
    toast.success('Đã copy!');
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'var(--green)';
    if (score >= 65) return 'var(--yellow)';
    if (score >= 40) return '#ff8800';
    return 'var(--red)';
  };

  const getSmellLabel = (level) => {
    const map = { low: 'SẠCH', medium: 'TRUNG BÌNH', high: 'NHIỄM CAO', extreme: 'NHIỄM NẶNG' };
    return map[level] || level;
  };

  const getSmellColor = (level) => {
    const map = { low: 'var(--green)', medium: 'var(--yellow)', high: '#ff8800', extreme: 'var(--red)' };
    return map[level] || 'var(--text-muted)';
  };

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate(`/book/${id}`)} style={{ marginBottom: '16px' }}>
        <FiArrowLeft /> Quay lại
      </button>

      <div className="page-header">
        <h1>ANTI-AI SMELL</h1>
        <p className="subtitle">Phát hiện và loại bỏ dấu vết AI trong văn bản</p>
      </div>

      {/* Action bar */}
      <div className="antiai-actions">
        <button className="btn btn-ghost" onClick={loadChapters}>
          <FiFileText /> CHỌN CHƯƠNG
        </button>
        <button className="btn btn-cyber" onClick={handleQuickAnalyze} disabled={!!loading}>
          {loading === 'quick' ? <><span className="loading-spinner" /> ĐANG KIỂM TRA...</> : <><FiSearch /> PHÂN TÍCH NHANH</>}
        </button>
        <button className="btn btn-cyber" onClick={handleDeepAnalyze} disabled={!!loading}>
          {loading === 'deep' ? <><span className="loading-spinner" /> ĐANG PHÂN TÍCH...</> : <><FiZap /> PHÂN TÍCH CHI TIẾT</>}
        </button>
        <button className="btn btn-cyber" onClick={handleFix} disabled={!!loading} style={{ background: 'linear-gradient(135deg, #ff8800, #ff00aa)', borderColor: 'rgba(255,136,0,0.5)' }}>
          {loading === 'fix' ? <><span className="loading-spinner" /> ĐANG SỬA...</> : <><FiRefreshCw /> TỰ ĐỘNG SỬA</>}
        </button>
        <button className="btn btn-ghost" onClick={copyToClipboard}>
          <FiCopy /> COPY
        </button>
      </div>

      {/* Chapter selector */}
      {showChapters && (
        <div className="antiai-chapters">
          <div className="antiai-chapters-header">
            <span>CHỌN CHƯƠNG ĐỂ KIỂM TRA</span>
            <button className="btn btn-ghost" onClick={() => setShowChapters(false)}>ĐÓNG</button>
          </div>
          {chapters.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '20px' }}>Chưa có chương nào</p>
          ) : (
            chapters.map(ch => (
              <div key={ch.id} className="antiai-chapter-item" onClick={() => loadChapterContent(ch)}>
                <span className="antiai-ch-num">CH.{ch.chapter_number}</span>
                <span className="antiai-ch-title">{ch.title}</span>
                <span className="antiai-ch-size">{(ch.content?.length || 0).toLocaleString()} ký tự</span>
              </div>
            ))
          )}
        </div>
      )}

      <div className={`antiai-layout ${fixedText ? 'has-two' : ''}`}>
        {/* Input */}
        <div className="antiai-panel">
          <div className="antiai-panel-header">
            <span>VĂN BẢN GỐC</span>
            <span className="antiai-char-count">{text.length.toLocaleString()} ký tự</span>
          </div>
          <textarea
            className="antiai-editor"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Dán văn bản vào đây hoặc chọn chương..."
          />
        </div>

        {/* Fixed output */}
        {fixedText && (
          <div className="antiai-panel">
            <div className="antiai-panel-header">
              <span style={{ color: 'var(--green)' }}>VĂN BẢN ĐÃ SỬA</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedChapter && (
                  <button className="btn btn-cyber" onClick={handleSaveToChapter} style={{ padding: '6px 12px', fontSize: '0.7rem' }}>
                    LƯU VÀO CHƯƠNG
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => { setText(fixedText); setFixedText(''); }} style={{ padding: '6px 12px', fontSize: '0.7rem' }}>
                  THAY THẾ GỐC
                </button>
              </div>
            </div>
            <textarea className="antiai-editor antiai-editor-fixed" value={fixedText} readOnly />
          </div>
        )}
      </div>

      {/* Quick Analysis Result */}
      {quickResult && (
        <div className="antiai-results">
          <div className="antiai-score-card">
            <div className="antiai-score-ring" style={{ borderColor: getScoreColor(quickResult.quickScore) }}>
              <span className="antiai-score-num" style={{ color: getScoreColor(quickResult.quickScore) }}>
                {quickResult.quickScore}
              </span>
              <span className="antiai-score-label">/100</span>
            </div>
            <div className="antiai-score-info">
              <span className="antiai-smell-badge" style={{
                color: getSmellColor(quickResult.smellLevel),
                borderColor: getSmellColor(quickResult.smellLevel),
              }}>
                {getSmellLabel(quickResult.smellLevel)}
              </span>
              <span className="antiai-score-desc">
                {quickResult.quickScore >= 85 ? 'Văn bản sạch, không có dấu vết AI rõ ràng' :
                 quickResult.quickScore >= 65 ? 'Có một số dấu vết AI nhẹ' :
                 quickResult.quickScore >= 40 ? 'Nhiều dấu vết AI, cần chỉnh sửa' :
                 'Dấu vết AI rất nặng, cần viết lại'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="antiai-stats-grid">
            <div className="antiai-stat">
              <span className="antiai-stat-val">{quickResult.totalWords}</span>
              <span className="antiai-stat-lbl">TỔNG TỪ</span>
            </div>
            <div className="antiai-stat">
              <span className="antiai-stat-val">{quickResult.uniqueRatio}%</span>
              <span className="antiai-stat-lbl">ĐA DẠNG TỪ</span>
            </div>
            <div className="antiai-stat">
              <span className="antiai-stat-val">{quickResult.avgSentenceLength}</span>
              <span className="antiai-stat-lbl">TB TỪ/CÂU</span>
            </div>
            <div className="antiai-stat">
              <span className="antiai-stat-val">{quickResult.dialogueRatio}%</span>
              <span className="antiai-stat-lbl">HỘI THOẠI</span>
            </div>
          </div>

          {/* Repeated words */}
          {quickResult.repeatedWords?.length > 0 && (
            <div className="antiai-card">
              <h3><FiAlertTriangle style={{ color: 'var(--yellow)' }} /> TỪ LẶP NHIỀU</h3>
              <div className="antiai-words-list">
                {quickResult.repeatedWords.map(([word, count], i) => (
                  <div key={i} className="antiai-word-item">
                    <span className="antiai-word">"{word}"</span>
                    <span className="antiai-word-count" style={{
                      color: count >= 8 ? 'var(--red)' : count >= 5 ? '#ff8800' : 'var(--yellow)'
                    }}>{count} lần</span>
                    <div className="antiai-word-bar">
                      <div className="antiai-word-fill" style={{
                        width: `${Math.min(100, count * 12)}%`,
                        background: count >= 8 ? 'var(--red)' : count >= 5 ? '#ff8800' : 'var(--yellow)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Phrases */}
          {quickResult.aiPhrases?.length > 0 && (
            <div className="antiai-card antiai-card-danger">
              <h3><FiXCircle style={{ color: 'var(--red)' }} /> CỤM TỪ AI ĐIỂN HÌNH</h3>
              <div className="antiai-words-list">
                {quickResult.aiPhrases.map((item, i) => (
                  <div key={i} className="antiai-word-item">
                    <span className="antiai-word" style={{ color: 'var(--red)' }}>"{item.phrase}"</span>
                    <span className="antiai-word-count" style={{ color: 'var(--red)' }}>{item.count} lần</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Analysis Result */}
      {detailedResult && (
        <div className="antiai-results">
          <div className="antiai-score-card">
            <div className="antiai-score-ring" style={{ borderColor: getScoreColor(detailedResult.overall_score) }}>
              <span className="antiai-score-num" style={{ color: getScoreColor(detailedResult.overall_score) }}>
                {detailedResult.overall_score}
              </span>
              <span className="antiai-score-label">/100</span>
            </div>
            <div className="antiai-score-info">
              <span className="antiai-smell-badge" style={{
                color: getSmellColor(detailedResult.smell_level),
                borderColor: getSmellColor(detailedResult.smell_level),
              }}>
                {getSmellLabel(detailedResult.smell_level)}
              </span>
              <span className="antiai-score-desc">
                Phát hiện {detailedResult.issues?.length || 0} vấn đề
              </span>
            </div>
          </div>

          {/* Issues */}
          {detailedResult.issues?.map((issue, i) => (
            <div key={i} className={`antiai-issue antiai-issue-${issue.severity}`}>
              <div className="antiai-issue-header">
                <span className="antiai-issue-type">{issue.type?.replace(/_/g, ' ').toUpperCase()}</span>
                <span className={`antiai-issue-severity sev-${issue.severity}`}>
                  {issue.severity === 'high' ? 'CAO' : issue.severity === 'medium' ? 'TRUNG BÌNH' : 'THẤP'}
                </span>
              </div>
              {issue.original && (
                <div className="antiai-issue-original">
                  <span className="antiai-issue-label">GỐC:</span>
                  <p>"{issue.original}"</p>
                </div>
              )}
              {issue.explanation && (
                <div className="antiai-issue-explain">
                  <span className="antiai-issue-label">VẤN ĐỀ:</span>
                  <p>{issue.explanation}</p>
                </div>
              )}
              {issue.suggestion && (
                <div className="antiai-issue-suggest">
                  <span className="antiai-issue-label">GỢI Ý:</span>
                  <p>{issue.suggestion}</p>
                </div>
              )}
            </div>
          ))}

          {/* Recommendations */}
          {detailedResult.recommendations?.length > 0 && (
            <div className="antiai-card">
              <h3><FiCheckCircle style={{ color: 'var(--cyan)' }} /> KHUYẾN NGHỊ</h3>
              <ul className="antiai-rec-list">
                {detailedResult.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AntiAI;