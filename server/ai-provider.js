const axios = require('axios');
require('dotenv').config();

// ====== DANH SÁCH PROVIDER ======
const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', tier: 'premium', description: 'Xịn nhất — Thông minh, viết hay' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tier: 'standard', description: 'Nhanh — Cân bằng tốt' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', tier: 'basic', description: 'Rẻ — Tốc độ cao' },
      { id: 'o1-mini', name: 'O1 Mini', tier: 'premium', description: 'Suy luận — Logic mạnh' },
      { id: 'o3-mini', name: 'O3 Mini', tier: 'premium', description: 'Suy luận mới — Rất thông minh' },
    ],
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    keyPrefix: 'sk-',
  },
  anthropic: {
    name: 'Claude (Anthropic)',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', tier: 'premium', description: 'Mới nhất — Viết rất hay' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', tier: 'premium', description: 'Cân bằng — Được yêu thích' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', tier: 'standard', description: 'Nhanh — Giá rẻ' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', tier: 'premium', description: 'Cao cấp — Suy luận sâu' },
    ],
    baseUrl: 'https://api.anthropic.com/v1/messages',
    keyPrefix: 'sk-ant-',
  },
  google: {
    name: 'Gemini (Google)',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tier: 'premium', description: 'Mới nhất — Rất thông minh' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: 'standard', description: 'Nhanh — Giá rẻ' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tier: 'basic', description: 'Cơ bản — Rất nhanh' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', tier: 'standard', description: 'Ổn định — Context dài' },
    ],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    keyPrefix: 'AI',
  },
  mistral: {
    name: 'Mistral',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', tier: 'premium', description: 'Xịn nhất — Viết hay nhất' },
      { id: 'mistral-medium-latest', name: 'Mistral Medium', tier: 'standard', description: 'Cao cấp — Chất lượng tốt' },
      { id: 'mistral-small-latest', name: 'Mistral Small', tier: 'basic', description: 'Cơ bản — Nhanh, rẻ' },
      { id: 'open-mistral-nemo', name: 'Mistral Nemo', tier: 'standard', description: 'Tiêu chuẩn — Thông minh' },
      { id: 'mistral-tiny-latest', name: 'Mistral Tiny', tier: 'free', description: 'Miễn phí — Nhanh nhất' },
    ],
    baseUrl: 'https://api.mistral.ai/v1/chat/completions',
    keyPrefix: '',
  },
  deepseek: {
    name: 'DeepSeek',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', tier: 'basic', description: 'Rẻ — Chất lượng bất ngờ' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', tier: 'standard', description: 'Suy luận — Logic mạnh' },
    ],
    baseUrl: 'https://api.deepseek.com/chat/completions',
    keyPrefix: 'sk-',
  },
  moonshot: {
    name: 'Kimi (Moonshot)',
    models: [
      { id: 'moonshot-v1-128k', name: 'Kimi 128K', tier: 'standard', description: 'Context dài — Đọc nhiều' },
      { id: 'moonshot-v1-32k', name: 'Kimi 32K', tier: 'basic', description: 'Tiêu chuẩn — Giá rẻ' },
      { id: 'moonshot-v1-8k', name: 'Kimi 8K', tier: 'basic', description: 'Nhanh — Giá rẻ nhất' },
    ],
    baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
    keyPrefix: 'sk-',
  },
};

// ====== GỌI AI CHUNG ======
async function callAI(prompt, maxTokens = 4000, temperature = 0.7, options = {}) {
  const providerId = options.provider || process.env.AI_PROVIDER || 'mistral';
  const modelId = options.model || process.env.AI_MODEL || 'mistral-small-latest';
  const apiKey = options.apiKey || process.env.MISTRAL_API_KEY;

  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error('Provider không hỗ trợ');

  if (!apiKey) {
    throw new Error('Bạn chưa nhập API Key. Vào Sidebar → CÀI ĐẶT → chọn Provider → nhập API Key của bạn.');
  }

  try {
    let result;
    if (providerId === 'anthropic') {
      result = await callAnthropic(apiKey, modelId, prompt, maxTokens, temperature);
    } else if (providerId === 'google') {
      result = await callGoogle(apiKey, modelId, prompt, maxTokens, temperature);
    } else {
      result = await callOpenAICompatible(provider.baseUrl, apiKey, modelId, prompt, maxTokens, temperature);
    }
    return result;
  } catch (error) {
    const status = error.response?.status;
    const msg = error.response?.data?.error?.message
      || error.response?.data?.detail
      || error.response?.data?.message
      || error.message;

    if (status === 401) throw new Error(`[${provider.name}] API Key không hợp lệ. Kiểm tra lại trong Cài đặt.`);
    if (status === 429) throw new Error(`[${provider.name}] Đã hết quota. Thử provider khác hoặc chờ reset.`);
    if (status === 400) throw new Error(`[${provider.name}] Lỗi: ${msg}`);
    if (status === 404) throw new Error(`[${provider.name}] Model "${modelId}" không tồn tại`);

    throw new Error(`[${provider.name}] ${msg}`);
  }
}

// ====== OPENAI COMPATIBLE ======
async function callOpenAICompatible(baseUrl, apiKey, model, prompt, maxTokens, temperature) {
  const response = await axios.post(baseUrl, {
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature,
  }, {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    timeout: 180000,
  });
  return response.data.choices[0].message.content;
}

// ====== ANTHROPIC (Claude) ======
async function callAnthropic(apiKey, model, prompt, maxTokens, temperature) {
  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }],
  }, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    timeout: 180000,
  });
  return response.data.content[0].text;
}

// ====== GOOGLE (Gemini) ======
async function callGoogle(apiKey, model, prompt, maxTokens, temperature) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature },
  }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 180000,
  });
  return response.data.candidates[0].content.parts[0].text;
}

// ====== HELPERS ======
function getProviders() {
  return Object.entries(PROVIDERS).map(([id, p]) => ({
    id,
    name: p.name,
    models: p.models,
    keyPrefix: p.keyPrefix,
  }));
}

function getDefaultConfig() {
  return {
    provider: 'mistral',
    model: 'mistral-small-latest',
    hasDefaultKey: false,
    message: 'Bạn cần nhập API Key trong Cài đặt để sử dụng. Chọn Provider → nhập Key → chọn Model → Lưu.',
  };
}

module.exports = { callAI, getProviders, getDefaultConfig, PROVIDERS };