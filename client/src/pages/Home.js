import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiBookOpen, FiFeather, FiClock, FiZap, FiDatabase, FiCpu, FiTerminal } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Home.css';

function Typewriter({ text, speed = 40 }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return <span>{displayed}<span className="cursor-blink">█</span></span>;
}

function CountUp({ target, duration = 1500 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const interval = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(interval);
  }, [target, duration]);
  return <span>{count}</span>;
}

function Home({ books, refreshBooks }) {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', genre: '', setting: '', synopsis: '' });
  const [creating, setCreating] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error('Nhập tên truyện'); return; }
    setCreating(true);
    try {
      const res = await fetch('http://localhost:4000/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      await refreshBooks();
      toast.success('Khởi tạo thành công!');
      navigate(`/book/${data.id}`);
    } catch (err) { toast.error('Lỗi khởi tạo'); }
    setCreating(false);
  };

  const genreOptions = [
    'Linh dị đô thị', 'Tiên hiệp', 'Huyền huyễn', 'Kiếm hiệp',
    'Ngôn tình', 'Đô thị', 'Khoa học viễn tưởng', 'Trinh thám',
    'Mạt thế', 'Game online', 'Xuyên không', 'Hệ thống'
  ];

  return (
    <div className="page">
      {/* ====== CYBER BANNER ====== */}
      <div className="cyber-banner">
        <div className="banner-grid-bg" />
        <div className="banner-noise" />
        <div className="banner-vignette" />

        {/* Animated circuit lines */}
        <svg className="banner-circuits" viewBox="0 0 1100 400" preserveAspectRatio="none">
          <defs>
            <linearGradient id="circuit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0" />
              <stop offset="50%" stopColor="#00f0ff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="circuit-grad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff00aa" stopOpacity="0" />
              <stop offset="50%" stopColor="#ff00aa" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ff00aa" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Horizontal lines */}
          <line x1="0" y1="80" x2="1100" y2="80" stroke="url(#circuit-grad)" strokeWidth="0.5">
            <animate attributeName="x1" values="0;1100;0" dur="8s" repeatCount="indefinite" />
          </line>
          <line x1="0" y1="200" x2="1100" y2="200" stroke="url(#circuit-grad2)" strokeWidth="0.5">
            <animate attributeName="x2" values="1100;0;1100" dur="12s" repeatCount="indefinite" />
          </line>
          <line x1="0" y1="320" x2="1100" y2="320" stroke="url(#circuit-grad)" strokeWidth="0.5">
            <animate attributeName="x1" values="1100;0;1100" dur="10s" repeatCount="indefinite" />
          </line>
          {/* Dots traveling */}
          <circle r="2" fill="#00f0ff" opacity="0.8">
            <animateMotion dur="6s" repeatCount="indefinite"
              path="M0,80 L400,80 L400,150 L700,150 L700,80 L1100,80" />
          </circle>
          <circle r="2" fill="#ff00aa" opacity="0.7">
            <animateMotion dur="9s" repeatCount="indefinite"
              path="M1100,320 L800,320 L800,250 L500,250 L500,320 L0,320" />
          </circle>
          <circle r="1.5" fill="#aa44ff" opacity="0.6">
            <animateMotion dur="7s" repeatCount="indefinite"
              path="M0,200 L200,200 L200,100 L500,100 L500,200 L800,200 L800,300 L1100,300" />
          </circle>
          {/* Circuit nodes */}
          <rect x="398" y="78" width="4" height="4" fill="#00f0ff" opacity="0.6">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          </rect>
          <rect x="698" y="148" width="4" height="4" fill="#00f0ff" opacity="0.6">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
          </rect>
          <rect x="798" y="318" width="4" height="4" fill="#ff00aa" opacity="0.6">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite" />
          </rect>
        </svg>

        {/* Banner content */}
        <div className="banner-content">
          <div className="banner-top-bar">
            <div className="banner-status">
              <span className="status-dot" />
              <span>SYSTEM ONLINE</span>
            </div>
            <div className="banner-time">
              {time.toLocaleTimeString('vi-VN', { hour12: false })}
            </div>
          </div>

          <div className="banner-main">
            <div className="banner-text">
              <div className="banner-tagline">
                <FiTerminal className="tagline-icon" />
                <span>NEXT-GEN AI WRITING SYSTEM</span>
              </div>

              <h1 className="banner-title glitch" data-text="NOVEL AI STUDIO">
                NOVEL AI STUDIO
              </h1>

              <p className="banner-desc">
                Hệ thống sáng tạo truyện AI đa Agent.<br />
                Giữ nhân vật nhất quán · Không lệch quỹ đạo · Viết dài tập tự động.
              </p>

              <div className="banner-features">
                <div className="feature-pill">
                  <span className="pill-dot cyan" />
                  MEMORY ENGINE
                </div>
                <div className="feature-pill">
                  <span className="pill-dot magenta" />
                  CONSISTENCY CHECK
                </div>
                <div className="feature-pill">
                  <span className="pill-dot green" />
                  AUTO WRITE
                </div>
              </div>

              <div className="banner-actions">
                <button className="btn btn-cyber btn-lg" onClick={() => setShowCreate(true)}>
                  <FiZap /> KHỞI TẠO DỰ ÁN
                </button>
              </div>
            </div>

            <div className="banner-visual">
              <div className="visual-hex-ring">
                <div className="hex-ring-inner">
                  <div className="hex-core">
                    <span className="hex-kanji">墨</span>
                    <span className="hex-label">AI ENGINE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="banner-bottom-bar">
            <span className="bar-segment">
              <span className="seg-label">PROJECTS</span>
              <span className="seg-value"><CountUp target={books.length} /></span>
            </span>
            <span className="bar-divider" />
            <span className="bar-segment">
              <span className="seg-label">ENGINE</span>
              <span className="seg-value flicker">MISTRAL-v7</span>
            </span>
            <span className="bar-divider" />
            <span className="bar-segment">
              <span className="seg-label">STATUS</span>
              <span className="seg-value" style={{ color: 'var(--green)' }}>OPERATIONAL</span>
            </span>
            <span className="bar-divider" />
            <span className="bar-segment">
              <span className="seg-label">UPTIME</span>
              <span className="seg-value">99.97%</span>
            </span>
          </div>
        </div>
      </div>

      {/* ====== STATS ====== */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap"><FiDatabase /></div>
          <div className="stat-number"><CountUp target={books.length} /></div>
          <div className="stat-label">DỰ ÁN</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap"><FiBookOpen /></div>
          <div className="stat-number">—</div>
          <div className="stat-label">CHƯƠNG</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap"><FiFeather /></div>
          <div className="stat-number">—</div>
          <div className="stat-label">KÝ TỰ</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap"><FiCpu /></div>
          <div className="stat-number flicker" style={{ color: 'var(--green)' }}>ACT</div>
          <div className="stat-label">AI ENGINE</div>
        </div>
      </div>

      <div className="separator" />

      {/* ====== QUICK GENRE SELECT ====== */}
      <div className="section-header">
        <h2><span className="section-bracket">[</span>THỂ LOẠI PHỔ BIẾN<span className="section-bracket">]</span></h2>
      </div>
      <div className="genre-grid">
        {genreOptions.map(g => (
          <button key={g} className="genre-chip" onClick={() => {
            setForm(prev => ({ ...prev, genre: g }));
            setShowCreate(true);
          }}>
            {g}
          </button>
        ))}
      </div>

      <div className="separator" />

      {/* ====== BOOKS ====== */}
      <div className="section-header">
        <h2><span className="section-bracket">[</span>DANH SÁCH DỰ ÁN<span className="section-bracket">]</span></h2>
        <span className="section-count">{books.length} ITEMS</span>
      </div>

      {books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrap">
            <div className="empty-hex">⬡</div>
          </div>
          <p>Hệ thống trống. Khởi tạo dự án đầu tiên.</p>
          <button className="btn btn-cyber" onClick={() => setShowCreate(true)}>
            <FiPlus /> KHỞI TẠO
          </button>
        </div>
      ) : (
        <div className="book-grid">
          {books.map((book, i) => (
            <div key={book.id} className="book-card"
              onClick={() => navigate(`/book/${book.id}`)}
              style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="book-card-scan" />
              <div className="book-card-line" />
              <div className="book-card-header">
                <span className="tag">{book.genre || 'UNCLASSIFIED'}</span>
                <span className="book-id">#{String(book.id).padStart(3, '0')}</span>
              </div>
              <h3 className="book-card-title">{book.title}</h3>
              <p className="book-card-desc">{book.synopsis || 'Chưa có mô tả'}</p>
              <div className="book-card-footer">
                <span className="book-card-date">
                  <FiClock /> {new Date(book.created_at).toLocaleDateString('vi-VN')}
                </span>
                <span className="book-card-action">MỞ →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====== CREATE MODAL ====== */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2><FiZap style={{ marginRight: '8px' }} />KHỞI TẠO DỰ ÁN</h2>

            <div className="form-group">
              <label className="form-label">Tên dự án *</label>
              <input className="form-input" placeholder="Nhập tên truyện..."
                value={form.title} onChange={e => setForm({...form, title: e.target.value})} autoFocus />
            </div>

            <div className="form-group">
              <label className="form-label">Thể loại</label>
              <div className="genre-select-grid">
                {genreOptions.map(g => (
                  <button key={g}
                    className={`genre-select-btn ${form.genre === g ? 'selected' : ''}`}
                    onClick={() => setForm({...form, genre: g})}>
                    {g}
                  </button>
                ))}
              </div>
              <input className="form-input" placeholder="Hoặc nhập thể loại tùy chỉnh..."
                value={form.genre} onChange={e => setForm({...form, genre: e.target.value})}
                style={{ marginTop: '8px' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Bối cảnh</label>
              <textarea className="form-textarea" placeholder="Mô tả thế giới, thời đại, địa điểm..."
                value={form.setting} onChange={e => setForm({...form, setting: e.target.value})} rows={3} />
            </div>

            <div className="form-group">
              <label className="form-label">Tóm tắt cốt truyện</label>
              <textarea className="form-textarea" placeholder="Tóm tắt ngắn gọn nội dung chính..."
                value={form.synopsis} onChange={e => setForm({...form, synopsis: e.target.value})} rows={4} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>HỦY</button>
              <button className="btn btn-cyber" onClick={handleCreate} disabled={creating}>
                {creating ? <><span className="loading-spinner" /> KHỞI TẠO...</> : <><FiZap /> KHỞI TẠO</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;