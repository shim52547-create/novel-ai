import React, { useEffect, useRef } from 'react';
import './CyberBackground.css';

function CyberBackground() {
  const canvasRef = useRef(null);
  const matrixRef = useRef(null);

  // ====== MATRIX RAIN ======
  useEffect(() => {
    const canvas = matrixRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>{}[]|/\\';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(3, 3, 8, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Gradient green to cyan
        const brightness = Math.random();
        if (brightness > 0.95) {
          ctx.fillStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 10;
        } else if (brightness > 0.8) {
          ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = 'rgba(0, 180, 200, 0.12)';
          ctx.shadowBlur = 0;
        }

        ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 45);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ====== CYBER LINES CANVAS ======
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const lines = [];
    for (let i = 0; i < 12; i++) {
      lines.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: Math.random() * 200 + 100,
        speed: Math.random() * 1.5 + 0.3,
        angle: Math.random() * Math.PI * 2,
        color: ['#00f0ff', '#ff00aa', '#aa44ff', '#00ff88'][Math.floor(Math.random() * 4)],
        opacity: Math.random() * 0.15 + 0.03,
        width: Math.random() * 1.5 + 0.3,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      lines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(
          line.x + Math.cos(line.angle) * line.length,
          line.y + Math.sin(line.angle) * line.length
        );
        ctx.strokeStyle = line.color;
        ctx.globalAlpha = line.opacity;
        ctx.lineWidth = line.width;
        ctx.shadowColor = line.color;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        line.x += Math.cos(line.angle) * line.speed;
        line.y += Math.sin(line.angle) * line.speed;

        if (line.x < -200 || line.x > canvas.width + 200 ||
            line.y < -200 || line.y > canvas.height + 200) {
          line.x = Math.random() * canvas.width;
          line.y = Math.random() * canvas.height;
          line.angle = Math.random() * Math.PI * 2;
        }
      });
    };

    const interval = setInterval(draw, 30);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      {/* Matrix rain */}
      <canvas ref={matrixRef} className="matrix-canvas" />

      {/* Cyber lines */}
      <canvas ref={canvasRef} className="cyber-lines-canvas" />

      {/* Hex grid pattern */}
      <div className="hex-grid" />

      {/* Animated gradient mesh */}
      <div className="gradient-mesh">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
        <div className="mesh-orb mesh-orb-4" />
      </div>

      {/* Scanlines */}
      <div className="crt-scanlines" />

      {/* Corner decorations */}
      <div className="corner-decor top-left" />
      <div className="corner-decor top-right" />
      <div className="corner-decor bottom-left" />
      <div className="corner-decor bottom-right" />

      {/* Horizontal scan beam */}
      <div className="scan-beam" />

      {/* Data stream borders */}
      <div className="data-border top" />
      <div className="data-border bottom" />
    </>
  );
}

export default CyberBackground;