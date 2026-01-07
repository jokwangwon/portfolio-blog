# 아키텍처 원칙 (Architecture Principles)

> **PROJECT_CONSTITUTION.md 제2조를 상세화한 문서**

**우선순위**: 🟠 **HIGH**
**참조**: PROJECT_CONSTITUTION.md 제2조

---

## 원칙 1: 모듈러 아키텍처 (Modular Architecture)

### 정의
각 기능을 독립적인 모듈로 분리하여 결합도는 낮추고 응집도는 높인다.

### 구현 규칙

#### Frontend 모듈 구조
```
modules/
├── core/          # 공통 인프라 (API 클라이언트, 설정)
├── auth/          # 인증/인가
├── blog/          # 블로그 기능
├── three/         # 3D 기능
├── benchmark/     # 벤치마크 기능
└── project/       # 프로젝트 쇼케이스
```

#### Backend 모듈 구조
```
backend/
├── common/        # 공통 유틸리티
├── domain/        # 엔티티 + 리포지토리
├── security/      # 인증/인가
├── module-blog/   # 블로그 비즈니스 로직
├── module-user/   # 사용자 관리
└── api-server/    # 실행 가능한 메인 앱
```

### 의존성 규칙
```
✅ 허용
module → shared/common
module → domain/core

❌ 금지
module → module (직접 의존)
A → B → A (순환 참조)
```

### 검증 방법
```bash
# Frontend
npm run analyze-dependencies

# Backend
./gradlew checkDependencies
```

---

## 원칙 2: 계층형 아키텍처 (Layered Architecture)

### 정의
각 레이어는 명확한 책임을 가지며, 상위 레이어만 하위 레이어에 의존한다.

### 레이어 구조

#### Backend (Spring Boot)
```
Controller (API 진입점)
    ↓
Service (비즈니스 로직)
    ↓
Repository (데이터 접근)
    ↓
Entity (도메인 모델)
```

#### Frontend (React)
```
Page/Route (라우팅)
    ↓
Container Component (상태 관리)
    ↓
Presentational Component (UI)
    ↓
Shared Component (재사용)
```

#### AI API (FastAPI)
```
Router (API 진입점)
    ↓
Service (비즈니스 로직)
    ↓
Infrastructure (외부 시스템 연동)
```

### 각 레이어의 책임

| 레이어 | 책임 | 금지 사항 |
|--------|------|-----------|
| **Controller** | HTTP 요청/응답, 검증 | 비즈니스 로직, DB 접근 |
| **Service** | 비즈니스 로직, 트랜잭션 | HTTP 처리, 직접 DB 접근 |
| **Repository** | 데이터 접근, 쿼리 | 비즈니스 로직 |
| **Entity** | 도메인 모델, 밸리데이션 | 외부 의존성 |

### 구현 예시

```java
// ✅ 올바른 계층 분리
@RestController
@RequestMapping("/api/v1/posts")
public class PostController {
    private final PostService postService;

    @PostMapping
    public ResponseEntity<PostResponse> createPost(@Valid @RequestBody PostCreateRequest request) {
        PostResponse response = postService.createPost(request);  // Service에 위임
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

@Service
@Transactional(readOnly = true)
public class PostService {
    private final PostRepository postRepository;

    @Transactional
    public PostResponse createPost(PostCreateRequest request) {
        Post post = Post.builder()
            .title(request.getTitle())
            .content(request.getContent())
            .build();

        Post saved = postRepository.save(post);  // Repository에 위임
        return PostMapper.toResponse(saved);
    }
}

// ❌ 잘못된 계층 침범
@RestController
public class PostController {
    private final PostRepository postRepository;  // Controller가 직접 Repository 접근

    @PostMapping
    public ResponseEntity<PostResponse> createPost(@RequestBody PostCreateRequest request) {
        Post post = Post.builder()  // Controller에서 비즈니스 로직
            .title(request.getTitle())
            .build();

        Post saved = postRepository.save(post);  // Controller에서 직접 저장
        return ResponseEntity.ok(PostMapper.toResponse(saved));
    }
}
```

---

## 원칙 3: 관심사의 분리 (Separation of Concerns)

### 정의
각 모듈/클래스는 하나의 책임만 가진다 (Single Responsibility Principle).

### 구현 규칙

#### DTO 분리
```java
// Request DTO (입력)
public class PostCreateRequest {
    @NotBlank
    private String title;
    private String content;
}

// Response DTO (출력)
public class PostResponse {
    private Long id;
    private String title;
    private LocalDateTime createdAt;
}

// Entity (도메인)
@Entity
public class Post {
    @Id
    private Long id;
    private String title;
    private String content;
}
```

#### Frontend 분리
```typescript
// Container Component (로직)
export const PostListContainer: React.FC = () => {
  const { data: posts } = usePosts();
  const handleDelete = (id: number) => { /* 로직 */ };

  return <PostListView posts={posts} onDelete={handleDelete} />;
};

// Presentational Component (UI)
interface PostListViewProps {
  posts: Post[];
  onDelete: (id: number) => void;
}

export const PostListView: React.FC<PostListViewProps> = ({ posts, onDelete }) => {
  return (
    <ul>
      {posts.map(post => (
        <PostCard key={post.id} post={post} onDelete={onDelete} />
      ))}
    </ul>
  );
};
```

---

## 원칙 4: 의존성 역전 원칙 (Dependency Inversion Principle)

### 정의
고수준 모듈은 저수준 모듈에 의존하지 않고, 둘 다 추상화에 의존한다.

### 구현 예시

#### 인터페이스 기반 설계
```java
// 추상화 (인터페이스)
public interface StorageService {
    String uploadFile(MultipartFile file);
    void deleteFile(String fileUrl);
}

// 구현체 1: S3
@Service
@Profile("prod")
public class S3StorageService implements StorageService {
    @Override
    public String uploadFile(MultipartFile file) {
        // S3 업로드 로직
    }
}

// 구현체 2: 로컬 파일 시스템
@Service
@Profile("dev")
public class LocalStorageService implements StorageService {
    @Override
    public String uploadFile(MultipartFile file) {
        // 로컬 저장 로직
    }
}

// Service는 구현체가 아닌 인터페이스에 의존
@Service
public class PostService {
    private final StorageService storageService;  // 인터페이스에 의존

    public void uploadImage(MultipartFile file) {
        String url = storageService.uploadFile(file);  // 구현체 몰라도 됨
    }
}
```

---

## 원칙 5: SOLID 원칙 준수

### S: Single Responsibility Principle
하나의 클래스는 하나의 책임만 가진다.

```java
// ✅ 좋은 예: 책임 분리
public class PostService {
    public PostResponse createPost(PostCreateRequest request) { /* ... */ }
}

public class PostSlugGenerator {
    public String generate(String title) { /* ... */ }
}

// ❌ 나쁜 예: 여러 책임
public class PostService {
    public PostResponse createPost(PostCreateRequest request) { /* ... */ }
    public String generateSlug(String title) { /* ... */ }  // 다른 책임
    public void sendEmail(User user) { /* ... */ }  // 또 다른 책임
}
```

### O: Open/Closed Principle
확장에는 열려있고 수정에는 닫혀있다.

```java
// ✅ 좋은 예: 전략 패턴으로 확장
public interface AuthenticationStrategy {
    User authenticate(String token);
}

public class JwtAuthenticationStrategy implements AuthenticationStrategy { /* ... */ }
public class OAuth2AuthenticationStrategy implements AuthenticationStrategy { /* ... */ }

// 새로운 인증 방식 추가 시 기존 코드 수정 불필요
public class ApiKeyAuthenticationStrategy implements AuthenticationStrategy { /* ... */ }
```

### L: Liskov Substitution Principle
하위 타입은 상위 타입으로 대체 가능해야 한다.

### I: Interface Segregation Principle
클라이언트는 사용하지 않는 인터페이스에 의존하지 않아야 한다.

```java
// ✅ 좋은 예: 인터페이스 분리
public interface Readable {
    Post read(Long id);
}

public interface Writable {
    Post create(PostCreateRequest request);
    Post update(Long id, PostUpdateRequest request);
}

// 읽기만 필요한 곳은 Readable만 의존
public class PostSearchService {
    private final Readable postRepository;
}
```

### D: Dependency Inversion Principle
(위 원칙 4 참고)

---

## 원칙 6: API First 설계

### 정의
API 스펙을 먼저 정의하고, 이를 기반으로 개발한다.

### 구현 프로세스
```
1. OpenAPI/Swagger 스펙 작성
    ↓
2. Frontend/Backend 합의
    ↓
3. 스펙 기반 개발
    ↓
4. 통합 테스트
```

### 예시: Swagger 정의
```yaml
paths:
  /api/v1/posts:
    get:
      summary: 게시글 목록 조회
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: 성공
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PagePostResponse'
```

---

## 원칙 7: 데이터베이스 독립성

### 정의
비즈니스 로직은 특정 데이터베이스에 종속되지 않는다.

### 구현 규칙
- JPA/Hibernate 사용 (JPQL, QueryDSL)
- Native Query 최소화
- 데이터베이스 특화 기능 사용 시 추상화 레이어 생성

```java
// ✅ 좋은 예: JPA 사용
@Query("SELECT p FROM Post p WHERE p.title LIKE %:keyword%")
List<Post> searchByTitle(@Param("keyword") String keyword);

// ⚠️ 주의: Native Query (PostgreSQL 특화)
@Query(value = "SELECT * FROM posts WHERE title ILIKE :keyword", nativeQuery = true)
List<Post> searchByTitleNative(@Param("keyword") String keyword);
```

---

## 원칙 8: 테스트 가능한 구조

### 정의
모든 컴포넌트는 독립적으로 테스트 가능해야 한다.

### 구현 규칙
- 생성자 주입 사용 (필드 주입 금지)
- 인터페이스 기반 설계
- Mock 가능한 구조

```java
// ✅ 좋은 예: 생성자 주입 (테스트 용이)
@Service
@RequiredArgsConstructor
public class PostService {
    private final PostRepository postRepository;
    private final UserRepository userRepository;
}

// 테스트 코드
@Test
void createPost_validRequest_success() {
    PostRepository mockRepo = mock(PostRepository.class);
    UserRepository mockUserRepo = mock(UserRepository.class);
    PostService service = new PostService(mockRepo, mockUserRepo);
    // 테스트 가능
}

// ❌ 나쁜 예: 필드 주입 (테스트 어려움)
@Service
public class PostService {
    @Autowired
    private PostRepository postRepository;  // Mock 주입 어려움
}
```

---

## 원칙 9: 에러 처리 아키텍처

### 정의
에러는 계층별로 적절히 처리하고 변환한다.

### 계층별 에러 처리

```
Controller
    → HTTP 예외 (ResponseEntity)
        ↓
Service
    → 비즈니스 예외 (BusinessException)
        ↓
Repository
    → 데이터 접근 예외 (DataAccessException)
```

### 구현 예시
```java
// Service에서 비즈니스 예외 발생
@Service
public class PostService {
    public PostResponse getPost(Long id) {
        Post post = postRepository.findById(id)
            .orElseThrow(() -> new PostNotFoundException(id));  // 비즈니스 예외
        return PostMapper.toResponse(post);
    }
}

// GlobalExceptionHandler에서 HTTP 응답으로 변환
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(PostNotFoundException.class)
    public ResponseEntity<ErrorResponse> handlePostNotFound(PostNotFoundException e) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.from(e));
    }
}
```

---

## 원칙 10: 성능 우선 설계

### 정의
처음부터 성능을 고려한 아키텍처를 설계한다.

### 필수 고려사항
1. **N+1 쿼리 방지**: Fetch Join 사용
2. **캐싱 전략**: Redis 활용
3. **페이징**: 무한 스크롤 방지
4. **인덱스**: 자주 조회되는 컬럼
5. **비동기 처리**: 긴 작업은 비동기로

```java
// N+1 방지
@Query("SELECT p FROM Post p JOIN FETCH p.author WHERE p.id = :id")
Optional<Post> findByIdWithAuthor(@Param("id") Long id);

// 캐싱
@Cacheable(value = "posts", key = "#id")
public PostResponse getPost(Long id) { /* ... */ }

// 페이징
Page<Post> posts = postRepository.findAll(
    PageRequest.of(page, size, Sort.by("createdAt").descending())
);
```

---

## 검증 체크리스트

새로운 기능 개발 시:
- [ ] 모듈 독립성을 유지하는가?
- [ ] 계층형 아키텍처를 따르는가?
- [ ] SOLID 원칙을 위반하지 않는가?
- [ ] 테스트 가능한 구조인가?
- [ ] 성능을 고려했는가?

코드 리뷰 시:
- [ ] 의존성 방향이 올바른가?
- [ ] 책임이 명확히 분리되었는가?
- [ ] 에러 처리가 적절한가?
- [ ] 데이터베이스 독립적인가?

---

**이 원칙은 PROJECT_CONSTITUTION.md 제2조를 구체화한 문서입니다.**
**모든 개발은 이 원칙을 따라야 합니다.**
