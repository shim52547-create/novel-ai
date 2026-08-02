import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome, FiBookOpen, FiUsers, FiFeather, FiMap,
  FiChevronLeft, FiChevronRight, FiPlus,
  FiActivity, FiShield, FiDownload, FiEdit3,
  FiBook, FiMessageSquare, FiSettings
} from 'react-icons/fi';
import './Sidebar.css';

function Sidebar({ books, collapsed, onToggle }) {
  const location = useLocation();
  const params = location.pathname.match(/\/book\/(\d+)/);
  const bookId = params?.[1];
  const isHome = location.pathname === '/';

  const bookNav = bookId ? [
    { path: `/book/${bookId}`, label: 'TỔNG QUAN', icon: <FiBookOpen /> },
    { path: `/book/${bookId}/characters`, label: 'NHÂN VẬT', icon: <FiUsers /> },
    { path: `/book/${bookId}/plot`, label: 'KẾ HOẠCH', icon: <FiMap /> },
    { path: `/book/${bookId}/memory`, label: 'BỘ NHỚ', icon: <FiActivity /> },
    { path: `/book/${bookId}/storybible`, label: 'CẨM NANG', icon: <FiBook /> },
    { path: `/book/${bookId}/chat`, label: 'AI CHAT', icon: <FiMessageSquare /> },
    { path: `/book/${bookId}/anti-ai`, label: 'ANTI-AI', icon: <FiShield /> },
    { path: `/book/${bookId}/revision`, label: 'REVISION', icon: <FiEdit3 /> },
    { path: `/book/${bookId}/export`, label: 'XUẤT FILE', icon: <FiDownload /> },
    { path: `/book/${bookId}/write`, label: 'VIẾT TRUYỆN', icon: <FiFeather /> },
  ] : [];

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <span className="logo-icon">墨</span>
          {!collapsed && <span className="logo-text">NOVEL <span className="logo-ai">AI</span></span>}
        </Link>
        <button className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      <div className="sidebar-section">
        <Link to="/" className={`sidebar-link ${isHome ? 'active' : ''}`}>
          <FiHome />
          {!collapsed && <span>TRANG CHỦ</span>}
        </Link>
      </div>

      {bookId && (
        <>
          <div className="sidebar-divider" />
          <div className="sidebar-section">
            {!collapsed && <div className="sidebar-section-title">DỰ ÁN</div>}
            {bookNav.map(item => (
              <Link key={item.path} to={item.path} className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}>
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="sidebar-divider" />
      <div className="sidebar-section">
        {!collapsed && <div className="sidebar-section-title">TÁC PHẨM</div>}
        {books.slice(0, 8).map(book => (
          <Link key={book.id} to={`/book/${book.id}`} className={`sidebar-link sidebar-book ${location.pathname === `/book/${book.id}` ? 'active' : ''}`}>
            <span className="book-dot" />
            {!collapsed && <span className="book-title">{book.title}</span>}
          </Link>
        ))}
        {!collapsed && (
          <Link to="/" className="sidebar-link sidebar-add">
            <FiPlus /><span>TẠO MỚI</span>
          </Link>
        )}
      </div>

      <div className="sidebar-divider" />
      <div className="sidebar-section">
        <Link to="/settings" className={`sidebar-link ${location.pathname === '/settings' ? 'active' : ''}`}>
          <FiSettings />
          {!collapsed && <span>CÀI ĐẶT</span>}
        </Link>
      </div>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-version">
            <span className="version-dot" /> SYSTEM ONLINE
          </div>
        )}
      </div>
    </nav>
  );
}

export default Sidebar;