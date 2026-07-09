# 배포 가이드 (Deployment Guide)

> GB10 홈서버 + Cloudflare Tunnel 프로덕션 배포 절차

**작성일**: 2026-07-09 (세션 #19)
**상태**: Accepted
**관련 파일**: `docker-compose.yml`, `docker-compose.prod.yml`, `nginx/nginx.conf`, `.env.example`

---

## 1. 배포 아키텍처

**전체 스택을 GB10 단일 호스트에서 docker compose로 운영**하고, Cloudflare Tunnel이 TLS 종단과 외부 노출을 담당한다.

```
인터넷 → Cloudflare (TLS, CDN, DDoS 방어)
           │  Tunnel (아웃바운드 연결 — 포트포워딩/방화벽 개방 불필요)
           ▼
       cloudflared 컨테이너
           ▼
       nginx (API Gateway, :80)
           ├── /api/portal/* → api-server:8080 (Spring Boot)
           ├── /health, /api/summary → api-server
           └── /* → frontend:3000 (Next.js production)
       api-server → ai-backend:8081 (글 요약, 내부 전용)
       api-server → portal-db:5432
```

### 이 구성을 선택한 이유
- **ai-backend가 GB10 로컬 Ollama에 의존** → 백엔드는 어차피 GB10에서 실행해야 함
- **동일 오리진** → HttpOnly refresh 쿠키/CORS 재작업 불필요 (Vercel 분리 시 크로스 도메인 쿠키 문제)
- **Cloudflare Tunnel** → 무료 TLS, 포트포워딩 불필요, 홈 IP 비노출

---

## 2. 사전 요구사항

| 항목 | 비고 |
|------|------|
| Docker + Compose v2.24+ | `!override` YAML 태그 사용 |
| Cloudflare 계정 | 무료 플랜으로 충분 |
| 도메인 | Cloudflare에 네임서버 연결 (구매 후 1회) |
| Ollama (선택) | AI 요약 기능용 — GB10 호스트에서 실행 중이어야 함 |

---

## 3. 배포 절차

### 3.1 환경변수 준비

```bash
cp .env.example .env
```

`.env`에서 **반드시** 설정할 값:

```bash
# 필수 (프로덕션 기동 자체가 거부됨)
JWT_SECRET=$(openssl rand -base64 64)   # 생성해서 붙여넣기
PUBLIC_URL=https://blog.example.com     # 실제 도메인

# DB 비밀번호 변경 (기본값 postgres 금지)
PORTAL_DB_PASSWORD=<강력한 비밀번호>

# OAuth2 (소셜 로그인 사용 시 — 콜백 URL을 PUBLIC_URL 기준으로 재등록)
OAUTH_GOOGLE_CLIENT_ID=...
OAUTH_GOOGLE_CLIENT_SECRET=...
OAUTH_GITHUB_CLIENT_ID=...
OAUTH_GITHUB_CLIENT_SECRET=...

# 터널 (3.3에서 발급)
CLOUDFLARE_TUNNEL_TOKEN=...
```

### 3.2 스택 기동

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --profile backend --profile frontend --profile gateway up -d --build

# 확인
curl -s http://localhost:80/health          # {"status":"UP",...}
curl -sI http://localhost:80 | head -1      # HTTP/1.1 200
```

### 3.3 Cloudflare Tunnel 연결 (도메인 확보 후)

1. [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks → Tunnels → Create a tunnel** (Cloudflared 방식)
2. 발급된 토큰을 `.env`의 `CLOUDFLARE_TUNNEL_TOKEN`에 저장
3. 터널 설정에서 **Public Hostname** 추가: `blog.example.com` → Service `HTTP` / `nginx:80`
4. 터널 컨테이너 기동:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --profile deploy up -d cloudflared
```

5. `https://blog.example.com` 접속 확인

### 3.4 도메인 없이 임시 검증 (trycloudflare)

도메인 구매 전 외부 접근 테스트:

```bash
# 스택 기동 후 (토큰/계정 불필요, 임시 URL 발급)
cloudflared tunnel --url http://localhost:80
# → https://<랜덤>.trycloudflare.com
```

> 임시 URL은 재실행마다 바뀌고 OAuth2 콜백 등록이 안 되므로 데모 확인 용도로만 사용.

---

## 4. 운영

### 업데이트 배포

```bash
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --profile backend --profile frontend --profile gateway up -d --build
```

### 로그 확인

```bash
docker compose logs -f api-server     # prod 프로필은 JSON 로그
docker compose logs -f cloudflared    # 터널 연결 상태
```

### 백업

```bash
docker exec portal-db pg_dump -U postgres portal_db > backup_$(date +%Y%m%d).sql
```

---

## 5. 보안 체크리스트 (배포 전 확인)

- [ ] `JWT_SECRET` 무작위 생성 값으로 교체 (`openssl rand -base64 64`)
- [ ] `PORTAL_DB_PASSWORD` 기본값(postgres) 변경
- [ ] `PUBLIC_URL` 설정 → 쿠키 `Secure` 플래그 + CORS 화이트리스트 자동 적용
- [ ] OAuth2 콜백 URL을 프로덕션 도메인으로 재등록 (Google/GitHub 콘솔)
- [ ] 시드 관리자 계정(`admin@example.com`) 비밀번호 변경
- [ ] `docker compose ps` 로 불필요 포트 노출 점검 (Tunnel만 외부 노출이므로 호스트 포트 바인딩은 내부용)

---

## 6. 남은 과제

- [ ] CI deploy 잡 (GitHub Actions → GB10 self-hosted runner 또는 SSH/webhook)
- [ ] 헬스체크 DB 프로브 (현재 `/health`가 UP 하드코딩 — Service Contract 미달)
- [ ] 모니터링 (Prometheus/Grafana — observability-design.md Phase 2)
