# 개발 가이드라인

> 3D 포트폴리오 블로그 프로젝트의 개발 규칙 및 컨벤션

---

## 📋 목차

1. [프로젝트 구조](#1-프로젝트-구조)
2. [코딩 컨벤션](#2-코딩-컨벤션)
3. [Git 워크플로우](#3-git-워크플로우)
4. [API 설계 규칙](#4-api-설계-규칙)
5. [데이터베이스 규칙](#5-데이터베이스-규칙)
6. [에러 처리 규칙](#6-에러-처리-규칙)
7. [테스트 작성 규칙](#7-테스트-작성-규칙)
8. [보안 규칙](#8-보안-규칙)
9. [성능 최적화 규칙](#9-성능-최적화-규칙)
10. [문서화 규칙](#10-문서화-규칙)

---

## 1. 프로젝트 구조

### 1.1 저장소 구조

```
portfolio-blog/
├── backend/              # Spring Boot 멀티 모듈
├── frontend/             # Next.js 애플리케이션
├── ai-api/              # FastAPI 애플리케이션
├── infrastructure/       # Docker, Nginx 설정
├── docs/                # 프로젝트 문서
└── scripts/             # 유틸리티 스크립트
```

### 1.2 모듈 독립성 원칙

**✅ 허용:**
- `module` → `shared/common`
- `module` → `domain`
- `module` → `core`

**❌ 금지:**
- `module` → `module` (모듈 간 직접 의존)
- 순환 의존성

---

## 2. 코딩 컨벤션

### 2.1 Java / Spring Boot

#### 네이밍 규칙

```java
// 클래스명: PascalCase
public class UserService {}
public class PostController {}

// 인터페이스명: PascalCase
public interface PostRepository {}

// 메서드명: camelCase (동사로 시작)
public User findUserById(Long id) {}
public void deletePost(Long id) {}
public boolean isAdmin() {}
public boolean hasPermission() {}

// 변수명: camelCase
private String userName;
private int pageSize;

// 상수: UPPER_SNAKE_CASE
public static final int MAX_PAGE_SIZE = 100;
public static final String DEFAULT_ROLE = "USER";

// 패키지명: lowercase
com.portfolio.blog.service
com.portfolio.blog.controller.api
```

#### 레이어별 네이밍

| 레이어 | 접미사 | 예시 |
|--------|--------|------|
| Controller | `Controller` | `PostController` |
| Service | `Service` | `PostService` |
| Repository | `Repository` | `PostRepository` |
| DTO | `Request`, `Response` | `PostCreateRequest` |
| Entity | 없음 | `Post`, `User` |
| Exception | `Exception` | `PostNotFoundException` |

#### 코드 스타일

```java
// ✅ 좋은 예
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public PostResponse getPost(Long id) {
        Post post = postRepository.findById(id)
            .orElseThrow(() -> new PostNotFoundException(id));

        return PostMapper.toResponse(post);
    }

    @Transactional
    public PostResponse createPost(PostCreateRequest request) {
        User author = getCurrentUser();

        Post post = Post.builder()
            .title(request.getTitle())
            .content(request.getContent())
            .author(author)
            .build();

        Post saved = postRepository.save(post);
        return PostMapper.toResponse(saved);
    }
}

// ❌ 나쁜 예
@Service
public class PostService {
    @Autowired
    private PostRepository postRepository;  // 필드 주입 금지

    public PostResponse getPost(Long id) {
        Post post = postRepository.findById(id).get();  // get() 직접 호출 금지
        PostResponse response = new PostResponse();     // Builder 사용 권장
        response.setTitle(post.getTitle());
        return response;
    }
}
```

#### 필수 애너테이션 규칙

```java
// Entity
@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post extends BaseEntity {
    @Builder  // 생성자 대신 Builder 패턴
    public Post(...) {}
}

// Controller
@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
@Tag(name = "Post", description = "게시글 API")
public class PostController {}

// Service
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)  // 기본 readOnly, 쓰기 작업만 @Transactional
public class PostService {}

// Configuration
@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {}
```

---

### 2.2 TypeScript / React / Next.js

#### 네이밍 규칙

```typescript
// 컴포넌트: PascalCase
export const PostCard: React.FC<PostCardProps> = () => {}
export const LoginForm: React.FC = () => {}

// 훅: camelCase (use로 시작)
export const useAuth = () => {}
export const usePosts = () => {}

// 유틸 함수: camelCase
export const formatDate = (date: Date) => {}
export const slugify = (text: string) => {}

// 상수: UPPER_SNAKE_CASE
export const API_BASE_URL = 'http://localhost:8080';
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 타입/인터페이스: PascalCase
export interface User {
  id: number;
  name: string;
}

export type PostStatus = 'DRAFT' | 'PUBLISHED';

// Enum: PascalCase
export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER'
}
```

#### 파일 네이밍

| 타입 | 네이밍 | 예시 |
|------|--------|------|
| 컴포넌트 | PascalCase | `PostCard.tsx` |
| 페이지 | lowercase | `page.tsx`, `layout.tsx` |
| 훅 | camelCase | `useAuth.ts` |
| 유틸 | camelCase | `dateFormatter.ts` |
| 타입 | camelCase.types | `post.types.ts` |
| 상수 | camelCase.constants | `api.constants.ts` |

#### Redux Toolkit 규칙

```typescript
// Slice 네이밍: {domain}Slice
// File: store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
};

export const authSlice = createSlice({
  name: 'auth',  // slice 이름: lowercase
  initialState,
  reducers: {
    // reducer 이름: camelCase
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;

// 사용
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogin = () => {
    dispatch(setUser(userData));
  };
};
```

#### 컴포넌트 구조

```typescript
// ✅ 좋은 예
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/dateFormatter';
import styles from './PostCard.module.css';

interface PostCardProps {
  post: Post;
  onDelete?: (id: number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onDelete }) => {
  // 1. Hooks
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = React.useState(false);

  // 2. Handlers
  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(post.id);
    } finally {
      setIsDeleting(false);
    }
  };

  // 3. Render
  return (
    <article className={styles.card}>
      <h2>{post.title}</h2>
      <time>{formatDate(post.createdAt)}</time>
      {user?.role === 'ADMIN' && (
        <button onClick={handleDelete} disabled={isDeleting}>
          삭제
        </button>
      )}
    </article>
  );
};

// ❌ 나쁜 예
export default function PostCard(props) {  // 타입 없음
  const handleDelete = () => {
    props.onDelete(props.post.id);  // 에러 처리 없음
  };

  return <div onClick={handleDelete}>{props.post.title}</div>;  // 시맨틱 태그 미사용
}
```

---

### 2.3 Python / FastAPI

#### 네이밍 규칙

```python
# 클래스: PascalCase
class ModelManager:
    pass

class BenchmarkService:
    pass

# 함수/메서드: snake_case
def get_model_by_id(model_id: str) -> AiModel:
    pass

async def run_benchmark(model_id: str) -> BenchmarkResult:
    pass

# 변수: snake_case
user_name = "John"
max_tokens = 512

# 상수: UPPER_SNAKE_CASE
MAX_LOADED_MODELS = 2
DEFAULT_TEMPERATURE = 0.7

# Private: _snake_case
class ModelManager:
    def __init__(self):
        self._loaded_models = {}

    def _load_from_disk(self, path: str):
        pass
```

#### 타입 힌팅 필수

```python
# ✅ 좋은 예
from typing import List, Optional, Dict
from pydantic import BaseModel

class InferenceRequest(BaseModel):
    model_id: str
    prompt: str
    max_tokens: int = 512
    temperature: float = 0.7

async def generate_text(
    request: InferenceRequest,
    db: Session = Depends(get_db)
) -> InferenceResponse:
    client: LlamaCppClient = await model_manager.load_model(
        request.model_id,
        request.model_path
    )

    result: str = await client.generate(
        prompt=request.prompt,
        max_tokens=request.max_tokens
    )

    return InferenceResponse(generated_text=result)

# ❌ 나쁜 예
async def generate_text(request, db):  # 타입 없음
    client = await model_manager.load_model(request.model_id)
    result = await client.generate(request.prompt)
    return result
```

---

## 3. Git 워크플로우

### 3.1 브랜치 전략 (Git Flow 간소화)

```
main (프로덕션)
  ↑
develop (개발 통합)
  ↑
feature/* (기능 개발)
hotfix/*  (긴급 수정)
```

#### 브랜치 네이밍

```bash
# Feature 브랜치
feature/user-authentication
feature/post-crud
feature/3d-landing-page
feature/benchmark-api

# Hotfix 브랜치
hotfix/fix-login-error
hotfix/fix-memory-leak

# Release 브랜치 (선택적)
release/v1.0.0
```

### 3.2 커밋 메시지 규칙

#### 포맷

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 종류

| Type | 설명 | 예시 |
|------|------|------|
| `feat` | 새 기능 | `feat(auth): JWT 인증 구현` |
| `fix` | 버그 수정 | `fix(post): 조회수 증가 오류 수정` |
| `refactor` | 리팩토링 | `refactor(user): 서비스 레이어 분리` |
| `style` | 코드 스타일 | `style(frontend): ESLint 규칙 적용` |
| `test` | 테스트 | `test(post): 게시글 CRUD 테스트 추가` |
| `docs` | 문서 | `docs(readme): 설치 가이드 추가` |
| `chore` | 빌드/설정 | `chore(deps): Spring Boot 3.2 업그레이드` |
| `perf` | 성능 개선 | `perf(db): 인덱스 추가` |

#### 예시

```bash
# 좋은 예
feat(auth): 소셜 로그인 (Google, GitHub) 구현

- OAuth2 설정 추가
- 소셜 로그인 버튼 컴포넌트 생성
- 콜백 핸들러 구현

Closes #42

# 나쁜 예
update code
fix bug
작업 완료
```

### 3.3 Pull Request 규칙

#### PR 템플릿

```markdown
## 변경 사항
<!-- 무엇을 변경했는지 -->

## 변경 이유
<!-- 왜 변경했는지 -->

## 테스트 방법
<!-- 어떻게 테스트했는지 -->
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] 수동 테스트 완료

## 스크린샷 (UI 변경 시)

## 관련 이슈
Closes #이슈번호
```

---

## 4. API 설계 규칙

### 4.1 RESTful API 규칙

#### URL 규칙

```bash
# ✅ 좋은 예
GET    /api/v1/posts              # 목록 조회
GET    /api/v1/posts/{id}         # 단건 조회
POST   /api/v1/posts              # 생성
PUT    /api/v1/posts/{id}         # 전체 수정
PATCH  /api/v1/posts/{id}         # 부분 수정
DELETE /api/v1/posts/{id}         # 삭제

# 중첩 리소스
GET    /api/v1/posts/{id}/comments
POST   /api/v1/posts/{id}/comments

# 액션 (동사 허용)
POST   /api/v1/posts/{id}/publish
POST   /api/v1/posts/{id}/like
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh

# ❌ 나쁜 예
GET    /api/v1/getPost?id=1       # 동사 사용 금지
POST   /api/v1/post/create        # create 불필요
GET    /api/v1/posts/1/edit       # GET은 조회만
```

#### HTTP 상태 코드

| 코드 | 의미 | 사용 상황 |
|------|------|-----------|
| 200 | OK | 성공 (GET, PUT, PATCH) |
| 201 | Created | 생성 성공 (POST) |
| 204 | No Content | 삭제 성공 (DELETE) |
| 400 | Bad Request | 잘못된 요청 |
| 401 | Unauthorized | 인증 필요 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 충돌 (중복 등) |
| 500 | Internal Server Error | 서버 오류 |

### 4.2 응답 형식 표준

#### 성공 응답

```json
// 단건 조회
{
  "id": 1,
  "title": "게시글 제목",
  "content": "내용",
  "createdAt": "2026-01-07T10:00:00Z"
}

// 목록 조회 (페이징)
{
  "content": [
    { "id": 1, "title": "..." },
    { "id": 2, "title": "..." }
  ],
  "pageable": {
    "page": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5
  }
}
```

#### 에러 응답

```json
{
  "timestamp": "2026-01-07T10:00:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "게시글을 찾을 수 없습니다.",
  "path": "/api/v1/posts/999",
  "errorCode": "POST_NOT_FOUND"
}
```

---

## 5. 데이터베이스 규칙

### 5.1 테이블 네이밍

```sql
-- 테이블: 복수형, snake_case
CREATE TABLE users (...);
CREATE TABLE posts (...);
CREATE TABLE post_categories (...);

-- 컬럼: snake_case
created_at TIMESTAMP
updated_at TIMESTAMP
user_name VARCHAR(100)

-- 인덱스: idx_{table}_{column}
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_users_email ON users(email);

-- FK: fk_{from_table}_{to_table}
CONSTRAINT fk_posts_users FOREIGN KEY (user_id) REFERENCES users(id)
```

### 5.2 필수 컬럼

모든 테이블에 다음 컬럼 필수:

```sql
CREATE TABLE example (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ...
);
```

### 5.3 Soft Delete

```sql
-- Hard Delete 대신 Soft Delete 사용
ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMP;

-- 조회 시 필터링
SELECT * FROM posts WHERE deleted_at IS NULL;
```

---

## 6. 에러 처리 규칙

### 6.1 Backend (Spring Boot)

```java
// 커스텀 예외
@Getter
public class PostNotFoundException extends BusinessException {
    public PostNotFoundException(Long id) {
        super(ErrorCode.POST_NOT_FOUND, "게시글을 찾을 수 없습니다: " + id);
    }
}

// ErrorCode Enum
@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    POST_NOT_FOUND(404, "POST_001"),
    UNAUTHORIZED(401, "AUTH_001"),
    FORBIDDEN(403, "AUTH_002");

    private final int status;
    private final String code;
}

// GlobalExceptionHandler
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PostNotFoundException.class)
    public ResponseEntity<ErrorResponse> handlePostNotFound(PostNotFoundException e) {
        ErrorResponse response = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(e.getErrorCode().getStatus())
            .error(e.getErrorCode().name())
            .message(e.getMessage())
            .errorCode(e.getErrorCode().getCode())
            .build();

        return ResponseEntity
            .status(e.getErrorCode().getStatus())
            .body(response);
    }
}
```

### 6.2 Frontend (React)

```typescript
// API 에러 처리
import axios, { AxiosError } from 'axios';

interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  errorCode: string;
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      // 서버 에러 (4xx, 5xx)
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // 로그아웃 처리
          break;
        case 403:
          // 권한 없음 페이지로 이동
          break;
        case 404:
          // 404 페이지로 이동
          break;
        default:
          // 토스트 메시지 표시
          toast.error(data.message || '오류가 발생했습니다.');
      }
    } else if (error.request) {
      // 네트워크 에러
      toast.error('네트워크 연결을 확인해주세요.');
    }

    return Promise.reject(error);
  }
);
```

---

## 7. 테스트 작성 규칙

### 7.1 테스트 구조

```
테스트 파일명: {TargetClass}Test.java
테스트 메서드명: {method}_{condition}_{expected}
```

### 7.2 Spring Boot 테스트

```java
@SpringBootTest
@Transactional
class PostServiceTest {

    @Autowired
    private PostService postService;

    @Autowired
    private PostRepository postRepository;

    @Test
    @DisplayName("게시글 생성 - 성공")
    void createPost_validRequest_success() {
        // Given
        PostCreateRequest request = PostCreateRequest.builder()
            .title("테스트 제목")
            .content("테스트 내용")
            .build();

        // When
        PostResponse response = postService.createPost(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("테스트 제목");
        assertThat(postRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("게시글 조회 - 존재하지 않는 ID")
    void getPost_nonExistentId_throwsException() {
        // Given
        Long nonExistentId = 999L;

        // When & Then
        assertThatThrownBy(() -> postService.getPost(nonExistentId))
            .isInstanceOf(PostNotFoundException.class)
            .hasMessageContaining("999");
    }
}
```

### 7.3 React 테스트 (Jest + Testing Library)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PostCard } from './PostCard';

describe('PostCard', () => {
  const mockPost = {
    id: 1,
    title: '테스트 게시글',
    content: '내용',
    createdAt: new Date('2026-01-07'),
  };

  it('게시글 정보를 렌더링한다', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('테스트 게시글')).toBeInTheDocument();
    expect(screen.getByText('2026-01-07')).toBeInTheDocument();
  });

  it('삭제 버튼 클릭 시 onDelete 호출', async () => {
    const handleDelete = jest.fn();
    render(<PostCard post={mockPost} onDelete={handleDelete} />);

    const deleteButton = screen.getByRole('button', { name: /삭제/ });
    fireEvent.click(deleteButton);

    expect(handleDelete).toHaveBeenCalledWith(1);
  });
});
```

---

## 8. 보안 규칙

### 8.1 환경 변수 관리

```bash
# ✅ 좋은 예
# .env (Git에 커밋하지 않음)
DB_PASSWORD=secret123
JWT_SECRET=verysecretkey

# .env.example (Git에 커밋)
DB_PASSWORD=your_password_here
JWT_SECRET=your_secret_here

# ❌ 나쁜 예
# 코드에 직접 하드코딩
const password = "secret123";  // 절대 금지!
```

### 8.2 SQL Injection 방지

```java
// ✅ JPA/QueryDSL 사용 (안전)
List<Post> posts = queryFactory
    .selectFrom(post)
    .where(post.title.containsIgnoreCase(keyword))
    .fetch();

// ❌ 문자열 직접 연결 (위험)
String sql = "SELECT * FROM posts WHERE title LIKE '%" + keyword + "%'";
```

### 8.3 XSS 방지

```typescript
// ✅ DOMPurify 사용
import DOMPurify from 'dompurify';

const SafeHTML = ({ html }: { html: string }) => {
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};

// ❌ 직접 삽입 (위험)
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

---

## 9. 성능 최적화 규칙

### 9.1 N+1 문제 방지

```java
// ✅ Fetch Join 사용
@Query("SELECT p FROM Post p JOIN FETCH p.author WHERE p.id = :id")
Optional<Post> findByIdWithAuthor(@Param("id") Long id);

// ❌ Lazy Loading (N+1 발생)
Post post = postRepository.findById(id);
String authorName = post.getAuthor().getName();  // N번의 추가 쿼리
```

### 9.2 캐싱 전략

```java
// Redis 캐싱
@Cacheable(value = "posts", key = "#id")
public PostResponse getPost(Long id) {
    // DB 조회
}

@CacheEvict(value = "posts", allEntries = true)
public PostResponse createPost(PostCreateRequest request) {
    // 생성 시 캐시 전체 삭제
}
```

### 9.3 React 최적화

```typescript
// useMemo로 비싼 계산 캐싱
const sortedPosts = useMemo(
  () => posts.sort((a, b) => b.createdAt - a.createdAt),
  [posts]
);

// React.memo로 불필요한 리렌더링 방지
export const PostCard = React.memo<PostCardProps>(({ post }) => {
  // ...
});
```

---

## 10. 문서화 규칙

### 10.1 코드 주석

```java
/**
 * 게시글을 생성합니다.
 *
 * @param request 게시글 생성 요청 데이터
 * @return 생성된 게시글 정보
 * @throws UserNotFoundException 작성자를 찾을 수 없는 경우
 */
@Transactional
public PostResponse createPost(PostCreateRequest request) {
    // ...
}
```

### 10.2 API 문서 (SpringDoc)

```java
@Operation(
    summary = "게시글 조회",
    description = "ID로 게시글을 조회합니다. 조회수가 1 증가합니다."
)
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "조회 성공"),
    @ApiResponse(responseCode = "404", description = "게시글 없음")
})
@GetMapping("/{id}")
public ResponseEntity<PostResponse> getPost(
    @Parameter(description = "게시글 ID") @PathVariable Long id
) {
    // ...
}
```

---

## 📌 체크리스트

개발 시작 전 확인:
- [ ] 브랜치를 올바르게 생성했는가? (`feature/*`)
- [ ] 코딩 컨벤션을 확인했는가?
- [ ] API 설계 규칙을 준수하는가?
- [ ] 에러 처리를 구현했는가?

PR 제출 전 확인:
- [ ] 테스트를 작성했는가?
- [ ] 코드 리뷰를 요청했는가?
- [ ] 문서를 업데이트했는가?
- [ ] 커밋 메시지가 규칙을 따르는가?

---

## 🔧 도구 설정

### ESLint (Frontend)

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Checkstyle (Backend)

```xml
<!-- Google Java Style Guide 기반 -->
<module name="Checker">
  <module name="TreeWalker">
    <module name="NamingConventions"/>
    <module name="AvoidStarImport"/>
  </module>
</module>
```

---

**이 문서는 프로젝트의 기준이 됩니다. 모든 개발자(에이전트 포함)는 이 규칙을 따라야 합니다.**
