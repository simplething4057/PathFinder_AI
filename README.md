# PathFinder AI

> HTP 투사적 심리 검사 × Big5 성격 이론 × TCI 기질·성격 모델을 통합한  
> AI 기반 심리 분석 플랫폼

---

## 소개

PathFinder AI는 기존 심리 검사의 두 가지 한계를 동시에 해결합니다.

첫째, 기존 Big5나 MBTI 검사는 자기보고 방식이라 방어기제와 사회적 바람직성의 영향을 받습니다. PathFinder AI는 **비언어(드로잉) · 언어(SCT/PDI) · 행동(획 데이터)** 3채널을 교차 검증해 편향을 최소화합니다.

둘째, 기존 HTP 검사는 숙련된 임상가가 수동으로 해석해야 합니다. PathFinder AI는 Claude AI를 활용해 HTP 상징 → TCI 기질 → Big5 성격 차원으로 이어지는 추론 체계를 자동화하고, 결과를 **캐릭터 아키타입**으로 시각화합니다.

---

## 핵심 기능

### 🎨 4단계 디지털 드로잉 검사
집(A·C) → 나무(O·P) → 사람 동성(E·N) → 사람 이성(A·RD) 순서로 진행하며, 각 드로잉에서 측정하는 Big5 차원이 다릅니다. 획의 속도·멈춤·필압을 실시간으로 수집해 TCI 기질(NS·HA·RD·P) 추론에 활용합니다.

### 📝 통합 데이터 수집 (5채널)
| 채널 | 내용 | AI 가중치 |
|------|------|----------|
| 드로잉 이미지 | 4장 base64 PNG → 시각적 상징 분석 | 40% |
| 획 과정 지표 | 속도·멈춤·필압 → TCI 기질 추론 | 35% |
| 사전 SCT | 현재 상태 8문항 + TCI 행동닻 4문항 | 25% |
| PDI 인터뷰 | Big5 앵커 3문항×4 + AI 심층 질문 | 25% |
| 인구통계 | 나이·성별·직업·가족관계 | 맥락 |

### 🧠 HTP × Big5 × TCI 통합 분석
- **Big5 레이더 차트**: 개방성·성실성·외향성·친화성·신경성 0~100 점수
- **TCI 기질 프로파일**: 새로움 추구·위험 회피·보상 의존·인내 高/中/低
- **RAG 근거 인용**: 모든 해석에 시각·과정·SCT·인구통계 근거 명시
- **캐릭터 아키타입**: 6유형(탐험가·수호자·사색가·조율사·개척자·관찰자) 중 프로파일 매핑

### 🗃️ 세션 관리
검사 결과를 DB에 저장하고, 언제든 JSON으로 내보내거나 다시 불러올 수 있습니다.

---

## 기술 스택

```
프론트엔드:  React 19 + Vite 8
백엔드:      Node.js + Express
데이터베이스: PostgreSQL
AI 엔진:     Claude Sonnet 4.6 (분석) · Claude Haiku 4.5 (AI 추가 질문)
인증:        JWT + bcryptjs
배포:        Railway (백엔드 + DB + 프론트엔드)
```

---

## 아키타입 6유형

| 아키타입 | Big5 프로파일 | 핵심 특성 |
|---------|--------------|----------|
| 🧭 탐험가 | O高·E高·N低 | 새로움 추구, 에너지·호기심 |
| 🛡 수호자 | C高·A高·N低 | 안정·책임·타인 돌봄 |
| 🔭 사색가 | O高·E低·N中 | 깊은 내면, 창의적 독립 |
| 🎵 조율사 | A高·E中·RD高 | 공감·관계 중심, 조화 |
| ⚡ 개척자 | E高·C高·N低 | 목표 지향, 실행력, 주도성 |
| 🌊 관찰자 | N高·O高·E低 | 예민한 감수성, 내성적 통찰 |

---

## 로컬 실행

### 사전 요구사항
- Node.js 18+
- PostgreSQL 14+
- Anthropic API 키

### 1. 저장소 클론

```bash
git clone https://github.com/YOUR_USERNAME/pathfinder-ai.git
cd pathfinder-ai
```

### 2. 백엔드 설정

```bash
cd pathfinder-server
npm install

# .env 파일 작성
cp .env.example .env   # 없으면 직접 생성
```

`.env` 파일:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pathfinder_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=랜덤_64자_이상_문자열
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

### 3. 데이터베이스 초기화

DBeaver 또는 psql에서 아래 SQL 실행:

```sql
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'user',
  age           INT,
  gender        TEXT,
  occupation    TEXT,
  family_info   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  pdi_answers     JSONB       DEFAULT '{}',
  ai_state        JSONB       DEFAULT '{}',
  pre_sct_answers JSONB       DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  stage_key   TEXT        NOT NULL CHECK (stage_key IN ('house','tree','person_same','person_opposite')),
  image_data  TEXT,
  stroke_log  JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, stage_key)
);

CREATE TABLE IF NOT EXISTS analysis_results (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  result      JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4. 프론트엔드 설정

```bash
cd pathfinder-app
npm install

# .env 파일 작성
```

`.env` 파일:

```env
VITE_API_URL=http://localhost:3001
VITE_USE_MOCK=false
```

### 5. 실행

```bash
# 터미널 1 — 백엔드
cd pathfinder-server
npm run dev     # http://localhost:3001

# 터미널 2 — 프론트엔드
cd pathfinder-app
npm run dev     # http://localhost:5173
```

---

## 배포 (Railway)

DEPLOY.md 파일을 참고하세요. 요약 순서:

1. GitHub에 push
2. Railway → PostgreSQL 서비스 추가 → 스키마 SQL 실행
3. Railway → 백엔드 서비스 (Root: `pathfinder-server`) → 환경변수 설정
4. Railway → 프론트엔드 서비스 (Root: `pathfinder-app`, Start: `npm run serve`) → `VITE_API_URL` 설정
5. 백엔드 `CLIENT_ORIGIN`을 프론트엔드 URL로 업데이트

---

## API 엔드포인트

| Method | 경로 | 인증 | 설명 |
|--------|------|:----:|------|
| POST | `/api/auth/register` | | 회원가입 |
| POST | `/api/auth/login` | | 로그인 |
| GET | `/api/auth/me` | ✅ | 내 정보 조회 |
| PATCH | `/api/users/profile` | ✅ | 프로필 수정 |
| POST | `/api/sessions` | ✅ | 세션 생성 |
| GET | `/api/sessions` | ✅ | 세션 목록 |
| GET | `/api/sessions/:id` | ✅ | 세션 상세 |
| PATCH | `/api/sessions/:id` | ✅ | 세션 업데이트 |
| POST | `/api/sessions/:id/stages` | ✅ | 드로잉 저장 |
| POST | `/api/sessions/:id/analysis` | ✅ | 분석 결과 저장 |
| GET | `/api/sessions/:id/analysis` | ✅ | 분석 결과 조회 |
| POST | `/api/analyze` | ✅ | Claude API 프록시 |
| GET | `/health` | | 헬스체크 |

---

## 보안

- Claude API 키는 서버 환경변수에만 존재하며 클라이언트에 노출되지 않습니다.
- 모든 세션·분석 API는 JWT 인증을 요구합니다.
- Rate Limiting: 인증 15분/20회, 분석 1시간/30회
- 비밀번호는 bcrypt(10 rounds)로 해싱됩니다.
- `.env` 파일은 `.gitignore`에 포함되어 있습니다.

---

## 임상 이론 근거

- **HTP**: Buck(1948), Hammer(1958)의 투사적 검사 해석 체계
- **Big5 (OCEAN)**: Costa & McCrae의 5요인 성격 모델
- **TCI**: Cloninger(1993)의 신경생물학적 기질·성격 목록
  - 기질 4차원: NS(새로움 추구)·HA(위험 회피)·RD(보상 의존)·P(인내)
  - 성격 3차원: SD(자기주도성)·C(협동성)·ST(자기초월)

> 본 서비스의 분석 결과는 임상 진단을 대체하지 않습니다.  
> 정확한 심리 진단은 전문 임상심리사를 통해 받으시기 바랍니다.
