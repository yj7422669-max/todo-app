# 오늘의 할 일

Next.js + Express + PostgreSQL Todo 앱입니다. 미니멀·파스텔·다크모드 디자인과 추가·조회·완료 변경·삭제 기능을 제공합니다. Todo는 PostgreSQL에, 디자인 선택은 브라우저 localStorage에 저장합니다.

## 프로젝트 구조

- `app/page.tsx`: 디자인 선택 및 Todo CRUD 화면
- `app/globals.css`, `app/layout.tsx`: 기존 스타일과 공통 레이아웃
- `api/server.js`: Express API와 PostgreSQL 연결 (4000번 포트)
- `next.config.js`: standalone 빌드 및 `/api/*` 프록시
- `Dockerfile`, `api/Dockerfile`: Web 다단계 빌드 및 API 이미지
- `compose.yaml`: Web, API, PostgreSQL 실행 및 named volume
- `db/init.sql`: 신규 DB의 todos 테이블 초기화

## Docker Compose 실행

Docker Engine 또는 Docker Desktop과 Docker Compose가 필요합니다. 프로젝트 루트에서:

```bash
cp .env.example .env
```

`.env`의 `POSTGRES_PASSWORD`를 원하는 비밀번호로 변경한 뒤 실행합니다. PowerShell에서는 `cp` 대신 `Copy-Item`을 사용할 수 있습니다.

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f
```

브라우저에서 http://localhost:3000 을 엽니다. 기존 로컬 Web이 실행 중이면 먼저 종료해 3000번 포트를 비워주세요.

브라우저 → Web `/api/*` 프록시 → `api:4000` → `db:5432`로 연결됩니다. Compose 기본 네트워크에서 서비스 이름으로 통신하며, 호스트에는 Web의 3000번 포트만 공개합니다. DB가 준비되면 API를, API가 준비되면 Web을 시작합니다.

DB 자격 증명은 루트 `.env`에서 주입하며, Docker 실행에서는 기존 `api/.env`를 사용하지 않습니다. 프록시 주소 `API_INTERNAL_URL`은 Web 이미지 **빌드 시** 설정됩니다. Compose는 `http://api:4000`, 로컬은 기본 `http://localhost:4000`을 사용합니다. 주소 변경 시 Web을 다시 빌드하세요.

종료:

```bash
docker compose down
```

Todo는 `postgres_data` named volume(실제 이름에는 Compose 프로젝트 접두사가 붙음)에 남아 다음 실행에도 유지됩니다. `docker compose down -v`는 DB 볼륨까지 삭제하므로 데이터 보존 시 사용하지 마세요.

초기화 SQL은 빈 볼륨의 최초 실행에서만 적용됩니다. 기존 로컬 PostgreSQL 데이터는 변경하거나 자동 이전하지 않습니다. 기존 데이터가 필요하면 별도로 백업·복원해야 합니다. 볼륨 생성 후 `.env`의 비밀번호만 바꿔도 DB 내부 비밀번호가 변경되지는 않습니다.

## 기존 로컬 실행

Node.js 22와 로컬 PostgreSQL을 준비합니다. 기존 `api/.env`가 있으면 그대로 사용하세요. 없으면:

```bash
cp api/.env.example api/.env
```

`api/.env`에 로컬 PostgreSQL의 호스트, 포트, DB 이름, 사용자, 비밀번호를 설정합니다. DB가 없다면 먼저 해당 사용자와 DB를 생성하세요. 새 DB에는 테이블을 생성합니다(기존 todos 테이블은 유지).

```bash
psql -h localhost -U postgres -d todo_db -f db/init.sql
```

터미널 1:

```bash
cd api
npm ci
node server.js
```

터미널 2 (프로젝트 루트):

```bash
npm ci
npm run dev
```

http://localhost:3000 에 접속합니다. PowerShell에서 npm 실행 정책 오류가 있으면 `npm` 대신 `npm.cmd`를 사용하세요. 로컬 API 포트를 변경하면 루트 `.env.local`에 `API_INTERNAL_URL=http://localhost:변경포트`를 설정하고 Web을 재시작하세요.

## 민감정보와 검증

`.env`, `.env.local`, `api/.env` 등은 기존 `.gitignore`의 `.env*` 규칙으로 제외됩니다. `.env.example`만 공유하며 실제 비밀번호를 적지 마세요. 각 `.dockerignore`도 환경 파일과 node_modules를 제외합니다.

```bash
npm run typecheck
docker compose config --quiet
curl http://localhost:3000/api/health
```

화면에서 Todo 추가 → 조회 → 완료 변경 → 삭제를 확인할 수 있습니다. 데이터 유지 확인은 Todo를 하나 추가한 뒤 `docker compose down`과 `docker compose up -d`를 실행해 확인하세요.
