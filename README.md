# PathFinder AI

> HTP 투사적 심리 검사 × Big5 성격 이론 × 기질·성격 모델을 통합한  
> AI 기반 심리 분석 플랫폼

---

## 목차

- [소개](#소개)
- [검사 플로우](#검사-플로우)
- [핵심 기능](#핵심-기능)
- [기술 스택](#기술-스택)
- [개별 기질·성격 프로파일](#개별-기질성격-프로파일)
- [로컬 실행](#로컬-실행)
- [배포](#배포)
- [API 엔드포인트](#api-엔드포인트)
- [보안](#보안)
- [주요 기술 결정 사항](#주요-기술-결정-사항)
- [트러블슈팅](#트러블슈팅)
- [임상 이론 근거](#임상-이론-근거)
- [개인정보 처리](#개인정보-처리)

---

## 소개

PathFinder AI는 기존 심리 검사의 두 가지 한계를 동시에 해결합니다.

첫째, 기존 자기보고식 검사 방식은 방어기제와 사회적 바람직성의 영향을 받습니다. PathFinder AI는 **비언어(드로잉) · 언어(SCT/PDI) · 행동(획 데이터)** 3채널을 교차 검증해 편향을 최소화합니다.

둘째, 기존 HTP 검사는 숙련된 임상가가 수동으로 해석해야 합니다. PathFinder AI는 Claude AI를 활용해 HTP 상징 → 기질 → Big5 성격 차원으로 이어지는 추론 체계를 자동화하고, 결과를 **수검자 고유의 기질·성격 서사**로 생성합니다. 고정 유형으로 분류하지 않고 개인의 실측 값 조합에서 직접 서사를 도출합니다.

---

## 검사 플로우

```
서비스 동의  →  HTP 안내  →  사전 SCT  →  드로잉 4단계  →  PDI 인터뷰  →  분석 보고서
```

| 단계 | 내용 |
|------|------|
| 서비스 동의 | 수집 항목·이용 목적 고지 및 동의 |
| HTP 안내 | 검사 방법·주의사항 안내 |
| 사전 SCT | 현재 상태 8문항 + 기질 행동닻 4문항 |
| 드로잉 (4단계) | 집 → 나무 → 사람(동성) → 사람(이성) 순서로 디지털 드로잉 |
| PDI 인터뷰 | Big5 앵커 3문항×4 + AI 심층 추가 질문 |
| 분석 보고서 | Big5 레이더 차트 + 기질 프로파일 + 개별 기질·성격 서사 |

---

## 핵심 기능

### 🎨 4단계 디지털 드로잉 검사

집(A·C) → 나무(O·P) → 사람 동성(E·N) → 사람 이성(A·RD) 순서로 각 드로잉에서 측정하는 Big5 차원이 다릅니다. 획의 속도·멈춤·필압을 실시간으로 수집해 TCI 기질(NS·HA·RD·P) 추론에 활용합니다.

### 📝 통합 데이터 수집 (5채널)

| 채널 | 내용 | AI 가중치 |
|------|------|----------|
| 드로잉 이미지 | 4장 base64 JPEG → 시각적 상징 분석 | 40% |
| 획 과정 지표 | 속도·멈춤·필압 → 기질 추론 | 35% |
| 사전 SCT | 현재 상태 8문항 + 기질 행동닻 4문항 | 25% |
| PDI 인터뷰 | Big5 앵커 3문항×4 + AI 심층 질문 | 25% |
| 인구통계 | 나이·성별·직업·가족관계 | 맥락 |

### 🧠 HTP × Big5 × 기질 통합 분석

- **Big5 레이더 차트**: 개방성·성실성·외향성·친화성·신경성 0~100 점수
- **기질 프로파일**: 새로움 추구·위험 회피·보상 의존·인내 4차원 (상/중/하)
- **RAG 근거 인용**: 모든 해석에 시각·과정·SCT·인구통계 근거 명시
- **개별 기질·성격 프로파일**: 기질 4차원 × Big5 교차 분석으로 수검자 고유의 서사 생성 (고정 유형 없음)

### 🗃️ 세션 관리

검사 결과를 DB에 저장하고, 언제든 JSON으로 내보내거나 다시 불러올 수 있습니다. 세션 히스토리에서 개별 세션을 삭제할 수 있습니다.

### 🖨 인쇄 / PDF 저장

분석 보고서 화면에서 브라우저 인쇄 기능을 통해 PDF로 저장하거나 출력할 수 있습니다. `@media print` CSS가 적용되어 헤더·버튼이 제거된 깔끔한 형태로 출력됩니다.

### 🔐 계정 관리

마이페이지에서 프로필(나이·성별·직업·가족관계) 수정과 비밀번호 변경이 가능합니다.

### 🛠 관리자 대시보드

`role=admin` 계정에게만 헤더에 관리 버튼이 표시됩니다. 통계(사용자·세션·분석 수), 사용자 목록, 최근 세션 현황, 사용자 역할 변경 기능을 제공합니다.

> **관리자 계정 설정**: 배포 후 DB에서 직접 role을 지정합니다. → [배포 섹션 참고](#배포)

---

## 기술 스택

```
프론트엔드:  React 19 + Vite 6
백엔드:      Node.js + Express
데이터베이스: PostgreSQL 14+
AI 엔진:     Claude Sonnet 4.6 (분석) · Claude Haiku 4.5 (AI 추가 질문)
인증:        JWT + bcryptjs
배포:        클라우드타입 (백엔드 + DB) · Vercel (프론트엔드)
```

---

## 개별 기질·성격 프로파일

고정 유형으로 분류하지 않고, 기질 4차원(NS·HA·RD·P) 수준과 Big5 5차원 점수를 교차하여 수검자 고유의 서사를 생성합니다.

| 기질 차원 | Big5 연결 | 수준 표기 | 분석 내용 |
|---------|----------|----------|----------|
| NS (새로움 추구) | E + O | 상/중/하 | 탐색·충동성·변화 적응 |
| HA (위험 회피) | N | 상/중/하 | 민감성·걱정·스트레스 반응 |
| RD (보상 의존) | A | 상/중/하 | 관계 지향·따뜻함·인정 욕구 |
| P (인내) | C | 상/중/하 | 끈기·완수 지향·지속성 |

보고서는 기질 서사(NS·HA·RD·P 조합 기반), 성격 서사(Big5 기반), 핵심 심리 주제, 강점, 성장 과제로 구성됩니다.

---

## 로컬 실행

### 사전 요구사항

- Node.js 18+
- PostgreSQL 14+
- Anthropic API 키

### 1. 저장소 클론

```bash
git clone https://github.com/simplething4057/PathFinder_AI.git
cd PathFinder_AI
```

### 2. 백엔드 설정

```bash
cd pathfinder-server
npm install
```

`.env` 파일 생성:

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
```

`.env` 파일 생성:

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

> 두 서버가 모두 실행 중인 상태에서 `http://localhost:5173`에 접속합니다.

---

## 배포

요약 순서:

1. GitHub에 push
2. **클라우드타입**: 프로젝트 생성 → PostgreSQL 서비스(`postgresql-prod`) 추가 → 스키마 SQL 실행
3. **클라우드타입**: 백엔드 서비스(`pathfinder-server`) 추가 → 환경변수 설정
4. **Vercel**: `pathfinder-app` 디렉터리를 Root Directory로 지정하여 프론트엔드 배포 → `VITE_API_URL` 환경변수 설정
5. 백엔드 `CLIENT_ORIGIN`을 Vercel 프론트엔드 URL로 업데이트

### 환경변수 (클라우드타입 백엔드)

| 키 | 값 |
|----|----|
| `ANTHROPIC_API_KEY` | Anthropic API 키 |
| `DB_HOST` | PostgreSQL 호스트 |
| `DB_PORT` | `5432` |
| `DB_NAME` | 데이터베이스 이름 |
| `DB_USER` | DB 사용자 |
| `DB_PASSWORD` | DB 비밀번호 |
| `JWT_SECRET` | 64자 이상 랜덤 문자열 |
| `PORT` | `3001` |
| `CLIENT_ORIGIN` | Vercel 프론트엔드 URL |

### 관리자 계정 생성

배포 후 DB에서 직접 지정합니다.

```sql
UPDATE users SET role = 'admin' WHERE email = '관리자이메일@example.com';
```

---

## API 엔드포인트

### 인증 / 계정

| Method | 경로 | 인증 | 설명 |
|--------|------|:----:|------|
| POST | `/api/auth/register` | | 회원가입 |
| POST | `/api/auth/login` | | 로그인 |
| GET | `/api/auth/me` | ✅ | 내 정보 조회 |
| PUT | `/api/auth/password` | ✅ | 비밀번호 변경 |
| PATCH | `/api/users/profile` | ✅ | 프로필 수정 |

### 세션

| Method | 경로 | 인증 | 설명 |
|--------|------|:----:|------|
| POST | `/api/sessions` | ✅ | 세션 생성 |
| GET | `/api/sessions` | ✅ | 세션 목록 |
| GET | `/api/sessions/:id` | ✅ | 세션 상세 |
| PATCH | `/api/sessions/:id` | ✅ | 세션 업데이트 |
| DELETE | `/api/sessions/:id` | ✅ | 세션 삭제 |
| POST | `/api/sessions/:id/stages` | ✅ | 드로잉 저장 |
| POST | `/api/sessions/:id/analysis` | ✅ | 분석 결과 저장 |
| GET | `/api/sessions/:id/analysis` | ✅ | 분석 결과 조회 |

### 분석 / 관리

| Method | 경로 | 인증 | 설명 |
|--------|------|:----:|------|
| POST | `/api/analyze` | ✅ | Claude API 프록시 |
| GET | `/api/admin/stats` | ✅ (admin) | 전체 통계 |
| GET | `/api/admin/users` | ✅ (admin) | 사용자 목록 |
| GET | `/api/admin/sessions` | ✅ (admin) | 최근 세션 목록 |
| PATCH | `/api/admin/users/:id/role` | ✅ (admin) | 사용자 역할 변경 |
| GET | `/health` | | 헬스체크 |

---

## 보안

- Claude API 키는 서버 환경변수에만 존재하며 클라이언트에 노출되지 않습니다.
- 모든 세션·분석 API는 JWT 인증을 요구합니다.
- Rate Limiting: 인증 15분/20회, 분석 1시간/30회
- 비밀번호는 bcrypt(10 rounds)로 해싱됩니다.
- `.env` 파일은 `.gitignore`에 포함되어 있습니다.

---

## 주요 기술 결정 사항

### Claude API 스트리밍 (SSE)

클라우드타입 게이트웨이의 60초 타임아웃을 우회하기 위해 `/api/analyze` 엔드포인트는 SSE 스트리밍 방식으로 Claude API를 호출합니다. `X-Accel-Buffering: no` 헤더로 nginx 버퍼링도 비활성화합니다.

### 분석 토큰 설계

Claude API 출력 한계(8,192 토큰) 내에서 안정적으로 완료되도록 출력 스키마를 설계했습니다. 드로잉당 keyIndicator 1개, evidences 배열 제거, 모든 텍스트 필드 1문장 제한. `max_tokens: 8000` 설정.

### 드로잉 이미지 저장

Canvas의 투명 배경이 JPEG 변환 시 검은색으로 나타나는 문제를 방지하기 위해 오프스크린 캔버스에 흰 배경을 먼저 칠한 뒤 드로잉을 합성하여 저장합니다.

### 더블클릭 방지 (submittedRef)

드로잉 단계 제출 시 `submittedRef` 플래그로 중복 제출을 차단하고, 단계 전환(`stageIndex` 변경) 시 `useEffect`에서 초기화합니다.

---

## 트러블슈팅

### 분석 중 "응답이 너무 길어 잘렸습니다" 오류

**원인**: Claude API `max_tokens` 초과로 출력이 중간에 잘려 JSON 파싱 실패.

**해결**: `pathfinder-app/src/utils/htpAnalysis.js`에서 다음을 확인합니다.

```js
max_tokens: 8000,
```

출력 스키마가 과도하게 길면 keyIndicators를 그림당 1개로 줄이고, evidences 배열을 제거하며, 모든 문자열 필드를 1문장 이내로 제한합니다.

---

### 드로잉 이미지가 검은 배경으로 저장됨

**원인**: HTML Canvas는 투명 배경을 사용하는데, JPEG 포맷은 투명도를 지원하지 않아 검정으로 변환됩니다.

**해결**: `DrawingCanvas.jsx`의 `handleNext`에서 오프스크린 캔버스에 흰 배경을 먼저 채운 뒤 드로잉을 합성합니다.

```js
const offscreen = document.createElement('canvas');
const octx = offscreen.getContext('2d');
octx.fillStyle = '#ffffff';
octx.fillRect(0, 0, CANVAS_W, CANVAS_H);
octx.drawImage(canvas, 0, 0);
const imageData = offscreen.toDataURL('image/jpeg', 0.75);
```

---

### 배포 후 수정사항이 반영되지 않음 (Vercel)

**원인**: Vercel 프로젝트가 실제 코드가 push되는 저장소가 아닌 다른 저장소에 연결된 경우.

**확인 방법**: Vercel 대시보드 → Settings → Git → Connected Git Repository가 올바른 저장소(`simplething4057/PathFinder_AI`)인지 확인합니다.

**해결**: 잘못 연결된 경우 Disconnect 후 올바른 저장소로 재연결하고 Redeploy합니다.

---

### 클라우드타입 배포 시 504 게이트웨이 타임아웃

**원인**: Claude API 분석 요청이 60초를 초과해 게이트웨이가 연결을 끊습니다.

**해결**: `/api/analyze` 엔드포인트를 SSE 스트리밍 방식으로 구현하고 `X-Accel-Buffering: no` 헤더를 설정합니다. (`pathfinder-server/src/routes/analyze.js` 참고)

---

### 배포 버전에서 관리자 메뉴가 보이지 않음

**원인**: 배포 DB의 사용자 role이 기본값 `'user'`로 설정되어 있습니다.

**해결**: 클라우드타입 PostgreSQL 콘솔 또는 psql에서 아래 쿼리를 실행합니다.

```sql
UPDATE users SET role = 'admin' WHERE email = '관리자이메일@example.com';
```

---

### Windows에서 git push 후 파일이 계속 modified로 표시됨

**원인**: Windows의 CRLF 줄바꿈이 Linux 마운트 환경과 달라 git이 변경으로 인식합니다.

**해결**: 실제 코드 변경은 정상적으로 커밋된 상태이므로 동작에 영향이 없습니다. 근본 해결이 필요하면 `.gitattributes`에 `* text=auto`를 추가합니다.

---

## 임상 이론 근거

- **HTP**: Buck(1948), Hammer(1958)의 투사적 검사 해석 체계
- **Big5 (OCEAN)**: Costa & McCrae의 5요인 성격 모델
- **기질 모델**: Cloninger(1993)의 신경생물학적 기질 이론에 기반
  - 기질 4차원: NS(새로움 추구)·HA(위험 회피)·RD(보상 의존)·P(인내)
  - 보고서 내 수준 표기: 상/중/하 (High/Mid/Low)

> 본 서비스의 분석 결과는 임상 진단을 대체하지 않습니다.  
> 정확한 심리 진단은 전문 임상심리사를 통해 받으시기 바랍니다.

---

## 개인정보 처리

- **수집 정보**: 이메일, 이름, 나이, 성별, 직업, 가족관계 (선택), 드로잉 이미지, 검사 응답
- 드로잉 이미지 및 검사 데이터는 AI 분석 목적으로만 사용되며, **제3자에게 제공되지 않습니다.**
- 분석은 Anthropic Claude API를 통해 처리되며, API 호출은 서버 사이드에서만 이루어져 **API 키 및 개인 데이터가 클라이언트에 노출되지 않습니다.**
- 계정 및 세션 데이터는 본인만 조회할 수 있으며, 세션 히스토리에서 언제든지 삭제할 수 있습니다.
- 서비스 이용 전 동의 화면을 통해 수집 항목 및 이용 목적을 고지합니다.
