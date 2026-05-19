import { useState, useRef, useCallback } from 'react';
import { STAGE_KEYS, STAGE_META } from '../constants/stages';

/* 드래그&드롭 공통 훅 */
function useDrop(onFile) {
  const [dragging, setDragging] = useState(false);
  const onDragOver  = e => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop      = e => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };
  return { dragging, onDragOver, onDragLeave, onDrop };
}

/* PNG → base64 dataURL 변환 */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* 빈 strokeLog 생성 (개별 PNG 로드 시) */
function emptyStrokeLog() {
  return { totalStrokes: 0, durationMs: 0, strokes: [] };
}

/* ─────────────── TAB: 세션 JSON 불러오기 ─────────────── */
function JsonTab({ onLoaded }) {
  const [status, setStatus]   = useState('idle'); // idle | ok | error
  const [errMsg, setErrMsg]   = useState('');
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();

  const processFile = useCallback(async (file) => {
    if (!file || !file.name.endsWith('.json')) {
      setErrMsg('JSON 파일만 지원합니다.');
      setStatus('error');
      return;
    }
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      /* 유효성 검사 */
      if (data.type !== 'pathfinder-session') {
        throw new Error('"pathfinder-session" 타입이 아닌 파일입니다.\n세션 전체 저장으로 내보낸 파일을 사용하세요.');
      }
      if (!Array.isArray(data.stages) || data.stages.length === 0) {
        throw new Error('stages 데이터가 없습니다.');
      }
      const missingImg = data.stages.find(s => !s.imageData);
      if (missingImg) {
        throw new Error(`"${missingImg.stageKey}" 단계 이미지가 없습니다.\n로그 JSON이 아닌 세션 전체 저장 파일을 사용하세요.`);
      }

      setPreview(data);
      setStatus('ok');
    } catch (e) {
      setErrMsg(e.message);
      setStatus('error');
    }
  }, []);

  const drop = useDrop(processFile);

  const handleConfirm = () => {
    if (!preview) return;
    onLoaded({
      sessionId:  preview.sessionId,
      startedAt:  preview.startedAt,
      stages:     preview.stages,
      pdiAnswers: preview.pdiAnswers ?? {},
      aiState:    preview.aiState   ?? {},
    });
  };

  return (
    <div>
      {/* 드롭존 */}
      <div
        {...drop}
        onClick={() => inputRef.current.click()}
        style={{
          border: `2px dashed ${drop.dragging ? '#2E75B6' : '#CBD5E0'}`,
          borderRadius: 12,
          padding: '32px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: drop.dragging ? '#EBF4FF' : '#F7FAFC',
          transition: 'all 0.2s',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
        <div style={{ fontSize: 14, color: '#2D3748', fontWeight: 600, marginBottom: 4 }}>
          세션 JSON 파일을 여기에 드래그하거나 클릭해서 선택
        </div>
        <div style={{ fontSize: 12, color: '#A0AEC0' }}>
          CompleteScreen에서 "💾 세션 전체 저장"으로 내보낸 파일
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={e => processFile(e.target.files[0])}
        />
      </div>

      {/* 오류 메시지 */}
      {status === 'error' && (
        <div style={{
          background: '#FFF5F5', border: '1px solid #FED7D7',
          borderRadius: 8, padding: '12px 16px',
          fontSize: 13, color: '#C53030', lineHeight: 1.7,
          marginBottom: 16, whiteSpace: 'pre-line',
        }}>
          ⚠️ {errMsg}
        </div>
      )}

      {/* 미리보기 */}
      {status === 'ok' && preview && (
        <div style={{
          background: '#F0F4FA', border: '1px solid #BEE3F8',
          borderRadius: 10, padding: '16px 18px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#2E75B6', marginBottom: 12 }}>
            ✅ 세션 파일 로드 성공
          </div>
          <div style={{ fontSize: 12, color: '#718096', marginBottom: 10 }}>
            세션 ID: {preview.sessionId?.slice(0, 8)}…
            &nbsp;·&nbsp;
            저장일: {preview.startedAt ? new Date(preview.startedAt).toLocaleDateString('ko-KR') : '알 수 없음'}
          </div>
          {/* 그림 미리보기 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {preview.stages.map(s => (
              <div key={s.stageKey} style={{ textAlign: 'center' }}>
                <img
                  src={s.imageData} alt={s.stageKey}
                  style={{
                    width: 130, height: 82, objectFit: 'contain',
                    border: '1px solid #CBD5E0', borderRadius: 6, background: '#fff',
                  }}
                />
                <div style={{ fontSize: 11, color: '#718096', marginTop: 3 }}>
                  {STAGE_META[s.stageKey]?.emoji} {STAGE_META[s.stageKey]?.label}
                </div>
              </div>
            ))}
          </div>
          <button
            className="btn-primary"
            onClick={handleConfirm}
            style={{ marginTop: 16, fontSize: 14, padding: '12px' }}
          >
            🧠 이 세션으로 분석 시작하기
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────── TAB: 개별 PNG 불러오기 ─────────────── */
function PngTab({ onLoaded }) {
  const [images, setImages]   = useState({ house: null, tree: null, person_same: null, person_opposite: null });
  const [dragging, setDragging] = useState(null); // stageKey
  const inputRefs = {
    house:           useRef(),
    tree:            useRef(),
    person_same:     useRef(),
    person_opposite: useRef(),
  };

  const handleFile = useCallback(async (stageKey, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const dataUrl = await fileToDataURL(file);
    setImages(prev => ({ ...prev, [stageKey]: dataUrl }));
  }, []);

  const allLoaded = STAGE_KEYS.every(k => images[k]);

  const handleConfirm = () => {
    const stages = STAGE_KEYS.map(k => ({
      stageKey: k,
      imageData: images[k],
      strokeLog: emptyStrokeLog(),
    }));
    onLoaded({
      sessionId:  crypto.randomUUID(),
      startedAt:  new Date().toISOString(),
      stages,
      pdiAnswers: {},
      aiState:    {},
    });
  };

  return (
    <div>
      <div style={{ fontSize: 13, color: '#718096', marginBottom: 16, lineHeight: 1.6 }}>
        집·나무·사람(동성)·사람(이성) 그림 파일을 각각 업로드하세요. (PNG / JPG)<br />
        드로잉 과정 지표는 포함되지 않으며, 이미지만으로 분석이 진행됩니다.
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {STAGE_KEYS.map(key => {
          const meta = STAGE_META[key];
          const isDragging = dragging === key;

          return (
            <div
              key={key}
              onClick={() => inputRefs[key].current.click()}
              onDragOver={e => { e.preventDefault(); setDragging(key); }}
              onDragLeave={() => setDragging(null)}
              onDrop={async e => {
                e.preventDefault();
                setDragging(null);
                const file = e.dataTransfer.files[0];
                await handleFile(key, file);
              }}
              style={{
                flex: '1 1 140px',
                minWidth: 140,
                border: `2px dashed ${isDragging ? '#2E75B6' : images[key] ? '#38A169' : '#CBD5E0'}`,
                borderRadius: 10,
                padding: '16px 12px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragging ? '#EBF4FF' : images[key] ? '#E6F4EC' : '#F7FAFC',
                transition: 'all 0.2s',
              }}
            >
              {images[key] ? (
                <>
                  <img
                    src={images[key]} alt={key}
                    style={{
                      width: '100%', height: 80, objectFit: 'contain',
                      borderRadius: 6, background: '#fff',
                      border: '1px solid #CBD5E0', marginBottom: 6,
                    }}
                  />
                  <div style={{ fontSize: 11, color: '#38A169', fontWeight: 600 }}>
                    {meta.emoji} {meta.label} ✓
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{meta.emoji}</div>
                  <div style={{ fontSize: 12, color: '#718096', fontWeight: 600 }}>
                    {meta.label} 그림
                  </div>
                  <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 4 }}>
                    클릭 또는 드래그
                  </div>
                </>
              )}
              <input
                ref={inputRefs[key]}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleFile(key, e.target.files[0])}
              />
            </div>
          );
        })}
      </div>

      {allLoaded && (
        <button
          className="btn-primary"
          onClick={handleConfirm}
          style={{ fontSize: 14, padding: '12px' }}
        >
          🧠 이미지로 분석 시작하기
        </button>
      )}

      {!allLoaded && (
        <div style={{ fontSize: 12, color: '#A0AEC0', textAlign: 'center' }}>
          네 장의 그림을 모두 업로드하면 분석을 시작할 수 있습니다.
        </div>
      )}
    </div>
  );
}

/* ─────────────── MAIN EXPORT ─────────────── */
export default function LoadSessionScreen({ onLoaded, onBack }) {
  const [tab, setTab] = useState('json'); // 'json' | 'png'

  const tabStyle = (active) => ({
    padding: '8px 20px',
    border: 'none',
    borderBottom: `2px solid ${active ? '#2E75B6' : 'transparent'}`,
    background: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: active ? 700 : 400,
    color: active ? '#2E75B6' : '#718096',
    transition: 'all 0.2s',
  });

  return (
    <div className="card" style={{ maxWidth: 560, width: '100%' }}>
      <div className="card-header">
        <h1>📂 저장 파일 불러오기</h1>
        <p>이전에 저장한 세션을 불러와 분석을 진행하세요</p>
      </div>
      <div className="card-body">

        {/* 탭 */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #E2E8F0',
          marginBottom: 20,
        }}>
          <button style={tabStyle(tab === 'json')} onClick={() => setTab('json')}>
            💾 세션 JSON
          </button>
          <button style={tabStyle(tab === 'png')} onClick={() => setTab('png')}>
            🖼 개별 PNG
          </button>
        </div>

        {tab === 'json' && <JsonTab onLoaded={onLoaded} />}
        {tab === 'png'  && <PngTab  onLoaded={onLoaded} />}

        <button
          className="btn-secondary"
          onClick={onBack}
          style={{ marginTop: 12, fontSize: 13 }}
        >
          ← 돌아가기
        </button>
      </div>
    </div>
  );
}
