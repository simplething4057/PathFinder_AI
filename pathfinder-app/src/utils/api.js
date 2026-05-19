/**
 * api.js — PathFinder AI 백엔드 API 클라이언트
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/* ── 토큰 관리 ── */
export const tokenStore = {
  get:    ()      => localStorage.getItem('pf_token'),
  set:    (t)     => localStorage.setItem('pf_token', t),
  clear:  ()      => localStorage.removeItem('pf_token'),
};

/* ── 공통 fetch 래퍼 ── */
async function req(method, path, body) {
  const token = tokenStore.get();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `API 오류 ${res.status}`);
  return data;
}

/* ════════════════════════════════════════
   인증
   ════════════════════════════════════════ */
export const authApi = {
  register: (email, password, name, age, gender) =>
    req('POST', '/api/auth/register', { email, password, name, age, gender }),

  login: (email, password) =>
    req('POST', '/api/auth/login', { email, password }),

  me: () => req('GET', '/api/auth/me'),
};

/* ════════════════════════════════════════
   사용자 프로필
   ════════════════════════════════════════ */
export const userApi = {
  updateProfile: (payload) =>
    req('PATCH', '/api/users/profile', payload),
};

/* ════════════════════════════════════════
   세션
   ════════════════════════════════════════ */
export const sessionApi = {
  create: (startedAt) =>
    req('POST', '/api/sessions', { startedAt }),

  list: () =>
    req('GET', '/api/sessions'),

  get: (id) =>
    req('GET', `/api/sessions/${id}`),

  update: (id, payload) =>
    req('PATCH', `/api/sessions/${id}`, payload),

  saveStage: (sessionId, stageKey, imageData, strokeLog) =>
    req('POST', `/api/sessions/${sessionId}/stages`, { stageKey, imageData, strokeLog }),

  saveAnalysis: (sessionId, result) =>
    req('POST', `/api/sessions/${sessionId}/analysis`, { result }),

  getAnalysis: (sessionId) =>
    req('GET', `/api/sessions/${sessionId}/analysis`),
};
