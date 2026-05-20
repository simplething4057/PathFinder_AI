require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

/* ── 프록시 신뢰 설정 (클라우드타입 리버스 프록시 대응) ── */
app.set('trust proxy', 1);

/* ── 미들웨어 ── */
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));  // base64 이미지 허용

/* ── Rate Limiting ── */
// 인증 엔드포인트: 15분간 최대 20회 (브루트포스 방지)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '요청이 너무 많습니다. 15분 후 다시 시도해주세요.' },
});

// 분석 엔드포인트: 1시간간 최대 30회 (API 비용 보호)
const analyzeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '분석 요청 한도를 초과했습니다. 1시간 후 다시 시도해주세요.' },
});

/* ── 라우터 ── */
app.use('/api/auth',     authLimiter,    require('./routes/auth'));
app.use('/api/users',                    require('./routes/auth'));   // PATCH /api/users/profile
app.use('/api/sessions',                 require('./routes/sessions'));
app.use('/api/analyze',  analyzeLimiter, require('./routes/analyze'));
app.use('/api/admin',                    require('./routes/admin'));

/* ── 헬스체크 ── */
app.get('/health', (_, res) => res.json({ ok: true }));

/* ── 전역 오류 핸들러 ── */
app.use((err, req, res, _next) => {
  console.error('[server]', err);
  res.status(500).json({ error: '서버 오류' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ PathFinder 서버 실행 중 → http://0.0.0.0:${PORT}`);
});
