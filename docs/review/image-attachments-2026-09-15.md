# 이미지 첨부 구현·검증 기록

2026-09-15. 설계 커밋 `479ab9f`, 구현 브랜치 `feature/blog-image-attachments`.

## 변경

- PNG/JPEG 업로드, ImageIO 실파일 검사·메타데이터 제거, Flyway V3 attachments, api-server 영속 볼륨을 구현했다. 파일당 입력/출력 10MiB, 8192px/2000만 화소 제한이다.
- 글 본문은 UUID 첨부 URL을 저장한다. 업로드 직후 소유자만 조회하고, 글 연결 후 현재 공개 여부를 따라 조회한다. 실제 Markdown/HTML 이미지만 파싱하고 코드 예시는 제외한다. 첨부 행을 정렬해 잠그고 글 수정도 행 잠금으로 직렬화해 본문/연결 변경을 함께 커밋한다.
- 미사용 Hypersistence Hibernate 6.0용 의존성이 Hibernate 6.4 UUID 타입 등록과 충돌해 제거했다. 해당 라이브러리를 쓰는 소스는 없었다.
- 편집기에 파일 선택·붙여넣기·드래그, 업로드 중 저장 잠금, 오류 표시를 추가했다. 기존 data URL 이미지는 명시적 저장 때만 변환하며 실패 시 원문과 복구본을 보존한다. 비공개 이미지는 인증된 요청의 Blob으로 표시하고 로그아웃/인증 변경 시 폐기한다.
- DB 이후 첨부 파일을 백업하는 스크립트를 추가했다. 자동 삭제·정기 백업·외부 복제·OCR/이미지 AI 분석은 이번 구현에 포함하지 않았다.

## 검증

- Backend 전체 check: 167 tests 통과. 공개/비공개/초안/삭제/미연결, 소유권·다중 글 연결 거부, 동시 연결 경쟁, 손상/위장/크기/치수 제한, V2 데이터 보존 및 V3 migration을 확인했다.
- Frontend 전체: 40 files / 216 tests, lint 오류 0. 운영 Next.js 빌드와 TypeScript 검사 통과. 별도 기존 미배포 BlogPreviewSection은 빌드에서 제외했다.
- 실제 브라우저: 파일·paste·drop, 비공개 읽기, 공개→비공개 즉시 이미지 차단, 참조 제거 시 차단, 구형 이미지 변환/코드 보존, 모바일 다크/데스크톱 라이트, 가로 넘침·JS 오류 없음.
- 격리 production 정책 서버 재시작 후 이미지 유지. pg_dump와 파일 tar를 별도 DB/볼륨으로 복원하고 새 API에서 동일 SHA256 이미지 응답 확인.
- [검증 결과](assets/2026-09-15/image-attachments/results.json), [이미지·소스 manifest](assets/2026-09-15/image-attachments/release.json).

## 운영 복구 경계

- 배포 전 백업: `backups/portal-20260915T085616Z-Q8He7U.dump`. 이전 버전에 첨부 디렉터리가 없어 이 백업은 DB만 포함한다.
- 정확한 배포 소스: `backups/releases/image-attachments-2026-09-15-source.tar.gz` (0600). 이전 운영 이미지는 `before-image-attachments` 태그로 보관했다.
- 첨부 저장이 시작된 뒤 이전 backend로 단순 롤백하면 첨부 연결/보호를 처리하지 못한다. 우선 새 버전에서 수정하고, 불가피한 복원은 서비스 중지 후 호환되는 DB·첨부 묶음으로 수행한다. 운영 볼륨 삭제 금지.

## 병렬 프로젝트 출근

두 Codex 프로세스 중 honcheon-server에 훅이 없었다. 수집기의 명시적 `--allow-project`와 해당 프로젝트의 7개 훅을 연결했다. 글로벌 범위를 확장하지 않았다. Python 30 tests에서 두 프로젝트 동시 출근·개별 종료·중복 도구 이벤트·범위 제한을 확인했다. 사용자가 훅 활성화를 확인했으며, 실제 두 번째 출근은 활성화 후 해당 세션의 다음 UserPromptSubmit을 기다린다. 활성화 전 진행 중이던 턴을 프로세스 존재만으로 출근시키지 않는다.

## 운영 반영 결과

- Backend/frontend `image-attachments` 이미지를 운영 latest로 반영했다. V3 성공, API healthy, 첨부 볼륨 쓰기 가능, 기존 글 0건 유지 확인.
- 배포 후 DB·첨부 묶음: `backups/portal-20260915T090237Z-z9qviD.dump`와 같은 접두사의 `.attachments.tar.gz` (0600).
- 실제 Chromium에서 공개 HTTPS health/posts/office/blog 정상 확인. 단순 Python HTTP 클라이언트는 공개 중계에서 403이어서 브라우저로 재검증했다. [공개 검증](assets/2026-09-15/image-attachments/public-results.json).
