import { STAGE_INDICATOR } from '../constants/stages';

export default function StageIndicator({ currentIndex }) {
  return (
    <div className="stage-indicator">
      {STAGE_INDICATOR.map((s, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'pending';
        return (
          <div key={s.key} className={`stage-step ${state}`}>
            <div className="stage-dot">{state === 'done' ? '✓' : s.emoji}</div>
            <div className="stage-label">{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}
