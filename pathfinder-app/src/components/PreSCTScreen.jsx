import { useState } from 'react';

/* ── 사전 SCT 문항 ── */
export const PRE_SCT_ITEMS = [
  { id: 'p1', stem: '오늘 나의 기분은',             suffix: '이다.',       clinicalKey: '현재 기분 상태' },
  { id: 'p2', stem: '요즘 나를 가장 힘들게 하는 것은', suffix: '이다.',       clinicalKey: '주된 스트레스원' },
  { id: 'p3', stem: '나는 스트레스를 받으면 주로',     suffix: '한다.',       clinicalKey: '스트레스 대처' },
  { id: 'p4', stem: '내가 가장 중요하게 여기는 것은',  suffix: '이다.',       clinicalKey: '핵심 가치' },
  { id: 'p5', stem: '지금 나에게 가장 필요한 것은',    suffix: '이다.',       clinicalKey: '현재 욕구' },
  { id: 'p6', stem: '나의 가장 큰 강점은',           suffix: '이다.',       clinicalKey: '자기 강점 인식' },
  { id: 'p7', stem: '내가 가장 두려워하는 것은',       suffix: '이다.',       clinicalKey: '핵심 두려움' },
  { id: 'p8', stem: '지금 이 순간 나는',             suffix: '하고 싶다.',  clinicalKey: '현재 욕동' },
];

/* ── TCI 기질 행동닻 문항 (NS / HA / RD / P) ──
   개방형 서술 → AI가 Big5 차원 추론에 활용
   유저에게는 "나 자신 탐색"으로 자연스럽게 제시 */
export const TCI_ANCHOR_ITEMS = [
  {
    id: 'tci_ns',
    stem: '새로운 상황이나 사람을 만나면 나는 주로',
    suffix: '하는 편이다.',
    hint: '바로 뛰어들거나, 천천히 살펴보거나, 설레거나…',
    clinicalKey: '새로움 추구 [NS]',
    tciDim: 'NS',
  },
  {
    id: 'tci_ha',
    stem: '중요한 결정을 앞두고 나는 보통',
    suffix: '하는 편이다.',
    hint: '신중하게 따져보거나, 직감을 따르거나, 걱정이 많아지거나…',
    clinicalKey: '위험 회피 [HA]',
    tciDim: 'HA',
  },
  {
    id: 'tci_rd',
    stem: '다른 사람의 인정이나 따뜻한 반응은 나에게',
    suffix: '.',
    hint: '매우 중요하거나, 어느 정도 필요하거나, 크게 신경 쓰지 않거나…',
    clinicalKey: '보상 의존 [RD]',
    tciDim: 'RD',
  },
  {
    id: 'tci_p',
    stem: '한번 시작한 일이 어려워지거나 지루해지면 나는',
    suffix: '하는 편이다.',
    hint: '끝까지 밀어붙이거나, 상황에 따라 유연하게 바꾸거나…',
    clinicalKey: '인내 [P]',
    tciDim: 'P',
  },
];

const ALL_ITEMS = [...PRE_SCT_ITEMS, ...TCI_ANCHOR_ITEMS];

export default function PreSCTScreen({ onComplete }) {
  const [answers, setAnswers] = useState(
    Object.fromEntries(ALL_ITEMS.map(i => [i.id, '']))
  );
  const [errors, setErrors] = useState({});

  const update = (id, val) => {
    setAnswers(p => ({ ...p, [id]: val }));
    if (val.trim()) setErrors(p => { const n = { ...p }; delete n[id]; return n; });
  };

  const handleSubmit = () => {
    const newErrors = {};
    ALL_ITEMS.forEach(item => {
      if (!answers[item.id]?.trim()) newErrors[item.id] = true;
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onComplete(answers);
  };

  const completedCount = ALL_ITEMS.filter(i => answers[i.id]?.trim()).length;
  const progressPct    = Math.round((completedCount / ALL_ITEMS.length) * 100);

  return (
    <div className="card" style={{ maxWidth: 620, width: '100%' }}>
      <div className="card-header">
        <h1>📝 검사 전 자기 탐색</h1>
        <p>
          검사 전 현재의 상태와 자신에 대해 솔직하게 적어주세요.<br />
          정답은 없으며, 떠오르는 대로 자유롭게 완성해주세요.
        </p>
      </div>

      <div className="card-body">
        {/* 진행률 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#718096', marginBottom: 6 }}>
            <span>진행률</span>
            <span>{completedCount} / {ALL_ITEMS.length}</span>
          </div>
          <div style={{ background: '#EDF2F7', borderRadius: 99, height: 6 }}>
            <div style={{
              background: '#2E75B6', borderRadius: 99, height: 6,
              width: `${progressPct}%`, transition: 'width 0.3s',
            }} />
          </div>
        </div>

        {/* ── 섹션 1: 현재 상태 SCT ── */}
        <SectionHeader
          label="현재 상태"
          description="지금 이 순간의 기분과 경험을 문장으로 완성해주세요."
          color="#2E75B6"
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          {PRE_SCT_ITEMS.map((item, idx) => (
            <StemRow
              key={item.id}
              index={idx + 1}
              item={item}
              value={answers[item.id]}
              error={errors[item.id]}
              onChange={update}
              accentColor="#2E75B6"
            />
          ))}
        </div>

        {/* ── 섹션 2: 기질 탐색 ── */}
        <SectionHeader
          label="나 자신 탐색"
          description="평소 자신의 성향을 떠올리며 자유롭게 완성해주세요."
          color="#7B5EA7"
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {TCI_ANCHOR_ITEMS.map((item, idx) => (
            <StemRow
              key={item.id}
              index={PRE_SCT_ITEMS.length + idx + 1}
              item={item}
              value={answers[item.id]}
              error={errors[item.id]}
              onChange={update}
              accentColor="#7B5EA7"
            />
          ))}
        </div>

        {/* 제출 */}
        <div style={{ marginTop: 32 }}>
          <button className="btn-primary" onClick={handleSubmit} style={{ fontSize: 15 }}>
            다음 — 검사 안내 보기 →
          </button>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#A0AEC0' }}>
            * 작성하신 내용은 분석 결과 해석에만 사용됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 섹션 헤더 ── */
function SectionHeader({ label, description, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      marginBottom: 16,
      paddingBottom: 10,
      borderBottom: `2px solid ${color}33`,
    }}>
      <div style={{
        background: color, color: '#fff',
        borderRadius: 6, padding: '3px 10px',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: '#718096' }}>{description}</div>
    </div>
  );
}

/* ── 문항 행 ── */
function StemRow({ index, item, value, error, onChange, accentColor }) {
  const filled = value?.trim().length > 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        {/* 번호 */}
        <span style={{
          minWidth: 22, height: 22, borderRadius: '50%',
          background: filled ? accentColor : '#EDF2F7',
          color: filled ? '#fff' : '#A0AEC0',
          fontSize: 11, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all 0.2s',
        }}>
          {index}
        </span>

        {/* 스템 */}
        <span style={{ fontSize: 15, color: '#2D3748', fontWeight: 500 }}>
          {item.stem}
        </span>

        {/* 입력 */}
        <input
          type="text"
          value={value}
          onChange={e => onChange(item.id, e.target.value)}
          placeholder={item.hint ?? '여기에 입력'}
          style={{
            flex: '1 1 160px', minWidth: 120,
            padding: '5px 10px',
            border: `1px solid ${error ? '#FC8181' : '#CBD5E0'}`,
            borderBottom: `2px solid ${error ? '#FC8181' : filled ? accentColor : '#CBD5E0'}`,
            borderRadius: '4px 4px 0 0',
            background: '#FAFAFA',
            fontSize: 14, outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderBottomColor = accentColor; }}
          onBlur={e => { e.target.style.borderBottomColor = filled ? accentColor : '#CBD5E0'; }}
        />

        {/* 접미사 */}
        <span style={{ fontSize: 15, color: '#2D3748' }}>{item.suffix}</span>
      </div>

      {/* 임상 키 */}
      <div style={{ marginLeft: 28, marginTop: 3, fontSize: 11, color: '#A0AEC0' }}>
        [{item.clinicalKey}]
      </div>

      {error && (
        <div style={{ marginLeft: 28, marginTop: 3, fontSize: 11, color: '#FC8181' }}>
          답변을 입력해주세요
        </div>
      )}
    </div>
  );
}
