/**
 * AnalysisReport.jsx — RAG 방식 HTP 임상 분석 보고서 (복합 분석 버전)
 */

import { summarizeStrokeLog } from '../utils/htpAnalysis';
import { STAGE_META, DRAWING_RENDER_ORDER } from '../constants/stages';

// STAGE_META imported from constants/stages

const EVIDENCE_META = {
  visual:  { icon: '🖼',  label: '시각',   bg: '#EBF4FF', color: '#2E75B6', border: '#BEE3F8' },
  process: { icon: '✏️',  label: '과정',   bg: '#FFFBEB', color: '#B7791F', border: '#FCD34D' },
  sct:     { icon: '💬',  label: 'SCT',    bg: '#E6F4EC', color: '#276749', border: '#9AE6B4' },
  demo:    { icon: '👤',  label: '인구통계', bg: '#F0EBF8', color: '#7B5EA7', border: '#D6BCFA' },
};

const TONE_COLORS = {
  '긍정': '#38A169', '안정': '#38A169', '건강': '#38A169',
  '불안': '#D69E2E', '갈등': '#D69E2E', '혼재': '#D69E2E',
  '우울': '#C53030', '위축': '#C53030', '억압': '#C53030',
};
function getToneColor(tone = '') {
  for (const [key, color] of Object.entries(TONE_COLORS)) {
    if (tone.includes(key)) return color;
  }
  return '#2E75B6';
}

/* ════════════════════════════════════════════════════════════
   메인 컴포넌트
   ════════════════════════════════════════════════════════════ */
export default function AnalysisReport({ analysis, sessionData, onRestart }) {
  const { stages, sessionId, startedAt, userProfile } = sessionData;
  const handlePrint = () => window.print();
  const toneColor = getToneColor(analysis.psychologicalTone);

  return (
    <div style={{ width: '100%', maxWidth: 800 }}>

      {/* ══ 보고서 헤더 ══ */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header" style={{ background: 'linear-gradient(135deg, #1A3C6E 0%, #2E75B6 100%)' }}>
          <h1>🧠 HTP 심리 분석 보고서</h1>
          <p>PathFinder AI · RAG 근거 인용 복합 분석</p>
        </div>
        <div className="card-body">

          {/* 수검자 정보 */}
          <div style={{
            display: 'flex', gap: 12, flexWrap: 'wrap',
            background: '#F7FAFC', borderRadius: 8,
            padding: '10px 14px', marginBottom: 12,
            fontSize: 12, color: '#718096',
          }}>
            <span>📅 {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>·</span>
            <span>🔑 {sessionId?.slice(0, 8).toUpperCase()}</span>
            {userProfile?.age    && <><span>·</span><span>🎂 {userProfile.age}세</span></>}
            {userProfile?.gender && <><span>·</span><span>👤 {userProfile.gender}성</span></>}
            {userProfile?.occupation && <><span>·</span><span>💼 {userProfile.occupation}</span></>}
          </div>

          {/* 면책 배너 */}
          <div style={{
            background: '#FEF3C7', border: '1px solid #FCD34D',
            borderRadius: 8, padding: '10px 14px',
            fontSize: 12, color: '#92400E', lineHeight: 1.7, marginBottom: 20,
          }}>
            ⚠️ {analysis.disclaimer}
          </div>

          {/* 전반 심리 톤 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#718096', fontWeight: 600 }}>전반적 심리 톤</span>
            <span style={{
              background: toneColor, color: '#fff',
              borderRadius: 20, padding: '4px 16px',
              fontSize: 14, fontWeight: 700,
            }}>
              {analysis.psychologicalTone}
            </span>
          </div>

          {/* 종합 요약 */}
          <div style={{
            background: '#F0F4FA', borderRadius: 10,
            padding: '16px 18px', fontSize: 14,
            color: '#2D3748', lineHeight: 1.9,
            borderLeft: '4px solid #2E75B6',
            marginBottom: analysis.demographicContext ? 14 : 0,
          }}>
            {analysis.summary}
          </div>

          {/* 인구통계 맥락 */}
          {analysis.demographicContext && (
            <div style={{
              padding: '12px 14px', background: '#F0EBF8',
              borderRadius: 8, fontSize: 13, color: '#4A5568',
              lineHeight: 1.7, borderLeft: '3px solid #7B5EA7', marginTop: 14,
            }}>
              <strong style={{ color: '#7B5EA7' }}>👤 인구통계 맥락:</strong>{' '}
              {analysis.demographicContext}
            </div>
          )}
        </div>
      </div>

      {/* ══ 사전 SCT 인사이트 ══ */}
      {analysis.preSctInsights && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header" style={{ background: '#2C7A7B' }}>
            <h1>📝 검사 전 상태 분석</h1>
          </div>
          <div className="card-body">
            <div style={{
              padding: '14px 16px', background: '#E6FFFA',
              borderRadius: 8, fontSize: 14, color: '#2D3748',
              lineHeight: 1.85, borderLeft: '4px solid #2C7A7B',
            }}>
              {analysis.preSctInsights}
            </div>
          </div>
        </div>
      )}

      {/* ══ 근거 범례 ══ */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
        padding: '10px 14px', marginBottom: 16,
        background: '#F7FAFC', borderRadius: 8,
        border: '1px solid #E2E8F0', fontSize: 12,
      }}>
        <span style={{ color: '#718096', fontWeight: 700, marginRight: 4 }}>근거 유형:</span>
        {Object.entries(EVIDENCE_META).map(([type, em]) => (
          <span key={type} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: em.bg, color: em.color,
            borderRadius: 12, padding: '3px 10px',
            border: `1px solid ${em.border}`, fontWeight: 600,
          }}>
            {em.icon} {em.label}
          </span>
        ))}
      </div>

      {/* ══ 그림별 RAG 분석 카드 ══ */}
      {DRAWING_RENDER_ORDER.map(key => {
        const meta    = STAGE_META[key];
        const drawingKey = (key === 'person_same' && !analysis.drawings?.[key]) ? 'person' : key;
        const drawing = analysis.drawings?.[drawingKey];
        const stage   = stages.find(s => s.stageKey === key);
        if (!drawing) return null;

        const strokeSummary = stage ? summarizeStrokeLog(stage.strokeLog ?? {}) : null;

        return (
          <DrawingCard
            key={key}
            meta={meta}
            drawing={drawing}
            stage={stage}
            strokeSummary={strokeSummary}
          />
        );
      })}

      {/* ══ SCT 인사이트 ══ */}
      {(analysis.sctInsights || analysis.pdiInsights) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <h1>💬 사후 문장완성 인사이트</h1>
          </div>
          <div className="card-body">
            {analysis.sctInsights && (
              <div style={{
                padding: '14px 16px', background: '#E6F4EC',
                borderRadius: 8, fontSize: 14, color: '#2D3748',
                lineHeight: 1.85, borderLeft: '4px solid #38A169',
                marginBottom: analysis.pdiInsights ? 14 : 0,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#276749', marginBottom: 6 }}>
                  💬 SCT 완성 문장 분석
                </div>
                {analysis.sctInsights}
              </div>
            )}
            {analysis.pdiInsights && (
              <div style={{
                padding: '14px 16px', background: '#F0F4FA',
                borderRadius: 8, fontSize: 14, color: '#2D3748',
                lineHeight: 1.85, borderLeft: '4px solid #4472C4',
              }}>
                {analysis.pdiInsights}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ 교차 주제 ══ */}
      {(analysis.crossDrawingThemes ?? []).length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <h1>🔗 반복되는 심리적 주제</h1>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {analysis.crossDrawingThemes.map((theme, i) => (
                <span key={i} style={{
                  background: '#EBF4FF', color: '#2E75B6',
                  borderRadius: 20, padding: '8px 16px',
                  fontSize: 13, fontWeight: 600,
                  border: '1px solid #BEE3F8',
                }}>
                  {theme}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ 강점 + 탐색 영역 ══ */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ background: '#276749' }}>
          <h1>🌱 강점 및 탐색 영역</h1>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#38A169', marginBottom: 10 }}>💪 심리적 자원과 강점</div>
              <div style={{
                padding: '14px 16px', background: '#E6F4EC',
                borderRadius: 8, fontSize: 14, color: '#2D3748', lineHeight: 1.8,
              }}>
                {analysis.strengthsAndResources}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#7B5EA7', marginBottom: 10 }}>🔎 추가 탐색 권장 영역</div>
              <div style={{
                padding: '14px 16px', background: '#F0EBF8',
                borderRadius: 8, fontSize: 14, color: '#2D3748', lineHeight: 1.8,
              }}>
                {analysis.areasOfExploration}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ 하단 버튼 ══ */}
      <div className="btn-group" style={{ justifyContent: 'center' }}>
        <button className="btn-secondary" onClick={handlePrint}>🖨 인쇄 / PDF 저장</button>
        <button className="btn-primary"
          style={{ width: 'auto', padding: '10px 28px', fontSize: 14 }}
          onClick={onRestart}>
          🔄 새 세션 시작
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   DrawingCard
   ════════════════════════════════════════════════════════════ */
function DrawingCard({ meta, drawing, stage, strokeSummary }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header" style={{ background: meta.color }}>
        <h1>{meta.emoji} {meta.label} 분석</h1>
      </div>
      <div className="card-body">

        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {stage && (
            <div style={{ flexShrink: 0 }}>
              <img src={stage.imageData} alt={meta.label}
                style={{
                  width: 180, height: 114, objectFit: 'contain',
                  background: '#fff', border: `2px solid ${meta.border}`,
                  borderRadius: 10, display: 'block',
                }}
              />
              {strokeSummary && !strokeSummary.error && (
                <div style={{
                  marginTop: 8, padding: '8px 10px',
                  background: meta.bg, borderRadius: 8,
                  border: `1px solid ${meta.border}`,
                  fontSize: 11, color: '#4A5568', lineHeight: 1.7, maxWidth: 180,
                }}>
                  <div style={{ fontWeight: 700, color: meta.color, marginBottom: 4 }}>✏️ 드로잉 과정 지표</div>
                  <div>총 {strokeSummary.totalStrokes}획 · {strokeSummary.durationSec}초</div>
                  <div>{strokeSummary.strokesPerMin}획/분 · 필압 {strokeSummary.avgPressure}</div>
                  <div>
                    첫획지연 {Math.round(strokeSummary.firstStrokeDelayMs / 1000)}초
                    {strokeSummary.longPausesCount > 0 && ` · 긴멈춤 ${strokeSummary.longPausesCount}회`}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, marginBottom: 10 }}>
              📋 주요 시각적 관찰
            </div>
            {(drawing.observations ?? []).map((obs, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, marginBottom: 7,
                fontSize: 13, color: '#2D3748', lineHeight: 1.5,
              }}>
                <span style={{ color: meta.color, flexShrink: 0 }}>•</span>
                <span>{obs}</span>
              </div>
            ))}
          </div>
        </div>

        {(drawing.keyIndicators ?? []).length > 0 && (
          <div>
            <div style={{
              fontSize: 12, fontWeight: 700, color: '#718096',
              marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>🔍 임상 지표 — 근거 인용 분석</span>
              <span style={{
                fontSize: 10, background: '#EBF4FF', color: '#2E75B6',
                borderRadius: 10, padding: '2px 8px',
              }}>RAG</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {drawing.keyIndicators.map((ind, i) => (
                <IndicatorCard key={i} indicator={ind} meta={meta} />
              ))}
            </div>
          </div>
        )}

        {drawing.processInsights && (
          <div style={{
            marginTop: 16, padding: '12px 14px',
            background: '#FFFBEB', borderRadius: 8,
            borderLeft: '3px solid #D69E2E',
            fontSize: 13, color: '#4A5568', lineHeight: 1.7,
          }}>
            <strong style={{ color: '#B7791F' }}>✏️ 드로잉 과정:</strong>{' '}
            {drawing.processInsights}
          </div>
        )}

        <div style={{
          marginTop: 14, padding: '14px 16px',
          background: meta.bg, borderRadius: 8,
          fontSize: 14, color: '#2D3748', lineHeight: 1.85,
          borderLeft: `4px solid ${meta.color}`,
        }}>
          <strong style={{ color: meta.color }}>종합 해석:</strong>{' '}
          {drawing.interpretation}
        </div>

        {/* person_opposite: 동성과의 비교 해석 */}
        {drawing.comparedToSame && (
          <div style={{
            marginTop: 12, padding: '12px 14px',
            background: '#FEF3E8', borderRadius: 8,
            borderLeft: '3px solid #C05621',
            fontSize: 13, color: '#4A5568', lineHeight: 1.7,
          }}>
            <strong style={{ color: '#C05621' }}>🔁 동·이성 인물상 비교:</strong>{' '}
            {drawing.comparedToSame}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   IndicatorCard
   ════════════════════════════════════════════════════════════ */
function IndicatorCard({ indicator, meta }) {
  const { element, finding, evidences = [], interpretation } = indicator;
  return (
    <div style={{ border: `1px solid ${meta.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', background: meta.bg,
        borderBottom: `1px solid ${meta.border}`,
      }}>
        <span style={{
          background: meta.color, color: '#fff',
          borderRadius: 6, padding: '2px 10px',
          fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>
          {element}
        </span>
        <span style={{ fontSize: 13, color: '#2D3748', fontWeight: 600, lineHeight: 1.4 }}>
          {finding}
        </span>
      </div>

      <div style={{ padding: '12px 14px' }}>
        {evidences.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#A0AEC0',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
            }}>
              📎 근거 출처
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {evidences.map((ev, i) => {
                const em = EVIDENCE_META[ev.type] ?? EVIDENCE_META.visual;
                return (
                  <div key={i} style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    background: em.bg, border: `1px solid ${em.border}`,
                    borderRadius: 6, padding: '6px 10px',
                    fontSize: 12, color: '#2D3748', lineHeight: 1.5,
                  }}>
                    <span style={{
                      color: em.color, fontWeight: 700, fontSize: 11,
                      flexShrink: 0, whiteSpace: 'nowrap',
                      background: em.border + '55',
                      borderRadius: 4, padding: '1px 6px', marginTop: 1,
                    }}>
                      {em.icon} {em.label}
                    </span>
                    <span>{ev.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-start',
          padding: '8px 10px', background: '#F7FAFC',
          borderRadius: 6, borderLeft: `3px solid ${meta.color}`,
        }}>
          <span style={{ color: meta.color, fontWeight: 700, fontSize: 11, flexShrink: 0, marginTop: 2 }}>
            💡 해석
          </span>
          <span style={{ fontSize: 13, color: '#2D3748', lineHeight: 1.6 }}>
            {interpretation}
          </span>
        </div>
      </div>
    </div>
  );
}
