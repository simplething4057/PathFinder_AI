import { useState, useCallback } from 'react';
import { generateFollowUpQuestions } from '../utils/aiFollowUp';

/* ════════════════════════════════════════════════════════════
   Big5 앵커 PDI 문항 정의 (드로잉별 3문항)

   clinicalKey 뒤 [차원] 표기:
     O=개방성, C=성실성, E=외향성, A=친화성, N=신경성
     TCI: NS=새로움추구, HA=위험회피, RD=보상의존, P=인내, SD=자기주도성
   ════════════════════════════════════════════════════════════ */
const STAGE_CONFIG = [
  {
    stageKey: 'house',
    emoji: '🏠',
    label: '집',
    color: '#2E75B6',
    bgColor: '#EBF4FF',
    big5Focus: 'A · C',
    basicQuestions: [
      {
        id: 'h1',
        stem: '이 집에 사는 사람은',
        suffix: '인/한 사람일 것 같다.',
        hint: '따뜻하거나, 조용하거나, 바쁘거나…',
        clinicalKey: '관계질 [A]',
      },
      {
        id: 'h2',
        stem: '이 집에서 가장 중요한 공간은',
        suffix: '이다.',
        hint: '거실, 서재, 마당, 부엌…',
        clinicalKey: '구조 선호 [C]',
      },
      {
        id: 'h3',
        stem: '지금 이 집 안에서는',
        suffix: '이/가 일어나고 있다.',
        hint: '평온함, 분주함, 갈등, 고요함…',
        clinicalKey: '정서 환경 [N]',
      },
    ],
  },
  {
    stageKey: 'tree',
    emoji: '🌳',
    label: '나무',
    color: '#38A169',
    bgColor: '#E6F4EC',
    big5Focus: 'O · P',
    basicQuestions: [
      {
        id: 't1',
        stem: '이 나무의 나이는 약',
        suffix: '살이다.',
        hint: '숫자나 느낌으로…',
        clinicalKey: '시간관 [P]',
      },
      {
        id: 't2',
        stem: '이 나무에게 가장 어려운 것은',
        suffix: '이다.',
        hint: '가뭄, 고독, 폭풍, 사람들…',
        clinicalKey: '스트레스 반응 [HA]',
      },
      {
        id: 't3',
        stem: '이 나무 주변에는',
        suffix: '이/가 있다.',
        hint: '다른 나무, 새, 사람, 바람…',
        clinicalKey: '환경 개방성 [O]',
      },
    ],
  },
  {
    stageKey: 'person_same',
    emoji: '🧑',
    label: '사람 (동성)',
    color: '#7B5EA7',
    bgColor: '#F0EBF8',
    big5Focus: 'E · N',
    basicQuestions: [
      {
        id: 'ps1',
        stem: '이 사람의 마음속에는 지금',
        suffix: '이/가 있다.',
        hint: '걱정, 기대, 외로움, 설렘…',
        clinicalKey: '내면 언어 [N]',
      },
      {
        id: 'ps2',
        stem: '이 사람의 가장 큰 강점은',
        suffix: '이다.',
        hint: '끈기, 공감, 창의성, 리더십…',
        clinicalKey: '자기효능감 [SD]',
      },
      {
        id: 'ps3',
        stem: '이 사람이 가장 즐기는 것은',
        suffix: '이다.',
        hint: '혼자만의 시간, 새로운 경험, 사람들과 어울리기…',
        clinicalKey: '접근 동기 [E/NS]',
      },
    ],
  },
  {
    stageKey: 'person_opposite',
    emoji: '🧑‍🤝‍🧑',
    label: '사람 (이성)',
    color: '#C05621',
    bgColor: '#FEF3E8',
    big5Focus: 'A · RD',
    basicQuestions: [
      {
        id: 'po1',
        stem: '이 사람과 앞의 사람(동성)은',
        suffix: '한/인 관계이다.',
        hint: '친구, 낯선 사람, 연인, 경쟁자…',
        clinicalKey: '관계 패턴 [A]',
      },
      {
        id: 'po2',
        stem: '이 두 사람이 만난다면 서로에게',
        suffix: '을/를 줄 것 같다.',
        hint: '힘, 위로, 자극, 갈등, 여유…',
        clinicalKey: '보상 의존 [RD]',
      },
      {
        id: 'po3',
        stem: '이 사람이 지금 느끼는 감정은',
        suffix: '이다.',
        hint: '기쁨, 불안, 외로움, 평온함…',
        clinicalKey: '감정 공명 [A]',
      },
    ],
  },
];

const GENERAL_QUESTIONS = [
  { id: 'g1', stem: '그림을 그리면서',             suffix: '을/를 느꼈다.',  hint: '감정, 생각, 신체 반응', clinicalKey: '과정 경험' },
  { id: 'g2', stem: '가장 마음에 걸리는 부분은',    suffix: '이다.',          hint: '그림의 특정 요소',     clinicalKey: '자기 인식' },
  { id: 'g3', stem: '이 네 그림을 보면 나는',       suffix: '것 같다.',       hint: '자기에 대한 인상',     clinicalKey: '자기 개념' },
];

/* ── 초기 answers 구조 ── */
function initAnswers() {
  const obj = {};
  STAGE_CONFIG.forEach(sc => sc.basicQuestions.forEach(q => { obj[q.id] = ''; }));
  GENERAL_QUESTIONS.forEach(q => { obj[q.id] = ''; });
  return obj;
}

/* ── SCT 스템 / 서픽스 / 키 맵 (htpAnalysis에서 참조) ── */
export const SCT_STEMS    = {};
export const SCT_SUFFIXES = {};
export const SCT_KEYS     = {};
[...STAGE_CONFIG.flatMap(c => c.basicQuestions), ...GENERAL_QUESTIONS].forEach(q => {
  SCT_STEMS[q.id]    = q.stem;
  SCT_SUFFIXES[q.id] = q.suffix;
  SCT_KEYS[q.id]     = q.clinicalKey;
});

/* ════════════════════════════════════════════════════════════
   메인 컴포넌트
   ════════════════════════════════════════════════════════════ */
export default function PostDrawingScreen({ sessionData, onComplete }) {
  const { stages } = sessionData;

  const [answers, setAnswers]     = useState(initAnswers);
  const [activeTab, setActiveTab] = useState(0);
  const [aiState, setAiState]     = useState({
    house:           { status: 'idle', questions: [], aiAnswers: {} },
    tree:            { status: 'idle', questions: [], aiAnswers: {} },
    person_same:     { status: 'idle', questions: [], aiAnswers: {} },
    person_opposite: { status: 'idle', questions: [], aiAnswers: {} },
  });

  const handleAnswer = (id, value) =>
    setAnswers(prev => ({ ...prev, [id]: value }));

  const handleAiAnswer = (stageKey, id, value) =>
    setAiState(prev => ({
      ...prev,
      [stageKey]: {
        ...prev[stageKey],
        aiAnswers: { ...prev[stageKey].aiAnswers, [id]: value },
      },
    }));

  /* ── AI 추가 질문 요청 ── */
  const requestAIQuestions = useCallback(async (stageKey) => {
    const config = STAGE_CONFIG.find(c => c.stageKey === stageKey);
    const stage  = stages.find(s => s.stageKey === stageKey);
    const basicAnswers = {};
    config.basicQuestions.forEach(q => { basicAnswers[q.id] = answers[q.id]; });

    setAiState(prev => ({ ...prev, [stageKey]: { ...prev[stageKey], status: 'loading' } }));

    const result = await generateFollowUpQuestions({
      stageKey,
      imageData: stage?.imageData ?? '',
      basicAnswers,
    });

    const aiQs = result.questions.map((text, i) => ({ id: `ai_${stageKey}_${i}`, text }));
    const initialAiAnswers = {};
    aiQs.forEach(q => { initialAiAnswers[q.id] = ''; });

    setAiState(prev => ({
      ...prev,
      [stageKey]: {
        status: result.isMock ? 'mock' : 'done',
        questions: aiQs,
        aiAnswers: initialAiAnswers,
      },
    }));
  }, [answers, stages]);

  const handleSubmit = () => onComplete({ answers, aiState });

  /* ── 진행률 ── */
  const totalBasic  = Object.keys(initAnswers()).length;
  const filledBasic = Object.values(answers).filter(v => v.trim()).length;
  const totalAi     = Object.values(aiState).reduce((s, st) => s + Object.keys(st.aiAnswers).length, 0);
  const filledAi    = Object.values(aiState).reduce((s, st) => s + Object.values(st.aiAnswers).filter(v => v?.trim()).length, 0);

  const tabs = [
    ...STAGE_CONFIG.map((c, i) => ({ label: `${c.emoji} ${c.label}`, index: i, stageKey: c.stageKey })),
    { label: '💬 전반', index: 4, stageKey: 'general' },
  ];

  return (
    <div className="card" style={{ maxWidth: 780 }}>
      <div className="card-header">
        <h1>✍️ 드로잉 인터뷰 (PDI)</h1>
        <p>
          각 그림을 바라보며 문장의 빈칸을 마음에 떠오르는 대로 완성해주세요.<br />
          정답이 없으며 짧은 단어나 구절로도 충분합니다.
        </p>
      </div>

      <div className="card-body">
        <ProgressBar filled={filledBasic + filledAi} total={totalBasic + totalAi} />

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap' }}>
          {tabs.map(tab => {
            const cfg   = STAGE_CONFIG[tab.index];
            const color = cfg?.color ?? '#718096';
            const active = activeTab === tab.index;
            return (
              <button
                key={tab.index}
                onClick={() => setActiveTab(tab.index)}
                style={{
                  padding: '7px 14px', borderRadius: 20,
                  border: `1.5px solid ${active ? color : '#CBD5E0'}`,
                  background: active ? color : '#fff',
                  color: active ? '#fff' : '#4A5568',
                  fontSize: 12, fontWeight: active ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab < 4
          ? <StagePanel
              config={STAGE_CONFIG[activeTab]}
              stage={stages.find(s => s.stageKey === STAGE_CONFIG[activeTab].stageKey)}
              answers={answers}
              onAnswer={handleAnswer}
              aiData={aiState[STAGE_CONFIG[activeTab].stageKey]}
              onRequestAI={() => requestAIQuestions(STAGE_CONFIG[activeTab].stageKey)}
              onAiAnswer={handleAiAnswer}
            />
          : <GeneralPanel
              questions={GENERAL_QUESTIONS}
              answers={answers}
              onAnswer={handleAnswer}
            />
        }

        {/* 하단 네비 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 28, paddingTop: 16, borderTop: '1px solid #E2E8F0',
        }}>
          <button className="btn-secondary"
            disabled={activeTab === 0}
            onClick={() => setActiveTab(p => p - 1)}>← 이전</button>

          {activeTab < tabs.length - 1
            ? <button className="btn-next" onClick={() => setActiveTab(p => p + 1)}>다음 →</button>
            : <button className="btn-next finish" onClick={handleSubmit}>✅ 인터뷰 완료</button>
          }
        </div>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button onClick={handleSubmit} style={{
            background: 'none', border: 'none',
            fontSize: 12, color: '#A0AEC0',
            cursor: 'pointer', textDecoration: 'underline',
          }}>
            전체 건너뛰고 완료하기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   StagePanel
   ════════════════════════════════════════════════════════════ */
function StagePanel({ config, stage, answers, onAnswer, aiData, onRequestAI, onAiAnswer }) {
  const { stageKey, emoji, label, color, bgColor, basicQuestions, big5Focus } = config;
  const hasAnyAnswer = basicQuestions.some(q => answers[q.id]?.trim());
  const aiStatus     = aiData.status;

  return (
    <div>
      {/* 그림 썸네일 + Big5 배지 */}
      {stage && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: bgColor, borderRadius: 10,
          padding: '12px 14px', marginBottom: 24,
          border: `1px solid ${color}33`,
        }}>
          <img
            src={stage.imageData} alt={label}
            style={{
              width: 120, height: 76, objectFit: 'contain',
              background: '#fff', border: '1px solid #CBD5E0',
              borderRadius: 6, flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 6 }}>
              {emoji} {label} 그림
            </div>
            <div style={{ fontSize: 12, color: '#718096', marginBottom: 6 }}>
              {stage.strokeLog?.totalStrokes ?? 0}획 · {Math.round((stage.strokeLog?.durationMs ?? 0) / 1000)}초
            </div>
            {/* Big5 포커스 배지 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: '#A0AEC0' }}>측정 차원</span>
              <span style={{
                background: color, color: '#fff',
                borderRadius: 10, padding: '2px 8px',
                fontSize: 11, fontWeight: 700,
              }}>
                Big5: {big5Focus}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PDI 라벨 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, fontWeight: 700, color: '#718096',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: 16,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
        드로잉 인터뷰 — {label} ({basicQuestions.length}문항)
      </div>

      {basicQuestions.map((q, i) => (
        <SCTRow
          key={q.id}
          index={i + 1}
          question={q}
          value={answers[q.id]}
          onChange={onAnswer}
          accentColor={color}
        />
      ))}

      {/* AI 추가 질문 */}
      <div style={{ marginTop: 28, borderTop: `2px dashed ${color}66`, paddingTop: 20 }}>
        {aiStatus === 'idle' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#718096', marginBottom: 14, lineHeight: 1.7 }}>
              AI가 답변을 분석해 맥락에 맞는 심층 질문을 드립니다.<br />
              {!hasAnyAnswer && (
                <span style={{ color: '#A0AEC0' }}>하나 이상의 문장을 완성하면 활성화됩니다.</span>
              )}
            </div>
            <button
              onClick={onRequestAI}
              disabled={!hasAnyAnswer}
              style={{
                padding: '10px 24px',
                background: hasAnyAnswer ? color : '#E2E8F0',
                color: hasAnyAnswer ? '#fff' : '#A0AEC0',
                border: 'none', borderRadius: 20,
                fontSize: 14, fontWeight: 700,
                cursor: hasAnyAnswer ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              ✨ AI 심층 질문 받기
            </button>
          </div>
        )}

        {aiStatus === 'loading' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>🤔</div>
            <div style={{ fontSize: 13, color: '#718096' }}>AI가 답변을 분석하는 중...</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: color, opacity: 0.3,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
          </div>
        )}

        {(aiStatus === 'done' || aiStatus === 'mock') && aiData.questions.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{
                background: color, color: '#fff',
                borderRadius: 20, padding: '4px 12px',
                fontSize: 12, fontWeight: 700,
              }}>
                {aiStatus === 'mock' ? '💬 AI 심층 질문 (데모)' : '✨ AI 심층 질문'}
              </div>
              {aiStatus === 'mock' && (
                <span style={{ fontSize: 11, color: '#A0AEC0' }}>
                  API 연결 시 맞춤형 질문이 생성됩니다
                </span>
              )}
            </div>
            {aiData.questions.map((q, i) => (
              <AIQuestionRow
                key={q.id}
                index={i + 1}
                question={q}
                value={aiData.aiAnswers[q.id] ?? ''}
                onChange={(id, v) => onAiAnswer(stageKey, id, v)}
                accentColor={color}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   GeneralPanel
   ════════════════════════════════════════════════════════════ */
function GeneralPanel({ questions, answers, onAnswer }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: '#718096', marginBottom: 20, lineHeight: 1.75 }}>
        네 장의 그림을 모두 완성한 지금, 전반적인 경험을 문장으로 완성해주세요.
      </p>
      {questions.map((q, i) => (
        <SCTRow
          key={q.id}
          index={i + 1}
          question={q}
          value={answers[q.id]}
          onChange={onAnswer}
          accentColor="#718096"
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SCTRow
   ════════════════════════════════════════════════════════════ */
function SCTRow({ index, question, value, onChange, accentColor }) {
  const { id, stem, suffix, hint, clinicalKey } = question;
  const filled = value?.trim().length > 0;

  return (
    <div style={{
      marginBottom: 16,
      padding: '14px 16px',
      borderRadius: 10,
      background: filled ? `${accentColor}08` : '#F7FAFC',
      border: `1.5px solid ${filled ? accentColor + '55' : '#E2E8F0'}`,
      transition: 'all 0.2s',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            background: filled ? accentColor : '#CBD5E0',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, transition: 'all 0.2s',
          }}>
            {index}
          </div>
          <span style={{ fontSize: 11, color: accentColor, fontWeight: 700, opacity: 0.8 }}>
            {clinicalKey}
          </span>
        </div>
        {filled && <span style={{ fontSize: 10, color: accentColor, fontWeight: 700 }}>✓</span>}
      </div>

      <div style={{
        display: 'flex', alignItems: 'baseline', flexWrap: 'wrap',
        gap: 4, marginBottom: 8,
        fontSize: 15, fontWeight: 500, color: '#1A202C', lineHeight: 1.6,
      }}>
        <span style={{ color: '#2D3748', whiteSpace: 'nowrap' }}>{stem}</span>
        <input
          value={value}
          onChange={e => onChange(id, e.target.value)}
          placeholder={hint}
          style={{
            flex: '1 1 140px', minWidth: 100,
            border: 'none',
            borderBottom: `2px solid ${filled ? accentColor : '#CBD5E0'}`,
            borderRadius: 0, padding: '2px 6px',
            fontSize: 15, fontWeight: 600, color: accentColor,
            background: 'transparent', outline: 'none',
            fontFamily: 'inherit', transition: 'border-color 0.15s',
            textAlign: 'center',
          }}
          onFocus={e => { e.target.style.borderColor = accentColor; }}
          onBlur={e => { e.target.style.borderColor = filled ? accentColor : '#CBD5E0'; }}
        />
        {suffix && <span style={{ color: '#2D3748', whiteSpace: 'nowrap' }}>{suffix}</span>}
      </div>

      {!filled && (
        <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 2, paddingLeft: 26 }}>
          예) {hint}
        </div>
      )}

      {filled && (
        <div style={{ fontSize: 12, color: '#718096', marginTop: 6, paddingLeft: 26, fontStyle: 'italic' }}>
          "{stem} <strong style={{ color: accentColor }}>{value}</strong> {suffix}"
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   AIQuestionRow
   ════════════════════════════════════════════════════════════ */
function AIQuestionRow({ index, question, value, onChange, accentColor }) {
  return (
    <div style={{
      marginBottom: 18,
      background: `${accentColor}08`,
      border: `1px solid ${accentColor}33`,
      borderRadius: 10, padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{
          background: accentColor, color: '#fff',
          borderRadius: 20, padding: '2px 10px',
          fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
        }}>
          AI {index}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#2D3748', lineHeight: 1.5 }}>
          {question.text}
        </div>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(question.id, e.target.value)}
        placeholder="자유롭게 입력하세요..."
        rows={2}
        style={{
          width: '100%', padding: '9px 12px', fontSize: 14, color: '#2D3748',
          border: `1px solid ${value?.trim() ? accentColor : '#CBD5E0'}`,
          borderRadius: 8, resize: 'vertical', outline: 'none',
          fontFamily: 'inherit', lineHeight: 1.65, transition: 'border-color 0.15s',
          background: '#fff', boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = accentColor; }}
        onBlur={e => { e.target.style.borderColor = value?.trim() ? accentColor : '#CBD5E0'; }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ProgressBar
   ════════════════════════════════════════════════════════════ */
function ProgressBar({ filled, total }) {
  const pct        = total > 0 ? Math.round((filled / total) * 100) : 0;
  const isComplete = filled === total && total > 0;
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 12, color: '#718096', marginBottom: 6,
      }}>
        <span>완성 진행률</span>
        <span style={{ color: isComplete ? '#38A169' : '#718096', fontWeight: isComplete ? 700 : 400 }}>
          {filled} / {total} 문장 {isComplete ? '✓' : ''}
        </span>
      </div>
      <div style={{ height: 6, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: isComplete ? '#38A169' : '#2E75B6',
          borderRadius: 99, transition: 'width 0.3s, background 0.3s',
        }} />
      </div>
    </div>
  );
}
