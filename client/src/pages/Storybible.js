import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiZap, FiGlobe, FiUsers, FiMap,
  FiClock, FiBookOpen, FiFileText, FiChevronDown,
  FiChevronRight, FiCopy, FiDownload
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Storybible.css';
import API_URL, { apiFetch } from '../config';

function Storybible() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [narrative, setNarrative] = useState('');
  const [loading, setLoading] = useState('');
  const [expanded, setExpanded] = useState({});

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/books/${id}/storybible`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Load error:', err);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setLoading('generate');
    try {
      const res = await apiFetch(`${API_URL}/api/books/${id}/storybible/generate`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setNarrative(json.narrative);
      toast.success('Đã tạo Cẩm Nang!');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    }
    setLoading('');
  };

  const toggleSection = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyAll = () => {
    const text = narrative || JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    toast.success('Đã copy!');
  };

  const downloadTxt = () => {
    const text = narrative || JSON.stringify(data, null, 2);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data?.world?.title || 'cam_nang'}_cam_nang.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!data) return <div className="loading-page"><span className="loading-spinner" /> LOADING...</div>;

  const sections = [
    {
      key: 'world',
      icon: <FiGlobe />,
      title: 'THẾ GIỚI',
      count: data.world?.genre ? 1 : 0,
      content: (
        <div className="sb-content">
          <div className="sb-field"><span className="sb-label">Tiêu đề</span><span className="sb-value">{data.world?.title}</span></div>
          <div className="sb-field"><span className="sb-label">Thể loại</span><span className="sb-value">{data.world?.genre || '—'}</span></div>
          <div className="sb-field"><span className="sb-label">Bối cảnh</span><span className="sb-value">{data.world?.setting || '—'}</span></div>
          <div className="sb-field"><span className="sb-label">Tóm tắt</span><span className="sb-value">{data.world?.synopsis || '—'}</span></div>
          {data.world?.world_rules && (
            <div className="sb-field"><span className="sb-label">Quy tắc thế giới</span><pre className="sb-pre">{data.world.world_rules}</pre></div>
          )}
        </div>
      ),
    },
    {
      key: 'characters',
      icon: <FiUsers />,
      title: 'NHÂN VẬT',
      count: data.characters?.length || 0,
      content: (
        <div className="sb-content">
          {data.characters?.length === 0 ? (
            <p className="sb-empty">Chưa có nhân vật</p>
          ) : (
            data.characters?.map((c, i) => (
              <div key={i} className="sb-char-card">
                <div className="sb-char-head">
                  <h4>{c.name}</h4>
                  <span className={`sb-status ${c.status === 'alive' ? 'status-alive' : c.status === 'dead' ? 'status-dead' : ''}`}>
                    {c.status || 'alive'}
                  </span>
                </div>
                {c.age && <div className="sb-field"><span className="sb-label">Tuổi</span><span className="sb-value">{c.age}</span></div>}
                {c.appearance && <div className="sb-field"><span className="sb-label">Ngoại hình</span><span className="sb-value">{c.appearance}</span></div>}
                {c.personality && <div className="sb-field"><span className="sb-label">Tính cách</span><span className="sb-value">{c.personality}</span></div>}
                {c.relationships && <div className="sb-field"><span className="sb-label">Quan hệ</span><span className="sb-value">{c.relationships}</span></div>}
                {c.backstory && <div className="sb-field"><span className="sb-label">Tiểu sử</span><span className="sb-value">{c.backstory}</span></div>}
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'plot',
      icon: <FiMap />,
      title: 'KẾ HOẠCH',
      count: data.plot_points?.length || 0,
      content: (
        <div className="sb-content">
          {data.plot_points?.length === 0 ? (
            <p className="sb-empty">Chưa có kế hoạch</p>
          ) : (
            data.plot_points?.map((p, i) => (
              <div key={i} className="sb-plot-item">
                <span className="sb-plot-ch">Ch.{p.chapter}</span>
                <span className="sb-plot-event">{p.event}</span>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'events',
      icon: <FiClock />,
      title: 'SỰ KIỆN',
      count: data.story_events?.length || 0,
      content: (
        <div className="sb-content">
          {data.story_events?.length === 0 ? (
            <p className="sb-empty">Chưa có sự kiện</p>
          ) : (
            data.story_events?.map((e, i) => (
              <div key={i} className="sb-event-item">
                <span className="sb-event-ch">Ch.{e.chapter}</span>
                <span className="sb-event-type">{e.type}</span>
                <span className="sb-event-desc">{e.description}</span>
                {e.characters && <span className="sb-event-chars">{e.characters}</span>}
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'world_state',
      icon: <FiGlobe />,
      title: 'TRẠNG THÁI THẾ GIỚI',
      count: data.world_state?.length || 0,
      content: (
        <div className="sb-content">
          {data.world_state?.length === 0 ? (
            <p className="sb-empty">Chưa có trạng thái</p>
          ) : (
            <div className="sb-state-grid">
              {data.world_state?.map((w, i) => (
                <div key={i} className="sb-state-card">
                  <span className="sb-state-type">{w.type}</span>
                  <span className="sb-state-name">{w.name}</span>
                  <span className="sb-state-key">{w.key}</span>
                  <span className="sb-state-val">{w.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'chapters',
      icon: <FiBookOpen />,
      title: 'CHƯƠNG',
      count: data.chapters?.length || 0,
      content: (
        <div className="sb-content">
          {data.chapters?.length === 0 ? (
            <p className="sb-empty">Chưa có chương</p>
          ) : (
            data.chapters?.map((ch, i) => (
              <div key={i} className="sb-chapter-item">
                <span className="sb-ch-num">Ch.{ch.number}</span>
                <span className="sb-ch-title">{ch.title}</span>
                {ch.summary && <span className="sb-ch-summary">{ch.summary}</span>}
                {ch.score && <span className={`sb-ch-score ${ch.score >= 80 ? 'score-good' : ch.score >= 60 ? 'score-mid' : 'score-low'}`}>{ch.score}</span>}
              </div>
            ))
          )}
        </div>
      ),
    },
  ];

  const totalChars = data.characters?.length || 0;
  const totalEvents = data.story_events?.length || 0;
  const totalChapters = data.chapters?.length || 0;
  const totalWorldState = data.world_state?.length || 0;

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate(`/book/${id}`)} style={{ marginBottom: '16px' }}>
        <FiArrowLeft /> {data.world?.title}
      </button>

      <div className="page-header">
        <h1>CẨM NANG</h1>
        <p className="subtitle">Tổng hợp toàn bộ thế giới, nhân vật, quy tắc của truyện</p>
      </div>

      {/* Stats */}
      <div className="sb-stats">
        <div className="sb-stat"><span className="sb-stat-num">{totalChars}</span><span className="sb-stat-lbl">NHÂN VẬT</span></div>
        <div className="sb-stat"><span className="sb-stat-num">{totalEvents}</span><span className="sb-stat-lbl">SỰ KIỆN</span></div>
        <div className="sb-stat"><span className="sb-stat-num">{totalChapters}</span><span className="sb-stat-lbl">CHƯƠNG</span></div>
        <div className="sb-stat"><span className="sb-stat-num">{totalWorldState}</span><span className="sb-stat-lbl">TRẠNG THÁI</span></div>
      </div>

      {/* Actions */}
      <div className="sb-actions">
        <button className="btn btn-cyber" onClick={handleGenerate} disabled={!!loading}>
          {loading === 'generate' ? <><span className="loading-spinner" /> ĐANG TẠO...</> : <><FiZap /> TẠO BẰNG AI</>}
        </button>
        <button className="btn btn-ghost" onClick={copyAll}><FiCopy /> COPY</button>
        <button className="btn btn-ghost" onClick={downloadTxt}><FiDownload /> TẢI TXT</button>
      </div>

      {/* Narrative */}
      {narrative && (
        <div className="sb-narrative">
          <div className="sb-narrative-header">
            <FiFileText />
            <span>CẨM NANG — TẠO BỞI AI</span>
          </div>
          <div className="sb-narrative-body">
            {narrative.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h2 key={i} className="sb-h2">{line.replace('## ', '')}</h2>;
              if (line.startsWith('### ')) return <h3 key={i} className="sb-h3">{line.replace('### ', '')}</h3>;
              if (line.startsWith('- ')) return <p key={i} className="sb-li">{line}</p>;
              if (line.trim() === '') return <br key={i} />;
              return <p key={i} className="sb-p">{line}</p>;
            })}
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="sb-sections">
        {sections.map(sec => (
          <div key={sec.key} className="sb-section">
            <div className="sb-section-header" onClick={() => toggleSection(sec.key)}>
              <div className="sb-section-left">
                {expanded[sec.key] !== false ? <FiChevronDown /> : <FiChevronRight />}
                {sec.icon}
                <span>{sec.title}</span>
              </div>
              <span className="sb-section-count">{sec.count}</span>
            </div>
            {expanded[sec.key] !== false && sec.content}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Storybible;