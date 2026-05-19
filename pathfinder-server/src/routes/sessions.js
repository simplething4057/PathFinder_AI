const router = require('express').Router();
const pool   = require('../../db');
const auth   = require('../middleware/auth');

// 모든 라우트에 인증 적용
router.use(auth);

/* ── POST /api/sessions — 새 세션 생성 ── */
router.post('/', async (req, res) => {
  const { startedAt } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO sessions (user_id, started_at) VALUES ($1,$2) RETURNING *',
      [req.user.id, startedAt || new Date()]
    );
    res.status(201).json({ session: rows[0] });
  } catch (err) {
    console.error('[sessions/create]', err.message);
    res.status(500).json({ error: '세션 생성 실패' });
  }
});

/* ── GET /api/sessions — 내 세션 목록 ── */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.started_at, s.completed_at, s.created_at,
              COUNT(st.id)::int AS stage_count,
              (SELECT result->>'psychologicalTone'
               FROM analysis_results ar WHERE ar.session_id = s.id) AS tone,
              (SELECT result->>'summary'
               FROM analysis_results ar WHERE ar.session_id = s.id) AS summary_preview
       FROM sessions s
       LEFT JOIN stages st ON st.session_id = s.id
       WHERE s.user_id = $1
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json({ sessions: rows });
  } catch (err) {
    console.error('[sessions/list]', err.message);
    res.status(500).json({ error: '세션 목록 조회 실패' });
  }
});

/* ── GET /api/sessions/:id — 세션 상세 ── */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM sessions WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: '세션을 찾을 수 없습니다.' });

    const session = rows[0];

    // 스테이지 (상세 조회 시에만 image_data 포함)
    const stagesRes = await pool.query(
      'SELECT id, session_id, stage_key, stroke_log, created_at, image_data FROM stages WHERE session_id=$1 ORDER BY created_at',
      [session.id]
    );

    // 분석 결과
    const analysisRes = await pool.query(
      'SELECT result FROM analysis_results WHERE session_id=$1',
      [session.id]
    );

    res.json({
      session: {
        ...session,
        stages:   stagesRes.rows,
        analysis: analysisRes.rows[0]?.result ?? null,
      },
    });
  } catch (err) {
    console.error('[sessions/get]', err.message);
    res.status(500).json({ error: '세션 조회 실패' });
  }
});

/* ── PATCH /api/sessions/:id — 세션 업데이트 (PDI, 완료 처리) ── */
router.patch('/:id', async (req, res) => {
  const { completedAt, pdiAnswers, aiState, preSctAnswers } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE sessions
       SET completed_at     = COALESCE($1, completed_at),
           pdi_answers      = COALESCE($2::jsonb, pdi_answers),
           ai_state         = COALESCE($3::jsonb, ai_state),
           pre_sct_answers  = COALESCE($4::jsonb, pre_sct_answers)
       WHERE id=$5 AND user_id=$6
       RETURNING *`,
      [
        completedAt    || null,
        pdiAnswers     ? JSON.stringify(pdiAnswers)    : null,
        aiState        ? JSON.stringify(aiState)       : null,
        preSctAnswers  ? JSON.stringify(preSctAnswers) : null,
        req.params.id,
        req.user.id,
      ]
    );
    if (!rows[0]) return res.status(404).json({ error: '세션을 찾을 수 없습니다.' });
    res.json({ session: rows[0] });
  } catch (err) {
    console.error('[sessions/patch]', err.message);
    res.status(500).json({ error: '세션 업데이트 실패' });
  }
});

/* ── POST /api/sessions/:id/stages — 드로잉 단계 저장 ── */
router.post('/:id/stages', async (req, res) => {
  const { stageKey, imageData, strokeLog } = req.body;
  if (!stageKey) return res.status(400).json({ error: 'stageKey가 필요합니다.' });

  try {
    // 세션 소유권 확인
    const own = await pool.query(
      'SELECT id FROM sessions WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (!own.rows[0]) return res.status(404).json({ error: '세션을 찾을 수 없습니다.' });

    const { rows } = await pool.query(
      `INSERT INTO stages (session_id, stage_key, image_data, stroke_log)
       VALUES ($1,$2,$3,$4::jsonb)
       ON CONFLICT (session_id, stage_key)
       DO UPDATE SET image_data=$3, stroke_log=$4::jsonb
       RETURNING *`,
      [req.params.id, stageKey, imageData ?? null, JSON.stringify(strokeLog ?? {})]
    );
    res.status(201).json({ stage: rows[0] });
  } catch (err) {
    console.error('[stages/save]', err.message);
    res.status(500).json({ error: '단계 저장 실패' });
  }
});

/* ── POST /api/sessions/:id/analysis — 분석 결과 저장 ── */
router.post('/:id/analysis', async (req, res) => {
  const { result } = req.body;
  if (!result) return res.status(400).json({ error: 'result가 필요합니다.' });

  try {
    const own = await pool.query(
      'SELECT id FROM sessions WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    if (!own.rows[0]) return res.status(404).json({ error: '세션을 찾을 수 없습니다.' });

    const { rows } = await pool.query(
      `INSERT INTO analysis_results (session_id, result)
       VALUES ($1,$2::jsonb)
       ON CONFLICT (session_id) DO UPDATE SET result=$2::jsonb
       RETURNING *`,
      [req.params.id, JSON.stringify(result)]
    );
    res.status(201).json({ analysis: rows[0] });
  } catch (err) {
    console.error('[analysis/save]', err.message);
    res.status(500).json({ error: '분석 결과 저장 실패' });
  }
});

/* ── GET /api/sessions/:id/analysis — 분석 결과 조회 ── */
router.get('/:id/analysis', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ar.* FROM analysis_results ar
       JOIN sessions s ON s.id = ar.session_id
       WHERE ar.session_id=$1 AND s.user_id=$2`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: '분석 결과가 없습니다.' });
    res.json({ analysis: rows[0].result });
  } catch (err) {
    console.error('[analysis/get]', err.message);
    res.status(500).json({ error: '분석 결과 조회 실패' });
  }
});

module.exports = router;
