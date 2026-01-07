# 프로젝트 헌법 (Project Constitution)

> **이 문서는 프로젝트의 최상위 규칙입니다. 모든 개발자와 AI 에이전트는 이 원칙을 절대적으로 준수해야 합니다.**

**제정일**: 2026-01-07
**최종 수정**: 2026-01-07
**우선순위**: 🔴 **CRITICAL** (모든 문서 중 최우선)

---

## 📜 헌법 제정 이유

이 프로젝트는 **2026년 취업 포트폴리오**를 목적으로 합니다.
따라서 다음 가치를 최우선으로 합니다:

1. **코드 품질** > 빠른 개발 속도
2. **일관성** > 개인 취향
3. **확장성** > 단기 편의성
4. **문서화** > 암묵적 지식

---

## 제1조: 불변의 원칙 (Immutable Principles)

### 제1항: 설계 문서 준수
- 모든 개발은 `blog-architecture-context.md`, `depth-2-module-structure.md` 설계를 따라야 함
- 설계 변경은 문서 업데이트 후 진행
- **위반 시**: 코드 거부, 재작성 필요

### 제2항: 개발 가이드 절대 준수
- `DEVELOPMENT_GUIDE.md`의 모든 규칙은 강제 사항
- 코딩 컨벤션, Git 규칙, API 설계 원칙 예외 없음
- **위반 시**: PR 거부, 수정 필요

### 제3항: 보안 우선
- 환경 변수에 시크릿 저장 (코드에 하드코딩 금지)
- SQL Injection, XSS 방지 필수
- 인증/인가 우회 금지
- **위반 시**: 즉시 수정, 배포 중단

---

## 제2조: 모듈 독립성 원칙

### 제1항: 모듈 간 직접 의존 금지
```
✅ 허용: module → shared/common
✅ 허용: module → domain/core
❌ 금지: module → module
❌ 금지: 순환 참조
```

### 제2항: Public API만 노출
- 각 모듈은 `index.ts` (Frontend) 또는 Public Interface (Backend)로만 외부 노출
- 내부 구현은 외부에서 접근 불가
- **위반 시**: 리팩토링 필요

---

## 제3조: 코드 품질 기준

### 제1항: 테스트 커버리지
- 모든 Service/비즈니스 로직은 단위 테스트 필수
- Controller/API는 통합 테스트 필수
- 최소 커버리지: **70% 이상**
- **위반 시**: PR 머지 불가

### 제2항: 코드 리뷰
- 모든 PR은 리뷰 필수 (자기 리뷰 포함)
- 체크리스트 확인:
  - [ ] 설계 문서 준수
  - [ ] 테스트 작성
  - [ ] 문서 업데이트
  - [ ] 보안 체크

### 제3항: 성능 최적화
- N+1 쿼리 방지 (Fetch Join 사용)
- 캐싱 전략 적용 (Redis)
- React 컴포넌트 최적화 (memo, useMemo)
- **위반 시**: 성능 개선 필요

---

## 제4조: Git 워크플로우 원칙

### 제1항: 브랜치 전략
```
main       ← 프로덕션 (태그로 버전 관리)
  ↑
develop    ← 개발 통합 (모든 기능 병합)
  ↑
feature/*  ← 기능 개발 (완료 후 삭제)
hotfix/*   ← 긴급 수정 (main에서 분기)
```

### 제2항: 커밋 메시지 강제
```
<type>(<scope>): <subject>

feat(auth): JWT 인증 구현
fix(post): 조회수 증가 버그 수정
docs(readme): 설치 가이드 추가
```

**Type 필수**: feat, fix, refactor, style, test, docs, chore, perf

### 제3항: PR 조건
- 최소 1개 이상의 커밋
- 충돌 해결 완료
- CI/CD 통과
- 리뷰 승인

---

## 제5조: API 설계 원칙

### 제1항: RESTful 규칙
```
✅ GET    /api/v1/posts
✅ POST   /api/v1/posts
✅ PUT    /api/v1/posts/{id}
✅ DELETE /api/v1/posts/{id}

❌ GET    /api/v1/getPost?id=1
❌ POST   /api/v1/post/create
```

### 제2항: 응답 형식 표준
```json
// 성공
{
  "id": 1,
  "title": "...",
  "createdAt": "2026-01-07T10:00:00Z"
}

// 에러
{
  "timestamp": "2026-01-07T10:00:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "게시글을 찾을 수 없습니다.",
  "errorCode": "POST_NOT_FOUND"
}
```

### 제3항: HTTP 상태 코드
- 200: 성공 (GET, PUT, PATCH)
- 201: 생성 성공 (POST)
- 204: 삭제 성공 (DELETE)
- 400: 잘못된 요청
- 401: 인증 필요
- 403: 권한 없음
- 404: 리소스 없음
- 500: 서버 오류

---

## 제6조: 데이터베이스 원칙

### 제1항: 네이밍 규칙
```sql
-- 테이블: 복수형, snake_case
CREATE TABLE users (...);
CREATE TABLE post_categories (...);

-- 컬럼: snake_case
created_at TIMESTAMP
user_name VARCHAR(100)

-- 인덱스: idx_{table}_{column}
CREATE INDEX idx_posts_created_at ON posts(created_at);
```

### 제2항: 필수 컬럼
```sql
id BIGSERIAL PRIMARY KEY
created_at TIMESTAMP NOT NULL DEFAULT NOW()
updated_at TIMESTAMP NOT NULL DEFAULT NOW()
```

### 제3항: Soft Delete 사용
```sql
-- Hard Delete 금지
ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMP;
```

---

## 제7조: 보안 원칙

### 제1항: 환경 변수 관리
```bash
# ✅ .env 파일 (Git 무시)
DB_PASSWORD=secret123
JWT_SECRET=verysecretkey

# ❌ 코드에 하드코딩 금지
const password = "secret123";  // 절대 금지!
```

### 제2항: SQL Injection 방지
```java
// ✅ JPA/QueryDSL (안전)
.where(post.title.containsIgnoreCase(keyword))

// ❌ 문자열 연결 (위험)
String sql = "SELECT * FROM posts WHERE title LIKE '%" + keyword + "%'";
```

### 제3항: XSS 방지
```typescript
// ✅ DOMPurify 사용
const sanitized = DOMPurify.sanitize(html);

// ❌ 직접 삽입 금지
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

---

## 제8조: 문서화 원칙

### 제1항: 코드 변경 시 문서 업데이트
- 새 API 추가 → Swagger 문서 업데이트
- 아키텍처 변경 → 설계 문서 업데이트
- 설정 변경 → README 업데이트

### 제2항: 주석 작성 규칙
```java
/**
 * 게시글을 생성합니다.
 *
 * @param request 게시글 생성 요청 데이터
 * @return 생성된 게시글 정보
 * @throws UserNotFoundException 작성자를 찾을 수 없는 경우
 */
public PostResponse createPost(PostCreateRequest request) {
    // ...
}
```

### 제3항: README 유지
- 설치 방법 최신화
- 실행 방법 검증
- API 문서 링크 유효성

---

## 제9조: 에러 처리 원칙

### 제1항: 예외 계층 구조
```
BusinessException (최상위)
  ├── PostNotFoundException
  ├── UserNotFoundException
  └── UnauthorizedException
```

### 제2항: 에러 메시지
- 사용자 친화적 메시지
- 개발자용 상세 정보 (로그)
- 에러 코드 부여

### 제3항: 예외 처리 금지 사항
```java
// ❌ 빈 catch 블록
try {
    // ...
} catch (Exception e) {
    // 아무것도 안 함
}

// ❌ Exception 직접 던지기
throw new Exception("에러 발생");

// ✅ 구체적인 예외
throw new PostNotFoundException(id);
```

---

## 제10조: 성능 원칙

### 제1항: 데이터베이스 최적화
- N+1 쿼리 방지
- 인덱스 적절히 사용
- 페이징 처리 (무한 스크롤 방지)

### 제2항: 캐싱 전략
```java
// Redis 캐싱
@Cacheable(value = "posts", key = "#id")
public PostResponse getPost(Long id) {
    // DB 조회
}
```

### 제3항: Frontend 최적화
```typescript
// useMemo로 캐싱
const sortedPosts = useMemo(
  () => posts.sort((a, b) => b.createdAt - a.createdAt),
  [posts]
);

// React.memo로 리렌더링 방지
export const PostCard = React.memo<PostCardProps>(({ post }) => {
  // ...
});
```

---

## 제11조: 테스트 원칙

### 제1항: 테스트 작성 필수
- 모든 Service는 단위 테스트
- 모든 Controller는 통합 테스트
- 중요 기능은 E2E 테스트

### 제2항: 테스트 네이밍
```java
// {method}_{condition}_{expected}
void createPost_validRequest_success()
void getPost_nonExistentId_throwsException()
```

### 제3항: Given-When-Then 패턴
```java
@Test
void createPost_validRequest_success() {
    // Given
    PostCreateRequest request = ...;

    // When
    PostResponse response = postService.createPost(request);

    // Then
    assertThat(response).isNotNull();
}
```

---

## 제12조: 개발 환경 원칙

### 제1항: 환경 분리
```
dev       ← 로컬 개발 (Docker Compose)
staging   ← 테스트 서버 (GB10)
prod      ← 프로덕션 (AWS)
```

### 제2항: 환경별 설정
- `.env.local` (로컬)
- `.env.staging` (스테이징)
- `.env.production` (프로덕션)

### 제3항: Docker 사용
- 모든 서비스 Docker 이미지화
- docker-compose로 로컬 환경 구성
- 환경 이식성 보장

---

## 헌법 수정 절차

이 헌법은 프로젝트의 기반이므로 함부로 수정할 수 없습니다.

### 수정 조건
1. 명확한 수정 이유
2. 대안 검토
3. 팀 합의 (개인 프로젝트의 경우 본인 결정)
4. 문서 업데이트

### 수정 기록
| 날짜 | 조항 | 변경 내용 | 이유 |
|------|------|-----------|------|
| 2026-01-07 | - | 최초 제정 | 프로젝트 시작 |

---

## 위반 시 조치

### 경고 단계
1. **1차**: 코드 리뷰에서 지적, 수정 요청
2. **2차**: PR 거부, 재작성 요청
3. **3차**: 해당 기능 전체 재설계

### 심각한 위반 (즉시 조치)
- 보안 취약점 코드
- 순환 의존성 발생
- 테스트 없이 PR 생성

---

## 체크리스트

개발 시작 전:
- [ ] 이 헌법을 읽었는가?
- [ ] DEVELOPMENT_GUIDE.md를 확인했는가?
- [ ] 설계 문서를 이해했는가?

개발 완료 후:
- [ ] 모든 조항을 준수했는가?
- [ ] 테스트를 작성했는가?
- [ ] 문서를 업데이트했는가?

---

**이 헌법은 프로젝트의 최상위 규칙입니다.**
**모든 개발자와 AI 에이전트는 예외 없이 준수해야 합니다.**

---

**제정**: 2026-01-07
**제정자**: 기원테크
**프로젝트**: 3D 포트폴리오 블로그
