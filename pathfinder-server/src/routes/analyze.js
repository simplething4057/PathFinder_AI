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
    const upstream = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      model      ?? 'claude-sonnet-4-6',
        max_tokens: max_tokens ?? 8192,
        system,
        messages,
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const msg = data?.error?.message ?? `Anthropic API 오류 ${upstream.status}`;
      return res.status(upstream.status).json({ error: msg });
    }

    res.json(data);
  } catch (err) {
    console.error('[analyze]', err.message);
    res.status(500).json({ error: '분석 요청 중 서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
