import { useState, useCallback, useEffect } from 'react';
import './App.css';
import { authApi, sessionApi, tokenStore } from './utils/api';

import AuthScreen        from './components/AuthScreen';
import SessionHistory    from './components/SessionHistory';
import ConsentScreen     from './components/ConsentScreen';
import PreSCTScreen      from './components/PreSCTScreen';
import IntroScreen       from './components/IntroScreen';
import LoadSessionScreen from './components/LoadSessionScreen';
import StageIndicator    from './components/StageIndicator';
import DrawingCanvas     from './components/DrawingCanvas';
import PostDrawingScreen from './components/PostDrawingScreen';
import CompleteScreen    from './components/CompleteScreen';
import AnalyzingScreen   from './components/AnalyzingScreen';
import AnalysisReport    from './components/AnalysisReport';
import MyPage            from './components/MyPage';
import { generateHTPAnalysis } from './utils/htpAnalysis';

const TOTAL_STAGES = 4;

export default function App() {
  // ── 인증 ──
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── 앱 phase ──
  // auth | history | mypage | consent | pre-sct | intro | load | drawing | questions | complete | analyzing | report
  const [phase, setPhase]               = useState('auth');
  const [stageIndex, setStageIndex]     = useState(0);
  const [sessionData, setSessionData]   = useState(null);
  const [dbSessionId, setDbSessionId]   = useState(null);
  const [analysis, setAnalysis]         = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [retryCount, setRetryCount]     = useState(0);

  /* ── 앱 시작 시 토큰 확인 ── */
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) { setAuthLoading(false); return; }
    authApi.me()
      .then(d => { setUser(d.user); setPhase('history'); })
      .catch(() => { tokenStore.clear(); })
      .finally(() => setAuthLoading(false));
  }, []);

  /* ════════════════════════════════════════
     인증 핸들러
     ════════════════════════════════════════ */
  const handleAuth = useCallback((u) => {
    setUser(u);
    setPhase('history');
  }, []);

  const handleLogout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setPhase('auth');
    setSessionData(null);
    setDbSessionId(null);
    setAnalysis(null);
  }, []);

  const handleUserUpdate = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  /* ════════════════════════════════════════
     세션 흐름 핸들러
     ════════════════════════════════════════ */

  const handleNewSession     = useCallback(() => setPhase('consent'), []);
  const handleConsent        = useCallback(() => setPhase('pre-sct'), []);

  /* 사전 SCT 완료 */
  const handlePreSCTComplete = useCallback((preSctAnswers) => {
    setSessionData(prev => ({ ...(prev ?? {}), preSctAnswers }));
    setPhase('intro');
  }, []);

  /* 소개 → 드로잉 시작 */
  const handleIntroStart = useCallback(async () => {
    const now = new Date().toISOString();
    const localData = {
      sessionId: crypto.randomUUID(),
      startedAt: now,
      stages: [],
      userProfile: {
        name:        user?.name,
        age:         user?.age,
        gender:      user?.gender,
        occupation:  user?.occupation,
        family_info: user?.family_info,
      },
      ...(sessionData?.preSctAnswers ? { preSctAnswers: sessionData.preSctAnswers } : {}),
    };
    setSessionData(localData);
    setStageIndex(0);
    setPhase('drawing');

    try {
      const { session } = await sessionApi.create(now);
      setDbSessionId(session.id);
      // 사전 SCT 저장
      if (localData.preSctAnswers) {
        await sessionApi.update(session.id, { preSctAnswers: localData.preSctAnswers }).catch(() => {});
      }
    } catch (e) {
      console.warn('[DB] 세션 생성 실패 (로컬 진행):', e.message);
    }
  }, [user, sessionData]);

  const handleGoToLoad = useCallback(() => setPhase('load'), []);

  const handleSessionLoaded = useCallback((restoredSession) => {
    setSessionData(restoredSession);
    setPhase('complete');
  }, []);

  const handleLoadFromHistory = useCallback((restoredSession, existingAnalysis) => {
    setSessionData(restoredSession);
    setDbSessionId(restoredSession.sessionId);
    if (existingAnalysis) {
      setAnalysis(existingAnalysis);
      setPhase('report');
    } else {
      setPhase('complete');
    }
  }, []);

  /* 드로잉 단계 완료 */
  const handleStageComplete = useCallback(async (stageResult) => {
    const newStages = [...(sessionData?.stages ?? []), stageResult];
    setSessionData(prev => ({ ...prev, stages: newStages }));

    if (dbSessionId) {
      try {
        await sessionApi.saveStage(dbSessionId, stageResult.stageKey, stageResult.imageData, stageResult.strokeLog);
      } catch (e) {
        console.warn('[DB] 단계 저장 실패:', e.message);
      }
    }

    if (stageIndex < TOTAL_STAGES - 1) {
      setStageIndex(i => i + 1);
    } else {
      setPhase('questions');
    }
  }, [stageIndex, sessionData, dbSessionId]);

  /* 사후 인터뷰 완료 */
  const handleQuestionsComplete = useCallback(async ({ answers, aiState }) => {
    const now = new Date().toISOString();
    setSessionData(prev => ({ ...prev, pdiAnswers: answers, aiState }));

    if (dbSessionId) {
      try {
        await sessionApi.update(dbSessionId, { completedAt: now, pdiAnswers: answers, aiState });
      } catch (e) {
        console.warn('[DB] PDI 저장 실패:', e.message);
      }
    }
    setPhase('complete');
  }, [dbSessionId]);

  /* 분석 시작 */
  const handleStartAnalysis = useCallback(() => {
    setAnalysis(null);
    setAnalysisError(null);
    setRetryCount(0);
    setPhase('analyzing');
  }, []);

  const handleRetryAnalysis  = useCallback(() => {
    setAnalysisError(null);
    setRetryCount(c => c + 1);
  }, []);

  const handleBackToComplete = useCallback(() => {
    setAnalysisError(null);
    setPhase('complete');
  }, []);

  /* ── analyzing 진입 시 API 호출 ── */
  useEffect(() => {
    if (phase !== 'analyzing' || !sessionData) return;
    let cancelled = false;

    // 분석 시 최신 userProfile 포함
    const enrichedSession = {
      ...sessionData,
      userProfile: {
        name:        user?.name,
        age:         user?.age,
        gender:      user?.gender,
        occupation:  user?.occupation,
        family_info: user?.family_info,
        ...(sessionData.userProfile ?? {}),
      },
    };

    generateHTPAnalysis(enrichedSession)
      .then(async result => {
        if (cancelled) return;
        setAnalysis(result);
        setPhase('report');
        const sid = dbSessionId ?? sessionData.sessionId;
        if (sid) {
          try { await sessionApi.saveAnalysis(sid, result); }
          catch (e) { console.warn('[DB] 분석 결과 저장 실패:', e.message); }
        }
      })
      .catch(err => {
        if (cancelled) return;
        setAnalysisError(err.message ?? '알 수 없는 오류');
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sessionData, retryCount]);

  const handleRestart = useCallback(() => {
    setSessionData(null);
    setDbSessionId(null);
    setAnalysis(null);
    setAnalysisError(null);
    setRetryCount(0);
    setStageIndex(0);
    setPhase('history');
  }, []);

  /* ── 면책 배너 ── */
  const showDisclaimer = !['auth', 'history', 'mypage', 'consent', 'pre-sct', 'intro'].includes(phase);

  /* ════════════════════════════════════════
     로딩 중
     ════════════════════════════════════════ */
  if (authLoading) {
    return (
      <>
        <header className="app-header">
          <span className="logo">PathFinder AI</span>
          <span className="badge">MVP Preview</span>
        </header>
        <main className="app-body">
          <div style={{ color: '#718096', fontSize: 14 }}>불러오는 중...</div>
        </main>
      </>
    );
  }

  /* ════════════════════════════════════════
     렌더
     ════════════════════════════════════════ */
  return (
    <>
      <header className="app-header">
        <span className="logo">PathFinder AI</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user && (
            <>
              <button
                onClick={() => setPhase('mypage')}
                style={{
                  background: 'none', border: '1px solid #CBD5E0',
                  borderRadius: 6, padding: '4px 10px',
                  fontSize: 12, color: '#4A5568', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                👤 {user.name}
              </button>
            </>
          )}
          <span className="badge">MVP Preview</span>
        </div>
      </header>

      {showDisclaimer && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '12px 16px 0' }}>
          <div className="disclaimer-banner" style={{ margin: 0 }}>
            ⚠️ 본 서비스의 분석 결과는 심리 임상 진단이 아닌 참고용 정보입니다.
          </div>
        </div>
      )}

      <main className="app-body">

        {phase === 'auth' && (
          <AuthScreen onAuth={handleAuth} />
        )}

        {phase === 'history' && user && (
          <SessionHistory
            user={user}
            onNewSession={handleNewSession}
            onLoadSession={handleLoadFromHistory}
            onLogout={handleLogout}
          />
        )}

        {phase === 'mypage' && user && (
          <MyPage
            user={user}
            onUpdate={handleUserUpdate}
            onClose={() => setPhase(user ? 'history' : 'auth')}
          />
        )}

        {phase === 'consent' && (
          <ConsentScreen onConsent={handleConsent} />
        )}

        {phase === 'pre-sct' && (
          <PreSCTScreen onComplete={handlePreSCTComplete} />
        )}

        {phase === 'intro' && (
          <IntroScreen onStart={handleIntroStart} onLoadFile={handleGoToLoad} />
        )}

        {phase === 'load' && (
          <LoadSessionScreen
            onLoaded={handleSessionLoaded}
            onBack={() => setPhase('intro')}
          />
        )}

        {phase === 'drawing' && (
          <>
            <StageIndicator currentIndex={stageIndex} />
            <DrawingCanvas
              key={stageIndex}
              stageIndex={stageIndex}
              onStageComplete={handleStageComplete}
              userGender={user?.gender}
            />
          </>
        )}

        {phase === 'questions' && sessionData && (
          <PostDrawingScreen
            sessionData={sessionData}
            onComplete={handleQuestionsComplete}
          />
        )}

        {phase === 'complete' && sessionData && (
          <CompleteScreen
            sessionData={sessionData}
            onStartAnalysis={handleStartAnalysis}
            onRestart={handleRestart}
          />
        )}

        {phase === 'analyzing' && (
          <AnalyzingScreen
            error={analysisError}
            onRetry={handleRetryAnalysis}
            onBack={handleBackToComplete}
          />
        )}

        {phase === 'report' && analysis && sessionData && (
          <AnalysisReport
            analysis={analysis}
            sessionData={sessionData}
            onRestart={handleRestart}
          />
        )}

      </main>
    </>
  );
}
