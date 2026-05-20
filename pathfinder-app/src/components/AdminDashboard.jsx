import { useEffect, useState } from 'react';
import { adminApi } from '../utils/api';

const TONE_COLORS = {
  '긍정': '#38A169', '안정': '#38A169', '건강': '#38A169',
  '불안': '#D69E2E', '갈등': '#D69E2E', '혼재': '#D69E2E',
  '우울': '#C53030', '위축': '#C53030', '억압': '#C53030',
};
function toneColor(t = '') {
  for (const [k, c] of Object.entries(TONE_COLORS)) if (t.includes(k)) return c;
  return '#718096';
}

function StatCard({ label, value, sub, color = '#2E75B6' }) {
  return (
    <div style={{
      flex: 1, minWidth: 120,
      background: '#fff', borderRadius: 10,
      border: '1px solid #E2E8F0',
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value ?? '—'}</div>
      <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard({ user, onClose }) {
  const [tab, setTab]           = useState('stats');
  const [stats, setStats]       = useState(null);
  const [users, setUsers]       = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [roleTarget, setRoleTarget] = useState(null); // { id, currentRole }

  useEffect(() => {
    setLoading(true); setError('');
    Promise.all([
      adminApi.stats(),
      adminApi.users(1, 50),
      adminApi.sessions(30),
    ])
      .then(([s, u, ss]) => {
        setStats(s.stats);
        setUsers(u.users);
        setSessions(ss.sessions);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminApi.changeRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e) {
      alert('역할 변경 실패: ' + e.message);
    } finally {
      setRoleTarget(null);
    }
  };

  const tabStyle = (t) => ({
    padding: '8px 18px', fontSize: 13, fontWeight: tab === t ? 700 : 400,
    color: tab === t ? '#2E75B6' : '#718096',
    borderBottom: tab === t ? '2px solid #2E75B6' : '2px solid transparent',
    background: 'none', border: 'none', cursor: 'pointer',
  });

  return (
    <div className="card" style={{ maxWidth: 840, width: '100%' }}>
      {/* 헤더 */}
      <div className="card-header"
        style={{ background: 'linear-gradient(135deg, #1A365D 0%, #2E75B6 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>🛠 관리자 대시보드</h1>
          <p>{user.email} · 관리자</p>
        </div>
        <button onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>
          ✕
        </button>
      </div>

      <div className="card-body">
        {loading && <div style={{ textAlign: 'center', color: '#718096', padding: '32px 0' }}>불러오는 중...</div>}
        {error  && <div style={{ color: '#C53030', fontSize: 13 }}>⚠️ {error}</div>}

        {!loading && !error && (
          <>
            {/* 탭 */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
              <button style={tabStyle('stats')}   onClick={() => setTab('stats')}>📊 통계</button>
              <button style={tabStyle('users')}   onClick={() => setTab('users')}>👥 사용자</button>
              <button style={tabStyle('sessions')} onClick={() => setTab('sessions')}>📋 세션</button>
            </div>

            {/* ── 통계 탭 ── */}
            {tab === 'stats' && stats && (
              <>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
                  <StatCard label="전체 사용자" value={stats.totalUsers} sub={`이번 주 +${stats.newUsersWeek}`} />
                  <StatCard label="전체 세션" value={stats.totalSessions} sub={`이번 주 +${stats.newSessionsWeek}`} color="#7B5EA7" />
                  <StatCard label="완료 세션" value={stats.completedSessions} color="#38A169" />
                  <StatCard label="분석 결과" value={stats.totalAnalyses} color="#D69E2E" />
                </div>

                <div style={{
                  background: '#F7FAFC', borderRadius: 8, padding: '14px 18px',
                  fontSize: 13, color: '#4A5568',
                }}>
                  <strong>완료율:</strong>{' '}
                  {stats.totalSessions > 0
                    ? `${Math.round((stats.completedSessions / stats.totalSessions) * 100)}%`
                    : '—'}
                  {' '}·{' '}
                  <strong>분석 전환율:</strong>{' '}
                  {stats.completedSessions > 0
                    ? `${Math.round((stats.totalAnalyses / stats.completedSessions) * 100)}%`
                    : '—'}
                </div>
              </>
            )}

            {/* ── 사용자 탭 ── */}
            {tab === 'users' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F7FAFC' }}>
                      {['이름', '이메일', '역할', '나이·성별', '세션', '분석', '가입일', ''].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#4A5568', whiteSpace: 'nowrap', borderBottom: '1px solid #E2E8F0' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #F0F4F8' }}>
                        <td style={{ padding: '9px 12px', fontWeight: 600, color: '#2D3748' }}>{u.name}</td>
                        <td style={{ padding: '9px 12px', color: '#718096' }}>{u.email}</td>
                        <td style={{ padding: '9px 12px' }}>
                          {roleTarget?.id === u.id ? (
                            <div style={{ display: 'flex', gap: 4 }}>
                              {['user', 'admin'].filter(r => r !== u.role).map(r => (
                                <button key={r}
                                  onClick={() => handleRoleChange(u.id, r)}
                                  style={{ fontSize: 10, padding: '2px 8px', background: r === 'admin' ? '#2E75B6' : '#E2E8F0', color: r === 'admin' ? '#fff' : '#4A5568', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                                  {r}
                                </button>
                              ))}
                              <button onClick={() => setRoleTarget(null)}
                                style={{ fontSize: 10, padding: '2px 6px', background: 'none', border: '1px solid #CBD5E0', borderRadius: 4, cursor: 'pointer', color: '#A0AEC0' }}>
                                취소
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={() => u.id !== user.id && setRoleTarget({ id: u.id, currentRole: u.role })}
                              style={{
                                fontSize: 11, padding: '2px 8px', borderRadius: 10,
                                background: u.role === 'admin' ? '#EBF4FF' : '#F7FAFC',
                                color: u.role === 'admin' ? '#2E75B6' : '#718096',
                                fontWeight: 700,
                                cursor: u.id !== user.id ? 'pointer' : 'default',
                              }}>
                              {u.role}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '9px 12px', color: '#718096' }}>
                          {u.age ? `${u.age}세` : '—'}{u.gender ? ` · ${u.gender}` : ''}
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>{u.session_count}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>{u.analysis_count}</td>
                        <td style={{ padding: '9px 12px', color: '#A0AEC0' }}>
                          {new Date(u.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '9px 12px' }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#A0AEC0', padding: '24px 0' }}>사용자 없음</div>
                )}
              </div>
            )}

            {/* ── 세션 탭 ── */}
            {tab === 'sessions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sessions.map(s => (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 8,
                    border: '1px solid #E2E8F0', background: '#FAFBFD',
                    fontSize: 12,
                  }}>
                    <div style={{ minWidth: 80 }}>
                      <div style={{ fontWeight: 700, color: '#2D3748' }}>{s.user_name}</div>
                      <div style={{ color: '#A0AEC0', fontSize: 11 }}>{s.user_email}</div>
                    </div>
                    <div style={{ flex: 1, color: '#718096' }}>
                      {new Date(s.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                      {' · '}단계 {s.stage_count}개
                      {s.completed_at ? ' · 완료' : ' · 진행중'}
                    </div>
                    {s.tone && (
                      <span style={{
                        background: toneColor(s.tone), color: '#fff',
                        borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 700,
                      }}>
                        {s.tone}
                      </span>
                    )}
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#A0AEC0', padding: '24px 0' }}>세션 없음</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
