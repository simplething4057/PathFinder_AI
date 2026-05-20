# PathFinder AI — 클라우드타입 배포 가이드

> 백엔드(Express) + PostgreSQL + 프론트엔드(Vite/React) → 클라우드타입 하나의 프로젝트로 배포

---

## 사전 준비

1. [cloudtype.app](https://cloudtype.app) 계정 생성 (GitHub 소셜 로그인 권장)
2. GitHub에 프로젝트 push (아래 참고)
3. Anthropic API 키 준비

### GitHub push 전 확인

```
# .gitignore가 다음을 제외하는지 확인
pathfinder-server/.env
pathfinder-app/.env
node_modules/
```

```bash
git init
git add .
git commit -m "init: PathFinder AI"
git remote add origin https://github.com/YOUR_NAME/pathfinder-ai.git
git push -u origin main
```

---

## 구조 한눈에 보기

클라우드타입에서 **하나의 프로젝트** 안에 서비스 3개를 배포합니다.

```
클라우드타입 프로젝트
├── postgresql-prod   ← PostgreSQL DB (서비스명이 곧 내부 호스트명)
├── pathfinder-server ← Node.js 백엔드 (서브디렉토리: pathfinder-server/)
└── pathfinder-app    ← React 정적 사이트 (서브디렉토리: pathfinder-app/)
```

백엔드 → DB 통신은 `postgresql-prod:5432`(내부 호스트)로 SSL 없이 연결됩니다.

---

## STEP 1 — GitHub push 후 클라우드타입 접속

[app.cloudtype.io](https://app.cloudtype.io) → **새 프로젝트 생성**

프로젝트 이름: `pathfinder-ai` (자유)

---

## STEP 2 — PostgreSQL 서비스 추가

1. 프로젝트 화면 → **서비스 추가** → `⌘+K` 또는 검색창에 `postgres` 입력 → **PostgreSQL** 선택
2. **설정변경** 클릭 → 서비스 이름을 **`postgresql-prod`** 으로 설정 (⚠️ 이 이름이 내부 호스트명이 됩니다)
3. **Root Password** 입력 후 **배포하기**

배포 완료 후 해당 서비스 → **도메인 탭** 에서 아래 두 주소를 확인합니다.

| 용도 | 형식 | 비고 |
|------|------|------|
| 내부 통신 (백엔드→DB) | `postgresql-prod:5432` | 고정, SSL 불필요 |
| 외부 접속 (pgAdmin 등) | `svc.xxx.cloudtype.app:[포트]` | TCP 허용 필요, 재배포 시 포트 변경 |

### DB 스키마 초기화

#### 방법 A — pgAdmin / DBeaver (외부 툴)

1. 프로젝트 설정(⚙️) → **TCP 외부 접속 허용하기** 활성화 → 적용
2. 외부 호스트(`svc.xxx.cloudtype.app:[포트]`)로 접속
   - User: `postgres`
   - Password: 위에서 설정한 Root Password
   - Database: `postgres`
3. 아래 SQL 실행 후 TCP 허용 다시 비활성화 권장

#### 방법 B — 백엔드 서비스 터미널 (STEP 3 배포 후)

백엔드 서비스 → **터미널** 탭 → `psql -h postgresql-prod -U postgres` 접속 후 SQL 실행

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

---

## STEP 3 — 백엔드 서비스 배포

1. 프로젝트 화면 → **서비스 추가** → `⌘+K` → `node` 검색 → **Node.js** 선택
2. **나의 저장소 선택** → `pathfinder-ai` 저장소 선택
3. **설정변경** 클릭:
   - **서브 디렉토리**: `pathfinder-server`
   - **Start Command**: `npm start`
   - **Port**: `3001`
4. **환경변수** 설정 (배포 전 또는 후에 설정 가능):

| 변수명 | 값 |
|--------|-----|
| `DB_HOST` | `postgresql-prod` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `postgres` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | STEP 2에서 설정한 Root Password |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` |
| `JWT_SECRET` | 랜덤 문자열 64자 이상 |
| `CLIENT_ORIGIN` | (STEP 4 완료 후 입력) |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |

5. **배포하기** → 완료 후 도메인 탭에서 **백엔드 URL** 복사
   - 예: `https://pathfinder-server.kr1.cldtype.io`

> `DATABASE_URL` 환경변수를 설정하지 않으면 `db/index.js`가 자동으로 개별 변수(`DB_HOST` 등) 방식으로 동작합니다.

---

## STEP 4 — 프론트엔드 서비스 배포

1. 프로젝트 화면 → **서비스 추가** → `⌘+K` → `node` 검색 → **Node.js** 선택
2. **나의 저장소 선택** → 같은 `pathfinder-ai` 저장소 선택
3. **설정변경** 클릭:
   - **서브 디렉토리**: `pathfinder-app`
   - **Install Command**: `npm install`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run serve`
   - **Port**: `3000`
4. **환경변수** 설정:

| 변수명 | 값 |
|--------|-----|
| `VITE_API_URL` | STEP 3에서 복사한 백엔드 URL |
| `VITE_USE_MOCK` | `false` |

5. **배포하기** → 완료 후 도메인 탭에서 **프론트엔드 URL** 복사

> `npm run serve`는 `node server.cjs`를 실행합니다. gzip 압축과 SPA fallback이 적용된 Express 기반 정적 서버입니다. 클라우드타입이 `PORT` 환경변수를 자동 주입합니다.

---

## STEP 5 — CORS 설정 업데이트

백엔드 서비스 → **환경변수** 탭:

```
CLIENT_ORIGIN = https://pathfinder-app.kr1.cldtype.io
```

(STEP 4에서 얻은 실제 프론트엔드 URL로 교체)

저장 후 백엔드 서비스 **재배포** (우측 상단 재배포 버튼 또는 git push)

---

## STEP 6 — 동작 확인

```bash
# 헬스체크
curl https://YOUR_BACKEND_URL/health
# → {"ok":true}

# 회원가입 테스트
curl -X POST https://YOUR_BACKEND_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"12345678","name":"테스트","age":30,"gender":"남"}'
```

브라우저에서 프론트엔드 URL 접속 → 로그인/회원가입 정상 작동 확인

---

## 배포 후 유지보수

### 코드 업데이트 배포

```bash
git push origin main
# → 클라우드타입이 변경된 서비스를 자동 감지해 재배포
```

### 로그 확인

각 서비스 → **로그뷰** 탭에서 실시간 로그 확인

### 이전 버전 복원

각 서비스 → **배포 이력** 탭 → 원하는 버전 클릭 → **복원**

---

## ⚠️ 데이터 백업 주의

클라우드타입 PostgreSQL은 **자동 백업을 지원하지 않습니다**.
정기적으로 아래 명령으로 수동 백업하세요:

```bash
# 로컬에서 실행 (TCP 외부 접속 허용 상태에서)
pg_dump -h svc.xxx.cloudtype.app -p [포트] -U postgres -d postgres > backup_$(date +%Y%m%d).sql
```

운영 단계에서는 **Neon** (클라우드타입 Integrations 지원, 자동 백업 포함) 사용을 권장합니다.

---

## 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| `ECONNREFUSED` DB 오류 | `DB_HOST` / `DB_PASSWORD` 오입력 | 환경변수에서 PostgreSQL 서비스명·비밀번호 재확인 |
| CORS 오류 | `CLIENT_ORIGIN` 불일치 | 프론트엔드 URL 정확히 입력 후 백엔드 재배포 |
| 빌드 실패 (프론트) | `serve` 패키지 없음 | `pathfinder-app/package.json`의 `serve` 의존성 확인 |
| API 401 오류 | `JWT_SECRET` 미설정 | 환경변수 탭 확인 |
| Claude API 오류 | `ANTHROPIC_API_KEY` 오류 | 실제 API 키 값 재입력 |
| 포트 불일치 | Start Command와 PORT 환경변수 불일치 | `PORT=3001` 환경변수와 클라우드타입 포트 설정 동일하게 맞추기 |
