import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiDownload, FiFileText, FiBook,
  FiFile, FiCode, FiCheckCircle, FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Export.css';
import API_URL, { apiFetch } from '../config';

const FORMATS = [
  {
    format: 'txt',
    label: 'TXT',
    desc: 'Văn bản thuần — mở được mọi nơi',
    icon: <FiFileText />,
    color: '#00f0ff',
    ext: '.txt',
  },
  {
    format: 'epub',
    label: 'EPUB',
    desc: 'Sách điện tử — đọc trên Kindle, điện thoại',
    icon: <FiBook />,
    color: '#00ff88',
    ext: '.epub',
  },
  {
    format: 'pdf',
    label: 'PDF',
    desc: 'Tài liệu — in ấn, chia sẻ chuyên nghiệp',
    icon: <FiFile />,
    color: '#ff00aa',
    ext: '.pdf',
  },
  {
    format: 'markdown',
    label: 'MARKDOWN',
    desc: 'Markdown — đăng lên blog, GitHub',
    icon: <FiCode />,
    color: '#aa44ff',
    ext: '.md',
  },
];

function Export() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    apiFetch(`${API_URL}/api/books/${id}`)
      .then(r => r.json())
      .then(data => {
        setBook(data.book);
        setChapters(data.chapters);
      });
  }, [id]);

  const handleExport = async (format) => {
    if (chapters.length === 0) {
      toast.error('Chưa có chương nào để xuất');
      return;
    }
    setExporting(format);
    try {
      const response = await apiFetch(`${API_URL}/api/books/${id}/export/${format}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Lỗi export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ext = FORMATS.find(f => f.format === format)?.ext || '.txt';
      a.href = url;
      a.download = `${book.title}${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Đã xuất ${format.toUpperCase()} thành công!`);
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    }
    setExporting('');
  };

  if (!book) return <div className="loading-page"><span className="loading-spinner" /> LOADING...</div>;

  const totalChars = chapters.reduce((sum, ch) => sum + (ch.content?.length || 0), 0);
  const totalWords = chapters.reduce((sum, ch) => sum + (ch.content?.split(/\s+/).length || 0), 0);

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate(`/book/${id}`)} style={{ marginBottom: '16px' }}>
        <FiArrowLeft /> {book.title}
      </button>

      <div className="page-header">
        <h1>XUẤT FILE</h1>
        <p className="subtitle">Export truyện ra các định dạng phổ biến</p>
      </div>

      {/* Book info */}
      <div className="export-book-info">
        <div className="export-book-title">
          <span className="export-book-icon">墨</span>
          <div>
            <h3>{book.title}</h3>
            <span className="tag">{book.genre || 'UNCLASSIFIED'}</span>
          </div>
        </div>
        <div className="export-book-stats">
          <div className="export-stat">
            <span className="export-stat-val">{chapters.length}</span>
            <span className="export-stat-lbl">CHƯƠNG</span>
          </div>
          <div className="export-stat">
            <span className="export-stat-val">{(totalWords / 1000).toFixed(1)}k</span>
            <span className="export-stat-lbl">TỪ</span>
          </div>
          <div className="export-stat">
            <span className="export-stat-val">{(totalChars / 1000).toFixed(1)}k</span>
            <span className="export-stat-lbl">KÝ TỰ</span>
          </div>
        </div>
      </div>

      {/* Format cards */}
      <div className="export-grid">
        {FORMATS.map(fmt => (
          <div
            key={fmt.format}
            className={`export-card ${exporting === fmt.format ? 'exporting' : ''}`}
            onClick={() => handleExport(fmt.format)}
          >
            <div className="export-card-top">
              <div className="export-card-icon" style={{
                color: fmt.color,
                borderColor: `${fmt.color}40`,
                background: `${fmt.color}08`,
              }}>
                {exporting === fmt.format ? <span className="loading-spinner" /> : fmt.icon}
              </div>
              <span className="export-card-ext" style={{ color: fmt.color }}>{fmt.ext}</span>
            </div>
            <h3 className="export-card-label">{fmt.label}</h3>
            <p className="export-card-desc">{fmt.desc}</p>
            <div className="export-card-action">
              {exporting === fmt.format ? (
                <span style={{ color: fmt.color }}>ĐANG XUẤT...</span>
              ) : (
                <>
                  <FiDownload /> TẢI XUỐNG
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chapters preview */}
      <div className="separator" />
      <div className="section-header">
        <h2><span className="section-bracket">[</span>CHƯƠNG SẼ ĐƯỢC XUẤT<span className="section-bracket">]</span></h2>
      </div>

      {chapters.length === 0 ? (
        <div className="empty-state">
          <div className="icon">⬡</div>
          <p>Chưa có chương nào. Hãy viết truyện trước khi xuất file.</p>
        </div>
      ) : (
        <div className="export-chapters">
          {chapters.map((ch, i) => (
            <div key={ch.id} className="export-ch-item" style={{ animationDelay: `${i * 0.05}s` }}>
              <span className="export-ch-num">CH.{ch.chapter_number}</span>
              <span className="export-ch-title">{ch.title}</span>
              <span className="export-ch-size">
                <FiClock /> {(ch.content?.length || 0).toLocaleString()} ký tự
              </span>
              <FiCheckCircle style={{ color: 'var(--green)', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Export;