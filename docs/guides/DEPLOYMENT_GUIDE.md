# 배포 가이드 — GB10 + Cloudflare Tunnel

> 이미지 첨부는 api-server의 /app/data/attachments를 portal_attachments_data 영속 볼륨에 저장한다. scripts/backup-portal.sh는 DB dump 이후 같은 접두사의 .attachments.tar.gz도 생성한다. 복원은 서비스를 중지한 상태에서 DB와 같은 시점 첨부 묶음을 함께 복원하고 볼륨 파일 소유자를 이미지의 appuser에 맞춘다. docker compose down -v는 운영 첨부를 삭제하므로 사용하지 않는다. 첨부 사용 이후에는 파일을 처리하지 못하는 이전 backend로 단순 롤백하지 않는다.

업데이트: 2026-09-16. [공개 준비 설계](../architecture/public-release-design.md).

## 저장 버전 필수 정책

2026-09-16부터 운영 `APP_BLOG_REQUIRE_EDIT_VERSION=true`다. V4 API를 먼저 잠시 false로 배포하고 새 프론트를 올린 뒤 true로 확정했다. 평상시 false로 운영하지 않는다. 기존 탭은 작성 중 내용을 보관하고 새로고침해야 한다. API/프론트 교체 뒤 Nginx 설정 검사와 reload로 컨테이너 주소를 갱신한다. 이전 API는 버전을 증가시키지 않으므로 새 편집기와 혼합하지 않는다. [검증·복구 기록](../review/blog-edit-conflicts-2026-09-16.md).

## 공개 범위

첫 공개는 방문자 조회 전용이다. 운영 프로필은 회원가입·OAuth2·댓글·좋아요를 차단하고
기존 ADMIN 계정만 글·카테고리·태그·AI 요약을 관리한다. 개발 프로필은 기존 기능을 유지한다.
프런트 `NEXT_PUBLIC_PUBLIC_READ_ONLY`는 빌드 시 고정된다. 운영 Compose가 true를 주입한다.

인터넷 → Cloudflare HTTPS → Tunnel → nginx:80 → Next.js / Spring Boot → PostgreSQL.
AI 요약은 Spring Boot → 내부 FastAPI → Ollama로 연결된다.

## 1. 도메인 준비

선택한 공개 주소는 **https://gwangwon.dev**이다. Cloudflare에서 구매 완료했다. Cloudflare 네임서버·Tunnel·Published application route 연결을 완료했고 실제 HTTPS 페이지와 관리자 인증을 검증했다 (2026-09-13).

1. 본인 이름/닉네임 기반으로 오래 사용할 이름 2~3개를 고른다.
2. [Cloudflare Registrar 등록 안내](https://developers.cloudflare.com/registrar/get-started/register-domain/)에서
   사용 가능 여부, 최초 등록비와 갱신비를 확인한다. 해당 이름의 구매 가능 여부는 검색/결제 화면에서 확인해야 한다.
3. Cloudflare Registrar는 Cloudflare DNS를 사용한다. 한글 지원을 원하면
   [가비아](https://domain.gabia.co.kr/) 등에서 구매하고 Cloudflare에 사이트를 추가한 뒤 지정 네임서버로 변경한다.
4. 등록자 이메일을 인증하고 자동 갱신/결제 수단을 확인한다.

도메인 이름은 소유자 결정·결제가 필요하다. 도메인과 호스팅은 별개이며 이 프로젝트의 서버는 GB10이다.

## 2. 기존 데이터 백업과 계정 점검

기존 `.env`가 있으면 예시 파일로 덮어쓰지 않는다. 현재 DB 볼륨도 삭제하지 않는다.

```bash
bash scripts/backup-portal.sh
```

기본 출력은 `backups/*.dump`이며 Git에서 제외되고 소유자만 읽을 수 있다.
다른 디스크/호스트에도 복사하고, 아래처럼 **비어 있는 별도 검증 DB**에서 복원해 확인한다.
운영 DB에 `--clean`을 실행하지 않는다.

```bash
# 복원 대상은 별도로 만든 빈 검증 컨테이너/DB여야 한다.
# 실제 대상명과 백업 파일명을 확인한 뒤 실행한다.
docker exec -i RESTORE_CONTAINER pg_restore --exit-on-error --no-owner --no-acl \
  -U RESTORE_USER -d RESTORE_DB < backups/SELECTED.dump
```

운영 전 확인:
- 기존 ADMIN 계정 로그인과 비밀번호 변경. 조회 전용 운영에서는 가입으로 관리자 계정을 만들 수 없다.
- JWT_SECRET은 충분한 무작위 값. 생성 명령 `openssl rand -base64 64`의 **출력 값**을 .env에 저장한다.
- `PORTAL_DB_PASSWORD`는 현재 DB 계정 비밀번호와 일치해야 한다.
  기존 볼륨의 비밀번호는 .env만 바꿔서는 변경되지 않는다. 백업 후 DB 계정과 앱을 함께 갱신한다.
- 재부팅 후 Docker/Ollama가 복구되는지 확인한다.

## 3. 운영 환경변수

- `PUBLIC_URL=https://gwangwon.dev`: 필수. 쿠키 Secure/CORS/향후 OAuth 콜백의 기준.
- `JWT_SECRET`, `PORTAL_DB_PASSWORD`: 필수. 실제 값은 저장소·작업 로그에 포함하지 않는다.
- `GATEWAY_PORT`: 기본 80, 다른 서비스와 충돌하면 비어 있는 값 사용. 호스트 127.0.0.1에만 바인딩.
- `OFFICE_GITHUB_OWNER=jokwangwon`, `OFFICE_GITHUB_REPO=portfolio-blog`.
- `GITHUB_TOKEN`: 필요 시 GitHub 조회용 서버 토큰.
- `OLLAMA_HOST=http://host.docker.internal:11434`: 운영 Compose에서 Linux host-gateway 매핑 제공.
- `CLOUDFLARE_TUNNEL_TOKEN`: 마지막 외부 연결 단계에서만 필요.

OAuth2는 첫 공개에서 닫혀 있다. 추후 열 때 Google/GitHub 자격증명을 설정하고
`https://gwangwon.dev/oauth2/callback/google`, `/github`를 공급자 콘솔에 등록한다.
프런트는 동일 오리진 `/oauth2/authorize/*`를 사용한다.

## 4. 운영 스택 검증

먼저 백업·계정 확인을 마치고 대상 포트/컨테이너를 확인한다. 이 명령은 기존 컨테이너를 재생성할 수 있다.
DB/API/AI/Frontend 호스트 포트가 제거되므로 기존 localhost DB 도구는 더 이상 직접 연결할 수 없다.
다른 프로젝트가 해당 DB 호스트 포트에 의존하는지 확인한다.

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --profile backend --profile frontend --profile gateway config -q

docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --profile backend --profile frontend --profile gateway up -d --build
```

기본 운영 스택은 미사용 ai-bench-db를 시작하지 않는다. 기존 실행 중인 ai-bench-db를 자동 중단하지는 않는다.
진단용 pgAdmin은 tools 프로필과 loopback 포트로만 사용한다.

```bash
curl --fail http://127.0.0.1:80/health
curl --fail http://127.0.0.1:80/api/portal/posts
```

실제 GATEWAY_PORT에 맞춰 URL을 바꾼다. `/health`는 DB 정상이면 200 UP, 장애면 503 DOWN.
Actuator/Swagger/관리자 Office 경로는 운영 Nginx에서 404.
로컬 HTTP에서는 Secure 쿠키 로그인을 최종 검증할 수 없으므로 HTTPS 단계에서 재확인한다.

## 5. 마지막 단계: 외부 공개

[Cloudflare Tunnel 공식 설정 안내](https://developers.cloudflare.com/tunnel/get-started/)에 따라
터널의 Routes → Add route → Published application에서 `gwangwon.dev` → `http://nginx:80`으로 설정한다.
하위 도메인과 Path는 비운다. 서비스 URL을 한 칸에 입력하는 화면에는 **`http://nginx:80`** 전체를 입력한다.
타입/주소를 따로 입력하는 화면은 HTTP와 `nginx:80`을 입력한다.
Cloudflare One 화면에서는 Published application routes라는 탭으로 표시될 수 있다.
토큰은 .env의 CLOUDFLARE_TUNNEL_TOKEN에 저장한다.

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --profile backend --profile frontend --profile gateway --profile deploy up -d cloudflared
```

외부 휴대폰 네트워크와 데스크톱에서 확인:
- 홈/블로그/게시글/Office 조회, 실제 연락처·프로젝트 링크.
- 가입·댓글·좋아요 UI 부재, 직접 API 쓰기 차단.
- 관리자 로그인 → 초안 저장·목록·편집 → 발행 → 조회 → 로그아웃.
- 미발행 글의 익명 접근 차단, 이미지·표·코드·수식·Mermaid 표시.
- DB/AI 장애 시 오류 화면과 복구.

도메인 없이 Quick Tunnel로 외부 테스트할 수도 있지만 임시 URL은 영구 주소로 사용하지 않는다.
토큰 없는 외부 공개도 데이터 노출이므로 로컬 준비/검증 완료 후에만 수행한다.

## 6. 운영과 되돌리기

업데이트 전 Git 커밋과 현재 이미지 ID를 기록하고 DB를 백업한다. 이전 이미지에 별도 태그를 붙여 유지한다.
문제 발생 시 해당 이미지와 설정으로 복구한다. DB 마이그레이션이 있으면 구버전 호환성을 먼저 확인한다.
이 공개 준비 변경은 DB 스키마를 변경하지 않는다.

로그: `docker compose logs --tail=100 api-server nginx` (토큰이 포함될 수 있는 전체 config 출력은 공유하지 않는다).
백업 스크립트를 매일 실행하도록 스케줄링하고, 장애 알림과 복원 훈련을 운영 항목으로 관리한다.

### 공개 Office 수집기 (2026-09-15)

frontend에는 `.office-presence/public` 디렉터리만 읽기 전용으로 연결한다. 사용자 서비스 설정·방송 제어·명령 연결은 [Office 운영 안내](OFFICE_PRESENCE.md)를 따른다. 기존 admin Office API 운영 차단 유지.
