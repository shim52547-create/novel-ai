import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiPlus, FiEdit3, FiTrash2, FiMap, FiUsers,
  FiActivity, FiGlobe, FiClock, FiSearch
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Memory.css';

const EVENT_TYPES = [
  { value: 'character_action', label: 'HÀNH ĐỘNG', color: '#00f0ff' },
  { value: 'plot_development', label: 'CỐT TRUYỆN', color: '#aa44ff' },
  { value: 'revelation', label: 'TIẾT LỘ', color: '#ffe44d' },
  { value: 'conflict', label: 'XUNG ĐỘT', color: '#ff3366' },
  { value: 'resolution', label: 'GIẢI QUYẾT', color: '#00ff88' },
  { value: 'death', label: 'CÁI CHẾT', color: '#ff0055' },
  { value: 'injury', label: 'THƯƠNG TÍCH', color: '#ff8800' },
  { value: 'meeting', label: 'GẶP GỠ', color: '#00bbff' },
  { value: 'discovery', label: 'PHÁT HIỆN', color: '#44ffaa' },
];

const ENTITY_TYPES = [
  { value: 'location', label: 'ĐỊA ĐIỂM', icon: <FiMap /> },
  { value: 'item', label: 'VẬT PHẨM', icon: <FiActivity /> },
  { value: 'faction', label: 'PHE PHÁI', icon: <FiUsers /> },
  { value: 'rule', label: 'QUY TẮC', icon: <FiGlobe /> },
];

function Memory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('events');
  const [book, setBook] = useState(null);
  const [events, setEvents] = useState([]);
  const [worldState, setWorldState] = useState([]);
  const [timeline, setTimeline] = useState({});
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterChapter, setFilterChapter] = useState('all');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showWorldForm, setShowWorldForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingWorld, setEditingWorld] = useState(null);
  const [eventForm, setEventForm] = useState({
    chapter_number: '', event_type: 'character_action',
    description: '', character_involved: '', location: '', importance: 'normal'
  });
  const [worldForm, setWorldForm] = useState({
    entity_type: 'location', entity_name: '', state_key: '', state_value: ''
  });

  const emptyEventForm = () => ({
    chapter_number: '', event_type: 'character_action',
    description: '', character_involved: '', location: '', importance: 'normal'
  });

  const emptyWorldForm = () => ({
    entity_type: 'location', entity_name: '', state_key: '', state_value: ''
  });

  const load = async () => {
    try {
      const [bookRes, eventsRes, worldRes, timelineRes] = await Promise.all([
        fetch(`http://localhost:4000/api/books/${id}`).then(r => r.json()),
        fetch(`http://localhost:4000/api/books/${id}/events`).then(r => r.json()),
        fetch(`http://localhost:4000/api/books/${id}/world-state`).then(r => r.json()),
        fetch(`http://localhost:4000/api/books/${id}/character-timeline`).then(r => r.json()),
      ]);
      setBook(bookRes.book);
      setEvents(eventsRes);
      setWorldState(worldRes);
      setTimeline(timelineRes);
    } catch (err) {
      console.error('Load error:', err);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleSaveEvent = async () => {
    if (!eventForm.description.trim()) { toast.error('Nhập mô tả'); return; }
    const method = editingEvent ? 'PUT' : 'POST';
    const url = editingEvent
      ? `http://localhost:4000/api/events/${editingEvent.id}`
      : `http://localhost:4000/api/books/${id}/events`;
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventForm)
    });
    toast.success(editingEvent ? 'Đã cập nhật!' : 'Đã thêm!');
    setShowEventForm(false);
    setEditingEvent(null);
    setEventForm(emptyEventForm());
    load();
  };

  const handleDeleteEvent = async (evtId) => {
    if (!window.confirm('Xóa sự kiện này?')) return;
    await fetch(`http://localhost:4000/api/events/${evtId}`, { method: 'DELETE' });
    toast.success('Đã xóa');
    load();
  };

  const handleEditEvent = (evt) => {
    setEventForm(evt);
    setEditingEvent(evt);
    setShowEventForm(true);
  };

  const handleSaveWorld = async () => {
    if (!worldForm.entity_name.trim()) { toast.error('Nhập tên'); return; }
    const method = editingWorld ? 'PUT' : 'POST';
    const url = editingWorld
      ? `http://localhost:4000/api/world-state/${editingWorld.id}`
      : `http://localhost:4000/api/books/${id}/world-state`;
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(worldForm)
    });
    toast.success(editingWorld ? 'Đã cập nhật!' : 'Đã thêm!');
    setShowWorldForm(false);
    setEditingWorld(null);
    setWorldForm(emptyWorldForm());
    load();
  };

  const handleDeleteWorld = async (wsId) => {
    if (!window.confirm('Xóa mục này?')) return;
    await fetch(`http://localhost:4000/api/world-state/${wsId}`, { method: 'DELETE' });
    toast.success('Đã xóa');
    load();
  };

  const handleEditWorld = (ws) => {
    setWorldForm(ws);
    setEditingWorld(ws);
    setShowWorldForm(true);
  };

  const filteredEvents = events.filter(evt => {
    if (filterType !== 'all' && evt.event_type !== filterType) return false;
    if (filterChapter !== 'all' && evt.chapter_number !== parseInt(filterChapter)) return false;
    if (search) {
      const s = search.toLowerCase();
      const desc = (evt.description || '').toLowerCase();
      const chars = (evt.character_involved || '').toLowerCase();
      if (!desc.includes(s) && !chars.includes(s)) return false;
    }
    return true;
  });

  const uniqueChapters = [...new Set(events.map(e => e.chapter_number))].sort((a, b) => a - b);

  const eventTypeMap = {};
  EVENT_TYPES.forEach(t => { eventTypeMap[t.value] = t; });

  const entityMap = {};
  ENTITY_TYPES.forEach(t => { entityMap[t.value] = t; });

  if (!book) return <div className="loading-page"><span className="loading-spinner" /> LOADING...</div>;

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate(`/book/${id}`)} style={{ marginBottom: '16px' }}>
        <FiArrowLeft /> {book.title}
      </button>

      <div className="page-header">
        <h1>BỘ NHỚ</h1>
        <p className="subtitle">Memory Engine — Lưu trữ và quản lý toàn bộ sự kiện, trạng thái thế giới</p>
      </div>

      {/* Stats */}
      <div className="mem-stats">
        <div className="mem-stat">
          <span className="mem-stat-num">{events.length}</span>
          <span className="mem-stat-label">SỰ KIỆN</span>
        </div>
        <div className="mem-stat">
          <span className="mem-stat-num">{worldState.length}</span>
          <span className="mem-stat-label">TRẠNG THÁI</span>
        </div>
        <div className="mem-stat">
          <span className="mem-stat-num">{Object.keys(timeline).length}</span>
          <span className="mem-stat-label">NHÂN VẬT</span>
        </div>
        <div className="mem-stat">
          <span className="mem-stat-num">{uniqueChapters.length}</span>
          <span className="mem-stat-label">CHƯƠNG</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab ${tab === 'events' ? 'active' : ''}`} onClick={() => setTab('events')}>
          <FiActivity /> SỰ KIỆN
        </button>
        <button className={`tab ${tab === 'world' ? 'active' : ''}`} onClick={() => setTab('world')}>
          <FiGlobe /> THẾ GIỚI
        </button>
        <button className={`tab ${tab === 'timeline' ? 'active' : ''}`} onClick={() => setTab('timeline')}>
          <FiUsers /> NHÂN VẬT
        </button>
      </div>

      {/* ====== EVENTS TAB ====== */}
      {tab === 'events' && (
        <div className="mem-section">
          <div className="mem-filters">
            <div className="mem-search">
              <FiSearch />
              <input placeholder="Tìm kiếm sự kiện..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select mem-filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">Tất cả loại</option>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select className="form-select mem-filter-select" value={filterChapter} onChange={e => setFilterChapter(e.target.value)}>
              <option value="all">Tất cả chương</option>
              {uniqueChapters.map(ch => <option key={ch} value={ch}>Ch.{ch}</option>)}
            </select>
            <button className="btn btn-cyber" onClick={() => {
              setEventForm(emptyEventForm());
              setEditingEvent(null);
              setShowEventForm(true);
            }}>
              <FiPlus /> THÊM
            </button>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="empty-state"><p>Không có sự kiện nào</p></div>
          ) : (
            <div className="events-list">
              {filteredEvents.map((evt, i) => {
                const typeInfo = eventTypeMap[evt.event_type] || { label: evt.event_type, color: '#888' };
                return (
                  <div key={evt.id} className="event-card" style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="event-left">
                      <div className="event-type-dot" style={{
                        background: typeInfo.color,
                        boxShadow: `0 0 8px ${typeInfo.color}40`
                      }} />
                      <div className="event-line" />
                    </div>
                    <div className="event-content">
                      <div className="event-header">
                        <span className="event-ch">CH.{evt.chapter_number}</span>
                        <span className="event-type-tag" style={{
                          color: typeInfo.color,
                          borderColor: `${typeInfo.color}40`
                        }}>{typeInfo.label}</span>
                        {evt.importance === 'high' && <span className="tag tag-red">QUAN TRỌNG</span>}
                        <div className="event-actions">
                          <button className="btn btn-ghost" onClick={() => handleEditEvent(evt)}>
                            <FiEdit3 />
                          </button>
                          <button className="btn btn-ghost" style={{ color: 'var(--red)' }} onClick={() => handleDeleteEvent(evt.id)}>
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                      <p className="event-desc">{evt.description}</p>
                      <div className="event-meta">
                        {evt.character_involved && <span><FiUsers /> {evt.character_involved}</span>}
                        {evt.location && <span><FiMap /> {evt.location}</span>}
                        <span><FiClock /> {new Date(evt.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====== WORLD STATE TAB ====== */}
      {tab === 'world' && (
        <div className="mem-section">
          <div className="mem-filters">
            <button className="btn btn-cyber" onClick={() => {
              setWorldForm(emptyWorldForm());
              setEditingWorld(null);
              setShowWorldForm(true);
            }}>
              <FiPlus /> THÊM TRẠNG THÁI
            </button>
          </div>

          {worldState.length === 0 ? (
            <div className="empty-state"><p>Chưa có trạng thái thế giới nào</p></div>
          ) : (
            <div className="world-grid">
              {worldState.map((ws, i) => {
                const entInfo = entityMap[ws.entity_type] || { label: ws.entity_type, icon: <FiGlobe /> };
                return (
                  <div key={ws.id} className="world-card" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="world-card-head">
                      <span className="world-entity-icon">{entInfo.icon}</span>
                      <span className="world-entity-type">{entInfo.label}</span>
                      <div className="event-actions">
                        <button className="btn btn-ghost" onClick={() => handleEditWorld(ws)}>
                          <FiEdit3 />
                        </button>
                        <button className="btn btn-ghost" style={{ color: 'var(--red)' }} onClick={() => handleDeleteWorld(ws.id)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                    <h4 className="world-name">{ws.entity_name}</h4>
                    <div className="world-kv">
                      <span className="world-key">{ws.state_key}</span>
                      <span className="world-value">{ws.state_value}</span>
                    </div>
                    {ws.updated_chapter > 0 && (
                      <span className="world-ch">Cập nhật: Ch.{ws.updated_chapter}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====== CHARACTER TIMELINE TAB ====== */}
      {tab === 'timeline' && (
        <div className="mem-section">
          {Object.keys(timeline).length === 0 ? (
            <div className="empty-state"><p>Chưa có dữ liệu nhân vật</p></div>
          ) : (
            Object.entries(timeline).map(([name, data]) => (
              <div key={name} className="timeline-card">
                <div className="timeline-char-head">
                  <div className="timeline-avatar"><FiUsers /></div>
                  <div>
                    <h3>{name}</h3>
                    <span className={`tag ${
                      data.info.status === 'alive' ? 'tag-green' :
                      data.info.status === 'dead' ? 'tag-red' : 'tag-yellow'
                    }`}>
                      {data.info.status === 'alive' ? 'SỐNG' :
                       data.info.status === 'dead' ? 'ĐÃ CHẾT' : data.info.status}
                    </span>
                  </div>
                </div>

                {data.appearances.length > 0 && (
                  <div className="timeline-events">
                    <div className="timeline-label">XUẤT HIỆN ({data.appearances.length})</div>
                    {data.appearances.slice(-8).map(evt => (
                      <div key={evt.id} className="timeline-event-item">
                        <span className="timeline-ch">Ch.{evt.chapter_number}</span>
                        <span className="timeline-desc">{evt.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                {data.changes.length > 0 && (
                  <div className="timeline-events" style={{ marginTop: '12px' }}>
                    <div className="timeline-label" style={{ color: 'var(--red)' }}>
                      THAY ĐỔI TRẠNG THÁI
                    </div>
                    {data.changes.map(evt => (
                      <div key={evt.id} className="timeline-event-item">
                        <span className="timeline-ch">Ch.{evt.chapter_number}</span>
                        <span className="timeline-desc" style={{ color: 'var(--red)' }}>
                          {evt.description}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {data.appearances.length === 0 && data.changes.length === 0 && (
                  <p className="timeline-empty">Chưa có dữ liệu</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ====== EVENT MODAL ====== */}
      {showEventForm && (
        <div className="modal-overlay" onClick={() => setShowEventForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingEvent ? 'SỬA SỰ KIỆN' : 'THÊM SỰ KIỆN'}</h2>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Chương</label>
                <input className="form-input" type="number"
                  value={eventForm.chapter_number}
                  onChange={e => setEventForm({...eventForm, chapter_number: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Loại sự kiện</label>
                <select className="form-select"
                  value={eventForm.event_type}
                  onChange={e => setEventForm({...eventForm, event_type: e.target.value})}>
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Mô tả</label>
              <textarea className="form-textarea"
                value={eventForm.description}
                onChange={e => setEventForm({...eventForm, description: e.target.value})}
                rows={3} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Nhân vật liên quan</label>
                <input className="form-input"
                  value={eventForm.character_involved}
                  onChange={e => setEventForm({...eventForm, character_involved: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Địa điểm</label>
                <input className="form-input"
                  value={eventForm.location}
                  onChange={e => setEventForm({...eventForm, location: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Mức quan trọng</label>
              <select className="form-select"
                value={eventForm.importance}
                onChange={e => setEventForm({...eventForm, importance: e.target.value})}>
                <option value="low">Thấp</option>
                <option value="normal">Bình thường</option>
                <option value="high">Quan trọng</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowEventForm(false)}>HỦY</button>
              <button className="btn btn-cyber" onClick={handleSaveEvent}>
                {editingEvent ? 'CẬP NHẬT' : 'THÊM'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== WORLD STATE MODAL ====== */}
      {showWorldForm && (
        <div className="modal-overlay" onClick={() => setShowWorldForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingWorld ? 'SỬA TRẠNG THÁI' : 'THÊM TRẠNG THÁI'}</h2>
            <div className="form-group">
              <label className="form-label">Loại</label>
              <select className="form-select"
                value={worldForm.entity_type}
                onChange={e => setWorldForm({...worldForm, entity_type: e.target.value})}>
                {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tên</label>
              <input className="form-input"
                value={worldForm.entity_name}
                onChange={e => setWorldForm({...worldForm, entity_name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Thông tin</label>
              <input className="form-input"
                value={worldForm.state_key}
                onChange={e => setWorldForm({...worldForm, state_key: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Giá trị</label>
              <textarea className="form-textarea"
                value={worldForm.state_value}
                onChange={e => setWorldForm({...worldForm, state_value: e.target.value})}
                rows={3} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowWorldForm(false)}>HỦY</button>
              <button className="btn btn-cyber" onClick={handleSaveWorld}>
                {editingWorld ? 'CẬP NHẬT' : 'THÊM'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Memory;