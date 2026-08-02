const https = require('https');
const http = require('http');

const RENDER_URL = process.env.RENDER_URL || '';

function keepAlive() {
  if (!RENDER_URL) return;

  setInterval(() => {
    const protocol = RENDER_URL.startsWith('https') ? https : http;
    protocol.get(RENDER_URL + '/api/books', (res) => {
      console.log(`🔄 Keep-alive: ${res.statusCode}`);
    }).on('error', (err) => {
      console.log('Keep-alive error:', err.message);
    });
  }, 14 * 60 * 1000); // Mỗi 14 phút
}

module.exports = keepAlive;