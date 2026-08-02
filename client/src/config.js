// Nếu REACT_APP_API_URL được set (kể cả rỗng) thì dùng giá trị đó (đường dẫn tương đối,
// dùng khi client và server chung 1 domain). Chỉ fallback về localhost khi biến này
// hoàn toàn không tồn tại (chạy "npm start" ở local mà chưa tạo .env).
const API_URL = process.env.REACT_APP_API_URL !== undefined
  ? process.env.REACT_APP_API_URL
  : 'http://localhost:4000';

// ====== ĐĂNG NHẬP / TOKEN ======
const TOKEN_KEY = 'novel_ai_token';
const USERNAME_KEY = 'novel_ai_username';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function getUsername() {
  return localStorage.getItem(USERNAME_KEY) || '';
}

export function setSession(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

// ====== AI PROVIDER SETTINGS (mỗi người tự nhập key riêng, lưu ở máy họ) ======
export function getApiKey() {
  return localStorage.getItem('novel_ai_api_key') || '';
}

export function getProvider() {
  return localStorage.getItem('novel_ai_provider') || '';
}

export function getModel() {
  return localStorage.getItem('novel_ai_model') || '';
}

export function getHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const key = getApiKey();
  const model = getModel();
  const provider = getProvider();
  const token = getToken();
  if (key) headers['x-api-key'] = key;
  if (model) headers['x-ai-model'] = model;
  if (provider) headers['x-ai-provider'] = provider;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ====== FETCH WRAPPER ======
// Dùng thay cho fetch() thẳng: tự gắn token đăng nhập vào header, và nếu
// server trả 401 (chưa đăng nhập / hết phiên) thì tự đăng xuất + chuyển về
// trang đăng nhập.
export async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token && !headers['Authorization']) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && !url.includes('/api/auth/')) {
    clearSession();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return res;
}

export default API_URL;
