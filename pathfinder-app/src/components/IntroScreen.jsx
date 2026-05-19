export default function IntroScreen({ onStart, onLoadFile }) {
  return (
    <div className="card">
      <div className="card-header">
        <h1>🖼 HTP 검사란?</h1>
        <p>House · Tree · Person — 그림을 통해 심리 성향을 탐색하는 투사적 검사입니다.</p>
      </div>

      <div className="card-body">

        {/* 개요 설명 */}
        <div style={{
          background: '#F0F4FA',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 22,
          lineHeight: 1.8,
          fontSize: 14,
          color: '#2D3748',
        }}>
          <strong style={{ color: '#1A3C6E' }}>HTP 검사(House-Tree-Person Test)</strong>는 1948년 임상심리학자
          John Buck이 개발한 심리 투사 기법입니다. 집·나무·사람이라는 친숙한 대상을 자유롭게 그리는 과정에서
          무의식적으로 드러나는 심리 상태, 자아상, 대인관계 패턴 등을 탐색합니다.
          <br /><br />
          PathFinder AI는 완성된 그림뿐 아니라 <strong>그리는 순서·속도·획의 흐름</strong>까지 분석하여
          기존 자동화 서비스가 놓쳤던 '과정의 맥락'을 복원합니다.
        </div>

        {/* 3단계 안내 */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#4A5568', marginBottom: 12 }}>
            📋 진행 순서
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { emoji: '🏠', stage: '1단계', title: '집 (House)', desc: '어떤 집이든 상관없습니다. 크기, 구조, 주변 환경까지 자유롭게 표현하세요.' },
              { emoji: '🌳', stage: '2단계', title: '나무 (Tree)', desc: '한 그루의 나무를 그려주세요. 열매, 가지, 뿌리 등은 선택입니다.' },
              { emoji: '🧑', stage: '3단계', title: '사람 (Person)', desc: '자신이 아닌 어떤 사람이어도 좋습니다. 전신 또는 상반신 모두 가능합니다.' },
            ].map(item => (
              <div key={item.stage} style={{
                flex: 1,
                background: '#FAFBFD',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: '14px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{item.emoji}</div>
                <div style={{ fontSize: 11, color: '#2E75B6', fontWeight: 700, marginBottom: 2 }}>{item.stage}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A3C6E', marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 유의사항 */}
        <div style={{
          background: '#EDE9FE',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 24,
          fontSize: 13,
          color: '#5B21B6',
          lineHeight: 1.75,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>✅ 검사 전 유의사항</div>
          <div>• <strong>정답이 없습니다.</strong> 잘 그린 그림이 아니라 솔직한 그림이 중요합니다.</div>
          <div>• <strong>자유롭게 그리세요.</strong> 자를 사용하거나 완벽하게 그릴 필요가 없습니다.</div>
          <div>• <strong>천천히 그려도 됩니다.</strong> 시간 제한이 없습니다.</div>
          <div>• <strong>마음에서 그려주세요.</strong> 머릿속에 떠오르는 대로 표현하는 것이 가장 좋습니다.</div>
        </div>

        {/* 면책 재고지 */}
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #FCD34D',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 22,
          fontSize: 12,
          color: '#92400E',
          lineHeight: 1.6,
        }}>
          ⚠️ 본 검사 결과는 <strong>임상적 진단이 아닌 참고용 정보</strong>입니다.
          정확한 심리 진단은 반드시 전문 임상심리사 또는 정신건강 전문의를 통해 받으시기 바랍니다.
        </div>

        {/* 시작 버튼 영역 */}
        <button className="btn-primary" onClick={onStart} style={{ marginBottom: 10 }}>
          준비됐어요 — 드로잉 시작하기 🖊
        </button>

        {/* 파일 불러오기 */}
        <button
          className="btn-secondary"
          onClick={onLoadFile}
          style={{ fontSize: 13 }}
        >
          📂 저장한 세션 파일 불러오기
        </button>
        <div style={{ fontSize: 11, color: '#A0AEC0', textAlign: 'center', marginTop: 6 }}>
          이전에 "💾 세션 전체 저장"으로 내보낸 파일이나 개별 PNG 이미지를 불러와 바로 분석할 수 있습니다.
        </div>

      </div>
    </div>
  );
}
