/**
 * pathfinder-app 프로덕션 정적 서버
 * - gzip 압축 (compression)
 * - 적절한 캐시 헤더 (해시 파일 1년, HTML 캐시 없음)
 * - SPA fallback (index.html)
 * - 헬스체크 엔드포인트
 */

const express      = require('express');
const path         = require('path');
const compression  = require('compression');
const fs           = require('fs');

const app  = express();
const PORT = process.env.PORT || 4173;
const DIST = path.join(__dirname, 'dist');

/* ── gzip 압축 ── */
app.use(compression());

/* ── 정적 파일 서빙 ── */
// Vite가 출력하는 해시 파일(JS/CSS/이미지)은 1년 캐시
app.use(
  '/assets',
  express.static(path.join(DIST, 'assets'), {
    maxAge: '1y',
    immutable: true,
  })
);

// 나머지 정적 파일 (favicon 등) — 단기 캐시
app.use(
  express.static(DIST, {
    maxAge: '1h',
    index: false, // fallback 핸들러가 index.html 담당
  })
);

/* ── 헬스체크 ── */
app.get('/health', (_req, res) => res.json({ ok: true }));

/* ── SPA fallback — 모든 경로를 index.html로 ── */
app.get('*', (_req, res) => {
  const indexPath = path.join(DIST, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(503).send('Build not found. Run `npm run build` first.');
  }
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(indexPath);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ PathFinder 프론트엔드 서버 실행 중 → http://0.0.0.0:${PORT}`);
});
