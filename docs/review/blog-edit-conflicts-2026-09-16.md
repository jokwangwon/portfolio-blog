# 글 저장 충돌 방지 구현·검증 기록

2026-09-16. 설계 커밋 `488c8c9`, 구현 브랜치 `feature/blog-edit-conflicts`.

## 변경

- V4는 posts에 edit_version(기본 0), edited_at(nullable), content_format(MARKDOWN_V1)을 추가한다. 기존 ID·본문·공개 범위를 보존하고 과거 편집 시각을 추측하지 않는다.
- PUT은 행 잠금 안에서 작성자 권한과 expectedEditVersion을 확인한다. 오래된 버전은 409 POST_EDIT_CONFLICT, 누락은 400 POST_EDIT_VERSION_REQUIRED다. 오류에 서버 본문은 포함하지 않는다.
- 실제 제목·본문·요약·분류·태그·상태·공개 범위 변경만 버전/편집 시각을 갱신한다. 동일 내용 재저장은 no-op이며 조회수·좋아요는 카운터만 갱신한다. 내 기록 목록은 본문을 제외한다.
- 편집 시작 버전을 유지하고 자신의 저장 성공 응답으로 갱신한다. 백그라운드 조회가 이를 올리지 않는다. 충돌 시 본문과 브라우저 복구본을 유지하고 저장 버튼을 잠근다. 최신 글 비교 후 사용자가 기준 버전을 선택해야 다시 저장할 수 있다. 비교·선택 자체는 저장하지 않는다.
- 오래되거나 버전이 없는 복구본은 명시적 비교가 필요하다. 자동 병합, 탭별 별도 복구본 이력, 수정 이력 저장, 영속 AI 분석은 구현하지 않았다.

## 검증

- Backend 전체 check: 173 tests / 실패·오류·skip 0. 실제 동시 PUT 하나 성공·하나 409, no-op, 카운터 독립성, 권한 우선 검사, 비공개 범위, 내 목록 본문 제외, V3→V4 기존 데이터 보존을 확인했다.
- Frontend 전체: 40 files / 223 tests, lint와 production build·TypeScript 검사 통과.
- 실제 Chromium 두 탭: 먼저 저장한 글 보존, 늦은 저장 409, 입력 유지, 비교만으로 저장되지 않음, 수동 반영 후 버전 2/연속 저장 버전 3, 구형 요청 400, 오래된 복구본 저장 잠금 확인.
- 모바일 390px 다크 모드와 데스크톱 비교 화면: 가로 넘침/JS 오류 없음. 초기 캡처의 검은 글자는 테마 전환 중이었으며 700ms 후 정상 글자색을 확인했다.
- 배포용 APP_BLOG_REQUIRE_EDIT_VERSION=false도 격리 API에서 검증했다. 운영 최종값은 true다.
- [브라우저 결과](assets/2026-09-16/edit-conflicts/results.json), [모바일 비교 화면](assets/2026-09-16/edit-conflicts/comparison-mobile-dark.png), [릴리스 명세](assets/2026-09-16/edit-conflicts/release.json).

## 운영 반영과 복구

- 배포 전 DB+첨부 백업: `backups/portal-20260916T065135Z-I2lVHw.dump` 및 같은 접두사의 `.attachments.tar.gz`.
- API 일시 호환 모드 → 새 프론트 → API 버전 필수 모드 순서로 배포했다. 운영 환경변수 true와 Flyway V4 성공을 확인했다. 기존 글 0건 유지.
- 공개 HTTPS health/blog/office/posts 200, 비로그인 PUT 401, JS 오류 없음. [공개 검증 결과](assets/2026-09-16/edit-conflicts/public-results.json). 운영에는 검증용 글을 만들지 않았다.
- 이전 이미지는 `before-edit-conflicts`, 신규 이미지는 `edit-conflicts`와 `latest` 태그다. 소스 및 테스트 묶음은 `backups/releases/edit-conflicts-2026-09-16-source.tar.gz`(0600)에 보관했다. 기존 미배포 BlogPreview 변경은 포함하지 않았다.
- 이전 API는 편집 버전을 올리지 않으므로 새 편집기와 혼합 운영하지 않는다. 우선 새 버전에서 수정하며, 불가피한 롤백은 글 쓰기를 중지한 뒤 호환되는 프론트/API를 함께 복원한다. 데이터 복원은 이후 작성분을 별도로 확보하고 DB·첨부 묶음으로 진행한다. 운영 볼륨을 삭제하지 않는다.
- 배포 전부터 열린 구형 편집 탭은 버전 없는 저장이 차단된다. 작성 중 내용을 복사해 보관한 뒤 새로고침하여 최신 편집기로 다시 연다.
