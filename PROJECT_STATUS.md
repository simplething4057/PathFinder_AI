# PathFinder AI — 프로젝트 현황 정리
> 최종 업데이트: 2026-05-20

---

## 1. 프로젝트 개요

**PathFinder AI**는 HTP(House-Tree-Person) 투사적 심리 검사를 디지털화하고,
Big5 성격 이론 × Cloninger TCI 기질·성격 모델과 통합하여 임상적으로 의미있는
성격·기질 프로파일을 자동 생성하는 웹 기반 심리 검사 플랫폼입니다.

| 항목 | 내용 |
|------|------|
| **프론트엔드** | React 19 + Vite 8 (port 5173) |
| **백엔드** | Node.js + Express (port 3001) |
| **데이터베이스** | PostgreSQL (로컬: pathfinder_db / 배포: Railway) |
| **AI 엔진** | Claude Sonnet 4.6 (분석) · Claude Haiku 4.5 (AI 추가 질문) |
| **인증** | JWT (7일 만료) + bcryptjs |
| **보안** | 서버사이드 Claude API 프록시, Rate Limiting |
| **배포 플랫폼** | Railway (백엔드 + DB) / Railway Static (프론트엔드) |

---

## 2. 전체 파일 구조

```
PathFinder AI/
├── pathfinder-app/                  ← 프론트엔드 (React + Vite)
│   ├── src/
│   │   ├── main.jsx                 ← 앱 진입점
│   │   ├── App.jsx                  ← 전체 phase 라우팅 & 세션 오케스트레이션
│   │   ├── App.css / index.css      ← 전역 스타일
│   │   ├── components/
│   │   │   ├── AuthScreen.jsx       ← 회원가입 / 로그인
│   │   │   ├── SessionHistory.jsx   ← 과거 검사 기록 목록
│   │   │   ├── MyPage.jsx           ← 프로필 편집 (직업·가족관계)
│   │   │   ├── ConsentScreen.jsx    ← 이용약관 동의
│   │   │   ├── PreSCTScreen.jsx     ← 사전 SCT 8문항 + TCI 행동닻 4문항
│   │   │   ├── IntroScreen.jsx      ← 검사 안내 / 파일 불러오기 분기
│   │   │   ├── LoadSessionScreen.jsx← JSON 세션 파일 / 개별 PNG 불러오기
│   │   │   ├── DrawingCanvas.jsx    ← 4단계 드로잉 캔버스 (획 로그 수집)
│   │   │   ├── StageIndicator.jsx   ← 드로잉 진행 상태 바
│   │   │   ├── PostDrawingScreen.jsx← PDI 인터뷰 (Big5 앵커 3문항×4 + AI 추가질문)
│   │   │   ├── CompleteScreen.jsx   ← 수집 완료 / 분석 시작 / 저장
│   │   │   ├── AnalyzingScreen.jsx  ← 분석 중 진행 표시 / 에러 복구
│   │   │   └── AnalysisReport.jsx   ← HTP×Big5×TCI 통합 보고서
│   │   ├── utils/
│   │   │   ├── htpAnalysis.js       ← 분석 파이프라인 (스트로크 지표 + Claude 호출)
│   │   │   ├── aiFollowUp.js        ← PDI AI 추가질문 생성 (Haiku)
│   │   │   └── api.js               ← REST API 클라이언트 래퍼
│   │   └── constants/
│   │       └── stages.js            ← 4단계 메타 중앙 관리 (STAGE_META, STAGE_KEYS 등)
│   ├── .env                         ← VITE_API_URL, VITE_USE_MOCK
│   ├── package.json                 ← react, react-dom, serve
│   └── vite.config.js              ← manualChunks 빌드 최적화
│
├── pathfinder-server/               ← 백엔드 (Node.js + Express)
│   ├── src/
│   │   ├── index.js                 ← Express 앱 + Rate Limiting + 라우트 마운트
│   │   ├── routes/
│   │   │   ├── auth.js              ← /api/auth/* (register/login/me/profile)
│   │   │   ├── sessions.js          ← /api/sessions/* (CRUD + stages + analysis)
│   │   │   └── analyze.js           ← /api/analyze (Claude API 서버사이드 프록시)
│   │   └── middleware/
│   │       └── auth.js              ← JWT 검증 미들웨어
│   ├── db/
│   │   └── index.js                 ← PostgreSQL Pool (DATABASE_URL 또는 개별 변수)
│   ├── .env                         ← ANTHROPIC_API_KEY, DB_*, JWT_SECRET, PORT
│   └── package.json                 ← express, pg, bcryptjs, jsonwebtoken, dotenv 등
│
├── DEPLOY.md                        ← Railway 배포 단계별 가이드
├── PROJECT_STATUS.md                ← 이 파일
└── .gitignore                       ← .env, node_modules, dist, venv 등 제외
```

---

## 3. 구현된 기능 전체 목록

### 3-1. 사용자 관리
| 기능 | 상태 | 세부 내용 |
|------|------|----------|
| 회원가입 | ✅ | 이메일·비밀번호·이름·나이·성별 필수 입력 |
| 로그인 | ✅ | JWT 7일 만료, localStorage 저장 |
| 마이페이지 | ✅ | 직업·가족관계·나이·성별 수정 (PATCH /api/users/profile) |
| 이용약관 동의 | ✅ | 개인정보 수집·처리 동의 화면 |

### 3-2. 검사 전 데이터 수집
| 기능 | 상태 | 세부 내용 |
|------|------|----------|
| 사전 SCT (8문항) | ✅ | 현재 기분·스트레스원·대처방식·가치·욕구·강점·두려움·욕동 |
| TCI 행동닻 (4문항) | ✅ | NS·HA·RD·P 각 1문항 개방형 — Big5 추론 핵심 소스 |
| 섹션 분리 UI | ✅ | "현재 상태" / "나 자신 탐색" 2섹션으로 구분 |

### 3-3. 드로잉 검사 (4단계)
| 단계 | stageKey | 상태 | 세부 내용 |
|------|----------|------|----------|
| 집 | house | ✅ | Big5: A·C 측정 |
| 나무 | tree | ✅ | Big5: O·P 측정 |
| 사람 (동성) | person_same | ✅ | Big5: E·N 측정 |
| 사람 (이성) | person_opposite | ✅ | Big5: A·RD 측정 |

- 캔버스 기능: 자유 드로잉, 지우개, 색상/굵기 선택, 실행취소
- 획 데이터 수집: x·y 좌표, 타임스탬프, 필압(p), 총획수, 소요시간
- 스테이지 인디케이터: 4/4 진행상황 표시

### 3-4. PDI 인터뷰 (PostDrawingScreen)
| 탭 | 측정 Big5 | 질문 구조 |
|----|----------|----------|
| 집 | A·C | 거주자 특성 / 중요 공간 / 현재 상황 |
| 나무 | O·P | 나무 나이 / 어려운 것 / 주변 환경 |
| 사람(동성) | E·N | 마음속 내용 / 강점 / 즐기는 것 |
| 사람(이성) | A·RD | 두 사람 관계 / 주고받는 것 / 감정 |
| 전반 | - | 과정 경험 / 마음에 걸리는 부분 / 자기 개념 |
| AI 심층 질문 | - | Claude Haiku가 답변 분석 후 2문항 자동 생성 |

### 3-5. 분석 파이프라인 (htpAnalysis.js)
**5채널 입력 → Claude Sonnet 4.6 → JSON 출력**

| 채널 | 가중치 | 내용 |
|------|--------|------|
| A. 드로잉 이미지 | 40% | 4장 base64 PNG → 시각적 상징 분석 |
| B. 획 과정 지표 | 35% | 총획수·속도·멈춤·필압·첫획지연 → TCI NS/HA/P 추론 |
| C-1. 사전 SCT | 25% | 8문항 완성 문장 |
| C-2. TCI 행동닻 | 25% | 4문항 기질 서술 (채널 C 합산) |
| D. PDI 답변 | 25% | 드로잉별 Big5 앵커 질문 + AI 추가질문 |
| E. 인구통계 | 맥락 | 나이·성별·직업·가족관계 |

**분석 출력 JSON 구조:**
```
summary · psychologicalTone · demographicContext · preSctInsights · tciAnchors
drawings { house · tree · person_same · person_opposite }
  └ keyIndicators[{ element · finding · evidences[RAG] · interpretation }]
  └ processInsights · interpretation · comparedToSame(이성인)
sctInsights · crossDrawingThemes
big5Profile { O·C·E·A·N: { score(0~100) · keySymbol · interpretation } }
tciProfile  { NS·HA·RD·P: { level(high|mid|low) · evidence } }
archetype { key·name·tagline·description·strengths·growthEdge·htpSymbol }
strengthsAndResources · areasOfExploration · disclaimer
```

### 3-6. 분석 보고서 (AnalysisReport.jsx)
| 섹션 | 내용 |
|------|------|
| 보고서 헤더 | 수검자 정보, 면책 배너, 전반 심리 톤, 종합 요약 |
| 검사 전 상태 분석 | preSctInsights |
| 아키타입 카드 | 이름·태그라인·서사·강점 목록·성장 과제·HTP 상징 연결 |
| Big5 프로파일 카드 | 오각형 SVG 레이더 차트 + 5차원 점수 바 + TCI 4기질 |
| RAG 근거 범례 | visual·process·SCT·demo 4유형 표시 |
| 그림별 분석 (4장) | 썸네일 + 드로잉 과정 지표 + keyIndicators(RAG) + 종합 해석 |
| 사후 SCT 인사이트 | PDI 답변 심리 주제 |
| 교차 주제 | 4장에 반복되는 심리 테마 |
| 강점·탐색 영역 | 심리적 자원 + 추가 탐색 권장 영역 |
| 하단 버튼 | 인쇄/PDF 저장, 새 세션 시작 |

### 3-7. 캐릭터 아키타입 6유형
| 유형 | key | Big5 프로파일 | 특성 |
|------|-----|--------------|------|
| 탐험가 | explorer | O高·E高·N低 | 새로움 추구, 에너지·호기심 |
| 수호자 | guardian | C高·A高·N低 | 안정·책임·타인 돌봄 |
| 사색가 | thinker | O高·E低·N中 | 깊은 내면, 창의적 독립 |
| 조율사 | harmonizer | A高·E中·RD高 | 공감·관계 중심, 조화 추구 |
| 개척자 | pioneer | E高·C高·N低 | 목표 지향, 실행력, 주도성 |
| 관찰자 | observer | N高·O高·E低 | 예민한 감수성, 내성적 통찰 |

### 3-8. 세션 관리 및 저장
| 기능 | 상태 |
|------|------|
| 세션 DB 저장 (PostgreSQL) | ✅ |
| 세션 JSON 내보내기 | ✅ |
| 스트로크 로그 JSON 내보내기 | ✅ |
| 이미지 일괄 저장 | ✅ |
| 저장 파일 불러오기 (JSON) | ✅ |
| 개별 PNG 불러오기 (4장) | ✅ |
| 세션 히스토리 목록 조회 | ✅ |

### 3-9. 보안 / 인프라
| 항목 | 상태 | 세부 내용 |
|------|------|----------|
| Claude API 서버사이드 프록시 | ✅ | 프론트엔드에 API 키 미노출 |
| JWT 인증 | ✅ | 모든 세션·분석 API 보호 |
| Rate Limiting | ✅ | 인증 15분/20회, 분석 1시간/30회 |
| bcrypt 비밀번호 해싱 | ✅ | 10 rounds |
| .gitignore | ✅ | .env, node_modules, dist, venv 제외 |
| Railway PostgreSQL SSL | ✅ | DATABASE_URL 자동 감지 + SSL 연결 |

---

## 4. 데이터베이스 스키마

```sql
users         -- id(UUID), email, password_hash, name, role, age, gender,
              --   occupation, family_info, created_at

sessions      -- id(UUID), user_id→users, started_at, completed_at,
              --   pdi_answers(JSONB), ai_state(JSONB),
              --   pre_sct_answers(JSONB), created_at

stages        -- id(UUID), session_id→sessions,
              --   stage_key IN ('house','tree','person_same','person_opposite'),
              --   image_data(TEXT/base64), stroke_log(JSONB), created_at
              --   UNIQUE(session_id, stage_key)

analysis_results -- id(UUID), session_id→sessions UNIQUE,
                 --   result(JSONB: HTP×Big5×TCI 통합 분석), created_at
```

---

## 5. 검사 플로우 (전체 UX)

```
로그인/회원가입
    ↓
세션 히스토리 (기존 검사 보기 / 새 검사)
    ↓
마이페이지 (직업·가족관계 입력, 선택)
    ↓
이용약관 동의
    ↓
사전 자기 탐색 (SCT 8문항 + TCI 행동닻 4문항) ← 12문항, 약 5분
    ↓
검사 안내 (HTP 설명)
    ↓
드로잉 4단계 (집→나무→사람동성→사람이성) ← 약 15분
    ↓
PDI 인터뷰 (Big5 앵커 3문항×4탭 + 전반 3문항 + AI 추가질문) ← 약 8분
    ↓
수집 완료 화면 (통계 미리보기 / 저장 / 분석 시작)
    ↓
분석 중 (Claude API 호출, 약 15~25초)
    ↓
HTP × Big5 × TCI 통합 분석 보고서
    ├ 아키타입 카드 (6유형 중 1개)
    ├ Big5 레이더 차트 (O·C·E·A·N 점수)
    ├ TCI 기질 프로파일 (NS·HA·RD·P 수준)
    ├ 그림별 RAG 근거 분석 (4장)
    └ 강점·성장 과제·탐색 영역

                           총 소요시간: 약 25~35분
```

---

## 6. API 엔드포인트 목록

| Method | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/auth/register | ❌ | 회원가입 |
| POST | /api/auth/login | ❌ | 로그인 |
| GET | /api/auth/me | ✅ | 내 정보 조회 |
| PATCH | /api/users/profile | ✅ | 프로필 수정 |
| POST | /api/sessions | ✅ | 새 세션 생성 |
| GET | /api/sessions | ✅ | 내 세션 목록 |
| GET | /api/sessions/:id | ✅ | 세션 상세 조회 |
| PATCH | /api/sessions/:id | ✅ | 세션 메타 업데이트 |
| POST | /api/sessions/:id/stages | ✅ | 드로잉 저장 |
| POST | /api/sessions/:id/analysis | ✅ | 분석 결과 저장 |
| GET | /api/sessions/:id/analysis | ✅ | 분석 결과 조회 |
| POST | /api/analyze | ✅ | Claude API 프록시 (분석) |
| GET | /health | ❌ | 헬스체크 |

---

## 7. 현재 미결 / 추가 가능 항목

| 항목 | 우선순위 | 내용 |
|------|---------|------|
| `npm install` 실행 필요 | **즉시** | pathfinder-app에서 실행 (serve 패키지 설치) |
| ANTHROPIC_API_KEY 입력 | **즉시** | pathfinder-server/.env에 실제 키 값 입력 |
| GitHub push 후 Railway 배포 | 배포 시 | DEPLOY.md 참고 |
| 분석 보고서 PDF 저장 기능 | 중 | window.print() 현재 구현, PDF 스킬 활용 가능 |
| 세션 삭제 기능 | 중 | SessionHistory에 삭제 버튼 미구현 |
| 비밀번호 재설정 | 낮음 | 이메일 인증 필요 |
| 관리자 대시보드 | 낮음 | role='admin' 필드 있으나 UI 없음 |
| i18n (영문 지원) | 낮음 | 현재 전체 한국어 |

---

## 8. 로컬 실행 방법

```bash
# 1. 백엔드 시작
cd pathfinder-server
npm install
# .env에 ANTHROPIC_API_KEY, DB_* 설정 확인
npm run dev    # http://localhost:3001

# 2. 프론트엔드 시작
cd pathfinder-app
npm install    # serve 패키지 포함
npm run dev    # http://localhost:5173

# 3. DB 스키마 (최초 1회)
# DBeaver에서 pathfinder_db 연결 후 schema.sql 실행
```
