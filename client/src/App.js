import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Particles, { useParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import CyberBackground from './components/CyberBackground';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import BookDetail from './pages/BookDetail';
import Characters from './pages/Characters';
import Write from './pages/Write';
import PlotPlan from './pages/PlotPlan';
import Memory from './pages/Memory';
import AntiAI from './pages/AntiAI';
import Export from './pages/Export';
import Revision from './pages/Revision';
import Storybible from './pages/Storybible';
import AIChat from './pages/AIChat';
import Settings from './pages/Settings';
import Login from './pages/Login';
import './App.css';
import API_URL, { apiFetch, isLoggedIn, getUsername, clearSession, getTheme, applyTheme } from './config';
import { FiLogOut } from 'react-icons/fi';

applyTheme(getTheme());

function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [books, setBooks] = useState([]);
  const loggedIn = isLoggedIn();

  const particlesProvider = useParticlesProvider(async (engine) => {
    await loadSlim(engine);
  });

  useEffect(() => { if (loggedIn) fetchBooks(); }, [loggedIn]);

  const handleLogout = () => {
    clearSession();
    window.location.href = '/login';
  };

  const fetchBooks = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/books`);
      setBooks(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const particlesConfig = useCallback(() => ({
    fullScreen: false,
    fpsLimit: 60,
    particles: {
      number: { value: 60, density: { enable: true, width: 1200 } },
      color: { value: ['#00f0ff', '#ff00aa', '#aa44ff'] },
      shape: { type: 'circle' },
      opacity: { value: { min: 0.1, max: 0.3 }, animation: { enable: true, speed: 0.3 } },
      size: { value: { min: 0.3, max: 1.5 } },
      links: { enable: true, distance: 140, color: '#00f0ff', opacity: 0.05, width: 0.8 },
      move: { enable: true, speed: 0.3, outModes: 'bounce' },
    },
    interactivity: {
      events: { onHover: { enable: true, mode: 'grab' } },
      modes: { grab: { distance: 160, links: { opacity: 0.12, color: '#ff00aa' } } },
    },
  }), []);

  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111130',
            color: '#e8e8ff',
            border: '1px solid #00f0ff',
            fontFamily: 'var(--font-body)',
            boxShadow: '0 0 20px rgba(0,240,255,0.15)',
          },
        }}
      />
      <CyberBackground />
      {particlesProvider && (
        <Particles id="tsparticles" provider={particlesProvider} options={particlesConfig()} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />
      )}
      {!loggedIn ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Sidebar books={books} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
          <main className="main-content">
            {!sidebarCollapsed && (
              <div className="topbar-account">
                <span className="topbar-username">{getUsername()}</span>
                <button className="topbar-logout" onClick={handleLogout} title="Đăng xuất">
                  <FiLogOut /> Đăng xuất
                </button>
              </div>
            )}
            <Routes>
              <Route path="/" element={<ProtectedRoute><Home books={books} refreshBooks={fetchBooks} /></ProtectedRoute>} />
              <Route path="/book/:id" element={<ProtectedRoute><BookDetail /></ProtectedRoute>} />
              <Route path="/book/:id/characters" element={<ProtectedRoute><Characters /></ProtectedRoute>} />
              <Route path="/book/:id/plot" element={<ProtectedRoute><PlotPlan /></ProtectedRoute>} />
              <Route path="/book/:id/memory" element={<ProtectedRoute><Memory /></ProtectedRoute>} />
              <Route path="/book/:id/anti-ai" element={<ProtectedRoute><AntiAI /></ProtectedRoute>} />
              <Route path="/book/:id/revision" element={<ProtectedRoute><Revision /></ProtectedRoute>} />
              <Route path="/book/:id/storybible" element={<ProtectedRoute><Storybible /></ProtectedRoute>} />
              <Route path="/book/:id/chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
              <Route path="/book/:id/export" element={<ProtectedRoute><Export /></ProtectedRoute>} />
              <Route path="/book/:id/write" element={<ProtectedRoute><Write /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
