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
import './App.css';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [books, setBooks] = useState([]);

  const particlesProvider = useParticlesProvider(async (engine) => {
    await loadSlim(engine);
  });

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/books');
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
      <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Sidebar books={books} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home books={books} refreshBooks={fetchBooks} />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/book/:id/characters" element={<Characters />} />
            <Route path="/book/:id/plot" element={<PlotPlan />} />
            <Route path="/book/:id/memory" element={<Memory />} />
            <Route path="/book/:id/anti-ai" element={<AntiAI />} />
            <Route path="/book/:id/revision" element={<Revision />} />
            <Route path="/book/:id/storybible" element={<Storybible />} />
            <Route path="/book/:id/chat" element={<AIChat />} />
            <Route path="/book/:id/export" element={<Export />} />
            <Route path="/book/:id/write" element={<Write />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;