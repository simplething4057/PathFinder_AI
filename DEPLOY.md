# PathFinder AI — Railway 배포 가이드

> 백엔드(Express) + PostgreSQL → Railway  
> 프론트엔드(Vite/React) → Railway Static Site

---

## 사전 준비

1. [railway.app](https://railway.app) 계정 생성
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

## STEP 1 — Railway 프로젝트 생성

1. railway.app 접속 → **New Project**
2. **Deploy from GitHub repo** 선택 → 저장소 연결
3. 서비스가 자동 감지되면 일단 **취소** (서비스를 수동으로 구성할 예정)

---

## STEP 2 — PostgreSQL 추가

1. 프로젝트 화면에서 **+ Add Service** → **Database** → **PostgreSQL**
2. 생성 완료 후 PostgreSQL 서비스를 클릭 → **Variables** 탭
3. `DATABASE_URL` 값을 복사해 둡니다 (백엔드 서비스에 자동 주입됩니다)

### DB 스키마 초기화

PostgreSQL 서비스 → **Query** 탭에서 아래 SQL 실행:

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

1. 프로젝트 화면 → **+ Add Service** → **GitHub Repo** → 같은 저장소 선택
2. 서비스 설정:
   - **Root Directory**: `pathfinder-server`
   - **Start Command**: `node src/index.js` (package.json의 start 스크립트 자동 감지)

3. **Variables** 탭에서 환경변수 추가:

| 변수명 | 값 |
|---|---|
| `DATABASE_URL` | (PostgreSQL 서비스에서 자동 주입 — Reference Variable로 연결) |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` (실제 키 입력) |
| `JWT_SECRET` | 랜덤 문자열 64자 이상 |
| `CLIENT_ORIGIN` | 프론트엔드 배포 URL (나중에 입력) |
| `NODE_ENV` | `production` |

> `DATABASE_URL` 연결 방법: Variables 탭 → **Add Reference Variable** → PostgreSQL 서비스의 `DATABASE_URL` 선택

4. 배포 완료 후 **백엔드 URL** 복사 (예: `https://pathfinder-server-production.up.railway.app`)

---

## STEP 4 — 프론트엔드 서비스 배포

1. 프로젝트 화면 → **+ Add Service** → **GitHub Repo** → 같은 저장소 선택
2. 서비스 설정:
   - **Root Directory**: `pathfinder-app`
   - **Build Command**: `npm run build`
   - **Start Command**: `npx serve dist -l $PORT` (또는 아래 참고)

> Railway에서 정적 사이트를 serve하려면 `serve` 패키지가 필요합니다:
> ```bash
> # pathfinder-app 폴더에서 로컬 실행
> npm install serve --save-dev
> ```
> package.json scripts에 추가:
> ```json
> "serve": "serve dist -l $PORT"
> ```
> Start Command: `npm run serve`

3. **Variables** 탭에서 환경변수 추가:

| 변수명 | 값 |
|---|---|
| `VITE_API_URL` | STEP 3에서 복사한 백엔드 URL |
| `VITE_USE_MOCK` | `false` |

4. 배포 완료 후 **프론트엔드 URL** 복사

---

## STEP 5 — CORS 설정 업데이트

백엔드 서비스 → **Variables** 탭에서:

```
CLIENT_ORIGIN = https://pathfinder-app-production.up.railway.app
```

(STEP 4에서 얻은 프론트엔드 URL로 교체)

변수 저장 → 백엔드 서비스 자동 재배포 대기

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
# → Railway가 변경된 서비스를 자동 감지해 재배포
```

### 로그 확인
Railway 각 서비스 → **Deployments** 탭 → 최신 배포 클릭 → **Logs**

### 무료 플랜 한계
- Railway 무료 플랜: 월 $5 크레딧 (소규모 사용 시 충분)
- PostgreSQL 스토리지: 1GB
- 트래픽 초과 시 유료 플랜 업그레이드 필요

---

## 문제 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| `ECONNREFUSED` DB 오류 | `DATABASE_URL` 미설정 | Variables에서 Reference Variable 재확인 |
| CORS 오류 | `CLIENT_ORIGIN` 불일치 | 프론트엔드 URL 정확히 입력 |
| 빌드 실패 | `serve` 패키지 없음 | `npm install serve --save-dev` 후 push |
| API 401 오류 | `JWT_SECRET` 환경변수 누락 | Variables 탭 확인 |
| Claude API 오류 | `ANTHROPIC_API_KEY` 오류 | 실제 API 키 값 재입력 |
