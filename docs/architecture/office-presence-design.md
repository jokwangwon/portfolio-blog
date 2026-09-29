# Office 작업 세션 출퇴근

2026-09-15 사용자 승인: 작업이 없으면 빈 사무실·소등, 독립 작업 세션마다 캐릭터 한 명, 종료 시 퇴근. 이 명세가 공개 Office의 GitHub 재생 설정보다 우선한다.

## 범위와 공개 계약

- 공개 Office는 GitHub와 무관한 현재 작업 상태만 표시한다. 캐릭터는 실제 직원이 아닌 활성 작업 세션이다.
- 로컬 Python 수집기가 허용된 프로젝트의 Claude Hook / 명령 실행 래퍼 이벤트를 수집한다. 웹사이트에 이벤트 쓰기 API를 만들지 않는다.
- `.office-presence/`는 Git 제외. 내부 세션 기록은 소유자 전용, `public/status.json`만 frontend 컨테이너에 읽기 전용 마운트한다. 원문 대화, 명령, 출력, 경로, 원본 세션 ID를 웹 서버에 전달하지 않는다.
- 공개 스키마: version, updatedAt, enabled, sessions[{id(임의 UUID), source(claude/codex/local), activity(working/reading/editing/running/testing/waiting), startedAt}]. 최대 24세션. 서버에서도 스키마를 검증·재구성한다.
- 수집기는 2초마다 스냅샷을 원자적으로 교체한다. SSE GET `/api/office/events`가 2초마다 최신 스냅샷을 전달한다. GET `/api/office`는 동일한 단발 조회. 쓰기는 405.
- 수집기 하트비트가 15초 이상 오래되거나 파일이 없으면 unavailable. 수집기 연결 장애와 확인된 빈 사무실을 구분한다. 브라우저 연결 장애 시에도 이전 작업을 현재 작업으로 표시하지 않는다.
- 프로세스 PID와 시작 시각으로 생존 확인(재사용 PID 제외). Claude UserPromptSubmit 출근, PreToolUse 행동 변경, PermissionRequest 대기, PostToolUse 일반 작업 복귀, Stop/SessionEnd 퇴근. 도구 미호출만으로 퇴근시키지 않는다.
- Claude 설치/실행 환경에 따라 Hook 재시작이 필요하다. 실행 부모를 식별할 수 없는 이벤트는 수집하지 않는다. 브라우저 ChatGPT/Claude와 현재 Codex 앱 대화의 자동 감지는 이번 범위 밖이다. Codex 비대화형 작업과 일반 명령은 실행 래퍼로 연결한다.
- 방송 off는 즉시 명단을 비우고 기존 내부 세션을 삭제한다. 다시 on해도 이전 작업은 자동 복원하지 않는다.
- 캐릭터 추가/제거 효과를 출퇴근으로 사용한다. 대기 세션도 출근 상태를 유지한다. 0세션은 소등. 기존 관리자 개발용 Hook 페이지는 계속 운영 차단한다.

## 검증

중복 세션, 다중 작업, 종료/비정상 종료, PID 재사용, 방송 off, 허용 경로 외 작업, 원문 유출 방지, 오래된 하트비트, 잘못된 스냅샷, SSE 중단 정리, 브라우저 연결 장애, 모바일·출퇴근·소등을 확인한다.

## 근거

- https://code.claude.com/docs/en/hooks
- https://developers.openai.com/codex/noninteractive/
- Next.js 16 로컬 route handler 가이드

Portal DB와 기존 블로그 API/권한에는 변경 없음. 장기 작업 이력 저장·원격 컴퓨터 수집·브라우저 대화 자동 추적은 별도 확장이다.

## 확장: 계절 테마·작업 칠판

2026-09-15 [계절·칠판 설계](office-season-board-design.md)에 따라 세션에 선택적 publicTitle을 추가했다. 원문 자동 추출 금지는 유지하며 실행 옵션/환경변수로 명시한 공개 제목만 허용한다. 기존 publicTitle 없는 세션도 지원한다.

## 확장: Codex 공식 Hook (2026-09-15, 사용자 승인)

프로젝트 .codex/hooks.json에서 codex-hook 명령을 연결한다. UserPromptSubmit 출근, PreToolUse/PostToolUse 상태 변경, PermissionRequest 대기, Stop/Interrupt/SessionEnd 퇴근. session_id와 turn_id를 구분해 이전 턴의 지연 이벤트가 다음 턴을 끝내지 못하게 한다. 원문/transcript_path/tool_input/tool_response는 사용·보관하지 않는다. 제목은 명시한 OFFICE_PUBLIC_TITLE만 사용한다. 프로젝트 허용 경로와 부모 Codex PID 확인 필수. 프로세스 존재만으로 출근시키지 않는다.

설정 파일 준비와 실제 활성화는 구분한다. Codex 자체 /hooks 신뢰 검토와 설정 로딩 후 다음 요청에서 실제 출근을 확인한다. 신뢰 승인 우회/임의 출근 등록 없음. 시작→도구→대기→종료, 이전 턴 이벤트, 중단, 세션 종료, 방송 off, 원문 제외, PID 종료를 검증한다.

공식 명세: https://developers.openai.com/codex/hooks

## 확장: 프로젝트 기준 칠판과 최근 작업 (2026-09-15, 사용자 승인)

허용된 작업 루트의 폴더명만 projectName으로 공개한다. cwd는 내부 판별에만 사용하고, 하위 디렉터리·절대 경로·부모 경로를 공개하지 않는다. 중첩 허용 루트에서는 가장 구체적인 루트를 선택한다. projectName은 최대64자 일반 문자/숫자/공백 및 ._()- 만 허용한다. 기존 projectName 없는 세션은 하위 호환한다.

허용된 실제 start/update 이벤트가 오면 최근 프로젝트 하나의 projectName/lastActiveAt을 소유자 전용 recent-project 파일에 저장한다. 하트비트는 활동 시각을 갱신하지 않는다. 종료/비정상 종료는 최근 작업을 유지하되 현재 세션을 지운다. 지연된 이전 턴 이벤트·허용되지 않은 작업은 최근 프로젝트를 바꾸지 않는다. 방송 off는 최근 기록도 삭제하고 on 시 복구하지 않는다. 공개 스냅샷에는 검증된 선택적 recentProject만 추가한다. 연결 장애/방송 off에서는 과거 기록을 숨긴다. 수집기 재시작 뒤에도 최근 기록 한 건을 유지하며 장기 이력은 저장하지 않는다.

현재 세션은 projectName 기준으로 묶고 업무/도구를 함께 표시한다. 활성 세션이 없을 때만 최근 작업과 마지막 활동 시각을 표시한다. 최근 프로젝트가 인원·조명·진행 중 수에 포함되면 안 된다. 작업실의 장문 소개/전체 프로젝트 모음 대신 칠판 중심으로 구성하고 기록/포트폴리오로 가는 짧은 링크를 유지한다. 원문 대화·명령으로 업무 제목을 추측하지 않으며 명시된 publicTitle 또는 activity 라벨을 사용한다.


## 퇴근·대기 동작 (2026-09-15)

작업 종료는 명단/칠판에서 즉시 제외하고 캐릭터는 1.2초 대기 후 하단 출구로 걸어 나간다. 퇴근 인원은 별도 표시하며 마지막 퇴근 후 소등한다. 응답 대기는 자리와 출근 상태를 유지한다. 연결 장애/방송 off는 즉시 비우고 동작 줄이기는 퇴근 이동을 생략한다. [설계](../architecture/office-departure-design.md).
