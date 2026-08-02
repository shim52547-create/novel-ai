// Nếu REACT_APP_API_URL được set (kể cả rỗng) thì dùng giá trị đó (đường dẫn tương đối,
// dùng khi client và server chung 1 domain). Chỉ fallback về localhost khi biến này
// hoàn toàn không tồn tại (chạy "npm start" ở local mà chưa tạo .env).
const API_URL = process.env.REACT_APP_API_URL !== undefined
  ? process.env.REACT_APP_API_URL
  : 'http://localhost:4000';

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
  if (key) headers['x-api-key'] = key;
  if (model) headers['x-ai-model'] = model;
  if (provider) headers['x-ai-provider'] = provider;
  return headers;
}

export default API_URL;