# AI Backend 포지셔닝 개편 — 2026-09-29

## 분석과 변경 범위

기존 홈은 데이터베이스 학습 중심 Hero → 포트폴리오/Oracle 학습 게임 대표 카드 → 기타 프로젝트 → 소개 → 기술 필터 → 경력 → 블로그 → 연락처 순서였다. 혼천은 기타 프로젝트였고, 논문 섹션은 없었다. 공개 화면 소스에서 오래된 Notion 링크·회사 상세 주소·빈 자격증 섹션·현재 재직 표현은 발견하지 않았다.

기존 색상 토큰, glass-card, 버튼, 타이포그래피, 반응형 최대 너비와 모션을 유지한다. 새 이미지는 만들지 않는다.

변경 후 순서: Hero → Selected Work(민원e, 혼천) → Publication → 공개 개인 도구 3개 → 소개 → 기술과 사용 맥락 → 경력·학습 → 블로그 → 연락처.

| 파일 | 변경 목적 |
| --- | --- |
| `frontend/src/modules/portfolio/components/HeroSection.tsx` | 이름·직무·서비스 연결 역량·경력/논문/운영 근거와 해당 섹션 링크 |
| `frontend/src/modules/portfolio/data/projects.ts` | 민원e 사례 추가, 혼천 우선 배치와 구현 상태 구분, 공개 저장소 4개로 선별 |
| `frontend/src/modules/portfolio/components/ProjectCard.tsx` | 문제·역할·선택·결과와 상태를 읽는 사례 카드 |
| `frontend/src/modules/portfolio/components/ProjectsSection.tsx` | 대표 작업과 보조 개인 프로젝트 분리, GitHub 이전에 설명 제공 |
| `frontend/src/modules/portfolio/components/PublicationSection.tsx` | 논문 제목·저자·서지·DOI·공식 KCI 링크 신설 |
| `frontend/app/(portfolio)/page.tsx` | 논문과 보조 프로젝트 배치 |
| `frontend/src/modules/portfolio/components/AboutSection.tsx` | 과거 실무와 현재 개인 개발을 구분 |
| `frontend/src/modules/portfolio/data/techStack.ts` | 실제 근거가 있는 기술과 사용 맥락만 선별 |
| `frontend/src/modules/portfolio/components/TechStackSection.tsx` | Backend / AI Integration / Infra·Ops / Research를 한눈에 표시 |
| `frontend/app/layout.tsx` | 검색 제목·설명을 Hero와 일치 |

Oracle 학습 게임과 ora-ppt-gen은 홈 프로젝트 목록에서 제외했다. 경력 원본 기간, 블로그, 작업실 기능은 유지한다. 작업 시작 시 이미 변경되어 있던 BlogPreviewSection과 다른 문서는 이번 개편에서 수정하지 않았다.

## 근거와 표현 한계

### 실무

- 민원e의 담당 범위, 1024차원 임베딩, 주제별 사전 그룹화, DBSCAN, 대표 문서/Noise 처리, 일·주·월·연 스냅샷, 권한 Scope, 리포트/LLM 입력, 챗봇 API, preset, 온프레미스 운영은 이번 사용자 설명을 근거로 한다.
- 회사 코드를 직접 검증했다는 의미가 아니다. 비공개 코드·고객 식별정보·내부 수치·주소는 수집하거나 추가하지 않았다. 정량 성과와 기술 선택의 새로운 이유를 만들어 넣지 않았다.
- 기존 `portfolio-disclosure-policy.md`의 요약 공개 방침보다 이번 사용자의 구체적인 민원e 소개 요청이 우선한다. 공개 확장은 이번에 직접 제공한 담당 내용으로 한정한다.
- Hero의 1년 6개월은 사용자 제공값이다. 기존 경력의 연월 표기(2024.07–2026.01)는 그대로 유지했다. 인턴 포함 여부와 정확한 입퇴사일에 따른 산정은 추가 확인 대상이며 연월만으로 재계산하지 않았다.

### 혼천

[공개 저장소](https://github.com/jokwangwon/honcheon-server)와 로컬 checkout에서 다음 근거를 확인했다. 로컬 작업 내용이 전부 원격에 반영되어 있다는 의미는 아니다.

- `core/src/main/java/com/honcheon/core/rules/RegionStateEngine.java`: 설정 기반 지역 상태 변화·회복 계산 코드.
- `core/src/main/java/com/honcheon/core/rules/FactionReactionEngine.java`, `core/src/test/java/com/honcheon/core/rules/WorldReactionParityTest.java`: 세력 반응 계산과 규칙 검증 코드 존재.
- `tools/prebirth_bot_driver.cjs`: Mineflayer 서버 접속·이동 도구.
- `tools/map04/capture.py`, `tools/building_capture_compare.py`: 실제 클라이언트 촬영과 촬영 결과 비교 도구.
- `docs/design/hwasan_ground_paths_2026-09-19.md`: 건축 배치와 지형·바닥을 구분하는 작업 및 보행 검토 기록. 전체 맵 완성이 아님을 명시.
- `docs/design/world_reaction_system.md`: 행동 → 소문 → 세력 → 지역 → 후속 사건 설계.
- AI 생성·레퍼런스 비교 의도는 사용자 설명과 생성/검토 도구를 근거로 하며, 자동 시각 판정 전체가 완성되었다고 쓰지 않는다. 전체 월드 반응의 인게임 통합 완료는 미확인이다.

### 공개 개인 프로젝트

- `portfolio-blog`: 현재 코드의 인증/블로그 모듈과 기존 운영 기록을 유지했다.
- [AI_development_tool](https://github.com/jokwangwon/AI_development_tool): 공개 README·디렉터리, 로컬 `src/jarvis/`, `src/adapters/llm/`, 검사 도구를 확인했다. 무인 개발 완성·생산성 수치는 주장하지 않는다.
- [Alert-log-project](https://github.com/jokwangwon/Alert-log-project): 공개 README 및 로컬 `classify.py`의 YAML/정규식 기반 분류·ORA 코드 처리를 확인했다. 스터디 결과물이며 실시간 감시·자동 장애 진단으로 확대하지 않는다. 공동 작업의 개별 기여 비율은 확인하지 않아 단독 개발로 표현하지 않는다.

### 논문

[KCI 공식 서지](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003221222)를 2026-09-29 확인했다.

- 제목: 행동 레이블링 데이터셋을 활용한 CNN 및 dlib 기반 어린이 행동 유형 분류 시스템
- 저자 순서: 조광원, 김동현, 박승민. 제1저자 표기는 사용자 설명과 일치한다.
- 한국전자통신학회 논문지, 2025, 20(3), 651–656.
- DOI: https://doi.org/10.13067/JKIECS.2025.20.3.651
- 정확도 등 성능 수치나 저자별 세부 구현 기여는 추가하지 않는다.

### 기술 목록

Python/FastAPI·PostgreSQL·Redis·OpenSearch·LLM·Embedding은 사용자 제공 실무 경험, Spring Boot/Docker는 개인 프로젝트, CNN/dlib/Computer Vision은 논문 맥락이다. LangGraph/STT/Linux의 구체적인 담당 근거는 이번에 별도 검증하지 않아 목록을 확대하지 않았다. 자격증 영역은 만들지 않았다.

## 검증

- 기존 프런트엔드 테스트: 40개 파일, 223개 테스트 통과.
- 변경 파일 ESLint 통과.
- `npm run build`: Next.js 프로덕션 빌드, TypeScript, 정적 페이지 생성 통과.
- Playwright: 로컬 프로덕션 서버에서 320/390/1280px × light/dark 6가지 통과. 단일 h1, 제목 메타데이터, 핵심 근거의 첫 화면 노출, 섹션 순서, 내부 앵커 이동, 요청한 GitHub 4개 링크, 민원e 비공개 코드 링크 부재, 가로 넘침 부재, 브라우저 실행 오류 부재 확인.
- 브라우저 검증은 reduced motion에서 실행했다. 로그인 API는 401, 블로그 목록은 빈 응답 fixture로 대체했으므로 백엔드 운영 상태 검증을 의미하지 않는다. 논문과 GitHub의 href를 검사했고, 논문 공식 서지는 별도 웹 조회로 확인했다.
- 화면을 직접 검토했다. 스크립트: `/tmp/portfolio-positioning-qa.cjs`, 결과/스크린샷: `/tmp/portfolio-positioning-qa/`.
- `git diff --check` 통과. 개편 검증 시점에는 운영 배포·커밋을 수행하지 않았다.
- 후속 Git 저장 요청에 따라 대표 화면 5개와 [브라우저 검사 결과](../review/assets/2026-09-29/portfolio-positioning/results.json)를 저장소에 보관했다. 문서/구현 브랜치와 커밋 구분은 [세션 기록](../sessions/SESSION_2026-09-29.md) 참조. 운영 배포는 하지 않았다.
