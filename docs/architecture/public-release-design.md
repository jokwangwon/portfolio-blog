# 공개 1차 버전 준비

작성일: 2026-09-13. 사용자 요청: 공개 버전 준비 진행 승인.

## 범위

포트폴리오, 블로그, 공개 Pixel Office를 첫 공개 대상으로 한다. AI 벤치마크,
Registry 대시보드, 운영용 관리자 Office SSE는 후속 작업이다.
사용자 결정: 방문자는 조회만 가능. 운영에서 가입·소셜 로그인·댓글·좋아요를 닫고 기존 관리자만 글을 관리한다. app.public-read-only=true 및 NEXT_PUBLIC_PUBLIC_READ_ONLY=true로 운영에 적용한다. 도메인은 Cloudflare에서 `gwangwon.dev` 구매 완료이며 연락처는 GitHub를 제공한다.

## 구현 기준

- `/blog/drafts`: 인증 완료 후 본인의 DRAFT 글만 페이지 단위로 조회하며,
  클릭하면 편집기로 이동한다. 로딩/빈 목록/오류/비로그인 상태를 구분한다.
- `/api/portal/posts/my`는 인증 필수. DRAFT/ARCHIVED 상세는 작성자만 조회하고,
  그 외에는 404를 반환한다. 미공개 글 조회는 조회수를 늘리지 않는다.
- 공개 상세는 기존 sanitize 적용 MarkdownRenderer를 사용한다.
- Pixel Office GitHub 소유자 기본값은 기존 프로필과 같은 `jokwangwon`이다.
  소유자·저장소·토큰은 서버 환경변수로 주입한다.
- 검증되지 않은 연락처/이력서 링크를 노출하지 않는다. 확정 전에는 GitHub를 제공한다.
- OAuth2 로그인은 동일 오리진 `/oauth2/authorize/*`로 이동하며 Nginx가 API로 전달한다.
  운영 콜백은 PUBLIC_URL의 HTTPS 주소를 명시하고 OAuth 자격증명을 컨테이너로 전달한다.
- 운영 Compose는 DB/API/AI/Frontend 호스트 포트를 제거하고 Nginx는 loopback만 바인딩한다.
  운영 Nginx에서 Actuator/API 문서/관리자 Office를 차단한다.
- `/health`는 DB 연결이 정상일 때 200 UP, 실패 시 503 DOWN을 반환한다.
  연결·비밀번호 등 내부 정보는 응답에 포함하지 않는다.
- 운영 환경에서 상세 예외/스택을 반환하지 않는다.

## 검증과 공개 완료 조건

- 핵심 회귀 테스트: 미공개 글 접근 경계, 내 글 인증, DB 장애 응답, 초안 목록 이동.
- 프론트 lint/test/build, 백엔드 check, 문서 링크 검증, 운영 Compose와 Nginx 검증.
- 운영 DB/계정/실행 중인 다른 서비스는 준비 작업 중 변경하지 않는다.
- 실제 공개 전: DB 백업·복원 확인, 관리자/DB/JWT 자격증명 점검, 운영 콘텐츠 확정,
  도메인/Tunnel 등록(OAuth는 첫 공개에서 비활성), HTTPS에서 로그인·게시글 CRUD·모바일 검증.
- 테스트 통과와 실배포 완료를 구분해 기록한다. 미수행 항목은 완료로 표시하지 않는다.
