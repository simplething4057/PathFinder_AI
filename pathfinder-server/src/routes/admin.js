const router = require('express').Router();
const pool   = require('../../db');
const auth   = require('../middleware/auth');

/* ── admin 권한 미들웨어 ── */
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }
  next();
}

router.use(auth, adminOnly);

/* ── GET /api/admin/stats — 전체 통계 ── */
router.get('/stats', async (req, res) => {
  try {
    const [users, sessions, analyses] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM users'),
      pool.query('SELECT COUNT(*)::int AS total FROM sessions'),
      pool.query('SELECT COUNT(*)::int AS total FROM analysis_results'),
    ]);

    // 최근 7일 신규 사용자 + 세션
    const recent = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users     WHERE created_at >= NOW() - INTERVAL '7 days') AS new_users,
        (SELECT COUNT(*)::int FROM sessions  WHERE created_at >= NOW() - INTERVAL '7 days') AS new_sessions
    `);

    // 완료된 세션 수
    const completed = await pool.query(
      'SELECT COUNT(*)::int AS total FROM sessions WHERE completed_at IS NOT NULL'
    );

    res.json({
      stats: {
        totalUsers:       users.rows[0].total,
        totalSessions:    sessions.rows[0].total,
        totalAnalyses:    analyses.rows[0].total,
        completedSessions: completed.rows[0].total,
        newUsersWeek:     recent.rows[0].new_users,
        newSessionsWeek:  recent.rows[0].new_sessions,
      },
    });
  } catch (err) {
    console.error('[admin/stats]', err.message);
    res.status(500).json({ error: '통계 조회 실패' });
  }
});

/* ── GET /api/admin/users — 사용자 목록 ── */
router.get('/users', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page  || '1', 10));
  const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
  const offset = (page - 1) * limit;

  try {
    const { rows } = await pool.query(
      `SELECT
         u.id, u.email, u.name, u.role, u.age, u.gender, u.occupation,
         u.created_at,
         COUNT(s.id)::int AS session_count,
         MAX(s.created_at) AS last_session_at,
         COUNT(ar.id)::int AS analysis_count
       FROM users u
       LEFT JOIN sessions s ON s.user_id = u.id
       LEFT JOIN analysis_results ar ON ar.session_id = s.id
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const total = await pool.query('SELECT COUNT(*)::int AS total FROM users');

    res.json({
      users: rows,
      pagination: { page, limit, total: total.rows[0].total },
    });
  } catch (err) {
    console.error('[admin/users]', err.message);
    res.status(500).json({ error: '사용자 목록 조회 실패' });
  }
});

/* ── GET /api/admin/sessions — 최근 세션 목록 ── */
router.get('/sessions', async (req, res) => {
  const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
  try {
    const { rows } = await pool.query(
      `SELECT
         s.id, s.started_at, s.completed_at, s.created_at,
         u.name AS user_name, u.email AS user_email,
         COUNT(st.id)::int AS stage_count,
         (SELECT result->>'psychologicalTone'
          FROM analysis_results ar WHERE ar.session_id = s.id) AS tone
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN stages st ON st.session_id = s.id
       GROUP BY s.id, u.name, u.email
       ORDER BY s.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json({ sessions: rows });
  } catch (err) {
    console.error('[admin/sessions]', err.message);
    res.status(500).json({ error: '세션 목록 조회 실패' });
  }
});

/* ── PATCH /api/admin/users/:id/role — 역할 변경 ── */
router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: "role은 'user' 또는 'admin' 이어야 합니다." });
  }
  // 자신의 역할은 변경 불가
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: '자신의 역할은 변경할 수 없습니다.' });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE users SET role=$1 WHERE id=$2 RETURNING id, email, name, role',
      [role, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('[admin/role]', err.message);
    res.status(500).json({ error: '역할 변경 실패' });
  }
});

module.exports = router;
