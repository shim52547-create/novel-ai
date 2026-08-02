import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiSend, FiUsers, FiMessageSquare, FiTrash2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AIChat.css';
import API_URL from '../config';

function AIChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedChar, setSelectedChar] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/books/${id}`)
      .then(r => r.json())
      .then(data => {
        setBook(data.book);
        setCharacters(data.characters);
      });
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectCharacter = (char) => {
    setSelectedChar(char);
    setMessages([{
      role: 'assistant',
      content: `*${char.name} nhìn bạn*\n\nXin chào, tôi là ${char.name}.${char.personality ? ` ${char.personality.split('.')[0]}.` : ''} Bạn muốn nói gì?`,
      timestamp: new Date(),
    }]);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedChar || loading) return;

    const userMsg = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = newMessages
        .filter(m => m.role)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_URL}/api/books/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: selectedChar.name,
          message: userMsg.content,
          chatHistory,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages([...newMessages, {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      }]);
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
      setMessages(newMessages);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (selectedChar) {
      selectCharacter(selectedChar);
    }
  };

  if (!book) return <div className="loading-page"><span className="loading-spinner" /> LOADING...</div>;

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate(`/book/${id}`)} style={{ marginBottom: '16px' }}>
        <FiArrowLeft /> {book.title}
      </button>

      <div className="page-header">
        <h1>AI CHAT</h1>
        <p className="subtitle">Trò chuyện trực tiếp với nhân vật trong truyện</p>
      </div>

      <div className="chat-layout">
        {/* Character Panel */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <FiUsers />
            <span>NHÂN VẬT</span>
          </div>

          {characters.length === 0 ? (
            <p className="chat-empty">Chưa có nhân vật</p>
          ) : (
            characters.map(char => (
              <div
                key={char.id}
                className={`chat-char-item ${selectedChar?.id === char.id ? 'active' : ''}`}
                onClick={() => selectCharacter(char)}
              >
                <div className="chat-char-avatar">
                  {char.name.charAt(0).toUpperCase()}
                </div>
                <div className="chat-char-info">
                  <span className="chat-char-name">{char.name}</span>
                  <span className="chat-char-status">
                    {char.personality?.substring(0, 40) || char.status || 'Nhân vật'}
                    {(char.personality?.length || 0) > 40 ? '...' : ''}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div className="chat-main">
          {!selectedChar ? (
            <div className="chat-placeholder">
              <FiMessageSquare />
              <p>Chọn một nhân vật để bắt đầu trò chuyện</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header-char">
                  <div className="chat-header-avatar">
                    {selectedChar.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="chat-header-name">{selectedChar.name}</span>
                    <span className="chat-header-sub">
                      {selectedChar.personality?.substring(0, 60) || 'Nhân vật trong truyện'}
                    </span>
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={clearChat} title="Xóa lịch sử">
                  <FiTrash2 />
                </button>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {messages.map((msg, i) => (
                  <div key={i} className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-char'}`}>
                    {msg.role !== 'user' && (
                      <div className="chat-msg-avatar">
                        {selectedChar.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="chat-msg-bubble">
                      {msg.content.split('\n').map((line, j) => (
                        <p key={j}>{line}</p>
                      ))}
                      <span className="chat-msg-time">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="chat-msg chat-msg-char">
                    <div className="chat-msg-avatar">
                      {selectedChar.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-msg-bubble chat-typing">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="chat-input-bar">
                <textarea
                  className="chat-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Nhắn cho ${selectedChar.name}...`}
                  rows={1}
                />
                <button
                  className="chat-send-btn"
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                >
                  <FiSend />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIChat;