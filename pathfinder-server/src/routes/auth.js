const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../../db');
const auth    = require('../middleware/auth');

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/* ── POST /api/auth/register ── */
router.post('/register', async (req, res) => {
  const { email, password, name, age, gender } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, name 필드가 필요합니다.' });
  }
  if (!age || !gender) {
    return res.status(400).json({ error: '나이와 성별은 필수 입력 항목입니다.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
  }

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: '이미 등록된 이메일입니다.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, name, age, gender)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, email, name, role, age, gender, occupation, family_info`,
      [email, hash, name, parseInt(age, 10), gender]
    );
    const user = rows[0];
    res.status(201).json({ token: makeToken(user), user });
  } catch (err) {
    console.error('[auth/register]', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

/* ── POST /api/auth/login ── */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email과 password가 필요합니다.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, email, name, role, age, gender, occupation, family_info, password_hash
       FROM users WHERE email=$1`,
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)  return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });

    const { password_hash: _, ...safeUser } = user;
    res.json({ token: makeToken(safeUser), user: safeUser });
  } catch (err) {
    console.error('[auth/login]', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

/* ── GET /api/auth/me ── */
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, name, role, age, gender, occupation, family_info, created_at
       FROM users WHERE id=$1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

/* ── PATCH /api/users/profile — 프로필 수정 ── */
router.patch('/profile', auth, async (req, res) => {
  const { occupation, family_info, age, gender } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET occupation  = COALESCE($1, occupation),
           family_info = COALESCE($2, family_info),
           age         = COALESCE($3, age),
           gender      = COALESCE($4, gender)
       WHERE id=$5
       RETURNING id, email, name, role, age, gender, occupation, family_info`,
      [
        occupation  ?? null,
        family_info ?? null,
        age         ? parseInt(age, 10) : null,
        gender      ?? null,
        req.user.id,
      ]
    );
    if (!rows[0]) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('[auth/profile]', err.message);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

/* ── PUT /api/auth/password — 비밀번호 변경 ── */
router.put('/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호가 필요합니다.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: '새 비밀번호는 8자 이상이어야 합니다.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT password_hash FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

    const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다.' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [newHash, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[auth/password]', err.message);
    res.status(500).json({ error: '비밀번호 변경 실패' });
  }
});

module.exports = router;
