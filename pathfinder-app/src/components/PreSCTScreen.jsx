import { useState } from 'react';

/* ── 사전 SCT 문항 정의 ── */
export const PRE_SCT_ITEMS = [
  { id: 'p1', stem: '오늘 나의 기분은',       suffix: '이다.',       clinicalKey: '현재 기분 상태' },
  { id: 'p2', stem: '요즘 나를 가장 힘들게 하는 것은', suffix: '이다.', clinicalKey: '주된 스트레스원' },
  { id: 'p3', stem: '나는 스트레스를 받으면 주로', suffix: '한다.',    clinicalKey: '스트레스 대처 방식' },
  { id: 'p4', stem: '내가 가장 중요하게 여기는 것은', suffix: '이다.', clinicalKey: '핵심 가치' },
  { id: 'p5', stem: '지금 나에게 가장 필요한 것은', suffix: '이다.',   clinicalKey: '현재 욕구' },
  { id: 'p6', stem: '나의 가장 큰 강점은',     suffix: '이다.',       clinicalKey: '자기 강점 인식' },
  { id: 'p7', stem: '내가 가장 두려워하는 것은', suffix: '이다.',      clinicalKey: '핵심 두려움' },
  { id: 'p8', stem: '지금 이 순간 나는',       suffix: '하고 싶다.',  clinicalKey: '현재 욕동' },
];

export default function PreSCTScreen({ onComplete }) {
  const [answers, setAnswers] = useState(
    Object.fromEntries(PRE_SCT_ITEMS.map(i => [i.id, '']))
  );
  const [errors, setErrors]   = useState({});

  const update = (id, val) => {
    setAnswers(p => ({ ...p, [id]: val }));
    if (val.trim()) setErrors(p => { const n = {...p}; delete n[id]; return n; });
  };

  const handleSubmit = () => {
    const newErrors = {};
    PRE_SCT_ITEMS.forEach(item => {
      if (!answers[item.id]?.trim()) newErrors[item.id] = true;
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onComplete(answers);
  };

  const completedCount = PRE_SCT_ITEMS.filter(i => answers[i.id]?.trim()).length;
  const progressPct    = Math.round((completedCount / PRE_SCT_ITEMS.length) * 100);

  return (
    <div className="card" style={{ maxWidth: 600, width: '100%' }}>
      <div className="card-header">
        <h1>📝 검사 전 자기 탐색</h1>
        <p>검사 전 현재의 상태와 자신에 대해 솔직하게 적어주세요.<br />
          정답은 없으며, 떠오르는 대로 자유롭게 완성해주세요.</p>
      </div>

      <div className="card-body">
        {/* 진행률 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#718096', marginBottom: 6 }}>
            <span>진행률</span>
            <span>{completedCount} / {PRE_SCT_ITEMS.length}</span>
          </div>
          <div style={{ background: '#EDF2F7', borderRadius: 99, height: 6 }}>
            <div style={{
              background: '#2E75B6', borderRadius: 99, height: 6,
              width: `${progressPct}%`, transition: 'width 0.3s',
            }} />
          </div>
        </div>

        {/* 문항 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {PRE_SCT_ITEMS.map((item, idx) => (
            <div key={item.id}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                {/* 번호 */}
                <span style={{
                  minWidth: 22, height: 22, borderRadius: '50%',
                  background: answers[item.id]?.trim() ? '#2E75B6' : '#EDF2F7',
                  color: answers[item.id]?.trim() ? '#fff' : '#A0AEC0',
                  fontSize: 11, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {idx + 1}
                </span>

                {/* 스템 */}
                <span style={{ fontSize: 15, color: '#2D3748', fontWeight: 500 }}>
                  {item.stem}
                </span>

                {/* 입력 */}
                <input
                  type="text"
                  value={answers[item.id]}
                  onChange={e => update(item.id, e.target.value)}
                  placeholder="여기에 입력"
                  style={{
                    flex: '1 1 160px', minWidth: 120,
                    padding: '5px 10px',
                    border: `1px solid ${errors[item.id] ? '#FC8181' : '#CBD5E0'}`,
                    borderBottom: `2px solid ${errors[item.id] ? '#FC8181' : answers[item.id]?.trim() ? '#2E75B6' : '#CBD5E0'}`,
                    borderRadius: '4px 4px 0 0',
                    background: '#FAFAFA',
                    fontSize: 14, outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderBottomColor = '#2E75B6'}
                  onBlur={e => e.target.style.borderBottomColor = answers[item.id]?.trim() ? '#2E75B6' : '#CBD5E0'}
                />

                {/* 접미사 */}
                <span style={{ fontSize: 15, color: '#2D3748' }}>
                  {item.suffix}
                </span>
              </div>

              {/* 임상 키 힌트 */}
              <div style={{ marginLeft: 28, marginTop: 3, fontSize: 11, color: '#A0AEC0' }}>
                [{item.clinicalKey}]
              </div>

              {errors[item.id] && (
                <div style={{ marginLeft: 28, marginTop: 3, fontSize: 11, color: '#FC8181' }}>
                  답변을 입력해주세요
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 제출 */}
        <div style={{ marginTop: 28 }}>
          <button className="btn-primary" onClick={handleSubmit}
            style={{ fontSize: 15 }}>
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
