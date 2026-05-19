import { useEffect, useState } from 'react';

const STEPS = [
  { icon: '🖼', text: '세 장의 그림을 분석하는 중...' },
  { icon: '📋', text: 'PDI 답변을 임상 맥락과 연결하는 중...' },
  { icon: '✏️', text: '드로잉 과정 지표를 해석하는 중...' },
  { icon: '🧠', text: '임상 프레임워크를 적용하는 중...' },
  { icon: '📝', text: '분석 리포트를 작성하는 중...' },
];

export default function AnalyzingScreen({ error, onRetry, onBack }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (error) return;
    const id = setInterval(() => {
      setStepIndex(i => (i + 1) % STEPS.length);
    }, 2800);
    return () => clearInterval(id);
  }, [error]);

  if (error) {
    return (
      <div className="card" style={{ maxWidth: 520, textAlign: 'center' }}>
        <div className="card-body" style={{ padding: '40px 32px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 18, color: '#C53030', marginBottom: 12 }}>분석 중 오류가 발생했습니다</h2>
          <p style={{ fontSize: 13, color: '#718096', lineHeight: 1.7, marginBottom: 8 }}>
            {error}
          </p>
          <p style={{ fontSize: 12, color: '#A0AEC0', marginBottom: 24 }}>
            네트워크 상태나 API 키를 확인한 뒤 다시 시도하거나,<br />
            완료 화면으로 돌아가 나중에 분석을 시작할 수 있습니다.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {onRetry && (
              <button className="btn-primary" onClick={onRetry}
                style={{ width: 'auto', padding: '10px 24px', fontSize: 14 }}>
                🔄 다시 시도
              </button>
            )}
            {onBack && (
              <button className="btn-secondary" onClick={onBack} style={{ fontSize: 14 }}>
                ← 완료 화면으로
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const step = STEPS[stepIndex];

  return (
    <div style={{ textAlign: 'center', maxWidth: 480, width: '100%' }}>
      {/* 애니메이션 원 */}
      <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 32px' }}>
        <svg viewBox="0 0 120 120" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <circle cx="60" cy="60" r="54" fill="none" stroke="#E2E8F0" strokeWidth="6" />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#2E75B6"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="339"
            strokeDashoffset="85"
            style={{ transformOrigin: '60px 60px', animation: 'spin 2s linear infinite' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36,
          animation: 'fadeStep 0.4s ease',
        }}>
          {step.icon}
        </div>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A3C6E', marginBottom: 10 }}>
        임상 분석 진행 중
      </h2>
      <p style={{
        fontSize: 14, color: '#718096', marginBottom: 32,
        minHeight: 24, transition: 'opacity 0.3s',
      }}>
        {step.text}
      </p>

      {/* 단계 도트 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i === stepIndex ? '#2E75B6' : '#CBD5E0',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <p style={{ fontSize: 12, color: '#A0AEC0', marginTop: 32, lineHeight: 1.6 }}>
        그림 3장과 드로잉 과정 데이터, PDI 답변을<br />
        HTP 임상 프레임워크로 분석하고 있습니다.
      </p>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeStep { from { opacity: 0.3; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
