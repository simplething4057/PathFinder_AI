import { STAGE_META } from '../constants/stages';

export default function CompleteScreen({ sessionData, onStartAnalysis, onRestart }) {
  const { sessionId, stages, startedAt, pdiAnswers } = sessionData;

  const answeredPDI = pdiAnswers
    ? Object.values(pdiAnswers).filter(v => v?.trim().length > 0).length
    : 0;
  const totalStrokes = stages.reduce((sum, s) => sum + (s.strokeLog?.totalStrokes ?? 0), 0);
  const totalDuration = Math.round(
    stages.reduce((sum, s) => sum + (s.strokeLog?.durationMs ?? 0), 0) / 1000
  );

  const handleDownloadLog = () => {
    const blob = new Blob(
      [JSON.stringify(
        { sessionId, startedAt, completedAt: new Date().toISOString(),
          stages: stages.map(s => ({ stageKey: s.stageKey, strokeLog: s.strokeLog })) },
        null, 2
      )],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pathfinder_${sessionId.slice(0, 8)}_strokelog.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadImages = () => {
    stages.forEach(s => {
      const a = document.createElement('a');
      a.href = s.imageData;
      a.download = `pathfinder_${s.stageKey}.png`;
      a.click();
    });
  };

  const handleDownloadFullSession = () => {
    const fullSession = {
      version: '1.0',
      type: 'pathfinder-session',
      sessionId,
      startedAt,
      exportedAt: new Date().toISOString(),
      stages: stages.map(s => ({
        stageKey: s.stageKey,
        imageData: s.imageData,   // base64 PNG 포함
        strokeLog: s.strokeLog,
      })),
      pdiAnswers: sessionData.pdiAnswers ?? {},
      aiState:    sessionData.aiState    ?? {},
    };
    const blob = new Blob([JSON.stringify(fullSession, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `pathfinder_session_${sessionId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="complete-card">
      <div className="complete-icon">🎉</div>
      <h2>모든 데이터 수집 완료!</h2>
      <p>
        집·나무·사람(동성)·사람(이성) 드로잉과 사후 인터뷰 답변이 모두 수집됐습니다.<br />
        아래 버튼을 눌러 HTP 임상 분석을 시작하세요.
      </p>

      {/* 세션 통계 */}
      <div className="data-stats">
        <div className="stat-box">
          <div className="val">{stages.length}</div>
          <div className="lbl">완료 단계</div>
        </div>
        <div className="stat-box">
          <div className="val">{totalStrokes}</div>
          <div className="lbl">총 획 수</div>
        </div>
        <div className="stat-box">
          <div className="val">{totalDuration}s</div>
          <div className="lbl">소요 시간</div>
        </div>
        <div className="stat-box">
          <div className="val">{answeredPDI}</div>
          <div className="lbl">답변 항목</div>
        </div>
      </div>

      {/* 그림 미리보기 */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        {stages.map(s => {
          const meta = STAGE_META[s.stageKey];
          return (
            <div key={s.stageKey} style={{ textAlign: 'center' }}>
              <img
                src={s.imageData} alt={s.stageKey}
                style={{
                  width: 140, height: 88, objectFit: 'contain',
                  border: '1px solid #CBD5E0', borderRadius: 8, background: '#fff',
                }}
              />
              <div style={{ fontSize: 11, color: '#718096', marginTop: 4 }}>
                {meta?.emoji} {meta?.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* 분석 시작 버튼 (메인) */}
      <button
        className="btn-primary"
        onClick={onStartAnalysis}
        style={{ fontSize: 16, padding: '14px', marginBottom: 16, letterSpacing: '-0.3px' }}
      >
        🧠 HTP 임상 분석 시작하기
      </button>

      <p style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 20 }}>
        그림 4장 + 드로잉 과정 지표 + 인터뷰 답변을 Claude AI로 종합 분석합니다 (약 15~25초 소요)
      </p>

      {/* 보조 버튼 */}
      <div className="btn-group">
        <button
          className="btn-secondary"
          onClick={handleDownloadFullSession}
          title="그림 이미지가 포함된 전체 세션 파일 저장 (나중에 불러올 수 있음)"
        >
          💾 세션 전체 저장
        </button>
        <button className="btn-secondary" onClick={handleDownloadLog}>⬇ 로그 JSON</button>
        <button className="btn-secondary" onClick={handleDownloadImages}>🖼 이미지 저장</button>
        <button className="btn-secondary" onClick={onRestart}>🔄 처음부터 다시</button>
      </div>
    </div>
  );
}
