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

      {/* ══ 개별 기질·성격 프로파일 ══ */}
      {analysis.characterProfile && (
        <CharacterProfileCard
          profile={analysis.characterProfile}
          tci={analysis.tciProfile}
        />
      )}

      {/* ══ Big5 × 기질 프로파일 ══ */}
      {analysis.big5Profile && (
        <Big5ProfileCard
          big5={analysis.big5Profile}
          tci={analysis.tciProfile}
          tciAnchors={analysis.tciAnchors}
        />
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
      <div className="btn-group no-print" style={{ justifyContent: 'center' }}>
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

/* ════════════════════════════════════════════════════════════
   CharacterProfileCard — 개별 기질·성격 프로파일
   ════════════════════════════════════════════════════════════ */
const TCI_LEVEL_META = {
  high: { label: '상', bg: '#EBF4FF', color: '#2E75B6' },
  mid:  { label: '중', bg: '#F0EBF8', color: '#7B5EA7' },
  low:  { label: '하', bg: '#F7FAFC', color: '#718096' },
};
const TCI_DIM_LABELS = { NS: '새로움 추구', HA: '위험 회피', RD: '보상 의존', P: '인내' };

function CharacterProfileCard({ profile, tci }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header" style={{ background: 'linear-gradient(135deg, #2C5282 0%, #2B6CB0 100%)' }}>
        <h1>🧬 기질 × 성격 프로파일</h1>
        <p>기질 × 성격 — 개별 분석</p>
      </div>
      <div className="card-body">

        {/* 기질 수준 칩 */}
        {tci && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {Object.entries(TCI_DIM_LABELS).map(([dim, dimLabel]) => {
              const entry = tci[dim];
              const lvMeta = TCI_LEVEL_META[entry?.level] ?? TCI_LEVEL_META.mid;
              return (
                <div key={dim} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: lvMeta.bg, borderRadius: 20,
                  padding: '5px 12px', fontSize: 12,
                  border: `1px solid ${lvMeta.color}22`,
                }}>
                  <span style={{ fontWeight: 800, color: lvMeta.color }}>{lvMeta.label}</span>
                  <span style={{ color: '#4A5568' }}>{dimLabel}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* 핵심 심리 주제 */}
        {profile.coreTheme && (
          <div style={{
            padding: '12px 16px', background: '#EBF4FF',
            borderRadius: 8, borderLeft: '4px solid #2E75B6',
            fontSize: 14, fontWeight: 600, color: '#1A365D',
            lineHeight: 1.7, marginBottom: 16,
          }}>
            💡 {profile.coreTheme}
          </div>
        )}

        {/* 기질 서사 */}
        {profile.temperamentNarrative && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2C7A7B', marginBottom: 6 }}>
              🔬 기질 분석
            </div>
            <div style={{
              padding: '14px 16px', background: '#E6FFFA',
              borderRadius: 8, fontSize: 14, color: '#2D3748',
              lineHeight: 1.9, borderLeft: '4px solid #2C7A7B',
            }}>
              {profile.temperamentNarrative}
            </div>
          </div>
        )}

        {/* 성격 서사 */}
        {profile.personalityNarrative && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B46C1', marginBottom: 6 }}>
              🧠 Big5 성격 분석
            </div>
            <div style={{
              padding: '14px 16px', background: '#FAF5FF',
              borderRadius: 8, fontSize: 14, color: '#2D3748',
              lineHeight: 1.9, borderLeft: '4px solid #6B46C1',
            }}>
              {profile.personalityNarrative}
            </div>
          </div>
        )}

        {/* 강점 + 성장 과제 */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#38A169', marginBottom: 8 }}>
              💪 핵심 강점
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(profile.strengths ?? []).map((s, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 8, alignItems: 'center',
                  background: '#E6F4EC', borderRadius: 6,
                  padding: '6px 10px', fontSize: 13, color: '#276749',
                }}>
                  <span style={{ color: '#38A169', flexShrink: 0 }}>✓</span>
                  {s}
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#C05621', marginBottom: 8 }}>
              🌱 성장 과제
            </div>
            <div style={{
              padding: '10px 12px', background: '#FEF3E8',
              borderRadius: 6, fontSize: 13, color: '#7B341E', lineHeight: 1.7,
            }}>
              {profile.growthEdge}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Big5ProfileCard — 레이더 차트 + 기질 프로파일
   ════════════════════════════════════════════════════════════ */
const BIG5_META = {
  O: { label: '개방성', fullLabel: 'Openness',        color: '#7B5EA7', low: '보수적·실용적', high: '창의적·호기심' },
  C: { label: '성실성', fullLabel: 'Conscientiousness', color: '#2E75B6', low: '유연·즉흥적',   high: '계획적·책임감' },
  E: { label: '외향성', fullLabel: 'Extraversion',     color: '#C05621', low: '내향적·조용',   high: '사교적·활동적' },
  A: { label: '친화성', fullLabel: 'Agreeableness',    color: '#38A169', low: '경쟁적·직설적', high: '협력적·공감' },
  N: { label: '신경성', fullLabel: 'Neuroticism',      color: '#D69E2E', low: '안정적·침착',   high: '예민·감정기복' },
};

const TCI_META = {
  NS: { label: '새로움 추구', color: '#C05621', low: '신중·일관', high: '충동·탐색' },
  HA: { label: '위험 회피',   color: '#2C7A7B', low: '낙관·대담', high: '걱정·억제' },
  RD: { label: '보상 의존',   color: '#276749', low: '독립·냉정', high: '공감·인정 욕구' },
  P:  { label: '인내',        color: '#2E75B6', low: '유연·쉽게 포기', high: '끈기·완벽주의' },
};

function Big5RadarSVG({ scores }) {
  const dims  = ['O', 'C', 'E', 'A', 'N'];
  const cx    = 130, cy = 130, r = 100;
  const n     = dims.length;

  // 꼭짓점 계산 (위쪽부터 시계방향)
  const angle  = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt     = (i, scale) => ({
    x: cx + r * scale * Math.cos(angle(i)),
    y: cy + r * scale * Math.sin(angle(i)),
  });

  // 배경 격자 (20 40 60 80 100)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const gridPath = (scale) =>
    dims.map((_, i) => {
      const p = pt(i, scale);
      return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }).join(' ') + ' Z';

  // 데이터 폴리곤
  const dataPath = dims.map((d, i) => {
    const scale = (scores[d] ?? 50) / 100;
    const p     = pt(i, scale);
    return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(' ') + ' Z';

  return (
    <svg viewBox="0 0 260 260" style={{ width: '100%', maxWidth: 260 }}>
      {/* 격자 */}
      {gridLevels.map((scale, gi) => (
        <path key={gi} d={gridPath(scale)}
          fill="none" stroke="#E2E8F0" strokeWidth={gi === 4 ? 1.5 : 1} />
      ))}
      {/* 축 선 */}
      {dims.map((_, i) => {
        const p = pt(i, 1.0);
        return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(1)} y2={p.y.toFixed(1)}
          stroke="#E2E8F0" strokeWidth={1} />;
      })}
      {/* 데이터 폴리곤 */}
      <path d={dataPath} fill="#2E75B680" stroke="#2E75B6" strokeWidth={2} />
      {/* 꼭짓점 점 + 레이블 */}
      {dims.map((d, i) => {
        const meta  = BIG5_META[d];
        const scale = (scores[d] ?? 50) / 100;
        const pData = pt(i, scale);
        const pLabel = pt(i, 1.18);
        return (
          <g key={d}>
            <circle cx={pData.x.toFixed(1)} cy={pData.y.toFixed(1)} r={4}
              fill={meta.color} stroke="#fff" strokeWidth={1.5} />
            <text x={pLabel.x.toFixed(1)} y={pLabel.y.toFixed(1)}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={11} fontWeight={700} fill={meta.color}>
              {meta.label}
            </text>
            <text x={pLabel.x.toFixed(1)} y={(parseFloat(pLabel.y) + 13).toFixed(1)}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={9.5} fill="#718096">
              {scores[d] ?? 50}
            </text>
          </g>
        );
      })}
      {/* 중앙 점 */}
      <circle cx={cx} cy={cy} r={2} fill="#CBD5E0" />
    </svg>
  );
}

function Big5ProfileCard({ big5, tci, tciAnchors }) {
  const dims = ['O', 'C', 'E', 'A', 'N'];
  const scores = {};
  dims.forEach(d => { scores[d] = big5?.[d]?.score ?? 50; });

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header" style={{ background: 'linear-gradient(135deg, #1A365D 0%, #2E75B6 100%)' }}>
        <h1>📊 Big5 × 기질 성격 프로파일</h1>
        <p>드로잉 이미지 40% · 과정 지표 35% · 언어 반응 25% 가중 합산</p>
      </div>
      <div className="card-body">

        {/* 레이더 + 점수 바 */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 20 }}>
          {/* 레이더 차트 */}
          <div style={{ flexShrink: 0, width: 220 }}>
            <Big5RadarSVG scores={scores} />
          </div>

          {/* 점수 바 */}
          <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dims.map(d => {
              const meta  = BIG5_META[d];
              const score = scores[d];
              return (
                <div key={d}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        background: meta.color, color: '#fff',
                        borderRadius: 4, padding: '1px 6px',
                        fontSize: 10, fontWeight: 700,
                      }}>{d}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#2D3748' }}>{meta.label}</span>
                      <span style={{ fontSize: 10, color: '#A0AEC0' }}>{meta.fullLabel}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{score}</span>
                  </div>
                  <div style={{ position: 'relative', height: 8, background: '#EDF2F7', borderRadius: 99 }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0,
                      width: `${score}%`, height: '100%',
                      background: meta.color, borderRadius: 99,
                      transition: 'width 0.6s ease',
                    }} />
                    {/* 50 중앙선 */}
                    <div style={{
                      position: 'absolute', left: '50%', top: -2,
                      width: 1, height: 12, background: '#CBD5E0',
                    }} />
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 9.5, color: '#A0AEC0', marginTop: 2,
                  }}>
                    <span>{meta.low}</span>
                    <span>{meta.high}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Big5 차원별 해석 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {dims.map(d => {
            const meta = BIG5_META[d];
            const dim  = big5?.[d];
            if (!dim?.interpretation) return null;
            return (
              <div key={d} style={{
                flex: '1 1 180px',
                padding: '10px 12px',
                background: meta.color + '10',
                borderRadius: 8,
                border: `1px solid ${meta.color}40`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{
                    background: meta.color, color: '#fff',
                    borderRadius: 4, padding: '1px 7px',
                    fontSize: 10, fontWeight: 700,
                  }}>{d}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                  {dim.keySymbol && (
                    <span style={{ fontSize: 10, color: '#A0AEC0', fontStyle: 'italic' }}>
                      — {dim.keySymbol}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.65 }}>
                  {dim.interpretation}
                </div>
              </div>
            );
          })}
        </div>

        {/* 기질 프로파일 */}
        {tci && (
          <div>
            <div style={{
              fontSize: 12, fontWeight: 700, color: '#718096',
              marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>🧬 기질 프로파일</span>
              <span style={{ fontSize: 10, color: '#A0AEC0', fontWeight: 400 }}>
                (새로움 추구·위험 회피·보상 의존·인내 4차원)
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {Object.entries(TCI_META).map(([key, meta]) => {
                const dim = tci[key];
                if (!dim) return null;
                const levelColors = { high: meta.color, mid: '#718096', low: '#A0AEC0' };
                const levelLabels = { high: '高', mid: '中', low: '低' };
                return (
                  <div key={key} style={{
                    flex: '1 1 150px',
                    padding: '10px 12px',
                    background: '#F7FAFC',
                    borderRadius: 8,
                    border: `1.5px solid ${levelColors[dim.level] ?? '#CBD5E0'}40`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{
                        background: levelColors[dim.level] ?? '#CBD5E0',
                        color: '#fff', borderRadius: 4,
                        padding: '1px 6px', fontSize: 10, fontWeight: 700,
                      }}>
                        {key}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#2D3748' }}>
                        {meta.label}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: levelColors[dim.level] ?? '#CBD5E0',
                      }}>
                        {levelLabels[dim.level] ?? '-'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#718096', lineHeight: 1.6 }}>
                      {dim.evidence}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 기질 행동닻 해석 */}
        {tciAnchors && (
          <div style={{
            padding: '12px 14px', background: '#F0EBF8',
            borderRadius: 8, borderLeft: '3px solid #7B5EA7',
            fontSize: 13, color: '#4A5568', lineHeight: 1.75,
          }}>
            <strong style={{ color: '#7B5EA7' }}>🧬 기질 행동닻 해석:</strong>{' '}
            {tciAnchors}
          </div>
        )}
      </div>
    </div>
  );
}
