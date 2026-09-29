# 프로젝트 컨텍스트 (Project Context)

> **AI 에이전트가 세션 시작 시 가장 먼저 읽어야 하는 문서**
> 현재 프로젝트 상태, 진행 중인 작업, 다음 할 일을 기록

**최종 업데이트**: 2026-09-29 (세션 #24)

## AI Backend 포트폴리오 개편 및 Git 정리 (2026-09-29)

- Hero를 이름·AI Backend 직무·서비스 연결 역량·경력/논문/운영 근거로 변경했다. Selected Work는 민원e와 혼천, 다음은 Publication과 공개 개인 도구다.
- 민원e는 사용자 제공 담당 범위만 공개하고, 혼천은 개별 코드 구현·검토 실험·전체 월드 설계 범위를 구분했다. 논문 제목·저자 순서·DOI는 KCI 공식 기록으로 확인했다.
- Frontend 223 tests, 변경 파일 lint, production build/TypeScript, 320/390/1280px 라이트·다크 브라우저 6개 조합 통과. 운영 배포는 하지 않았다.
- 사용자 요청으로 이전 미커밋 문서·검증 자료·설정·BlogPreview와 이번 개편을 모두 Git 저장 대상으로 정리한다. 문서와 구현을 별도 브랜치로 분리하고 Conventional Commits와 기존 커밋 훅을 적용한다. 비밀값·백업·로컬 세션 자료는 기존 Git 제외 유지.
- [개편 근거와 확인 과제](content/portfolio-positioning-2026-09-29.md) · [세션 기록](sessions/SESSION_2026-09-29.md).





## 글 저장 충돌 방지 운영 반영 (2026-09-16)

- V4 편집 버전, 조건부 PUT, 조회 카운터 독립 갱신, 내 기록 목록 본문 제외를 구현했다. 편집기 충돌 안내·최신 글 비교·오래된 복구본 보호가 적용됐다.
- Backend 173 / Frontend 223 tests, 두 탭 실제 409와 연속 저장, 모바일 다크 화면 검증 통과. 운영 API·frontend edit-conflicts 배포, 최종 버전 필수 true, Flyway V4 성공, 공개 경로 정상 확인.
- [검증·백업·복구 기록](review/blog-edit-conflicts-2026-09-16.md). 기존 미배포 BlogPreview와 관련 없는 변경은 보존했다.
- 다음 단계: 실제 기록 작성 → 수정 이력/복원 → 영속 AI 요약·분석. 수정 이력과 영속 AI는 아직 설계 상태다.

## 이미지 첨부 및 병렬 프로젝트 출근 (2026-09-15)

- 파일 선택·붙여넣기·드래그 업로드, V3 attachments/영속 볼륨, 현재 글 공개 범위에 따른 이미지 조회를 구현했다. 기존 data URL은 명시적 저장 때 변환한다. DB+첨부 백업과 별도 복원 검증을 완료했다.
- Backend167 / Frontend216 tests, 운영 빌드, 실제 브라우저 공개·비공개·모바일 검증 통과. [구현·검증 보고서](review/image-attachments-2026-09-15.md).
- honcheon-server에 없던 출근 훅 7개를 중앙 수집기에 연결했다. --allow-project로 해당 프로젝트만 추가한다. Python30 tests 통과. 사용자 훅 활성화 확인, 다음 실제 작업 시작 이벤트부터 집계.
- 이력 저장·AI 분석은 설계 상태이며 이번 첨부 구현과 구분한다.

## 글 저장·호출과 향후 AI 데이터 설계 (2026-09-15)

- 사용자 요청으로 현재 PostgreSQL 저장, 브라우저 복구, Java/FastAPI 동기 요약 흐름을 조사했다. 글 데이터·운영 서비스에는 변경 없음.
- 3+1 설계 검토 후 기존 posts + post_revisions + post_ai_runs(JSONB 결과)의 최소 구조를 문서화했다. 편집 충돌 버전과 AI 입력 fingerprint를 분리하고 조회 카운터에 의한 수정 시각 혼용을 선행 수정 대상으로 정했다.
- 원문 이력·AI 결과는 작성자 전용, 원문 자동 덮어쓰기 없이 선택 적용, 현재 권한 재검사, 로컬/외부 처리 선택을 공개 여부와 분리한다.
- [저장·AI 설계안](architecture/knowledge-storage-ai-design.md): 필드·API·비동기 실행·복원·마이그레이션·필수 검증. 구현 순서는 편집 버전/목록 경량화 → 수정 이력 → 영속 요약 → 분류·학습 분석 → 첨부·내보내기·링크/그래프다.
- docs/knowledge-storage-ai-design 브랜치에서 문서만 작업. 새 DB 테이블·API·모델 호출은 아직 구현/실행하지 않았다.

## 블로그 공개 범위·내 기록 운영 반영 (2026-09-15)

- 사용자 승인으로 PUBLIC/PRIVATE 공개 범위를 작성 상태와 분리하고 편집·복구·개인 목록 필터·비공개 조회 차단을 구현했다. 기본 공개, 선택 비공개, 방문자 조회 전용이다.
- 운영 backend/frontend `blog-visibility` 이미지를 배포했다. Flyway V2 성공, 백업 완료, 공개 글 0건 유지. 소스 기준 커밋 `c0f29a0`으로 이전 운영 변경을 정리했고 기능 구현은 `fa76c72`로 커밋했다. 임시 검증 컨테이너·DB·네트워크 정리 완료.
- backend151/frontend202 tests, 운영 빌드, 실제 브라우저 공개→비공개→로그아웃 검증 통과. [구현·검증·복구 보고서](review/blog-visibility-2026-09-15.md).
- PRIVATE 글 작성 후 이전 backend로 단순 롤백하면 보호가 사라지므로 사용하지 않는다. 기존 미배포 BlogPreviewSection 및 관련 없는 미커밋 문서는 보존했다.
- 다음: 실제 기록 작성과 분류 검증 → 문서 링크/역링크 → 관계 그래프.

## 프로젝트별 현재 업무·최근 작업 칠판 (2026-09-15)

- 사용자 요청에 따라 작업실 장문 소개·세션 해설·전체 프로젝트/최근 글 모음을 제거했다. 작업실 제목과 사무실·칠판만 남기고 칠판 하단에 기록/프로젝트 링크를 제공한다.
- 허용된 프로젝트 루트 폴더명을 projectName으로 표시하며 frontend/backend 등의 하위 작업은 같은 프로젝트로 묶는다. 칠판은 프로젝트별 현재 세션과 업무(publicTitle 또는 activity)를 보여준다. 현재 연결 범위는 기존 portfolio-blog 저장소로 유지한다.
- 실제 start/update 이벤트의 최근 프로젝트/시각 한 건을 소유자 전용 파일에 남긴다. 종료/프로세스 종료 뒤 현재 인원과 조명에서 제외하고 유휴 칠판에만 최근 작업을 표시한다. 수집기 재시작 뒤 유지, 하트비트로 시각 갱신 없음. 방송 off 시 삭제, 연결 장애 시 숨김. 원문·명령·전체 경로 수집/공개 없음.
- Python 26 tests, Office 78 tests 및 실제 파일 읽기 Unicode 최대24세션 테스트1개 통과(총 Office79). 수정 컴포넌트 lint·최종 production build/TypeScript 통과. 스냅샷 크기 상한을 64KiB로 조정해 최대 길이 Unicode 프로젝트명/공개 제목이 포함된 JSON도 수용한다.
- [프로젝트 칠판 검증](review/assets/2026-09-15/workroom-projects/project-board-results.json): 프로젝트 묶음·세션 선택·유휴/최근 전환·새로고침·활동 시각 유지·off/연결 장애·320/390px·JS 오류 없음. [기존 Office 검증](review/assets/2026-09-15/workroom-projects/preview-results.json): 출퇴근·고양이·4계절/라이트·다크 회귀 통과. [진행 중](review/assets/2026-09-15/workroom-projects/projects-working.jpg), [최근 작업](review/assets/2026-09-15/workroom-projects/projects-recent-dark.jpg)은 로컬 검증용 작업이다.
- [공개 HTTPS 검증](review/assets/2026-09-15/workroom-projects/public-results.json): 실제 Codex 1명과 portfolio-blog 프로젝트명/최근 프로젝트 필드, 간결한 화면, 모바일/테마/새로고침·상호작용·JS 오류 없음 확인. health200/관리자404/공개쓰기405. 실제 응답 종료 뒤 최근 칠판 전환은 자동 테스트/로컬 브라우저로 검증했으며 이번 턴 종료 후 외부 관찰은 하지 않았다.
- 운영 workroom-projects/latest: sha256:8ce9d3cf33ace32c0d652579f553d51e7bc8c6c442898f140e3847070ad68f9d. 이전 before-workroom-projects 보관. frontend 소스5개 변경·WorkroomResources 제거, 수집기 갱신 후 사용자 서비스 restart. [릴리스](review/assets/2026-09-15/workroom-projects/release.json), backups/releases/workroom-projects-2026-09-15-source.tar.gz(0600)에 frontend/수집기/이전 수집기 복구본 보관. Hook 설정·허용 범위·DB·글 변경 없음. 별도 미배포 BlogPreviewSection 제외, Git 커밋/푸시/PR 없음.

## 개인 작업실과 기록 탐색 정리 (2026-09-15)

- 사용자 승인: 채용 포트폴리오와 개인 개발·학습 공간의 역할을 구분했다. 양쪽 헤더에 포트폴리오(/)·기록(/blog)·작업실(/office) 메뉴를 제공하고, 홈에 프로젝트·경력·소개 목차를 유지한다. 블로그 소개는 개발·학습·독서 기록으로 넓혔다.
- /office 주소는 유지하며 제목/메타데이터를 작업실로 변경했다. AI 도구와 진행하는 작업의 표현임을 소개하고 세션 종료와 프로젝트 완료의 차이를 안내한다. 포트폴리오 프로젝트 목록에는 작업실 시각화 구현을 한 항목으로 소개한다.
- 칠판에서 프로젝트·기록 영역으로 이동할 수 있다. 기존 공개 프로젝트 6개의 소스 링크와 공개 글 API 기반 최근 기록 3개를 표시한다. 제목을 이용한 세션-글 관계 추측은 하지 않는다. 로딩/빈 목록/조회 실패/재시도 상태를 구분한다.
- 전체 frontend 193 tests/36 files, 변경 파일 lint, production build/TypeScript 통과. [탐색 QA](review/assets/2026-09-15/workroom/navigation-results.json): 세 공간 왕복·홈 목차·칠판 앵커·글 링크·조회 상태/재시도·320/390px 가로 넘침 없음 확인. [Office QA](review/assets/2026-09-15/workroom/preview-results.json): 기존 출퇴근/산책/상호작용·4계절/라이트·다크 통과.
- 운영 workroom/latest: sha256:7a17feb4c86f9b9b143585c4c62df2a028b7d4fb7ccd9639fd5a16edb26fcf6a. 이전 before-workroom 보관. [릴리스](review/assets/2026-09-15/workroom/release.json), backups/releases/workroom-2026-09-15-source.tar.gz(0600). 이전 검증 사본에서 소스 10개만 변경, BlogPreviewSection 등 별도 미배포 변경 제외. Git 커밋/푸시/PR 없음.
- [공개 HTTPS QA](review/assets/2026-09-15/workroom/public-results.json): 세 공간 메뉴·칠판 앵커·기록 왕복·홈 목차·실제 Codex 1명·테마 전환/새로고침·모바일 검증 통과. JS 오류 없음, health200/관리자404/공개쓰기405. 실행 이미지 ID 확인 완료.
- 이후 범위: 작업별 명시적 프로젝트/글 연결과 지속적인 작업/완료 이력 관리. 현재는 실시간 활동과 공개 자료 탐색 단계다. DB·게시글·수집기·Hook 변경 없음.

## 고양이 외곽선 비중 보완 (2026-09-15)

- 사용자 승인에 따라 각진 22×18 실루엣을 유지하면서 귀·다리·꼬리의 어두운 테두리를 줄이고 털 면적을 넓혔다. 머리/몸통 내부 경계는 연결하고 가장 짙은 색은 배 아래·발바닥에 남겼다. 수면·걷기 두 프레임·쓰다듬기 표정에 함께 적용했다.
- decorSprites.ts 한 파일만 이전 배포 사본에서 변경. 공통 가구 재질·산책/출근/상호작용 및 다크 CSS는 유지한다. [수정 전후 비교](review/assets/2026-09-15/office-cat-soft/sprite-comparison.png).
- 변경 파일 ESLint 오류 없음, 기존 companion 테스트 3개 통과, production build/TypeScript 통과. 로컬 브라우저에서 산책/수면·쓰다듬기·4계절·라이트/다크·모바일 검증 통과. 공개 HTTPS에서도 실제 Codex 1명 출근 유지·테마 전환/새로고침·모바일 320/390px·JS 오류 없음 확인. [공개 검증](review/assets/2026-09-15/office-cat-soft/public-results.json).
- 운영 image office-cat-soft/latest: sha256:1e224a1b481e3c015c3ccc8e495bc9543944e3351540626745699be3b3118beb. 이전 before-office-cat-soft 보관. [릴리스 기록](review/assets/2026-09-15/office-cat-soft/release.json), 소스 backups/releases/office-cat-soft-2026-09-15-source.tar.gz(0600). BlogPreviewSection 등 별도 미배포 변경은 포함하지 않았다.

## 최신 Office 각진 고양이·독립 산책·다크 모드 (2026-09-15)

- 사용자 요청으로 고양이의 머리/몸통/귀/발을 사각형 중심으로 변경했다. 색·크기·클릭 범위는 유지한다. 추가 요청에 따라 출근 여부와 독립적으로 휴게 공간 가장자리를 산책하고, 한 바퀴 뒤 바구니에서 4초 쉬고 재출발한다. 쓰다듬기 반응 중 멈췄다가 재개. 동작 줄이기 설정에서는 바구니에 머문다.
- Office 카드·버튼·달력·칠판·테두리·본문/보조/강조 색을 라이트/다크별로 분리했다. 다크에서 밝은 회갈색 카드와 저대비 회색 글씨를 제거하고 캔버스 눈부심·작은 문자/포커스를 보완했다. 서울 낮밤·출근/소등은 UI 테마와 별도다.
- frontend 193 tests/36 files, lint 오류0·기존 경고6, 최종 production build/TypeScript 통과. 산책/휴식/재출발·실제 레이아웃의 벽/빈 타일 미진입·쓰다듬기/동작 줄이기 테스트 추가(요구사항 RED 확인 후 GREEN).
- [로컬 QA](review/assets/2026-09-15/office-cat-dark/preview-results.json): 빈 사무실에서 고양이 이동, 4계절 낮밤/라이트·다크·소등·Canvas/키보드·320/390px/DPR2, 실제 테마 버튼/새로고침 유지 확인. 점검한 9개 텍스트 항목의 81개 대비 측정 최저 4.56:1. 라이트 봄 계절 표기 4.12:1을 발견해 색을 보강했다.
- [공개 HTTPS QA](review/assets/2026-09-15/office-cat-dark/public-results.json): 실제 Codex1명·상호작용 후 명단 유지, 4계절 라이트/다크 72개 대비 측정 최저4.56:1, 실제 테마 전환/새로고침·모바일·JS 오류 없음. health200/관리자404/공개쓰기405. [다크 화면](review/assets/2026-09-15/office-cat-dark/public-dark-autumn.png).
- 운영 office-cat-dark/latest: sha256:6dafa8e053887a7f3b9c87f960ef5f0075b4cff874867c05281034ae0fa97ce5. before-office-cat-dark/office-window-vase 보관. frontend 교체·Nginx reload·실제 이미지 ID 확인. [릴리스](review/assets/2026-09-15/office-cat-dark/release.json), 소스 backups/releases/office-cat-dark-2026-09-15-source.tar.gz(0600).
- 배포는 이전 검증 사본에서 Office 소스4개만 변경. 창문/화병/원본 자산·정원 제거 상태 유지. BlogPreviewSection 미배포·회사 상세 비공개, DB·게시글·수집기/Hook 유지. 기존 미커밋 변경 유지, Git 커밋/푸시/PR 없음.

## 최신 Office 창문·계절 소품 재평가 (2026-09-15)

- 사용자 재평가 요청: 창문은 짧은 4분할 풍경 액자처럼 보였고, 호박/스노글로브는 사무실 안에서 독립 아이콘처럼 보였다. 탁상 원본 픽셀을 확인한 결과 소품 바닥이 상판 뒤쪽 경계(y=171)에 걸쳐 있었다.
- 벽 여백을 둔 48×28 두 칸 창으로 교체했다. 창틀 안쪽 깊이·유리 반사·창턱과 하나로 이어지는 원경/가장자리 가지를 표현했다. 나란한 나무 두 개와 해/달 아이콘·중간 가로 창살은 제거했다. 낮/밤 풍경 밝기 구분 유지.
- 모든 계절의 탁상 장식은 동일 도자기 화병에 봄 꽃·여름 잎·가을 마른 가지·겨울 열매를 꽂는 구성으로 통일했다. 바닥/그림자를 상판 안쪽(y=177~178)에 맞췄다. 정원 제거·고양이·실내 팔레트 유지.
- frontend 192 tests/36 files, lint 오류0·기존 경고6, 최종 production build/TypeScript 통과. [로컬 QA](review/assets/2026-09-15/office-window-vase/preview-results.json)와 [공개 HTTPS QA](review/assets/2026-09-15/office-window-vase/public-results.json): 사계절·낮밤·모바일/DPR2·클릭/키보드/맞춤·출근 상태 유지, JS 오류 없음. 공개 실제 Codex 1명, health200/관리자404/공개쓰기405. [가을 장면](review/assets/2026-09-15/office-window-vase/canvas-autumn.png).
- 운영 office-window-vase/latest: sha256:80a06b867bf62318df551b2ee0ab6bca26d9d951b8b9f434626bf6790ad7d1be. 이전 before-office-window-vase/office-harmony 보관. frontend 교체·Nginx reload·이미지 ID 확인. [릴리스](review/assets/2026-09-15/office-window-vase/release.json), 소스 backups/releases/office-window-vase-2026-09-15-source.tar.gz(0600).
- 이전 배포 소스에서 장식 파일 3개 수정·미사용 scenery.ts 제거만 반영. 원본 이미지·DB·글·수집기/Hook 변경 없음. BlogPreviewSection 미배포·회사 상세 비공개 유지. 기존 미커밋 작업 유지, Git 커밋/푸시/PR 없음.

## 최신 Office 정원 제거·실내 조화 (2026-09-15)

- 사용자 요청으로 하단 정원을 제거했다. 전용 그리기/스프라이트·24px 예약 높이·사용하지 않는 테마 필드를 정리하고 원래 336×208 기준 맞춤/클릭 좌표와 화면 비율로 복귀했다. 창밖 계절 나무는 유지한다.
- 강한 휴게실 바닥색을 낮추고 공통 목재색으로 두 공간을 연결했다. 중복 색상 처리로 평평했던 소파 명암을 복원하고 계절감은 창문·소파·러그/소품에 유지한다. 창틀·바구니·화분의 공통 재질/윤곽색, 고양이 접지 그림자·낮춘 털 밝기, 저대비 러그/탁상 그림자를 적용했다.
- frontend 192 tests/36 files, lint 오류 0·기존 경고 6, 최종 production build/TypeScript 통과. [미리보기](review/assets/2026-09-15/office-harmony/preview-results.json) 4계절·낮밤·빈 사무실·Canvas 클릭·키보드·모바일/DPR2·맞춤·연결 장애 통과. [여름 화면](review/assets/2026-09-15/office-harmony/canvas-summer.png).
- [공개 HTTPS 검증](review/assets/2026-09-15/office-harmony/public-results.json): 336/208 비율·정원 제거 화면 확인, 실제 Codex 1명 유지·상호작용, 자동 가을/4계절·모바일 320/390px·다크, JS 오류 없음. health200/관리자404/공개쓰기405.
- 운영 office-harmony/latest: sha256:88d235c24ed1d6692f219fc9d05bc60d9a42bfaf3917a588359cfafae99256f8. 이전 before-office-harmony/office-detail 보관. frontend 교체·Nginx reload·이미지 ID 확인. [릴리스](review/assets/2026-09-15/office-harmony/release.json), backups/releases/office-harmony-2026-09-15-source.tar.gz(0600).
- 이전 배포 사본 대비 Office 파일 11개만 변경. 원본 가구 이미지·레이아웃 유지. BlogPreviewSection 미배포·회사 상세 비공개 유지. DB·게시글·Hook/수집기 변경 및 Git 커밋/푸시/PR 없음.

## 최신 Office 신규 도트 전체 보완 (2026-09-15)

- 사용자 피드백 범위가 하단/창문 나무에서 추가 제작 장식 전체(고양이·화분 등)로 확장돼 함께 수정했다. 원본 가구 이미지를 기준으로 새 나무의 수관·가지·명암, 정원 잔디/꽃/낙엽·경계석·포장길, 창문 원경, 고양이 털/자세·바구니 짜임, 계절 탁상 소품, 러그 직조·하트 윤곽을 보완했다. 정적 스프라이트 캐시로 반복 렌더 비용을 제한한다.
- 기존 이미지 자산·출근/이동/조명·상호작용 계약은 유지한다. 배포 사본 비교 시 Office 계절 장식 소스 6개만 변경. BlogPreviewSection 미배포·회사 상세 기록 비공개 유지.
- frontend 192 tests/36 files 통과, lint 오류 0·기존 경고 6. 최종 운영 빌드·TypeScript 통과. [미리보기](review/assets/2026-09-15/office-detail/preview-results.json)에서 4계절/낮밤·소등·Canvas/키보드·모바일/DPR2·연결 장애 확인. 첫 화면 확인 후 나무의 반복 줄무늬를 보정해 최종 재검증했다.
- [공개 검증](review/assets/2026-09-15/office-detail/public-results.json): 실제 Codex 1명, 상호작용 후 명단 유지, 4계절·390/320px·다크 화면, JS 오류 없음. health200/관리자404/공개쓰기405. [여름 장면](review/assets/2026-09-15/office-detail/canvas-summer.png).
- 운영 office-detail/latest: sha256:89653048ae51a5d9eec3495c3364f27f717499a566edc86b79d04d6963a9c603. before-office-detail/office-season-room 복원 태그 보관. frontend 교체·Nginx reload 및 실제 이미지 ID 확인. [릴리스](review/assets/2026-09-15/office-detail/release.json), 소스 백업 backups/releases/office-detail-2026-09-15-source.tar.gz(0600). 수집기·Hook·DB·글 변경 및 Git 커밋/푸시/PR 없음.

## 최신 Office 계절 인지성과 상호작용 (2026-09-15)

- 실내 벽·바닥·소파·러그·커튼과 칠판·앞마당을 사계절 팔레트로 통합했다. 봄 벚꽃/크림, 여름 녹음/청록, 가을 단풍/갈색, 겨울 눈/청회색. 기존 도트 해상도와 서울 달력·낮밤 자동 전환을 유지한다.
- 한 명 작업 시 생활감을 위해 고양이 휴식·산책, 쓰다듬기 하트, 커피 김과 클릭/키보드 버튼을 추가했다. 고양이는 실제 직원·좌석·출근 인원과 독립적이며, 작업이 없으면 바구니에서 잔다. 동작 줄이기 설정을 지원한다.
- frontend 192 tests/36 files 통과(`npm test -- --maxWorkers=4`), lint 오류 0·기존 경고 6, 운영 빌드·TypeScript 통과. 기본 병렬 실행의 기존 BlogPreviewSection 테스트 1건 timeout 후 워커 제한 전체 재실행이 통과했다.
- [로컬 검증](review/assets/2026-09-15/office-season-room/preview-results.json): 4계절·낮밤·출퇴근·소등·연결 장애·Canvas 클릭·키보드·모바일·DPR2. [공개 HTTPS 검증](review/assets/2026-09-15/office-season-room/public-results.json): 실제 Codex 1명, 상호작용 후 명단 유지, 4계절·320/390px·다크 화면, JS 오류 없음. health 200/관리자 404/공개 쓰기 405.
- 운영 office-season-room/latest: sha256:5a9000c7c22651d9ab999ecb5b8d647907dbaff07c677a280fb14e17188fb88b. 이전 before-office-season-room/office-refinement 보관. frontend 교체·Nginx reload 완료. [릴리스 해시](review/assets/2026-09-15/office-season-room/release.json), 소스 backups/releases/office-season-room-2026-09-15-source.tar.gz(0600).
- 검증된 이전 배포 소스에 이번 Office 파일만 추가했다. BlogPreviewSection 미배포·경력 상세 비공개 유지. 수집기/Hook·DB·게시글 변경 없음. 기존 미커밋 변경 유지, 커밋·푸시·PR 없음.

## 최신 Office 진단 보완 (2026-09-15)

- [진단 후 보완](review/office-design-diagnosis-2026-09-15.md)을 구현·운영 반영했다. 상단 SVG 배너 제거, Canvas 벽의 계절 창문, 서울 시각 낮/밤, 저채도 목재·녹색 팔레트, 소등 38%, 원본 픽셀 렌더 후 확대와 맞춤 복귀, 모바일 조작부를 적용했다. 0 크기 Canvas 전환 오류도 보완했다.
- Codex 공식 Hook 어댑터 및 .codex/hooks.json/config.toml 추가. 턴 구분·중단·이전 턴 지연 이벤트 보호. **사용자가 /hooks 7개를 신뢰하고 같은 대화를 재개한 후 실제 자동 출근 확인 완료.** 수집기 Codex 1명, Hook 필수 필드/부모/프로젝트 확인 정상, 공개 HTTPS 출근 1명·조명 on·승인 대기 상태 전달을 확인했다. [실제 Codex 검증](review/assets/2026-09-15/office-refinement/codex-live-result.json). 실제 Stop 후 퇴근 관찰은 이번 응답 이후 확인할 항목이다. 현재 대화 임의 출근/로그 감시/Hook 신뢰 우회 없음. [활성화 안내](guides/OFFICE_PRESENCE.md).
- frontend 189 tests / Python 18 tests, lint 오류 0·기존 경고 6, 운영 빌드·TypeScript 통과. 미리보기 4계절·낮밤·DPR1/2·모바일·연결 장애 및 실제 HTTPS의 명령 작업 출퇴근 확인. [결과](review/assets/2026-09-15/office-refinement/results.json).
- 운영 이미지 office-refinement/latest: sha256:500d6990fa60435aa58e1653c58b020539b5569ad91b057351eb7d4d69fa389b. 이전 before-office-refinement/office-seasons 보관. 수집기 재시작 완료.
- BlogPreviewSection 미배포 및 공개 경력 요약 정책 유지. 백업은 backups/releases/office-refinement-2026-09-15-{source,ops}.tar.gz(0600). 기존 미커밋 변경 유지, 커밋·푸시·PR 없음.

## 최신 Office 사계절·칠판 (2026-09-15)

- [계절·칠판 설계](architecture/office-season-board-design.md) 구현·배포. 서울 달력 기준 자동 4계절, 화면 전용 미리보기, 픽셀 창밖 풍경·실내 소품, 모바일 하단 작업 칠판.
- 선택적 publicTitle은 --public-title / OFFICE_PUBLIC_TITLE에서 명시한 공개 제목만 사용. 제목 없이도 기존 상태 표시, 종료·연결 장애에서 제목 제거. 원문 자동 추출 금지 유지.
- frontend 184 tests / Python 13 tests, 운영 빌드·TypeScript 통과. 린트 기존 경고 6. 실제 공개 주소에서 제목 있는 명령 작업의 출근·퇴근 확인. [결과](review/assets/2026-09-15/office-seasons/results.json).
- 운영 이미지 office-seasons/latest: sha256:f010fcf5f35fbfa4abdbbc23aeebd384de00dd3917af6527f3a73889ec7f15ec. 이전 before-office-seasons/office-presence 유지. 수집기 재시작 완료.
- BlogPreviewSection은 계속 미배포, 회사 상세 기록 공개 축소 정책 유지. 현재 Codex 앱/브라우저 대화 자동 감지 확장은 하지 않았다.

## 최신 Office 출퇴근 (2026-09-15)

- [실시간 출퇴근 명세](architecture/office-presence-design.md), [운영 안내](guides/OFFICE_PRESENCE.md). 공개 Office를 GitHub 재생에서 현재 세션별 출근/퇴근·소등으로 전환해 배포했다.
- 로컬 수집기 → 공개 허용 상태 파일 → Next.js SSE. 원문/경로/명령 공개 없음. 조회 전용, 연결 장애와 빈 사무실 구분.
- Claude Code Hook 설정 추가, Codex 비대화형/일반 명령은 실행 래퍼 제공. 현재 Codex 앱·브라우저 대화의 자동 감지는 아직 아니다. PC 전체 감시 없음.
- 사용자 서비스 portfolio-office-presence.service + linger 활성화, 방송 on. 운영 이미지 office-presence/latest: sha256:414ae1b8d8f1dbfdb366000917952304428a22b097d9350ef45d4e82d7e75a9c. 이전 before-office-presence/public-summary 유지.
- frontend 168 tests / Python 10 tests, production build/TypeScript 통과. lint 기존 경고 6. 원 작업 폴더 전체 tsc는 기존 fixture/.next/dev 타입 오류가 남아 있다.
- 실제 공개 HTTPS에서 테스트 작업 출근·종료 후 소등, 모바일, 쓰기 차단 확인. [결과](review/assets/2026-09-15/office-presence/results.json). BlogPreviewSection은 계속 미배포. 상세 경력 공개 축소 정책 유지.

## 최신 공개 범위 분리 (2026-09-15, 세션 #22 후속)

- 사용자의 공개 범위 구분 요청에 따라 공개 경력은 회사명·기간·역할·한 문장으로 축소했다. 상세 업무와 공통 프로젝트 내용은 HTML/JS에서 제거했다.
- [공개 범위 기준](content/portfolio-disclosure-policy.md). 지원용 초안 application-resume.md/career-details.md와 원장 review.md는 backups/career/2026-09-15에만 보관(0600/Git 제외). 공개 다운로드 없음.
- 이전 상세 화면 캡처·검증 스크립트도 Git 제외 위치로 이동했다. 원문/지원 자료를 프런트엔드 코드나 공개 문서에 재삽입하지 않는다.
- frontend 156 tests, lint 오류 0(기존 경고 6), TypeScript·빌드 통과. 로컬·최종 운영 HTTPS PC/모바일 및 전달 HTML/JS의 상세 문구 제외 확인.
- 운영 이미지 public-summary/latest: sha256:73a6d3fcda1e95c321849b7df6387df435be0a736a6a1d4f3940ce886b012454. 이전 before-public-summary/career-records 유지.
- 빌드 /tmp/portfolio-public-summary-build, 장기 소스 backups/releases/public-summary-2026-09-15-source.tar.gz. 미커밋 상태 유지.
- 지식 저장소의 ‘공개 기본/선택 비공개’ 요구는 별도 개발 계획이며 지원용 문서를 공개해도 된다는 뜻이 아니다.

## 직전 경력 반영 (2026-09-15, 세션 #22)

- Claude 경력 정리본 수신. 사용자가 정확한 회사명은 트러스트에이아이라고 확인했다. 모델 전환 시점은 미상으로 유지.
- 기원테크/트러스트에이아이 정규직/인턴의 기간·담당 업무와 공통 프로젝트 기여를 홈에 반영했다. About·Hero 보조 문구·Experience 메뉴 및 교육 기록도 갱신했다.
- 내부 수치·고객명·사내 코드 등은 공개 문안에서 제외. 상세 검토 원장은 Git 제외 backups/career/2026-09-15/review.md에만 보관.
- frontend 156 tests, lint 오류 0(기존 경고 6), TypeScript·운영 빌드 통과. 로컬 및 최종 운영 HTTPS에서 PC 라이트/다크·390/320px 모바일 확인.
- 운영 이미지 career-records/latest: sha256:38b6de0860f5fb97391797aa284a5ce63c17d9c8aea477743c61bd6cfad4dbc7. 이전 before-career-records/editor-safety 보관.
- 빌드 사본 /tmp/portfolio-career-records-build, 장기 사본 backups/releases/career-records-2026-09-15-source.tar.gz. [세션 기록](sessions/SESSION_2026-09-15.md).
- BlogPreviewSection 최근 글 기능은 여전히 미배포. 지식 저장소 공개 범위/검색/링크/그래프는 요구사항 초안이며 아직 구현하지 않았다.

## 최신 방향 (2026-09-14, 사용자 추가 요구)

- 블로그를 자료구조/개발 공부·독서·업무 기록의 지식 저장소로 확장하고 문서 관계 그래프를 추가하려 한다.
- 사용자 확정: 공개가 기본, 선택한 글은 비공개. 초안은 비공개 유지, 발행 시 공개가 기본 선택인 안으로 정리했다.
- [확장 설계 초안](architecture/knowledge-workspace-design.md), [회사 경험 자료 양식](content/career-records-intake.md) 작성. 현재는 요구사항/검토안이며 API·DB·화면·배포 변경 없음.
- 현재 재직 중이라고 소개하지 않는다. 기원테크·트러스트랩 기록을 포함하되 날짜/역할/성과/회사-프로젝트 관계는 자료를 받아 확인한다. 다른 GPT/Claude 정리본 또는 직접 자료 제공을 안내했다.
- 다음 진행: 회사 자료 수집, 공개 범위/기록 탐색 설계 검토 → 보존성/문서 링크 → 주변/전체 그래프. 기존 자동 요약·첨부 형식 보완도 기록 보존 단계에 포함한다.

## 최신 구현 (2026-09-14, 세션 #21 후속)

- 사용자 승인에 따라 저장 보호 P1 보완을 구현·운영 반영했다. 원복 시 중간 복구본 정리, 보관 실패 중 메뉴·목록·로그아웃 확인, 탭 내 보조 복원 및 새로고침 경고.
- frontend 156 tests, lint 오류 0(기존 경고 6), 운영 빌드·TypeScript 통과. 최종 HTTPS PC/모바일 8개 시나리오 및 홈/블로그/health 확인 통과.
- 운영 이미지 editor-safety/latest: sha256:12b4158d0a2992f22b4a676185b8c0eba524bf16c6532fac386caae81ffaddc4. 이전 before-editor-safety/editor-step1 유지.
- 빌드 사본 /tmp/portfolio-editor-safety-build, 장기 로컬 사본 backups/releases/editor-safety-2026-09-14-source.tar.gz. [소스·이미지 기록](review/assets/2026-09-14/editor-safety/release.json).
- BlogPreviewSection 최근 글 기능은 여전히 미배포. 기존 미커밋 변경을 유지했으며 이번에도 커밋/PR은 생성하지 않았다.
- 다음 단계: 자동 요약의 마크다운 제거 계약 → 이미지·고급 블록 지원 범위 → 현행 명세/커밋 이력 정리.
- 저장소 실패 시 보조 복구본은 현재 탭에서만 유지된다. 브라우저 뒤로/앞으로는 강제 차단 대신 재진입 복원으로 보호한다. 모든 저장소 실패나 강제 종료에서 영구 보존을 보장하지 않는다.

## 최신 검토 (2026-09-14, 세션 #21)

사용자가 다음 기능 작업 전에 설계·코드·배포를 비교하도록 요청했다. 제품 코드·운영 데이터·배포 변경 없이 검토했다.
- [설계 정합성 보고서](review/design-conformance-2026-09-14.md): 큰 방향은 일치하지만 저장 보호·콘텐츠 표현 계약은 미완성.
- P1 재현: 수정 후 원복해도 중간 복구본이 남음 / 브라우저 저장 실패 중 Header 내부 이동으로 미저장 내용 유실.
- P2: API의 마크다운 제거 요약 규칙 미구현, 이미지/고급 블록 지원 범위 불명확, 미커밋 배포와 구/신 명세 공존.
- frontend 전체 146 tests 통과. 실제 운영 이미지 ID와 문서 일치. 빌드 사본 대비 비테스트 파일 238개 중 BlogPreviewSection만 다름(의도적 미배포).
- 권장 다음 작업: 저장 예외의 기대 동작·회귀 테스트 → 수정 → 콘텐츠 계약·현행 문서·릴리스 기록 정리. 이미지 기능 확장은 그 이후.
- 위 내용은 수정 전 검토 결과다. 두 P1의 후속 조치는 상단 최신 구현과 세션 로그를 참조한다.

## 현재 상태 (2026-09-13, 세션 #20)

첫 공개는 **방문자 조회 전용**, 기존 관리자만 글 관리. 댓글/가입은 추후 검토.
작업 브랜치 `feature/public-release-preparation`에서 공개 준비 구현과 자동 검증 완료.
사용자가 Cloudflare에서 `gwangwon.dev` 구매 완료. 운영 컨테이너 전환 및 Tunnel 연결 4개 성공. Published application route 반영 후 **https://gwangwon.dev 공개 접속 확인 완료**.

- 초안 목록·작성자 접근 제한, 운영 읽기 전용 API/UI 정책, GitHub/연락처 정리.
- 운영 포트 제한·진단 경로 차단, DB health 200/503, 운영 예외 상세 비노출.
- Backend 147 tests, Frontend 125 tests 및 운영 빌드 성공. lint 오류 0, 기존 경고 6.
- 운영 Compose/Nginx 검증 및 실제 portal-db 백업 → 임시 DB 복원 검증 완료.
- 운영 이미지 3개 빌드 및 독립 DB의 운영 스택 HTTP 검증 완료(관리자 로그인/초안/발행/토큰 갱신/로그아웃).
- 실제 DB 기본 비밀번호와 초기 ADMIN 비밀번호를 무작위 값으로 교체하고 로그인/로그아웃 검증. 기존 데이터 유지, 관리자 로그인 파일은 Git 제외 backups/에 권한 0600으로 저장.
- 운영 로컬 health/홈/블로그/Office 정상, 가입·글쓰기·댓글·OAuth 익명 요청 401, 관리자 진단 경로 404.
- 실제 HTTPS 홈/블로그/Office/정적 파일 200, 관리자 로그인·Secure/HttpOnly 쿠키·refresh·로그아웃 및 방문자 쓰기 차단 검증 완료.
- 후속 운영 작업: 대표 게시글 작성·발행 확인, 정기/외부 백업 및 AI 모델 호출 검증. 실제 PC·모바일 화면 검증은 아래 디자인 개선 단계에서 완료했다.
- 실제 `.env`와 예시 구성을 동기화했다. 기존 비밀값은 보존하고 맨 위에 Tunnel 토큰 입력란을 추가했다. PUBLIC_URL은 `https://gwangwon.dev`. 기존 환경변수 동기화 후 운영 단계에서 DB·관리자 비밀번호와 관련 컨테이너를 갱신했다. 다른 프로젝트 컨테이너는 유지했다.

- 사용자가 실제 화면 접속 확인. 이후 공개 GitHub와 비교해 과장된 소개를 수정하고 운영 사이트에 반영했다. 새 공개 JS 문구·링크 검증, Frontend 125 tests·빌드 통과.
- AI Benchmark 완료형 소개·숙련도 점수·미확인 재직 문구를 제거하고 실제 프로젝트 6개와 사용 기술·용도를 표시.
- 수료 시점은 사용자 정정에 따라 2026년 8월. GitHub 코드만으로 개인 숙련도나 담당 범위를 단정하지 않는다.

- 화면의 품질·채용 포트폴리오 적합성·난잡한 부분을 실제 화면에서 탐색했다. [화면 검토](review/design-review-2026-09-13.md) 완료.
- Chromium PC 라이트/다크·모바일 확인. 글꼴 변수 자기 참조(Times New Roman 폴백), 큰 임시 이미지, 프로젝트 도달 지연, 빈 블로그 CTA, 공개 테마 편집 패널 등을 확인.
- 화면 검토 당시 로컬에 있던 카드·메뉴·최신 글 개선 중 카드는 아래 2단계에서 공개했다. 관련 6 tests는 통과했다. 메뉴는 3단계에서 공개했으며 최신 글 기능만 아직 미배포다.

- 후속 요청에 따라 디자인 개선 1단계(글꼴·모바일 줄바꿈)를 별도 이미지로 공개했다. Pretendard 실제 렌더링, PC 라이트/다크·390/320px 모바일, 공개 HTTPS 확인 완료.
- 디자인 개선 2단계 완료: About 임시 이미지 제거, 프로젝트 카드 핵심 내용 상시 노출, 링크 높이 44px 이상. PC 라이트/다크·390/320px 모바일 및 실제 HTTPS 검증 완료.
- 디자인 개선 3단계 완료: 간결한 Hero·단색 홈, 대표 프로젝트 2개/다른 작업 4개를 소개보다 앞에 배치. 메뉴·Office의 홈 섹션 이동과 모바일 닫기, 스크롤 여백을 공개했다. 테마 편집 패널은 개발 모드 전용.
- 글 작성 개선 1차 완료: 복구본 보호·서버 오류 안내·명확한 임시저장/발행·초안 이어쓰기·본문 우선 배치·편집/마크다운/미리보기·기본 서식·저장 단축키. 공개 본문 스타일도 함께 복구했다.
- 현재 운영 이미지: portfolio-frontend:editor-step1 (latest도 동일). 이전 이미지 before-editor-step1 및 priority-step3.
- 프런트엔드 전체 145 tests, 마지막 테스트 추가 후 저장 관련 15 tests 통과. lint 오류 0·기존 경고 6, 운영 빌드·TypeScript 통과.
- 최종 공개 PC/모바일/다크 모의 작성 흐름과 실제 관리자 화면 접근 확인. 실제 글 생성·발행 없음. health200·UP 및 실제 로그아웃204.
- **배포 주의**: 작업 폴더의 BlogPreviewSection 개선만 아직 미배포다. 이번에는 3단계 사본에 작성·공개 본문·관리자 헤더 관련 8개 구현 파일을 덮어썼다. 일반 Compose build는 최근 글 기능도 포함하므로 범위를 검토한다.
- [블로그 검토](review/blog-review-2026-09-13.md), [글 작성 검토](review/editor-review-2026-09-13.md) 참조. 본문 스타일 미적용은 해결했으며 블로그 목록/상세 태그 넘침·목록 오류·검색/최근 글은 후속이다.
- 다음 작성 개선: 이미지 업로드/data URL 공개 표시, 고급 블록 왕복 보존. 동시 탭 충돌 병합·실제 AI 요약 호출은 이번 검증 범위 밖이다.

상세: [세션 #20](sessions/SESSION_2026-09-13.md), [공개 설계](architecture/public-release-design.md),
[배포 가이드](guides/DEPLOYMENT_GUIDE.md).

---

## 이하 내용은 세션 #19까지의 과거 기록



## 🎯 현재 프로젝트 상태

### Phase
**Phase 1B: 프론트엔드 개발** (진행 중)

### 마지막 작업 (세션 #19, 2026-07-09 — 약 3개월 중단 후 재개)
- **Docker 29 호환성 복구**: Testcontainers 1.19.3 → 2.0.5 (백엔드 통합 테스트 30개 복구, 전체 131개 통과)
- **프론트엔드 취약점 정리**: npm audit 27건 → 2건, next 16.2.10 업그레이드 (테스트 107개 + 빌드 통과)
- **docker-compose 정리**: FastAPI 라벨 수정, 미존재 ai-benchmark-api 서비스 주석 처리
- 미기록 세션 #18 (2026-04-06) 이력 복원: 관리자 Pixel Office SSE + hardening 완료 확인

### 직전 작업 (세션 #17–#18, 2026-04-06)
- **pixel-agents 렌더링 엔진 이식 완료**: PNG 에셋 54개 + 엔진 19파일 + assetLoader + usePixelOffice 어댑터
- **백엔드 보안 정비**: module-registry GET 인증 추가, AiClient CircuitBreaker/Retry, 벤치마크 @Deprecated
- **관리자 /admin/office 완료**: 실시간 Hook SSE + 이벤트 로그 사이드바 + 실제 타임랩스(Git 이력) + 커밋 시각화

### 완료된 개발

#### Phase 1A (백엔드) — 완료 ✅
- Spring Boot 멀티 모듈 프로젝트 (7개 모듈), JPA 엔티티, Security+JWT, Auth API — 세션 #1
- Blog CRUD, Auth Cookie 리팩토링, Flyway V2-V5 — 세션 #5
- 서비스 레이어 단위 테스트 69개 + Health Check + JSON 로깅 — 세션 #6
- module-registry + Controller 테스트 (총 90개) — 세션 #7
- ServiceHealthChecker + Nginx Gateway + Sentry (총 95개) — 세션 #8
- 통합 테스트 28개 (Testcontainers), 전체 123개 — 세션 #9
- JWT jti claim, Flyway 통합, Dockerfile, docker-compose 기동 테스트 — 세션 #10

#### Phase 1B (프론트엔드) — 진행 중
- Next.js 16.2.1 Shell App + TailwindCSS v4 + Redux Toolkit + TanStack Query — 세션 #10
- Shell: Header, Footer, ShellLayout, AuthProvider, Providers, API Client — 세션 #10
- Auth: 로그인, 회원가입 페이지 — 세션 #10
- Blog: 목록, 상세(마크다운 렌더링), 카테고리 필터, 페이지네이션 — 세션 #10
- **shadcn/ui v4 (base-nova) 디자인 시스템 도입 — 세션 #11**
- **블로그 에디터 (생성/수정/삭제) CRUD 완성 — 세션 #11**
- **블로그 UI 디자인 세분화 문서 작성 — 세션 #11**
- **Blog 고도화: 좋아요/댓글/검색 — 세션 #12**
- **프론트엔드 테스트 57개 (Vitest + RTL + MSW) — 세션 #12**
- **OAuth2 소셜 로그인 Google/GitHub (백엔드 TDD + 프론트 UI) — 세션 #12**

### 현재 상황
**디자인 강화 3-Stage 전체 완료** (Stage 1 마이크로 인터랙션 ✅ + Stage 2 3D Hero ✅ + Stage 3 Pixel Office ✅) + 관리자 office(SSE)까지 완료. 세션 #19에서 중단 기간 발생한 환경 호환성 문제(Docker 29)와 보안 취약점을 정리하여 **백엔드 131개 + 프론트엔드 107개 테스트 전부 통과** 상태.

**브랜치/PR 정리 완료 (세션 #19)**: PR #8을 main에 병합, 중복 PR #4 close, 구계보 PR #2 close(댓글 UI만 백로그로 이관), develop을 main으로 리셋. 상세는 `docs/sessions/SESSION_2026-07-09.md` 참조.

---

## 📋 다음 할 일 (Next Actions)

> 세션 #19 완성도 평가(구현율 ~75-80%) 기준 우선순위. P0(블로그 상세 버그, frontend Dockerfile, nginx 죽은 라우트)는 완료.

### P1 — 포트폴리오 가치 최대화 (세션 #19에서 대부분 완료)
1. **실배포**: ~~인프라 준비~~ ✅ (docker-compose.prod.yml + cloudflared + DEPLOYMENT_GUIDE.md, 스택 기동 검증 완료)
   - [ ] **남은 것: 도메인 구매 → Cloudflare Tunnel 토큰 발급 → `--profile deploy` 기동** (사용자 작업)
   - [ ] CI deploy 잡 (선택)
2. ~~README 현행화~~ ✅ — 스크린샷/GIF 추가는 남음 (배포 후 라이브 URL과 함께)
3. ~~유저 프로필 최소 기능~~ ✅ (/users/me API + /mypage)

### P2 — 차별화 스토리 완성
4. **AI Benchmark API** (FastAPI `ai-benchmark-api/`) + 랜딩 BenchmarkSection 시각화 — README가 내세우는 핵심 차별화인데 통째로 부재
5. **Service Registry UI 대시보드** (백엔드만 존재) + 헬스체크 DB 프로브 (현재 UP 하드코딩, Service Contract 미달)
6. Pixel Office 타임랩스 파이프라인 (`extract-git-history` → office-history.json) + 재생/속도 컨트롤

### P3 — 품질 부채
7. 커버리지: security 모듈 17%, 프론트 22.9% → 70% 목표 (헌법 제3조)
8. 댓글 UI 개선 이식 (PR #2 백로그: 아바타·인라인 삭제 확인·sonner 토스트 — 참조 커밋 78fabf4, 27d8a44) + blog-ui-design.md §12 토스트 시스템
9. `PUT /tags/{id}` 구현 (스펙 대비 유일한 누락 CRUD), `generate-draft` 프론트 연결 or 제거
10. ai-backend pytest + CI 잡, admin office SSE 서버측 인증
11. 문서 후행 정리: 리치 에디터·pixel-engine 설계 문서화 (SDD 원칙)

---

## 🔑 주요 의사결정 기록

> 상세 내용은 각 ADR 문서를 참조하세요. 여기는 빠른 참조용 요약입니다.

| # | 결정 | 결정일 | ADR |
|---|------|--------|-----|
| 1 | PostgreSQL 3개 → 1개 통합 (TimescaleDB) | 2026-01-07 | [ADR-001](decisions/ADR-001-database-consolidation.md) |
| 2 | Redux Toolkit 선택 (취업 포폴 목적) | 2026-01-07 | — |
| 3 | Redis 도입 Phase 2로 지연 | 2026-01-07 | — |
| 4 | Observability 조기 도입 (Phase 1부터) | 2026-01-07 | [ADR-002](decisions/ADR-002-observability-first.md) |
| 5 | 테스트 커버리지 70% 목표 | 2026-01-07 | [ADR-004](decisions/ADR-004-test-strategy.md) |
| 6 | JWT Refresh Token Rotation | 2026-01-07 | [ADR-003](decisions/ADR-003-jwt-refresh-token-rotation.md) |
| 7 | PixiJS + @pixi/react 채택 (Pixel Office) | 2026-03-26 | [ADR-005](decisions/ADR-005-pixel-office-tech-stack.md) |
| 8 | **독립 서비스 아키텍처 전환** | 2026-03-30 | [ADR-006](decisions/ADR-006-microservice-architecture.md) |
| 9 | **멀티 에이전트 합의 시스템** | 2026-03-30 | [ADR-007](decisions/ADR-007-multi-agent-consensus-system.md) |
| 10 | **Pixel Office Canvas 2D MVP 전환** | 2026-04-06 | [ADR-008](decisions/ADR-008-pixel-office-canvas2d-mvp.md) |

---

## 💬 사용자 강조 사항

### 1. 문서 우선주의
- "docs 외부에 문서가 있는게 싫은데 docs 내에서도 폴더화를 통해 정리"
- → 모든 문서를 `docs/` 폴더 내부로 이동 완료
- → `docs/history/` 폴더로 과거 문서 관리

### 2. 취업 포트폴리오 목적
- "2026년 취업 포트폴리오를 목적으로 합니다"
- → 코드 품질 > 빠른 개발 속도
- → 일관성 > 개인 취향
- → Redux Toolkit 같은 기업 표준 기술 선호

### 3. 헌법 준수
- "개발 시작전 세팅부터 진행할 예정입니다. 개발을 진행하면서 에이전트가 지켜야할 법규나 문서를 확립"
- → `PROJECT_CONSTITUTION.md` 제정 완료 (12개 조항)
- → 모든 개발은 헌법 준수 필수

### 4. MVP 우선 접근
- "기본 블로그 기능부터 구현 진행"
- "1. 이정도면 적당할것 같아요 2. 일단 별도로 구현 후 게이트웨이를 도입하여 병합"
- → Depth 2까지 설계 완료, Depth 3/4는 개발하면서 설계

### 5. 관제형 에이전트 활용
- "추가적으로 다른 에이전트를 띄워 문서와 아이디어를 보고 점검 및 개선 혹은 다른 아이디어를 던져줄수 있는 관제형 에이전트"
- → `architecture-review.md` 생성 (아키텍처 검토 에이전트)
- → 필요 시 Task 도구로 검토 에이전트 실행

---

## 📚 필수 참조 문서

### AI 에이전트가 반드시 읽어야 할 문서 (우선순위 순)

1. **🔴 이 문서 (CONTEXT.md)** - 현재 상태 파악
2. **🔴 PROJECT_CONSTITUTION.md** - 절대 규칙
3. **🟠 INDEX.md** - 문서 전체 구조
4. **🟠 database-consolidation-design.md** - DB 설계
5. **🟠 observability-design.md** - 로깅/모니터링
6. **🟠 DEVELOPMENT_GUIDE.md** - 코딩 컨벤션

### 개발 시작 전 체크리스트
- [ ] CONTEXT.md 읽고 현재 상태 파악
- [ ] PROJECT_CONSTITUTION.md 숙지
- [ ] 관련 설계 문서 확인
- [ ] 사용자 강조 사항 확인

---

## 🚧 진행 중인 이슈

### 1. ~~브랜치/PR 중복~~ (세션 #19에서 해결)
- 히스토리 재작성으로 구계보(develop)와 신계보(main/현 브랜치)가 공존했음
- 정리: PR #8 → main 병합 / PR #4 close(중복) / PR #2 close(대체됨, 댓글 UI만 백로그) / develop을 main으로 리셋

### 2. 잔여 npm 취약점 2건 (moderate)
- next 내부 고정 postcss <8.5.10 (GHSA-qx2v-qp2m-jg93) — next 릴리스 대기, 실질 위험 낮음

### 3. admin office SSE 무인증
- `frontend/app/api/admin/office/events/route.ts`는 dev 전용 가드(`NODE_ENV`)만 존재, 서버측 인증 없음

---

## ⚠️ 주의사항

### 절대 하지 말아야 할 것
1. **헌법 위반**: `PROJECT_CONSTITUTION.md` 조항 위반
2. **문서 없는 개발**: 설계 문서 없이 코드 작성
3. **과도한 기술 스택**: MVP에 불필요한 기술 추가
4. **Redis 도입**: Phase 1에서는 PostgreSQL만 사용
5. **서비스 간 DB 교차 접근**: 각 서비스는 자기 DB만 접근 (ADR-006)

### 강조 사항
1. **코드보다 문서**: 변경 사항은 문서부터 업데이트
2. **보안 우선**: JWT Rotation, XSS 방지 필수
3. **테스트 작성**: 핵심 로직은 70% 커버리지
4. **구조화된 로깅**: 처음부터 JSON 로깅 설정
5. **Service Contract 준수**: 새 서비스는 /health + /api/summary 필수

---

## 📊 프로젝트 통계

### 문서 현황
- 헌법 문서: 4개
- 아키텍처 설계: 7개 (database-erd.md 포함)
- API 명세: 2개 (API_SPECIFICATION.md, openapi.yaml)
- 가이드: 2개
- 검토 보고서: 1개
- ADR: 7개 (ADR-000 ~ ADR-006)
- 세션 로그: 3개
- 총 문서: ~29개

### 완료된 설계
- [x] 시스템 아키텍처 — 독립 서비스 + 중앙 포털 (Depth 1)
- [x] 서비스별 모듈 구조 (Depth 2)
- [x] Service Registry 패턴 + Service Contract
- [x] DB 물리 분리 전략 (서비스별 독립 PostgreSQL 인스턴스)
- [x] Observability 설계
- [x] JWT 보안 강화 설계
- [x] 테스트 전략
- [x] Pixel Office 설계

### 완료된 개발
- [x] Spring Boot 멀티 모듈 프로젝트 (7개 모듈)
- [x] Docker Compose (PostgreSQL + TimescaleDB)
- [x] JPA 엔티티 전체 (User, Blog, Benchmark)
- [x] Spring Security + JWT 인증
- [x] 인증 API (회원가입/로그인/갱신/로그아웃)

### Phase 1A (완료) ✅
- [x] Spring Boot 멀티 모듈, JPA 엔티티, Security+JWT, Auth API, Blog CRUD
- [x] module-registry, ServiceHealthChecker, Health Check, Service Contract
- [x] Logback JSON 로깅, Sentry 연동
- [x] Flyway V1 통합, Dockerfile, docker-compose 기동, JWT jti
- [x] 123개 테스트 (단위 95 + 통합 28)

### Phase 1B (진행 중)
- [x] Next.js Shell App 프로젝트 생성 + 기본 레이아웃 — 세션 #10
- [x] Auth 페이지 (로그인, 회원가입) — 세션 #10
- [x] Blog 조회 (목록, 상세, 카테고리 필터, 페이지네이션) — 세션 #10
- [x] shadcn/ui 디자인 시스템 도입 (11개 컴포넌트) — 세션 #11
- [x] Blog 에디터 (생성/수정/삭제, PostEditor 컴포넌트) — 세션 #11
- [x] Blog 고도화 (좋아요/댓글/검색) — 세션 #12
- [x] 프론트엔드 테스트 57개 (Vitest + RTL + MSW) — 세션 #12
- [x] OAuth2 소셜 로그인 Google/GitHub — 세션 #12
- [ ] AI Benchmark API (FastAPI) 독립 프로젝트 생성
- [ ] Service Registry UI 대시보드

---

## 🔄 세션 전환 프로토콜

### 세션 종료 시
1. 이 문서(`CONTEXT.md`) 업데이트
   - 현재 작업 상태
   - 다음 할 일
   - 새로운 의사결정 사항
2. `docs/sessions/SESSION_{날짜}.md` 생성 (작업 로그)
3. 중요한 결정은 `docs/decisions/ADR-{번호}.md` 작성

### 새 세션 시작 시 (AI 에이전트용)
1. **이 문서 먼저 읽기** (`docs/CONTEXT.md`)
2. 현재 상태 파악
3. 다음 할 일 확인
4. 필수 참조 문서 읽기
5. 사용자에게 현재 상태 요약 제시

---

## 📝 마지막 대화 요약

### 세션 #11 (2026-03-31)
- shadcn/ui v4 (base-nova) 디자인 시스템 도입 (11개 컴포넌트)
- Blog 에디터 (PostEditor + 생성/수정 라우트 + 삭제 Dialog)
- Blog CRUD 완성 (API 함수 + Mutation hooks)

### 세션 #12 (2026-03-31)
- Blog 고도화: 좋아요/댓글/검색 (LikeButton, CommentSection, SearchBar)
- Vitest + RTL + MSW 프론트엔드 테스트 57개
- OAuth2 소셜 로그인 Google/GitHub (백엔드 TDD 5개 + 프론트 UI)
- 모노레포 정리, 시스템 분석 8.3/10

### 세션 #13–#14 (2026-04-02)
- 하네스 엔지니어링 6개 Layer 전수 점검 (모두 정상)
- OAuth2 소셜 로그인 4건 버그 수정 (CRITICAL 2, HIGH 1, MEDIUM 1)
- `.env.local` 환경변수 관리 체계 구축
- 이슈 보고서 문서화 (`docs/review/oauth2-issue-report.md`)
- 블로그 에디터 3건 수정: 한글 slug 생성, Tiptap SSR hydration, 슬래시 명령어 "/" 잔존

### 세션 #15 (2026-04-05)
- 기획 문서 전수 점검 (14개 설계 문서, 구현율 55-60%)
- 3-Stage 디자인 강화 통합 설계 (`design-enhancement.md`)
- **Stage 1 완료**: framer-motion, 스크롤 애니메이션 7개 섹션, 마우스 glow, 배경 메쉬 drift, 텍스트 그라데이션
- 테스트 10개 추가 (총 67개)

### 세션 #16 (2026-04-06)
- pixel-agents 분석 + 3+1 멀티 에이전트 합의 → ADR-008 (Canvas 2D MVP)
- Pixel Office MVP 엔진 구현 (39 테스트, TDD)
- 디자인 시스템 재설계 (SpriteData, Colorize, 어두운 팔레트)

### 세션 #17 (2026-04-06)
- **pixel-agents 렌더링 엔진 이식**: PNG 에셋 54개 + pixel-engine/ 19파일 + assetLoader + usePixelOffice
- **백엔드 보안 정비**: module-registry GET 인증, AiClient CircuitBreaker/Retry, 벤치마크 @Deprecated
- 84개 테스트 통과, Next.js 빌드 성공
- CREDITS.md MIT 라이선스 고지

### 세션 #18 (2026-04-06, 로그 누락 — #19에서 복원)
- 관리자 /admin/office: 실시간 Hook SSE + 이벤트 로그 사이드바
- Pixel Office hardening: 실제 타임랩스(Git 이력), Hook 보안, 테스트, 커밋 시각화
- 줌/팬 UX 수정 (auto-fit, DPR, 휠 passive listener)

### 세션 #19 (2026-07-09)
- **Docker 29 호환**: Testcontainers 2.0.5 업그레이드 → 백엔드 통합 테스트 복구 (131개 전부 통과)
- **취약점 정리**: npm audit 27→2, next 16.2.10 (프론트 107개 테스트 + 빌드 통과)
- docker-compose 정리 (FastAPI 라벨, 미존재 ai-benchmark-api 주석 처리)
- 브랜치/PR 중복 문제 발견 및 문서화

---

## 💡 다음 세션을 위한 메모

### 다음 세션(#20) 우선순위
1. **PR/브랜치 정리** (같은 브랜치 PR 2개 중복 — 사용자 결정 필요)
2. ai-backend pytest + CI 잡 추가
3. admin office SSE 서버측 인증
4. 커서 트레일 + 벤치마크 시각화 (잔여 디자인 항목)
5. AI Benchmark API (FastAPI)
6. Service Registry UI 대시보드

---

**이 문서는 프로젝트의 현재 상태를 나타냅니다.**
**세션이 바뀔 때마다 반드시 업데이트하세요.**
**AI 에이전트는 세션 시작 시 이 문서를 가장 먼저 읽어야 합니다.**


## weather_companion 작업실 연결 (2026-09-15)

사용자 요청으로 인접 weather_companion 폴더의 AGENTS/기획/컨텍스트를 읽고 프로젝트별 .codex/hooks.json에 중앙 수집기와 --allow-project 절대 경로를 연결했다. 이벤트 7개와 실제 CLI 인수 처리 검증 완료. 글로벌 설정·앱 코드·운영 프론트 변경 없음. 새 훅 신뢰 검토 후 다음 사용자 요청부터 집계하며 실제 출근은 아직 확인 전이다. 프로젝트 내 docs/sessions/2026-09-15-office-link.md에 인계했다. 다른 세션의 staged 변경은 유지했고 해당 저장소에서 커밋하지 않았다.


## 출근 확인 및 다음 우선순위 (2026-09-15)

- 사용자가 weather_companion 연결 후 출근을 확인했다. 수집기 조회에서도 honcheon-server와 portfolio-blog의 두 실제 세션을 확인했다(서로 다른 시점의 관찰).
- 남은 우선순위: 편집 충돌/편집 시각 분리 → 수정 이력·복원 → 영속 AI 요약·분류 추천 → 내부 링크/역링크·그래프. 실제 기록 작성과 사용성 확인은 병행한다.
- 공개 목록은 이미 본문을 제외한다. 본인 목록은 본문 포함이므로 경량화 대상이다. 기존 동기 AI 요약 호출은 구현되어 있지만 결과 이력 저장과 운영 모델 응답 확인은 별도다. DB+첨부 수동 백업/복원 검증은 완료, 정기 자동 백업·별도 장소 복제·사용자 내보내기는 후속이다.


## 작업실 퇴근·대기 표현 (2026-09-15)

사용자 요청으로 저장 충돌 작업에 앞서 프론트 퇴근 애니메이션을 구현했다. 1.2초 서서 대기→기존 장애물 회피 통로→출구에서 제거, 마지막 퇴근 후 소등. 퇴근 중은 실제 활성 세션 수에서 제외. 같은 세션 복귀·연결 장애·방송 off·동작 줄이기 처리. Frontend 40files/220tests 및 production build/TypeScript/lint, 실제 브라우저 이동·대기·소등·복귀·모바일 다크 검증 통과. backend/DB/수집기/훅은 변경하지 않았다. 소스는 backups/releases/office-departure-2026-09-15-source.tar.gz(0600), 이미지·QA는 docs/review/assets/2026-09-15/office-departure에 보관한다. 기존 미배포 BlogPreviewSection은 제외했다.
