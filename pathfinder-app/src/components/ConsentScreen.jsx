import { useState } from 'react';

const CONSENTS = [
  {
    id: 'basic',
    label: '개인정보 수집·이용 동의',
    tags: [],
    required: true,
    content: (
      <>
        <p>서비스 제공을 위해 아래와 같이 개인정보를 수집·이용합니다.</p>
        <table className="consent-table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th style={{ width: '25%' }}>항목</th>
              <th style={{ width: '35%' }}>수집 목적</th>
              <th style={{ width: '20%' }}>보유 기간</th>
              <th style={{ width: '20%' }}>비고</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>드로잉 이미지 (PNG)</td>
              <td>HTP 심리 분석</td>
              <td>세션 종료 후 30일</td>
              <td>로컬 저장</td>
            </tr>
            <tr>
              <td>드로잉 행동 로그 (JSON)</td>
              <td>과정 기반 분석</td>
              <td>세션 종료 후 30일</td>
              <td>로컬 저장</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: 10, color: '#C53030', fontSize: 12 }}>
          * 동의를 거부할 권리가 있으며, 거부 시 서비스 이용이 제한됩니다.
        </p>
      </>
    ),
  },
  {
    id: 'sensitive',
    label: '민감정보 수집·이용 동의',
    tags: [{ text: '민감정보', cls: 'tag-sensitive' }],
    required: true,
    content: (
      <>
        <p>
          개인정보보호법 제23조에 따라 <strong>심리·정신건강 관련 정보는 민감정보</strong>에 해당합니다.
          PathFinder AI가 생성하는 HTP 분석 결과가 이에 해당하므로 별도 동의가 필요합니다.
        </p>
        <table className="consent-table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>수집 항목</th>
              <th>수집 목적</th>
              <th>보유 기간</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>HTP 심리 분석 결과 텍스트</td>
              <td>사용자 심리 성향 분석 리포트 제공</td>
              <td>세션 종료 후 30일</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: 10, fontSize: 12 }}>
          본 분석 결과는 임상적 진단이 아니며 참고 목적으로만 제공됩니다.
        </p>
      </>
    ),
  },
  {
    id: 'overseas',
    label: '개인정보 국외 이전 동의',
    tags: [{ text: '국외 이전', cls: 'tag-overseas' }],
    required: true,
    content: (
      <>
        <p>
          개인정보보호법 제28조의8에 따라 아래 외부 AI 서비스에 데이터를 전송합니다.
          전송 전 동의가 필요합니다.
        </p>
        <table className="consent-table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>이전받는 자</th>
              <th>이전 국가</th>
              <th>이전 항목</th>
              <th>이전 목적</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>OpenAI, Inc.</td>
              <td>미국</td>
              <td>음성 녹음 파일 (추후 추가)</td>
              <td>Whisper 음성 전사</td>
            </tr>
            <tr>
              <td>Anthropic, PBC 또는 OpenAI, Inc.</td>
              <td>미국</td>
              <td>드로잉 이미지, 행동 로그, 전사 텍스트</td>
              <td>멀티모달 HTP 분석</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: 10, fontSize: 12, color: '#5B21B6' }}>
          * 각 사의 개인정보처리방침에 따라 처리됩니다. OpenAI: privacy.openai.com / Anthropic: anthropic.com/privacy
        </p>
      </>
    ),
  },
];

export default function ConsentScreen({ onConsent }) {
  const [checked, setChecked]   = useState({ basic: false, sensitive: false, overseas: false });
  const [opened, setOpened]     = useState({});

  const allChecked = CONSENTS.every(c => checked[c.id]);

  const toggleAll = () => {
    const next = !allChecked;
    setChecked({ basic: next, sensitive: next, overseas: next });
  };

  const toggleSection = (id) => setOpened(p => ({ ...p, [id]: !p[id] }));
  const toggleCheck   = (id, e) => {
    e.stopPropagation();
    setChecked(p => ({ ...p, [id]: !p[id] }));
  };

  return (
    <div className="card">
      <div className="card-header">
        <h1>서비스 이용 동의</h1>
        <p>PathFinder AI를 시작하기 전에 아래 항목에 동의해 주세요. 모든 항목은 필수입니다.</p>
      </div>

      <div className="card-body">

        {/* 면책 고지 */}
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #FCD34D',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 18,
          fontSize: 13,
          color: '#92400E',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
        }}>
          <span>⚠️</span>
          <span>
            <strong>임상 진단 아님 안내:</strong> 본 서비스의 분석 결과는 심리 임상 진단이 아닌
            참고용 정보입니다. 정확한 심리 상담 및 진단은 전문 의료인을 통해 받으시기 바랍니다.
          </span>
        </div>

        {/* 전체 동의 */}
        <div className="all-agree-row" onClick={toggleAll}>
          <input
            type="checkbox"
            className="consent-checkbox"
            checked={allChecked}
            onChange={toggleAll}
            onClick={e => e.stopPropagation()}
          />
          <label>아래 항목에 모두 동의합니다</label>
        </div>

        {/* 개별 동의 섹션 */}
        {CONSENTS.map((c, i) => (
          <div className="consent-section" key={c.id}>
            <div
              className={`consent-section-header ${opened[c.id] ? 'open' : ''}`}
              onClick={() => toggleSection(c.id)}
            >
              <input
                type="checkbox"
                className="consent-checkbox"
                checked={checked[c.id]}
                onChange={() => {}}
                onClick={(e) => toggleCheck(c.id, e)}
              />
              <div className="consent-label">
                {String(i + 1).padStart(2, '0')}. {c.label}
                {c.required && <span className="required">[필수]</span>}
                {c.tags.map(t => (
                  <span key={t.text} className={`tag ${t.cls}`}>{t.text}</span>
                ))}
              </div>
              <span className="consent-toggle">{opened[c.id] ? '▲ 접기' : '▼ 내용 보기'}</span>
            </div>
            {opened[c.id] && (
              <div className="consent-detail">{c.content}</div>
            )}
          </div>
        ))}

        {/* 시작 버튼 */}
        <div style={{ marginTop: 22 }}>
          <button
            className="btn-primary"
            disabled={!allChecked}
            onClick={onConsent}
          >
            {allChecked ? '✓ 동의하고 HTP 드로잉 시작하기' : '위 항목에 모두 동의해야 시작할 수 있습니다'}
          </button>
        </div>

      </div>
    </div>
  );
}
