/**
 * analyze.js — Claude API 프록시
 * 프론트엔드에서 직접 Anthropic API를 호출하지 않고
 * 이 엔드포인트를 통해 서버 사이드에서 호출합니다.
 * ANTHROPIC_API_KEY는 서버 환경변수에만 존재합니다.
 */

const router = require('express').Router();
const auth   = require('../middleware/auth');

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

router.post('/', auth, async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY가 서버에 설정되지 않았습니다.' });
  }

  const { model, max_tokens, system, messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: '잘못된 요청 형식입니다.' });
  }

  try {
    // 스트리밍 모드로 Claude API 호출 — 60초 게이트웨이 타임아웃 우회
    const upstream = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      model      ?? 'claude-sonnet-4-6',
        max_tokens: max_tokens ?? 6000,
        system,
        messages,
        stream:     true,   // 스트리밍 활성화
      }),
    });

    if (!upstream.ok) {
      const errData = await upstream.json().catch(() => ({}));
      const msg = errData?.error?.message ?? `Anthropic API 오류 ${upstream.status}`;
      return res.status(upstream.status).json({ error: msg });
    }

    // SSE 헤더 설정 — 클라이언트에 스트림 전달
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // nginx 버퍼링 비활성화

    // Anthropic SSE 스트림을 그대로 클라이언트에 중계
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }

    res.end();
  } catch (err) {
    console.error('[analyze]', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: '분석 요청 중 서버 오류가 발생했습니다.' });
    }
  }
});

module.exports = router;
