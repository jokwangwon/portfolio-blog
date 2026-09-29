# 공개 Office 운영

> 2026-09-15: 다른 프로젝트는 중앙 스크립트에 --allow-project <프로젝트 절대경로>를 명시해 연결한다. 기본 수집 범위는 기존 저장소를 유지한다. honcheon-server의 프로젝트별 Codex 7개 훅을 연결했다. 신규 훅은 해당 CLI의 /hooks에서 검토·활성화 후 다음 UserPromptSubmit부터 집계한다. 활성화 전에 진행 중이던 턴의 도구 이벤트만으로 출근을 생성하지 않는다.

관련 명세: [작업 세션 출퇴근](../architecture/office-presence-design.md).

## 방송 제어

저장소 루트에서 실행한다.

```bash
python3 scripts/office-presence.py on
python3 scripts/office-presence.py off
python3 scripts/office-presence.py status
```

방송 off는 기존 세션 기록을 지운다. 다시 on해도 과거 세션이 재등장하지 않으며 다음 작업 시작부터 수집한다. 켜짐 상태는 서버 재부팅 뒤에도 유지된다. 공개 상태 파일에는 경로·명령·대화·도구 출력이 없다.

## 연결 범위

- 이 프로젝트의 Claude Code: 프로젝트 Hook 설정 적용 후 새 요청 시작 시 출근, 도구 사용 시 행동 변경, 응답 완료/세션 종료 시 퇴근한다. 권한·사용자 입력 대기는 출근 상태로 유지한다. 실행 중인 Claude Code는 설정 재로딩/재시작이 필요할 수 있다.
- 부모 Claude 프로세스를 이름으로 식별할 수 없는 실행 환경에서는 잘못된 인원을 만들지 않고 수집을 생략한다. 브라우저 Claude 대화는 연동 대상이 아니다.
- Codex CLI: 프로젝트 `.codex/hooks.json`을 신뢰한 뒤 다음 요청부터 공식 Hook으로 자동 출근/퇴근한다. 작업 시작·도구·승인 대기·완료·중단을 연결한다. 기존 실행 중 대화에 소급 적용하지 않는다. 브라우저 ChatGPT 및 Hook을 실행하지 않는 클라이언트는 연동하지 않는다.
- Codex 비대화형 작업: Hook을 사용하거나 아래 래퍼로 명령의 실제 실행 수명을 연결한다. 래퍼 안에서는 Hook 수집을 생략해 중복 인원을 방지한다.
- 직접 빌드·테스트: 같은 래퍼를 사용한다. 중첩 래퍼는 인원을 늘리지 않는다. 테스트 결과를 추정하지 않으며 실행 상태만 표시한다.
- 허용 범위는 이 저장소와 하위 디렉터리다. PC 전체 파일 변경/프로세스 목록 감시는 하지 않는다. 동시 세션 최대 24개.

```bash
python3 scripts/office-presence.py run --source codex --activity working -- codex exec "작업 요청"
python3 scripts/office-presence.py run --source local --activity testing -- npm --prefix frontend test
```

대화형 CLI 전체를 래퍼로 실행하면 CLI가 열려 있는 동안 출근으로 표시되므로, Codex는 작업이 끝나면 프로세스도 종료하는 exec/review 명령에 사용한다. Claude Hook에 연결된 세션 안에서 별도 래퍼를 실행하는 것은 피한다.

## 운영 구성

- 사용자 systemd 서비스 `portfolio-office-presence.service`가 `python3 scripts/office-presence.py serve`를 실행한다.
- 로그아웃/재부팅 뒤 사용자 서비스 실행을 위해 이 서버는 사용자 linger가 활성화되어 있다.
- 수집기 내부 디렉터리 `.office-presence/private`는 0700, 기록은 0600. `public/status.json`만 Docker frontend에 읽기 전용 마운트한다.
- 수집기 PID 시작 시각을 확인해 비정상 종료된 작업을 정리한다. 사용자 세션 대화나 로그 파일은 열지 않는다.
- 수집기 2초 갱신, SSE 2초 전달. 실제 표시까지 보통 한두 갱신 주기가 걸린다. 수집기 하트비트 15초 초과는 연결 확인 중. 브라우저 무응답 10초 초과도 연결 확인 중.
- 서버 재시작 후 살아 있는 작업 프로세스는 내부 기록을 통해 복원된다. 죽은 프로세스는 제외된다.
- `GET /api/office`: 현재 스냅샷. `GET /api/office/events`: SSE. 공개 쓰기 API 없음.
- 기존 `/admin/office`, `/api/admin/office` 운영 차단 유지.

```bash
systemctl --user status portfolio-office-presence.service
systemctl --user restart portfolio-office-presence.service
```

## 검증

Python 수집기 테스트: `python3 scripts/test_office_presence.py`.
프론트엔드: `cd frontend && npm test`. 실제 운영 확인은 출근 없음 → 연결된 실제 명령 실행 → 종료 후 소등 순서다.

참고: [Claude Hooks](https://code.claude.com/docs/en/hooks), [Codex 비대화형 실행](https://developers.openai.com/codex/noninteractive/).

로컬 Next 개발 서버에서 연결하려면 `OFFICE_PRESENCE_FILE`을 이 저장소의 `.office-presence/public/status.json` 절대 경로로 지정한다. Docker 운영 설정에는 이미 적용되어 있다.

## 계절 테마와 작업 칠판

한국 시간 달력으로 봄(3–5월), 여름(6–8월), 가을(9–11월), 겨울(12–2월)이 바뀐다. 계절 미리보기는 방문자 화면에서만 적용되고, 자동으로 되돌리거나 새로고침하면 실제 날짜 기준으로 복귀한다. 창밖 풍경은 장식이며 실제 날씨 정보가 아니다.

칠판 제목은 **명시적으로 공개용으로 지정한 내용만** 사용한다. 48자 이내의 일반 문자·숫자·공백·기본 문장부호를 지원한다. URL/이메일/경로 형식과 제어문자 등은 제목으로 전달하지 않는다. 지정하지 않았거나 형식이 맞지 않으면 일반 작업 상태가 표시된다. 형식 검증이 회사명·기밀 내용을 판단해 주지는 않으므로 공개 가능한 표현을 작성한다.

```bash
python3 scripts/office-presence.py run --source local --activity testing --public-title "Office 계절 테마 검증" -- npm --prefix frontend test
OFFICE_PUBLIC_TITLE="블로그 화면 개선" claude
```

환경변수는 Claude/Codex Hook에서 읽으며 prompt/tool_input으로 제목을 추출하지 않는다. 명령 래퍼에서는 --public-title 옵션을 사용한다. 업무 제목은 해당 작업 세션이 끝나면 사라지며 최근 프로젝트명과 마지막 활동 시각 한 건만 남는다. [계절·칠판 설계](../architecture/office-season-board-design.md).

## Codex Hook 최초 활성화

1. 이 저장소에서 Codex의 `/hooks`를 열어 프로젝트 `.codex/hooks.json`의 Office presence 항목을 검토한다.
2. 작업 시작/도구/대기/완료/중단/세션 종료의 7개 이벤트가 모두 같은 `scripts/office-presence.py codex-hook` 명령을 실행하는지 확인하고 신뢰한다. 시작만 승인하고 종료를 승인하지 않으면 올바른 퇴근을 보장할 수 없다.
3. 설정이 보이지 않으면 현재 대화를 저장/종료한 뒤 같은 저장소에서 세션을 다시 열어 `/hooks`를 확인한다. 이후 다음 요청부터 출근한다. 프로세스를 종료하거나 재시작하는 작업은 자동 수행하지 않았다.
4. Office에서 요청 중 Codex 한 명, 응답 종료·중단 후 0명 및 소등을 확인한다. 테스트 fixture와 실제 대화 검증은 구분한다.

이 검토는 Codex 자체의 Hook 신뢰 절차다. 신뢰 저장소를 직접 수정하거나 검토를 우회하지 않는다. Hook 입력에서 원문, 명령, transcript_path를 읽거나 저장하지 않는다. [공식 Hook 설명](https://developers.openai.com/codex/hooks).

서울 시간 06:00~18:59는 창밖 낮, 그 외는 밤으로 표현한다. 출근 인원이 0이어도 낮 풍경은 유지한다. 화면 확대 뒤 `맞춤`으로 전체 사무실을 다시 볼 수 있다.

Hook이 Active=1이어도 현재 실행 프로세스에 연결되지 않았다면 Codex를 종료한 뒤 동일 저장소에서 `codex resume --last`로 재개한다. 로컬 `.office-presence/private/codex-hook-health`는 이벤트 enum/시각/필수 필드 존재 여부 등 진단값만 저장하며 웹에 마운트되지 않는다. 진단 파일이 없는 상태는 아직 Hook 수신을 확인하지 못했다는 뜻이다.

## 사무실 구경과 상호작용

`계절 테마`에서 봄·여름·가을·겨울을 선택하면 창밖뿐 아니라 실내 소파·러그·커튼과 창밖 풍경이 함께 바뀐다. 바닥과 목재는 공통의 차분한 색을 기준으로 계절색을 조절한다. 하단 정원은 제거했다. 창문에는 연결된 창밖 풍경이 보이며, 탁상에는 같은 작은 화병에 계절별 꽃·잎·마른 가지·열매가 놓인다. `자동`은 서울 달력에 맞춘 테마다.

고양이는 사무실을 꾸미는 캐릭터이며 출근 인원에 포함되지 않는다. 출근 여부와 관계없이 휴게 공간을 산책하고, 한 바퀴 뒤 바구니에서 잠깐 쉰 다음 다시 움직인다. 고양이나 `고양이 쓰다듬기` 버튼을 누르면 하트로 반응한다. 커피잔이나 `커피 내리기` 버튼은 잠깐 김을 표시한다. 버튼은 키보드로도 사용할 수 있다.

이 상호작용은 방문자의 현재 화면에서만 동작한다. 작업 상태·조명·다른 방문자 화면을 바꾸지 않는다. 기기의 동작 줄이기 설정에서는 고양이가 이동하지 않고 반응도 정적인 형태로 표시된다.

Office 다크 모드는 카드·칠판·버튼·보조 글씨에 별도 색을 적용한다. 헤더의 테마 버튼으로 전환하며 새로고침해도 선택을 유지한다. 다크 모드와 서울 시각 낮/밤·작업 유무에 따른 소등은 서로 별개의 상태다. 고양이가 돌아다녀도 출근 인원이나 조명은 바뀌지 않는다.

## 프로젝트 칠판

작업실은 연결된 프로젝트 루트의 폴더명을 기준으로 현재 세션을 묶는다. 이 저장소의 frontend/backend 하위 폴더에서 작업해도 portfolio-blog로 표시한다. 업무는 명시적 공개 제목 또는 일반 작업 상태이며 대화/명령 내용을 자동 요약하지 않는다. 현재 기본 연결 범위는 이 저장소다. 다른 프로젝트의 PC 활동을 자동 검색하지 않는다.

작업이 없으면 마지막으로 실제 활동한 프로젝트와 서울 시간 기준 마지막 활동 시각을 표시한다. 단순 하트비트와 오래된 턴 이벤트는 시각을 갱신하지 않는다. 최근 정보는 `.office-presence/private/recent-project`에 0600으로 한 건만 저장하며 프로젝트명/시각 외 데이터는 공개하지 않는다. 수집기 재시작 후 유지되고 방송 off 시 삭제된다. 연결 장애에서는 최근 기록도 숨긴다. 종료/비정상 종료는 프로젝트 완료로 표시하지 않는다.


## 퇴근·대기 동작 (2026-09-15)

작업 종료는 명단/칠판에서 즉시 제외하고 캐릭터는 1.2초 대기 후 하단 출구로 걸어 나간다. 퇴근 인원은 별도 표시하며 마지막 퇴근 후 소등한다. 응답 대기는 자리와 출근 상태를 유지한다. 연결 장애/방송 off는 즉시 비우고 동작 줄이기는 퇴근 이동을 생략한다. [설계](../architecture/office-departure-design.md).
