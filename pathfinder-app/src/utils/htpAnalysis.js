/**
 * htpAnalysis.js — HTP 임상 분석 파이프라인 (복합 분석 버전)
 *
 * ※ 보안: Claude API 호출은 백엔드 /api/analyze 를 통해 서버 사이드에서 수행됩니다.
 *    API 키는 서버 환경변수에만 존재하며 브라우저에 노출되지 않습니다.
 *
 * 분석 소스:
 *  A. 드로잉 이미지 (4장: house / tree / person_same / person_opposite)
 *  B. 드로잉 과정 지표 (stroke log)
 *  C. 사전 SCT (검사 전 상태·자기정보)
 *  D. 사후 SCT (PostDrawingScreen)
 *  E. 수검자 인구통계 (나이, 성별, 직업, 가족관계)
 */

import { SCT_STEMS, SCT_SUFFIXES, SCT_KEYS } from '../components/PostDrawingScreen';
import { PRE_SCT_ITEMS } from '../components/PreSCTScreen';
import { STAGE_LABELS_KO } from '../constants/stages';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/* ═══════════════════════════════════════════════════════════
   1. STROKE LOG 임상 지표 추출
   ═══════════════════════════════════════════════════════════ */
export function summarizeStrokeLog(strokeLog) {
  const strokes = strokeLog.strokes ?? [];
  if (strokes.length === 0) return { error: '획 데이터 없음' };

  const allPoints  = strokes.flatMap(s => s.points ?? []);
  const totalMs    = strokeLog.durationMs ?? 0;
  const totalSec   = totalMs / 1000;

  const strokeLengths = strokes.map(s => (s.points ?? []).length);
  const avgStrokeLen  = strokeLengths.reduce((a, b) => a + b, 0) / (strokes.length || 1);

  const pauses = [];
  for (let i = 1; i < strokes.length; i++) {
    const prevEnd   = strokes[i - 1].points?.at(-1)?.t ?? 0;
    const nextStart = strokes[i].points?.[0]?.t ?? 0;
    const gap = nextStart - prevEnd;
    if (gap > 0) pauses.push(gap);
  }
  const longPauses       = pauses.filter(p => p > 3000).length;
  const avgPauseMs       = pauses.length ? pauses.reduce((a, b) => a + b, 0) / pauses.length : 0;
  const firstStrokeDelay = strokes[0]?.points?.[0]?.t ?? 0;

  const pressures        = allPoints.map(p => p.p ?? 0.5).filter(p => p > 0);
  const avgPressure      = pressures.reduce((a, b) => a + b, 0) / (pressures.length || 1);
  const pressureVariance = pressures.length
    ? pressures.reduce((s, p) => s + Math.pow(p - avgPressure, 2), 0) / pressures.length : 0;
  const strokesPerMin    = totalSec > 0 ? (strokes.length / totalSec) * 60 : 0;

  const hints = [];
  if (firstStrokeDelay > 5000) hints.push('첫 획까지 5초↑ — 시작 망설임·주제 불안');
  if (strokesPerMin > 20)      hints.push('획속도 빠름(20획/분↑) — 충동성·에너지 높음');
  if (strokesPerMin < 4)       hints.push('획속도 느림(4획/분↓) — 신중함·억제·우울');
  if (longPauses > 3)          hints.push(`긴멈춤 ${longPauses}회(3초↑) — 불안·갈등·재고 경향`);
  if (avgStrokeLen < 5)        hints.push('짧은 획 반복 — 불안·강박적 통제');
  if (avgStrokeLen > 50)       hints.push('길고 연속적인 획 — 자신감·유연성');
  if (pressureVariance > 0.05) hints.push('필압 변동 큼 — 감정 기복·주제별 감정 반응차');

  return {
    totalStrokes: strokes.length,
    durationSec: Math.round(totalSec),
    strokesPerMin: Math.round(strokesPerMin * 10) / 10,
    avgStrokeLength: Math.round(avgStrokeLen),
    firstStrokeDelayMs: firstStrokeDelay,
    longPausesCount: longPauses,
    avgPauseMs: Math.round(avgPauseMs),
    avgPressure: Math.round(avgPressure * 100) / 100,
    pressureVariance: Math.round(pressureVariance * 1000) / 1000,
    clinicalHints: hints,
  };
}

/* ═══════════════════════════════════════════════════════════
   2. 시스템 프롬프트
   ═══════════════════════════════════════════════════════════ */
const CLINICAL_SYSTEM_PROMPT = `당신은 HTP(House-Tree-Person) 검사 전문 임상심리사입니다.
John Buck과 Emanuel Hammer의 HTP 해석 체계를 기반으로 분석하며,
투사적 검사의 한계를 인식하고 단정이 아닌 가설적·탐색적 언어로 기술합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ RAG(근거 인용) 원칙
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
각 keyIndicator의 해석은 반드시 아래 중 하나 이상을 evidences[]에 인용하세요:
• visual  : 이미지에서 직접 관찰된 시각적 특징
• process : 드로잉 과정 지표 (획/분, 멈춤, 필압 등)
• sct     : 사전/사후 SCT 완성 문장 (따옴표 사용)
• demo    : 수검자 인구통계 맥락 (나이, 성별, 직업 등)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ HTP 임상 해석 프레임워크
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【집(House)】
지붕: 정신 활동·공상 / 벽: 자아 강도 / 문: 외부 접촉
창문: 환경 소통·경계심 / 굴뚝: 심리적 온기
크기·위치: 자아상 (하단→억압, 중앙→안정)

【나무(Tree)】
줄기: 자아 강도·기본 성격 / 수관: 환경 상호작용
가지: 환경 만족 추구·좌절 / 뿌리: 현실 접촉·안정성
상처·옹이: 심리적 외상 / 열매·꽃: 성취 욕구

【사람(Person) — 동성·이성 비교 필수】
머리/두부: 지적 기능·공상 / 얼굴·표정: 대인관계 태도
눈: 세상 인식·의심 / 입: 언어적 의존성·공격성
목: 충동 통제 / 팔·손: 환경 상호작용
다리·발: 현실 접촉·지지기반
동성 인물상(person_same): 현실적 자기상·정체성
이성 인물상(person_opposite): 이성·대인관계 표상, 아니마/아니무스

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 인구통계 맥락 적용 지침
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 나이·발달 단계에 따른 규준 고려 (청소년/성인/중장년 해석 차별화)
• 성별에 따른 인물상 투사 방향성 해석
• 직업·가족관계는 스트레스원·자원 맥락으로 활용

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 출력 규칙 (토큰 절약 필수)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• keyIndicators: 그림당 최대 3개
• evidences: 지표당 최대 2개, 각 text 한 문장 이내
• 모든 문자열 필드: 1~2문장으로 간결하게
• JSON만 반환 — 설명·머리말 불가

{
  "summary": "전반 임상 인상 2~3문장",
  "psychologicalTone": "한 줄 톤 요약",
  "demographicContext": "인구통계 맥락이 해석에 미치는 영향 (1문장)",
  "preSctInsights": "사전 SCT에서 드러난 현재 심리 상태 (1~2문장)",
  "drawings": {
    "house": {
      "keyIndicators": [
        {
          "element": "요소명",
          "finding": "관찰 내용 (1문장)",
          "evidences": [{ "type": "visual|process|sct|demo", "text": "근거 (1문장)" }],
          "interpretation": "임상 의미 (1문장)"
        }
      ],
      "processInsights": "획 과정 해석 (1문장)",
      "interpretation": "종합 해석 (1~2문장)"
    },
    "tree":            { "keyIndicators":[], "processInsights":"", "interpretation":"" },
    "person_same":     { "keyIndicators":[], "processInsights":"", "interpretation":"" },
    "person_opposite": {
      "keyIndicators":[], "processInsights":"", "interpretation":"",
      "comparedToSame": "동성 인물상과의 비교 해석 (1~2문장)"
    }
  },
  "sctInsights": "사후 SCT 답변 심리 주제 (1~2문장)",
  "crossDrawingThemes": ["주제1 (5단어 이내)", "주제2", "주제3"],
  "strengthsAndResources": "강점 요약 (1~2문장)",
  "areasOfExploration": "탐색 권장 영역 (1~2문장)",
  "disclaimer": "본 분석은 임상 진단이 아닌 참고용 정보입니다. 정확한 진단은 전문 임상심리사를 통해 받으시기 바랍니다."
}`;

/* ═══════════════════════════════════════════════════════════
   3. 분석 페이로드 조립
   ═══════════════════════════════════════════════════════════ */
function buildUserPrompt(sessionData) {
  const { stages, pdiAnswers, aiState, preSctAnswers, userProfile } = sessionData;

  /* ── E. 인구통계 ── */
  const demo = userProfile ?? {};
  const demoText = [
    demo.age        ? `나이: ${demo.age}세` : null,
    demo.gender     ? `성별: ${demo.gender}성` : null,
    demo.occupation ? `직업: ${demo.occupation}` : null,
    demo.family_info ? `가족관계: ${demo.family_info}` : null,
  ].filter(Boolean).join(' | ') || '(제공 없음)';

  /* ── C. 사전 SCT ── */
  const preSctText = PRE_SCT_ITEMS
    .filter(item => preSctAnswers?.[item.id]?.trim())
    .map(item => {
      const ans = preSctAnswers[item.id].trim();
      return `  • [${item.clinicalKey}] "${item.stem} ${ans} ${item.suffix}"`;
    }).join('\n') || '  (없음)';

  /* ── D. 사후 SCT ── */
  const sctText = Object.entries(pdiAnswers ?? {})
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => {
      const stem        = SCT_STEMS[k]   ?? k;
      const suffix      = SCT_SUFFIXES[k] ?? '';
      const clinicalKey = SCT_KEYS[k]    ?? '';
      return `  • [${clinicalKey}] "${stem} ${v.trim()} ${suffix}"`;
    }).join('\n') || '  (없음)';

  /* ── AI 추가 질문 답변 ── */
  const aiText = Object.entries(aiState ?? {}).flatMap(([stageKey, st]) =>
    (st.questions ?? []).map((q, i) => {
      const ans = st.aiAnswers?.[q.id]?.trim();
      return ans ? `  • [${stageKey} AI추가${i + 1}] ${q.text}: "${ans}"` : null;
    }).filter(Boolean)
  ).join('\n') || '  (없음)';

  /* ── B. 드로잉 과정 지표 ── */
  const stageMetrics = stages.map(s => {
    const m     = summarizeStrokeLog(s.strokeLog ?? {});
    const label = STAGE_LABELS_KO[s.stageKey] ?? s.stageKey;
    if (m.error) return `[${label}] 획 데이터 없음`;
    return `[${label}]
  총획수: ${m.totalStrokes}획 | 소요: ${m.durationSec}초 | 획/분: ${m.strokesPerMin}
  평균획길이: ${m.avgStrokeLength}pt | 첫획지연: ${Math.round(m.firstStrokeDelayMs / 1000)}초
  긴멈춤(3초↑): ${m.longPausesCount}회 | 평균필압: ${m.avgPressure}
  임상힌트: ${m.clinicalHints.length > 0 ? m.clinicalHints.join(' / ') : '특이사항 없음'}`;
  }).join('\n\n');

  return `아래 5가지 데이터 소스를 종합하여 HTP 임상 분석을 수행하세요.
각 해석에는 반드시 evidences[]에 근거 소스(visual/process/sct/demo)를 명시하세요.
JSON 형식만 반환하고 다른 텍스트는 포함하지 마세요.

━━ [소스 E] 수검자 인구통계 ━━
${demoText}

━━ [소스 C] 사전 문장완성검사 — 검사 전 상태 ━━
${preSctText}

━━ [소스 B] 드로잉 과정 지표 ━━
${stageMetrics}

━━ [소스 D] 사후 문장완성검사 ━━
${sctText}

━━ [소스 D-AI] AI 추가 질문 ━━
${aiText}`;
}

/* ═══════════════════════════════════════════════════════════
   4. 메인 분석 함수 — 백엔드 프록시 경유
   ═══════════════════════════════════════════════════════════ */
export async function generateHTPAnalysis(sessionData) {
  const token = localStorage.getItem('pf_token');
  if (!token) throw new Error('로그인이 필요합니다.');

  const { stages } = sessionData;

  /* ── 이미지 멀티파트 블록 ── */
  const imageBlocks = stages.flatMap(s => {
    const base64 = s.imageData.replace(/^data:image\/\w+;base64,/, '');
    const label  = STAGE_LABELS_KO[s.stageKey] ?? s.stageKey;
    return [
      { type: 'text',  text: `▼ [소스 A 이미지 — ${label}]` },
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64 } },
    ];
  });

  const payload = {
    model:      'claude-sonnet-4-6',
    max_tokens: 8192,
    system:     CLINICAL_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: [
        ...imageBlocks,
        { type: 'text', text: buildUserPrompt(sessionData) },
      ],
    }],
  };

  /* ── 백엔드 /api/analyze 호출 ── */
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `분석 API 오류 ${res.status}`);
  }

  const data       = await res.json();
  const raw        = data.content?.[0]?.text ?? '';
  const stopReason = data.stop_reason;

  if (stopReason === 'max_tokens') {
    throw new Error('분석 응답이 너무 길어 잘렸습니다. 다시 시도해 주세요.');
  }

  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const match   = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error('[HTP] 파싱 실패 — raw:', raw.slice(0, 300));
    throw new Error('분석 응답 형식을 인식할 수 없습니다. 다시 시도해 주세요.');
  }

  try {
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('[HTP] JSON.parse 실패:', e.message);
    throw new Error('분석 결과 파싱 오류. 다시 시도해 주세요.');
  }
}
