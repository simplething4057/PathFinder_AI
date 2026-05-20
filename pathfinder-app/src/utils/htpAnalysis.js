/**
 * htpAnalysis.js — HTP × Big5 × TCI 통합 임상 분석 파이프라인
 *
 * 분석 소스 (5채널):
 *  A. 드로잉 이미지 (4장: house / tree / person_same / person_opposite)
 *  B. 드로잉 과정 지표 (stroke log — NS/HA/P 기질 추론)
 *  C. 사전 SCT 8문항 + TCI 행동닻 4문항
 *  D. 드로잉별 PDI 인터뷰 (Big5 앵커 3문항 × 4드로잉 + 전반 3문항)
 *  E. 수검자 인구통계 (나이, 성별, 직업, 가족관계)
 */

import { SCT_STEMS, SCT_SUFFIXES, SCT_KEYS } from '../components/PostDrawingScreen';
import { PRE_SCT_ITEMS, TCI_ANCHOR_ITEMS }   from '../components/PreSCTScreen';
import { STAGE_LABELS_KO }                   from '../constants/stages';

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
  if (firstStrokeDelay > 5000) hints.push('첫획 5초↑ — 시작 망설임·HA상');
  if (strokesPerMin > 20)      hints.push('획속도 빠름 — 충동성·NS상');
  if (strokesPerMin < 4)       hints.push('획속도 느림 — 신중함·HA상 또는 우울');
  if (longPauses > 3)          hints.push(`긴멈춤 ${longPauses}회 — 불안·갈등·HA상`);
  if (avgStrokeLen < 5)        hints.push('짧은 획 반복 — 불안·강박·HA상');
  if (avgStrokeLen > 50)       hints.push('길고 연속적인 획 — 자신감·NS중상');
  if (pressureVariance > 0.05) hints.push('필압 변동 큼 — 감정 기복·N상');

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
   2. 시스템 프롬프트 — HTP × Big5 × TCI 통합
   ═══════════════════════════════════════════════════════════ */
const CLINICAL_SYSTEM_PROMPT = `당신은 HTP(House-Tree-Person) 전문 임상심리사이며 Big5 성격이론과 기질·성격 모델 전문가입니다.
Buck & Hammer HTP 해석 체계와 Big5 × 기질 연구를 통합하여 분석합니다.
투사적 검사의 한계를 인식하고 단정이 아닌 가설적·탐색적 언어로 기술합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ Big5 × 기질 통합 해석 프레임워크
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【기질 4차원(NS·HA·RD·P) → Big5 매핑 및 HTP 지표】

NS(새로움 추구) → Big5 E+O:
  HTP 지표: 획 속도 빠름, 구도 이탈, 과도한 장식, 충동적 선 질감
  PDI 지표: 접근 동기(즐기는 것) 표현, 외향적 활동 언급

HA(위험 회피) → Big5 N:
  HTP 지표: 첫획 지연 길다, 긴 멈춤 多, 울타리·담장, 작은 크기, 지우개 흔적
  PDI 지표: 두려움·걱정 언급, 어려운 것 회피적 표현

RD(보상 의존) → Big5 A:
  HTP 지표: 창문 多, 따뜻한 이성상 감정 톤, 열린 문
  PDI 지표: 관계 언어 풍부, 이성상과의 따뜻한 관계 기술

P(인내) → Big5 C:
  HTP 지표: 완성도 높음, 총 획수 多, 소요시간 길다, 세부 묘사 풍부
  PDI 지표: 나무 나이 많음, 끈기·지속 표현

【성격차원 → PDI 언어 분석】
SD(자기주도성) → 동성인 강점 답변, 자기효능감 언어
C(협동성)      → 이성상 관계 기술, 집 거주자 표현
ST(자기초월)   → 나무 주변 환경의 상징적·영적 표현

【Big5 점수화 원칙 (0~100)】
3채널 가중 평균:
  드로잉 이미지 상징 40% + 드로잉 과정 지표 35% + PDI/SCT 언어 25%
각 차원 점수 산정 후 반드시 HTP 상징 1개 이상을 근거로 제시

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ HTP 상징 해석 체계
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【집(House) — A·C 핵심】
지붕: 정신 활동·공상 / 벽: 자아 강도
문: 외부 접촉(개방=A상) / 창문: 환경 소통·경계심(창문 多=RD상)
굴뚝: 심리적 온기 / 울타리: 방어(HA상) / 크기·위치: 자아상

【나무(Tree) — O·P 핵심】
줄기: 자아 강도·기본 성격 / 수관: 환경 상호작용(풍성=O상)
가지 뻗음: 외향적 접근(=E상) / 뿌리: 현실 접촉(=P/안정)
상처·옹이: 심리적 외상(=HA상) / 열매·꽃: 성취 욕구

【사람(동성·이성) — E·N·A 핵심】
표정·자세: 정서 톤(N/E) / 눈: 세상 인식
목: 충동 통제 / 팔·손: 환경 상호작용(E)
다리·발: 현실 접촉(C/P)
동성(person_same): 현실적 자기상·정체성 / NS·E·HA·N
이성(person_opposite): 이성 표상·아니마/무스 / RD·A·C

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 개별 기질·성격 프로파일 작성 원칙
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

기질 4차원(NS·HA·RD·P)과 Big5 5차원을 교차하여 수검자 고유의 기질·성격 서사를 작성합니다.
고정 유형 레이블(예: 탐험가, 수호자)을 사용하지 않습니다.
실제 측정값의 조합이 만들어내는 이 사람만의 특성을 직접 서술합니다.

【기질(NS·HA·RD·P) 수준별 특성 참조】
NS 상: 자극 추구, 변화 선호, 충동성 / NS 하: 질서·루틴 선호, 신중, 안정 지향
HA 상: 위험 민감, 걱정·신중, 감정 반응성 상 / HA 하: 낙관적, 담대, 스트레스 내성
RD 상: 관계 민감, 따뜻함, 인정 욕구 / RD 하: 독립적, 실용적, 사회적 거리감
P  상: 끈기·완수 지향, 인내 / P  하: 유연, 상황 적응적, 시작 多·완수 少

【기질 조합 패턴 (서사 작성 참고)】
NS상×HA상: 민감하고 탐색적 — 불안과 호기심이 공존, 새로움을 원하지만 위험에 민감
NS상×HA하: 대담하고 에너지 넘치는 탐색, 충동적 행동 경향
NS하×HA상: 신중하고 안전 지향적, 변화보다 예측 가능한 환경 선호
NS하×HA하: 안정적이고 여유로운, 루틴 속에서 효율 발휘
RD상×P상:  따뜻하고 헌신적인 완수 지향, 관계와 목표 모두 중시
RD상×P하:  관계 지향적이나 지속성 어려움, 공감 풍부하지만 산만
RD하×P상:  독립적이고 목표 지향적, 성과 중심 실용주의
RD하×P하:  실용적이고 탐색적, 관계·완수보다 자유 추구

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ RAG 근거 인용 원칙
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
각 keyIndicator의 evidences[]에 반드시 하나 이상 인용:
• visual  : 이미지 직접 관찰 (구체적 시각 요소 명시)
• process : 드로잉 과정 지표 (획/분, 멈춤, 필압 등 수치 포함)
• sct     : SCT/PDI 완성 문장 (따옴표로 인용)
• demo    : 인구통계 맥락

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 출력 JSON 스키마 (엄수)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON만 반환. 설명·머리말 불가. keyIndicators: 그림당 최대 3개.
evidences: 지표당 최대 2개. 모든 문자열 1~2문장.

{
  "summary": "전반 임상 인상 2~3문장",
  "psychologicalTone": "한 줄 톤 요약",
  "demographicContext": "인구통계 맥락이 해석에 미치는 영향 (1문장)",
  "preSctInsights": "사전 SCT에서 드러난 현재 심리 상태 (1~2문장)",
  "tciAnchors": "기질 행동닻 4문항이 시사하는 기질 패턴 (1~2문장)",
  "drawings": {
    "house": {
      "keyIndicators": [
        {
          "element": "요소명",
          "finding": "관찰 내용 (1문장)",
          "evidences": [{ "type": "visual|process|sct|demo", "text": "근거 (1문장)" }],
          "interpretation": "임상 의미 — Big5/기질 차원 연결 포함 (1문장)"
        }
      ],
      "processInsights": "획 과정 해석 + 기질 시사점 (1문장)",
      "interpretation": "종합 해석 (1~2문장)"
    },
    "tree":            { "keyIndicators":[], "processInsights":"", "interpretation":"" },
    "person_same":     { "keyIndicators":[], "processInsights":"", "interpretation":"" },
    "person_opposite": {
      "keyIndicators":[], "processInsights":"", "interpretation":"",
      "comparedToSame": "동성 인물상과의 비교 — RD·A 차원 중심 (1~2문장)"
    }
  },
  "sctInsights": "PDI 답변 전반의 심리 주제 (1~2문장)",
  "crossDrawingThemes": ["주제1 (5단어 이내)", "주제2", "주제3"],
  "big5Profile": {
    "O": { "score": 0, "label": "개방성", "keySymbol": "HTP 근거 상징 (1어구)", "interpretation": "1문장" },
    "C": { "score": 0, "label": "성실성", "keySymbol": "HTP 근거 상징", "interpretation": "1문장" },
    "E": { "score": 0, "label": "외향성", "keySymbol": "HTP 근거 상징", "interpretation": "1문장" },
    "A": { "score": 0, "label": "친화성", "keySymbol": "HTP 근거 상징", "interpretation": "1문장" },
    "N": { "score": 0, "label": "신경성", "keySymbol": "HTP 근거 상징", "interpretation": "1문장" }
  },
  "tciProfile": {
    "NS": { "level": "high|mid|low", "evidence": "근거 1문장" },
    "HA": { "level": "high|mid|low", "evidence": "근거 1문장" },
    "RD": { "level": "high|mid|low", "evidence": "근거 1문장" },
    "P":  { "level": "high|mid|low", "evidence": "근거 1문장" }
  },
  "characterProfile": {
    "temperamentNarrative": "TCI NS/HA/RD/P 실제 수준 조합 기반 기질 서사 — 이 사람의 고유한 행동·반응 방식 중심 (2~3문장)",
    "personalityNarrative": "Big5 5차원 프로파일이 드러내는 성격 특성 서사 — 대인관계·동기·스트레스 반응 중심 (2~3문장)",
    "coreTheme": "기질×성격 교차에서 드러나는 핵심 심리 주제 — HTP 상징 연결 포함 (1문장)",
    "strengths": ["이 사람 고유의 강점1", "강점2", "강점3"],
    "growthEdge": "기질·성격 패턴에서 시사되는 성장 과제 (1문장)"
  },
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

  /* ── C-1. 사전 SCT ── */
  const preSctText = PRE_SCT_ITEMS
    .filter(item => preSctAnswers?.[item.id]?.trim())
    .map(item => {
      const ans = preSctAnswers[item.id].trim();
      return `  • [${item.clinicalKey}] "${item.stem} ${ans} ${item.suffix}"`;
    }).join('\n') || '  (없음)';

  /* ── C-2. 기질 행동닻 (기질 추론 핵심 소스) ── */
  const tciText = TCI_ANCHOR_ITEMS
    .filter(item => preSctAnswers?.[item.id]?.trim())
    .map(item => {
      const ans = preSctAnswers[item.id].trim();
      return `  • [${item.clinicalKey}] "${item.stem} ${ans} ${item.suffix}"`;
    }).join('\n') || '  (없음)';

  /* ── D. PDI 인터뷰 답변 ── */
  const pdiText = Object.entries(pdiAnswers ?? {})
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
      return ans ? `  • [${stageKey} AI심층${i + 1}] ${q.text}: "${ans}"` : null;
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
  TCI힌트: ${m.clinicalHints.length > 0 ? m.clinicalHints.join(' / ') : '특이사항 없음'}`;
  }).join('\n\n');

  return `아래 5채널 데이터를 종합하여 HTP × Big5 × 기질 통합 분석을 수행하세요.
Big5 점수(0~100)는 드로잉 이미지 40% + 과정 지표 35% + PDI/SCT 언어 25% 가중치로 산정하세요.
각 해석에 evidences[] 근거를 명시하고, JSON 형식만 반환하세요.

━━ [소스 E] 수검자 인구통계 ━━
${demoText}

━━ [소스 C-1] 사전 문장완성검사 — 현재 상태 ━━
${preSctText}

━━ [소스 C-2] 기질 행동닻 — 기질 추론 핵심 ━━
${tciText}

━━ [소스 B] 드로잉 과정 지표 (기질 지표 포함) ━━
${stageMetrics}

━━ [소스 D] PDI 드로잉 인터뷰 (Big5 앵커 질문) ━━
${pdiText}

━━ [소스 D-AI] AI 심층 질문 답변 ━━
${aiText}`;
}

/* ═══════════════════════════════════════════════════════════
   4. 메인 분석 함수
   ═══════════════════════════════════════════════════════════ */
export async function generateHTPAnalysis(sessionData) {
  const token = localStorage.getItem('pf_token');
  if (!token) throw new Error('로그인이 필요합니다.');

  const { stages } = sessionData;

  /* ── 이미지 블록 ── */
  const imageBlocks = stages.flatMap(s => {
    const match     = s.imageData.match(/^data:(image\/\w+);base64,(.+)/);
    const mediaType = match?.[1] ?? 'image/png';
    const base64    = match?.[2] ?? s.imageData;
    const label     = STAGE_LABELS_KO[s.stageKey] ?? s.stageKey;
    return [
      { type: 'text',  text: `▼ [소스 A — ${label} 드로잉 이미지]` },
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
    ];
  });

  const payload = {
    model:      'claude-sonnet-4-6',
    max_tokens: 8000,
    system:     CLINICAL_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: [
        ...imageBlocks,
        { type: 'text', text: buildUserPrompt(sessionData) },
      ],
    }],
  };

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

  // SSE 스트림 파싱 — text_delta 이벤트에서 텍스트 조각을 모아 전체 응답 조립
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let raw        = '';
  let stopReason = null;
  let buffer     = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop(); // 마지막 미완성 줄은 다음 청크로

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const evt = JSON.parse(jsonStr);
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          raw += evt.delta.text;
        }
        if (evt.type === 'message_delta' && evt.delta?.stop_reason) {
          stopReason = evt.delta.stop_reason;
        }
      } catch { /* 파싱 불가 줄 무시 */ }
    }
  }

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
