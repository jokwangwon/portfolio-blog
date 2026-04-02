# AI Backend 분리 설계서

> Portal API에서 AI 기능을 독립 서비스(`ai-backend`)로 분리

**작성일**: 2026-04-02
**최종 수정**: 2026-04-02
**스택**: **Python 3.12 + FastAPI** (Java에서 전환)
**우선순위**: 높음
**관련 문서**: [depth-2-module-structure.md](./depth-2-module-structure.md), [API_SPECIFICATION.md](../api/API_SPECIFICATION.md)

---

## 0. 스택 전환: Java → Python

### 전환 사유

초기 구현은 기존 Portal API 코드 재사용을 위해 Java(Spring Boot)로 작성했으나,
다음 이유로 **Python(FastAPI)**으로 전환 결정:

1. **LLM 생태계**: LangChain Python이 Java 대비 압도적으로 풍부 (RAG, Agent, Tool, VectorStore, Callbacks 등)
2. **고급 AI 기능 확장**: 향후 RAG 파이프라인, AI Agent, 벡터 검색, 임베딩 등 고급 기능 추가 예정
3. **경량성**: JVM ~200MB+ vs Python ~50MB, AI 연산 서비스에 적합
4. **포트폴리오 가치**: Python AI 역량 + Spring Boot 백엔드 역량을 동시에 어필

### 기술 스택

| 레이어 | 도구 |
|--------|------|
| 웹 프레임워크 | FastAPI |
| LLM 체인 | LangChain + langchain-google-genai + langchain-ollama |
| HTTP 클라이언트 | httpx (async, Notion API용) |
| 설정 관리 | pydantic-settings |
| 런타임 | uvicorn |

### 영향 범위

- **Portal API**: 변경 없음 — AiClient는 HTTP 엔드포인트만 호출하므로 내부 구현 언어 무관
- **Frontend**: 변경 없음
- **docker-compose**: context만 변경

---

## 1. 배경 및 동기

### 현재 상태

Portal API(Spring Boot)가 다음 모듈을 모두 포함:
- `module-blog`, `module-user`, `module-registry`
- `module-ai` — Notion 연동 + LLM 초안 생성 + AI 요약
- `module-benchmark` — AI 벤치마크

### 문제점

1. **비대한 모놀리스**: LangChain4j/WebFlux 의존성이 Portal API 전체에 영향
2. **관심사 혼재**: 블로그 CRUD와 LLM 호출은 완전히 다른 리소스 프로파일
3. **독립 스케일링 불가**: LLM 호출이 느려도 블로그 API까지 영향

### 목표

- `module-ai` + `module-benchmark`를 Portal API에서 제거
- 새로운 `ai-backend/` 독립 Spring Boot 서비스로 이전
- **Frontend 변경 없음** — Portal API가 상태 관리 + 오케스트레이션 담당

---

## 2. 아키텍처

### 핵심 원칙

> **ai-backend는 데이터를 받고 처리만 하는 순수 연산 서비스**
> - 자체 DB 없음, 인증 없음 (내부 서비스)
> - 상태 관리는 Portal API가 전담
> - Frontend는 ai-backend의 존재를 모름

### 통신 흐름

```
┌──────────┐     /api/portal/ai/*     ┌──────────────┐    내부 REST    ┌──────────────┐
│ Frontend │ ──────────────────────►   │  Portal API  │ ──────────────► │  ai-backend  │
│ (Next.js)│ ◄──────────────────────   │  :8080       │ ◄────────────── │  :8081       │
└──────────┘     응답 (JSON)          │              │    처리 결과    │              │
                                       │  - 인증/권한 │                │  - LLM 호출  │
                                       │  - 상태 관리 │                │  - Notion 연동│
                                       │  - 오케스트레│                │  - 벤치마크   │
                                       │    이션      │                │              │
                                       └──────────────┘                └──────────────┘
                                              │                               │
                                              ▼                               │
                                       ┌──────────────┐                      │
                                       │  Portal DB   │            DB 없음 (Stateless)
                                       │  :5432       │
                                       └──────────────┘
```

### Portal API의 역할 (오케스트레이터)

1. **인증/권한 검증** — JWT 토큰 확인, 사용자 권한 체크
2. **요청 전처리** — 필요한 데이터를 DB에서 조회하여 ai-backend에 전달
3. **ai-backend 호출** — WebClient로 내부 REST 호출
4. **결과 후처리** — 결과를 DB에 저장하거나 가공하여 Frontend에 응답

### ai-backend의 역할 (순수 연산)

1. **LLM 호출** — Gemini/Ollama를 통한 텍스트 생성
2. **Notion 연동** — Notion API에서 페이지 읽기 + 마크다운 변환
3. **벤치마크 실행** — AI 모델 성능 측정
4. **결과 반환** — 처리 결과만 반환 (저장/상태 관리 없음)

---

## 3. ai-backend 프로젝트 구조

```
ai-backend/                              # 프로젝트 루트 (backend과 동급)
├── requirements.txt                     # Python 의존성
├── Dockerfile
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI 앱 + 라우트
│   ├── config.py                        # pydantic-settings 설정
│   ├── schemas.py                       # Pydantic 요청/응답 모델
│   ├── llm_service.py                   # LangChain 기반 LLM 호출 (요약, 초안)
│   └── notion_service.py                # Notion API 연동 (httpx async)
└── tests/
    └── __init__.py
```

### 엔드포인트 (내부 전용, 인증 없음)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/summarize` | 텍스트 요약 |
| POST | `/generate-draft` | Notion 기반 초안 생성 |
| GET | `/health` | 헬스 체크 (Service Registry용) |

> 경로에 `/api/ai` prefix 없음 — 내부 서비스이므로 단순한 경로 사용.
> Portal API가 `http://ai-backend:8081/summarize`로 직접 호출.

---

## 4. Portal API 변경 (오케스트레이터)

### module-ai 대체: AiClient

기존 `module-ai`를 삭제하고, Portal API에 **AiClient** (WebClient 래퍼)를 추가.

```java
// backend/module-blog/src/main/.../client/AiClient.java (또는 공통 모듈)
@Component
public class AiClient {
    private final WebClient webClient;

    public AiClient(@Value("${ai-backend.url}") String aiBackendUrl,
                    WebClient.Builder builder) {
        this.webClient = builder.baseUrl(aiBackendUrl).build();
    }

    public SummarizeResponse summarize(SummarizeRequest request) {
        return webClient.post()
                .uri("/summarize")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(SummarizeResponse.class)
                .block();
    }

    public DraftResponse generateDraft(DraftRequest request) {
        return webClient.post()
                .uri("/generate-draft")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(DraftResponse.class)
                .block();
    }
}
```

### 기존 AiDraftController 변경

```java
// 기존: SummarizationService 직접 호출
// 변경: AiClient를 통해 ai-backend 호출

@PostMapping("/summarize")
public ResponseEntity<SummarizeResponse> summarize(@Valid @RequestBody SummarizeRequest request) {
    SummarizeResponse response = aiClient.summarize(request);
    return ResponseEntity.ok(response);
}
```

---

## 5. 변경 파일 목록

### 신규 생성

| 파일 | 설명 |
|------|------|
| `ai-backend/build.gradle.kts` | Spring Boot + LangChain4j + WebFlux + Caffeine |
| `ai-backend/settings.gradle.kts` | 단일 프로젝트 |
| `ai-backend/Dockerfile` | Docker 빌드 |
| `ai-backend/src/.../AiApplication.java` | 메인 클래스 |
| `ai-backend/src/.../config/*` | AiProperties, AiConfig |
| `ai-backend/src/.../controller/*` | Summarize, Draft, Health |
| `ai-backend/src/.../service/*` | 기존 module-ai 서비스 이전 |
| `ai-backend/src/.../dto/*` | 기존 module-ai DTO 이전 |
| `ai-backend/src/main/resources/application-dev.yml` | AI 설정 |

### 수정

| 파일 | 변경 내용 |
|------|-----------|
| `backend/settings.gradle.kts` | `module-ai`, `module-benchmark` include 제거 |
| `backend/api-server/build.gradle.kts` | module-ai 의존 → WebFlux 의존 (AiClient용) |
| `backend/api-server/src/main/resources/application-dev.yml` | `ai-backend.url` 추가, AI 설정 제거 |
| `backend/module-blog`에 AiClient 추가 또는 공통 모듈에 배치 | ai-backend 호출 래퍼 |
| `docker-compose.yml` | ai-backend 서비스 추가 (port 8081, 내부만) |
| `docs/api/API_SPECIFICATION.md` | 내부 서비스 설명 추가 |
| `docs/architecture/depth-2-module-structure.md` | AI Backend 섹션 추가 |

### 삭제

| 파일 | 이유 |
|------|------|
| `backend/module-ai/` 전체 | ai-backend로 이전 완료 |
| `backend/module-benchmark/` 전체 | ai-backend로 이전 완료 |

### 변경 없음

| 파일 | 이유 |
|------|------|
| `frontend/*` | Portal API 경로 그대로 유지, ai-backend 존재를 모름 |
| `nginx/nginx.conf` | ai-backend는 외부 노출 안 함 |

---

## 6. 구현 순서

1. **ai-backend 프로젝트 생성** — build.gradle.kts, settings, AiApplication
2. **코드 이전** — module-ai 서비스/DTO/컨트롤러를 ai-backend로 복사 + 패키지 리팩토링
3. **module-benchmark 이전** — 벤치마크 코드 이전
4. **Health 엔드포인트** — Service Registry 등록용
5. **Portal API: AiClient** — WebClient 래퍼 작성
6. **Portal API: module-ai 제거** — settings.gradle.kts, 의존성 정리
7. **AiDraftController 수정** — 직접 서비스 호출 → AiClient 호출로 변경
8. **docker-compose 수정** — ai-backend 서비스 추가
9. **application-dev.yml** — ai-backend.url 설정 추가
10. **빌드 검증** — 양쪽 독립 빌드 + 통합 테스트
11. **문서 업데이트** — API spec, 아키텍처 문서

---

## 7. 설정

### ai-backend application-dev.yml

```yaml
server:
  port: 8081

ai:
  notion-api-key: ${NOTION_API_KEY:}
  gemini-api-key: ${GEMINI_API_KEY:}
  ollama-host: ${OLLAMA_HOST:http://localhost:11434}
  ollama-model: ${OLLAMA_MODEL:gemma3:12b}
  gemini-model: ${GEMINI_MODEL:gemini-2.0-flash}
  provider: ${AI_PROVIDER:ollama}
```

### Portal API application-dev.yml 추가

```yaml
ai-backend:
  url: ${AI_BACKEND_URL:http://localhost:8081}
```

### docker-compose.yml 추가

```yaml
ai-backend:
  build:
    context: ./ai-backend
    dockerfile: Dockerfile
  container_name: portfolio-ai-backend
  environment:
    AI_PROVIDER: ${AI_PROVIDER:-ollama}
    GEMINI_API_KEY: ${GEMINI_API_KEY:}
    OLLAMA_HOST: ${OLLAMA_HOST:-http://host.docker.internal:11434}
    NOTION_API_KEY: ${NOTION_API_KEY:}
  ports:
    - "8081:8081"    # 개발 시 디버깅용, 프로덕션에서는 내부만
  networks:
    - portal-network
  restart: unless-stopped
  profiles:
    - backend
```

---

## 8. 포트 배정

| 서비스 | 포트 | 외부 노출 |
|--------|------|-----------|
| Portal API | 8080 | O (Nginx) |
| AI Backend | 8081 | X (내부) |
| AI Benchmark API (FastAPI) | 8000 | O (Nginx) |
| Frontend (Next.js) | 3000 | O (Nginx) |
| Nginx Gateway | 80 | O |

---

## 9. 리스크 및 완화

| 리스크 | 완화 |
|--------|------|
| Portal → ai-backend 네트워크 지연 | 같은 Docker network, LLM 호출 자체가 수초이므로 무시 가능 |
| ai-backend 장애 시 | 블로그 CRUD에 영향 없음. AI 요약만 실패 → 적절한 에러 메시지 |
| 개발 시 두 서비스 동시 실행 | docker-compose 또는 별도 터미널로 관리 |
