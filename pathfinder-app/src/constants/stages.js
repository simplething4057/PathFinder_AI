/**
 * stages.js — 드로잉 단계 공유 상수
 * DrawingCanvas, StageIndicator, AnalysisReport, LoadSessionScreen,
 * htpAnalysis 등 전체에서 단일 소스로 참조합니다.
 */

export const STAGE_KEYS = ['house', 'tree', 'person_same', 'person_opposite'];

/** 단계 메타 (UI 표시용) */
export const STAGE_META = {
  house:           { emoji: '🏠', label: '집',          color: '#2E75B6', bg: '#EBF4FF', border: '#BEE3F8' },
  tree:            { emoji: '🌳', label: '나무',         color: '#38A169', bg: '#E6F4EC', border: '#9AE6B4' },
  person_same:     { emoji: '🧑', label: '사람 (동성)',  color: '#7B5EA7', bg: '#F0EBF8', border: '#D6BCFA' },
  person_opposite: { emoji: '🧑‍🤝‍🧑', label: '사람 (이성)', color: '#C05621', bg: '#FEF3E8', border: '#FBD38D' },
  // 구버전 호환 폴백
  person:          { emoji: '🧑', label: '사람',         color: '#7B5EA7', bg: '#F0EBF8', border: '#D6BCFA' },
};

/** 분석 리포트용 한국어 레이블 */
export const STAGE_LABELS_KO = {
  house:           '집',
  tree:            '나무',
  person_same:     '사람(동성)',
  person_opposite: '사람(이성)',
  person:          '사람',
};

/** StageIndicator용 순서 배열 */
export const STAGE_INDICATOR = [
  { key: 'house',           emoji: '🏠',     label: '집' },
  { key: 'tree',            emoji: '🌳',     label: '나무' },
  { key: 'person_same',     emoji: '🧑',     label: '사람' },
  { key: 'person_opposite', emoji: '🧑‍🤝‍🧑', label: '반대 성별' },
];

/** 분석 결과 렌더링 순서 */
export const DRAWING_RENDER_ORDER = ['house', 'tree', 'person_same', 'person_opposite', 'person'];
