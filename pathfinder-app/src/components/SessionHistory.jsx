import { useEffect, useState } from 'react';
import { sessionApi } from '../utils/api';

const TONE_COLORS = {
  '긍정': '#38A169', '안정': '#38A169', '건강': '#38A169',
  '불안': '#D69E2E', '갈등': '#D69E2E', '혼재': '#D69E2E',
  '우울': '#C53030', '위축': '#C53030', '억압': '#C53030',
};
function toneColor(tone = '') {
  for (const [k, c] of Object.entries(TONE_COLORS)) if (tone.includes(k)) return c;
  return '#718096';
}

export default function SessionHistory({ user, onNewSession, onLoadSession, onLogout }) {
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [loadingId, setLoadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId]   = useState(null); // 삭제 확인 대상 세션 id

  useEffect(() => {
    sessionApi.list()
      .then(d => setSessions(d.sessions))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await sessionApi.delete(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      alert('삭제 실패: ' + e.message);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const handleLoad = async (id) => {
    setLoadingId(id);
    try {
      const { session } = await sessionApi.get(id);
      // 프론트엔드 sessionData 구조로 변환
      const sessionData = {
        sessionId:  session.id,
        startedAt:  session.started_at,
        stages:     (session.stages ?? []).map(s => ({
          stageKey:  s.stage_key,
          imageData: s.image_data,
          strokeLog: s.stroke_log,
        })),
        pdiAnswers: session.pdi_answers ?? {},
        aiState:    session.ai_state    ?? {},
      };
      onLoadSession(sessionData, session.analysis);
    } catch (e) {
      alert('세션 불러오기 실패: ' + e.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 720, width: '100%' }}>
      <div className="card-header">
        <h1>📋 검사 세션 기록</h1>
        <p>안녕하세요, <strong>{user.name}</strong>님</p>
      </div>

      <div className="card-body">
        {/* 상단 액션 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button className="btn-primary" onClick={onNewSession}
            style={{ width: 'auto', padding: '10px 24px', fontSize: 14 }}>
            ＋ 새 검사 시작
          </button>
          <button onClick={onLogout}
            style={{ background: 'none', border: 'none', fontSize: 13, color: '#A0AEC0', cursor: 'pointer' }}>
            로그아웃
          </button>
        </div>

        {/* 세션 목록 */}
        {loading && (
          <div style={{ textAlign: 'center', color: '#718096', padding: '32px 0' }}>불러오는 중...</div>
        )}

        {error && (
          <div style={{
            background: '#FFF5F5', border: '1px solid #FED7D7',
            borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#C53030',
          }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div style={{ textAlign: 'center', color: '#A0AEC0', padding: '40px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🖼</div>
            <div style={{ fontSize: 14 }}>아직 검사 기록이 없습니다.<br />첫 번째 HTP 검사를 시작해보세요.</div>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sessions.map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 10,
                border: '1px solid #E2E8F0', background: '#FAFBFD',
                transition: 'box-shadow 0.15s',
              }}>
                {/* 날짜 */}
                <div style={{ minWidth: 90 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2D3748' }}>
                    {new Date(s.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 11, color: '#A0AEC0' }}>
                    {new Date(s.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* 단계 아이콘 */}
                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                  {['🏠', '🌳', '🧑'].slice(0, s.stage_count).map((e, i) => (
                    <span key={i} style={{ fontSize: 18 }}>{e}</span>
                  ))}
                  {s.stage_count === 0 && (
                    <span style={{ fontSize: 12, color: '#A0AEC0' }}>드로잉 없음</span>
                  )}
                </div>

                {/* 심리 톤 배지 */}
                {s.tone && (
                  <span style={{
                    background: toneColor(s.tone), color: '#fff',
                    borderRadius: 12, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {s.tone}
                  </span>
                )}

                {/* 버튼 영역 */}
                {confirmId === s.id ? (
                  /* 삭제 확인 인라인 */
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#C53030', whiteSpace: 'nowrap' }}>삭제할까요?</span>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      style={{
                        fontSize: 11, padding: '4px 10px',
                        background: '#C53030', color: '#fff',
                        border: 'none', borderRadius: 6, cursor: 'pointer',
                      }}
                    >
                      {deletingId === s.id ? '...' : '확인'}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      style={{
                        fontSize: 11, padding: '4px 10px',
                        background: 'none', border: '1px solid #CBD5E0',
                        borderRadius: 6, cursor: 'pointer', color: '#4A5568',
                      }}
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleLoad(s.id)}
                      disabled={loadingId === s.id}
                      className="btn-secondary"
                      style={{ fontSize: 12, padding: '6px 14px', whiteSpace: 'nowrap' }}
                    >
                      {loadingId === s.id ? '로딩...' : '불러오기'}
                    </button>
                    <button
                      onClick={() => setConfirmId(s.id)}
                      style={{
                        fontSize: 12, padding: '6px 10px',
                        background: 'none', border: '1px solid #FED7D7',
                        borderRadius: 6, color: '#C53030', cursor: 'pointer',
                      }}
                      title="세션 삭제"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
