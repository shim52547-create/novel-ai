const crypto = require('crypto');

// Khóa bí mật dùng để ký token đăng nhập. NÊN đặt biến môi trường JWT_SECRET
// riêng khi deploy thật (Render > Environment) để không ai giả mạo được token.
const JWT_SECRET = process.env.JWT_SECRET || 'novel-ai-dev-secret-please-change';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  Chưa đặt biến môi trường JWT_SECRET — đang dùng key mặc định, KHÔNG an toàn khi deploy thật.');
}

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 ngày

// ====== MẬT KHẨU ======
// Dùng scrypt (có sẵn trong Node, không cần cài bcrypt) để băm mật khẩu.
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = (stored || '').split(':');
  if (!salt || !hash) return false;
  const testHash = crypto.scryptSync(password, salt, 64);
  const storedHash = Buffer.from(hash, 'hex');
  if (testHash.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(testHash, storedHash);
}

// ====== TOKEN (kiểu JWT, tự ký bằng HMAC-SHA256) ======
function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signToken(payload) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }));
  const signature = base64url(crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = base64url(crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest());
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ====== MIDDLEWARE ======
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên đã hết hạn' });
  req.userId = payload.userId;
  req.username = payload.username;
  next();
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken, authMiddleware };
