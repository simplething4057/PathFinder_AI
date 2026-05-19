/**
 * aiFollowUp.js
 * 기본 PDI 답변 + 그림 이미지를 Claude Haiku에 전송,
 * 임상 맥락 기반 추가 질문 2개를 반환한다.
 *
 * ※ 보안: 백엔드 /api/analyze 프록시를 통해 호출합니다.
 */

import { STAGE_LABELS_KO } from '../constants/stages';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const SYSTEM_PROMPT = `당신은 20년 경력의 임상심리사입니다.
HTP(House-Tree-Person) 검사의 사후 질문 인터뷰(PDI)를 진행하고 있습니다.
다음 규칙을 반드시 따르세요:
1. 내담자의 답변에서 심리적으로 의미 있는 부분을 포착해 심화하는 질문을 만드세요.
2. 질문은 개방형이며 비판적이지 않고 탐색적인 톤을 유지하세요.
3. 내담자가 방어적으로 느끼지 않도록 부드럽게 질문하세요.
4. 반드시 한국어로 작성하고, JSON 형식으로만 응답하세요.
5. 형식: {"questions": ["질문1", "질문2"]}`;

function buildPrompt(stageKey, basicAnswers) {
  const stageName = STAGE_LABELS_KO[stageKey] ?? stageKey;
  const filledAnswers = Object.entries(basicAnswers)
    .filter(([, v]) => v?.trim())
    .map(([, v]) => `• ${v.trim()}`)
    .join('\n');

  return `HTP 검사 중 "${stageName}" 그림에 대한 기본 PDI 답변입니다.
${!filledAnswers
  ? '(내담자가 답변을 기입하지 않았습니다. 그림만 보고 질문을 생성하세요.)'
  : `\n내담자 답변:\n${filledAnswers}`}

위 내용을 바탕으로, 내담자의 내면을 더 깊이 탐색할 수 있는 추가 질문 2개를 JSON 형식으로 생성하세요.
{"questions": ["질문1", "질문2"]}`;
}

const MOCK_QUESTIONS = {
  house: [
    '이 집에서 가장 자주 문을 닫아두는 방이 있다면 어디인가요? 그 이유는 무엇인가요?',
    '이 집에 오래전부터 살던 사람이 있다면, 그 사람은 어떤 감정을 품고 있을 것 같나요?',
  ],
  tree: [
    '이 나무가 가장 힘들었던 계절은 언제였을까요? 그 시기를 어떻게 버텼을 것 같나요?',
    '이 나무 곁에 오래 앉아 있으면 어떤 감정이 올라올 것 같나요?',
  ],
  person_same: [
    '이 사람이 혼자 있는 시간에 주로 무슨 생각을 할 것 같나요?',
    '이 사람이 힘든 것을 혼자 감추고 있다면, 그것은 무엇일까요?',
  ],
  person_opposite: [
    '이 사람과 마주쳤을 때 어떤 감정이 들 것 같나요?',
    '이 사람이 당신에게 전하고 싶은 말이 있다면 무엇일까요?',
  ],
};

export async function generateFollowUpQuestions({ stageKey, imageData, basicAnswers }) {
  const token = localStorage.getItem('pf_token');

  // 토큰 없으면 Mock 반환
  if (!token) {
    await new Promise(r => setTimeout(r, 800));
    const fallbackKey = stageKey.startsWith('person') ? 'person_same' : stageKey;
    return { questions: MOCK_QUESTIONS[fallbackKey] ?? [], isMock: true };
  }

  try {
    const base64 = imageData?.replace(/^data:image\/\w+;base64,/, '') ?? '';

    const payload = {
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system:     SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          ...(base64 ? [{
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: base64 },
          }] : []),
          { type: 'text', text: buildPrompt(stageKey, basicAnswers) },
        ],
      }],
    };

    const res = await fetch(`${API_BASE}/api/analyze`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`API ${res.status}`);

    const data   = await res.json();
    const text   = data.content?.[0]?.text ?? '{}';
    const match  = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match?.[0] ?? '{"questions":[]}');

    return { questions: parsed.questions ?? [], isMock: false };

  } catch (err) {
    console.error('[aiFollowUp] 오류 → Mock 사용:', err.message);
    const fallbackKey = stageKey.startsWith('person') ? 'person_same' : stageKey;
    return { questions: MOCK_QUESTIONS[fallbackKey] ?? [], isMock: true };
  }
}
