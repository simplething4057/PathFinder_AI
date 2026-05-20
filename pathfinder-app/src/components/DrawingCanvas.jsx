import { useRef, useEffect, useState, useCallback } from 'react';

function buildStageMeta(userGender) {
  const oppGender = userGender === '남' ? '여성' : userGender === '여' ? '남성' : '반대 성별';
  return [
    {
      key: 'house',
      emoji: '🏠',
      title: '1단계 — 집 (House)',
      hint: '집 한 채를 자유롭게 그려주세요.',
      guide: '지붕, 벽, 창문, 문 등 떠오르는 대로 그리세요.',
    },
    {
      key: 'tree',
      emoji: '🌳',
      title: '2단계 — 나무 (Tree)',
      hint: '나무 한 그루를 자유롭게 그려주세요.',
      guide: '열매, 가지, 뿌리 등 원하는 대로 표현하세요.',
    },
    {
      key: 'person_same',
      emoji: '🧑',
      title: '3단계 — 사람 (Person)',
      hint: '사람 한 명을 자유롭게 그려주세요.',
      guide: '자신이 아닌 어떤 사람이어도 좋습니다.',
    },
    {
      key: 'person_opposite',
      emoji: '🧑‍🤝‍🧑',
      title: `4단계 — ${oppGender} (Person)`,
      hint: `이번에는 ${oppGender}을 그려주세요.`,
      guide: `앞서 그린 사람과 다른 성별(${oppGender})의 사람을 자유롭게 표현해주세요.`,
      badge: oppGender,
    },
  ];
}

const PEN_SIZES = [2, 4, 8];
const CANVAS_W  = 728;
const CANVAS_H  = 460;

export default function DrawingCanvas({ stageIndex, onStageComplete, userGender }) {
  const STAGE_META = buildStageMeta(userGender);

  const canvasRef      = useRef(null);
  const isDrawing      = useRef(false);
  const currentStroke  = useRef(null);
  const strokesRef     = useRef([]);
  const strokeIdRef    = useRef(0);
  const startTimeRef   = useRef(Date.now());

  const [strokeCount, setStrokeCount] = useState(0);
  const [tool, setTool]     = useState('pen');
  const [penSize, setPenSize] = useState(4);
  const submittedRef = useRef(false); // 더블클릭 방지

  const meta = STAGE_META[stageIndex] ?? STAGE_META[0]; // 범위 초과 방어

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    strokesRef.current.forEach(stroke => {
      if (stroke.erased || stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.size; ctx.strokeStyle = stroke.color;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
  }, []);

  useEffect(() => {
    strokesRef.current  = [];
    strokeIdRef.current = 0;
    startTimeRef.current = Date.now();
    setStrokeCount(0);
    setTool('pen');
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  }, [stageIndex]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
      t: Date.now() - startTimeRef.current,
      p: e.pressure ?? 0.5,
    };
  };

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    if (tool === 'eraser') {
      let changed = false;
      strokesRef.current = strokesRef.current.map(s => {
        const hit = s.points.some(p => Math.hypot(p.x - pos.x, p.y - pos.y) < penSize * 4);
        if (hit) { changed = true; return { ...s, erased: true }; }
        return s;
      });
      if (changed) { redraw(); setStrokeCount(strokesRef.current.filter(s => !s.erased).length); }
      return;
    }
    currentStroke.current = { id: strokeIdRef.current++, size: penSize, color: '#1a1a1a', erased: false, points: [pos] };
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = penSize; ctx.strokeStyle = '#1a1a1a';
    ctx.moveTo(pos.x, pos.y);
  }, [tool, penSize, redraw]);

  const onPointerMove = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const pos = getPos(e);
    if (tool === 'eraser') {
      let changed = false;
      strokesRef.current = strokesRef.current.map(s => {
        if (s.erased) return s;
        const hit = s.points.some(p => Math.hypot(p.x - pos.x, p.y - pos.y) < penSize * 4);
        if (hit) { changed = true; return { ...s, erased: true }; }
        return s;
      });
      if (changed) { redraw(); setStrokeCount(strokesRef.current.filter(s => !s.erased).length); }
      return;
    }
    if (!currentStroke.current) return;
    currentStroke.current.points.push(pos);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  }, [tool, penSize, redraw]);

  const onPointerUp = useCallback((e) => {
    e?.preventDefault();
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (tool === 'eraser' || !currentStroke.current) return;
    const stroke = currentStroke.current;
    currentStroke.current = null;
    if (stroke.points.length < 2) return;
    strokesRef.current.push(stroke);
    setStrokeCount(prev => prev + 1);
  }, [tool]);

  const handleUndo = useCallback(() => {
    const list = strokesRef.current;
    let idx = -1;
    for (let i = list.length - 1; i >= 0; i--) {
      if (!list[i].erased) { idx = i; break; }
    }
    if (idx === -1) return;
    strokesRef.current = list.filter((_, i) => i !== idx);
    redraw();
    setStrokeCount(strokesRef.current.filter(s => !s.erased).length);
  }, [redraw]);

  const handleClear = useCallback(() => {
    strokesRef.current = [];
    setStrokeCount(0);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  }, []);

  const handleNext = useCallback(() => {
    if (submittedRef.current) return; // 더블클릭 방지
    submittedRef.current = true;
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/png');
    const visible   = strokesRef.current.filter(s => !s.erased);
    onStageComplete({
      stageKey: meta.key,
      imageData,
      strokeLog: {
        sessionStageKey: meta.key,
        totalStrokes:    visible.length,
        durationMs:      Date.now() - startTimeRef.current,
        strokes:         visible.map(({ id, size, points }) => ({ id, size, points })),
      },
    });
  }, [meta.key, onStageComplete]);

  const isLast = stageIndex === STAGE_META.length - 1;

  return (
    <div className="drawing-card">
      <div className="drawing-topbar">
        <span className="stage-title">{meta.title}</span>
        <span className="stage-hint">{meta.hint}</span>
      </div>

      <div style={{
        padding: '8px 20px', fontSize: 13, color: '#4A5568',
        background: meta.badge ? '#FEF3C7' : '#F7FAFC',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>{meta.emoji}</span>
        <span>{meta.guide}</span>
        {meta.badge && (
          <span style={{
            marginLeft: 'auto', background: '#D69E2E', color: '#fff',
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
          }}>
            {meta.badge}
          </span>
        )}
      </div>

      <div className="toolbar">
        <button className={`tool-btn ${tool === 'pen' ? 'active' : ''}`} onClick={() => setTool('pen')}>✏️ 펜</button>
        <button className={`tool-btn ${tool === 'eraser' ? 'warn-active' : ''}`} onClick={() => setTool('eraser')}>🩹 지우개</button>
        <div className="toolbar-divider" />
        {PEN_SIZES.map(s => (
          <button key={s}
            className={`tool-btn ${penSize === s && tool === 'pen' ? 'active' : ''}`}
            onClick={() => { setTool('pen'); setPenSize(s); }}
            title={`굵기 ${s}px`} style={{ padding: '5px 10px' }}>
            <span className="size-dot" style={{ width: s + 4, height: s + 4, minWidth: s + 4 }} />
          </button>
        ))}
        <div className="toolbar-divider" />
        <button className="tool-btn" onClick={handleUndo} disabled={strokeCount === 0}>↩ 취소</button>
        <button className="tool-btn danger" onClick={handleClear} disabled={strokeCount === 0}>🗑 전체 지우기</button>
      </div>

      <div className={`canvas-wrapper ${tool === 'eraser' ? 'eraser-mode' : ''}`} style={{ width: '100%' }}>
        <canvas
          ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          style={{ width: '100%', height: 'auto' }}
          onMouseDown={onPointerDown} onMouseMove={onPointerMove}
          onMouseUp={onPointerUp} onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
        />
        <div className="stroke-counter">획 {strokeCount}개</div>
      </div>

      <div className="drawing-footer">
        <span className="hint">
          {strokeCount === 0 ? '캔버스에 그림을 그려주세요' : `${strokeCount}개의 획이 기록되었습니다`}
        </span>
        <button className={`btn-next ${isLast ? 'finish' : ''}`}
          onClick={handleNext} disabled={strokeCount === 0}>
          {isLast ? '✅ 드로잉 완료' : '다음 단계 →'}
        </button>
      </div>
    </div>
  );
}
