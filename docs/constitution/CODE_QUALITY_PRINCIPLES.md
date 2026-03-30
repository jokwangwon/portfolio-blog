# 코드 품질 원칙 (Code Quality Principles)

> **PROJECT_CONSTITUTION.md 제3조를 상세화한 문서**

**우선순위**: 🟠 **HIGH**
**참조**: PROJECT_CONSTITUTION.md 제3조

---

## 원칙 1: 클린 코드 (Clean Code)

### 의미 있는 이름
```java
// ✅ 좋은 예
public class UserService {
    private final UserRepository userRepository;

    public User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException(email));
    }
}

// ❌ 나쁜 예
public class US {
    private UR ur;

    public U find(String e) {
        return ur.get(e).orElseThrow(() -> new Ex(e));
    }
}
```

### 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 클래스 | PascalCase, 명사 | `UserService`, `PostRepository` |
| 메서드 | camelCase, 동사 | `findUser()`, `createPost()` |
| 변수 | camelCase, 명사 | `userName`, `postList` |
| 상수 | UPPER_SNAKE_CASE | `MAX_SIZE`, `DEFAULT_PAGE` |
| boolean | is/has로 시작 | `isActive`, `hasPermission` |

---

## 원칙 2: 함수는 한 가지 일만 한다

### 정의
함수는 하나의 책임만 가지며, 추상화 수준이 일관되어야 한다.

### 구현 예시

```java
// ✅ 좋은 예: 단일 책임
public Post createPost(PostCreateRequest request) {
    validateRequest(request);
    User author = getCurrentUser();
    Post post = buildPost(request, author);
    return postRepository.save(post);
}

private void validateRequest(PostCreateRequest request) {
    if (request.getTitle().isBlank()) {
        throw new InvalidRequestException("제목은 필수입니다.");
    }
}

private User getCurrentUser() {
    return userRepository.findById(SecurityUtil.getCurrentUserId())
        .orElseThrow(() -> new UserNotFoundException());
}

private Post buildPost(PostCreateRequest request, User author) {
    return Post.builder()
        .title(request.getTitle())
        .content(request.getContent())
        .author(author)
        .build();
}

// ❌ 나쁜 예: 여러 책임
public Post createPost(PostCreateRequest request) {
    // 검증
    if (request.getTitle().isBlank()) {
        throw new InvalidRequestException("제목은 필수입니다.");
    }

    // 사용자 조회
    Long userId = SecurityUtil.getCurrentUserId();
    User author = userRepository.findById(userId)
        .orElseThrow(() -> new UserNotFoundException());

    // 게시글 생성
    Post post = new Post();
    post.setTitle(request.getTitle());
    post.setContent(request.getContent());
    post.setAuthor(author);
    post.setCreatedAt(LocalDateTime.now());

    // 저장
    Post saved = postRepository.save(post);

    // 이메일 발송
    emailService.sendNotification(author.getEmail(), "게시글이 생성되었습니다.");

    // 캐시 무효화
    cacheManager.evict("posts");

    return saved;
}
```

### 함수 크기 제한
- **최대 라인 수**: 20줄
- **중첩 깊이**: 최대 3단계
- **매개변수**: 최대 3개 (그 이상은 객체로 묶기)

---

## 원칙 3: DRY (Don't Repeat Yourself)

### 정의
중복 코드를 제거하고 재사용 가능한 함수/클래스로 추출한다.

### 구현 예시

```java
// ❌ 나쁜 예: 중복 코드
public PostResponse getPost(Long id) {
    Post post = postRepository.findById(id)
        .orElseThrow(() -> new PostNotFoundException(id));
    return PostMapper.toResponse(post);
}

public PostResponse getPostBySlug(String slug) {
    Post post = postRepository.findBySlug(slug)
        .orElseThrow(() -> new PostNotFoundException(slug));
    return PostMapper.toResponse(post);
}

// ✅ 좋은 예: 공통 로직 추출
private Post findPostOrThrow(Supplier<Optional<Post>> finder, String identifier) {
    return finder.get()
        .orElseThrow(() -> new PostNotFoundException(identifier));
}

public PostResponse getPost(Long id) {
    Post post = findPostOrThrow(() -> postRepository.findById(id), id.toString());
    return PostMapper.toResponse(post);
}

public PostResponse getPostBySlug(String slug) {
    Post post = findPostOrThrow(() -> postRepository.findBySlug(slug), slug);
    return PostMapper.toResponse(post);
}
```

---

## 원칙 4: YAGNI (You Aren't Gonna Need It)

### 정의
현재 필요하지 않은 기능은 구현하지 않는다.

### 구현 예시

```java
// ❌ 나쁜 예: 미래를 위한 과도한 설계
public interface PostService {
    PostResponse createPost(PostCreateRequest request);
    PostResponse createPostWithScheduling(PostCreateRequest request, LocalDateTime publishAt);
    PostResponse createPostWithVersioning(PostCreateRequest request, String version);
    PostResponse createPostWithWorkflow(PostCreateRequest request, Workflow workflow);
    // ... 20개의 메서드
}

// ✅ 좋은 예: 현재 필요한 것만
public interface PostService {
    PostResponse createPost(PostCreateRequest request);
    PostResponse getPost(Long id);
    PostResponse updatePost(Long id, PostUpdateRequest request);
    void deletePost(Long id);
}
```

---

## 원칙 5: 주석 vs 자기 설명 코드

### 정의
코드 자체로 의도가 명확해야 하며, 주석은 "왜"를 설명한다.

### 구현 예시

```java
// ❌ 나쁜 예: 무엇을 하는지 설명하는 주석
// 게시글을 찾아서 응답으로 변환한다
public PostResponse getPost(Long id) {
    // ID로 게시글을 찾는다
    Post post = postRepository.findById(id)
        .orElseThrow(() -> new PostNotFoundException(id));
    // 응답 DTO로 변환한다
    return PostMapper.toResponse(post);
}

// ✅ 좋은 예: 자기 설명 코드
public PostResponse getPost(Long id) {
    Post post = findPostById(id);
    return toResponse(post);
}

// ✅ 좋은 예: "왜"를 설명하는 주석
public void incrementViewCount(Long postId) {
    // 조회수는 비동기로 업데이트하여 응답 속도를 개선
    // Redis 카운터를 먼저 증가시키고, 배치로 DB에 반영
    redisTemplate.opsForValue().increment("post:view:" + postId);
}
```

### 주석이 필요한 경우
1. **복잡한 알고리즘**: 왜 이렇게 구현했는지
2. **성능 최적화**: 왜 이 방식을 선택했는지
3. **버그 회피**: 특정 구현이 버그를 회피하는 이유
4. **외부 API**: 특이사항이나 제약사항

---

## 원칙 6: 예외 처리

### 정의
예외는 적절히 처리하고, 무시하지 않는다.

### 구현 예시

```java
// ❌ 나쁜 예: 예외 무시
try {
    postRepository.save(post);
} catch (Exception e) {
    // 아무것도 안 함
}

// ❌ 나쁜 예: 일반 Exception 사용
public void createPost(PostCreateRequest request) throws Exception {
    throw new Exception("게시글 생성 실패");
}

// ✅ 좋은 예: 구체적인 예외
public PostResponse createPost(PostCreateRequest request) {
    try {
        Post post = buildPost(request);
        Post saved = postRepository.save(post);
        return toResponse(saved);
    } catch (DataIntegrityViolationException e) {
        throw new DuplicatePostException("중복된 게시글입니다.", e);
    } catch (ValidationException e) {
        throw new InvalidPostException("유효하지 않은 게시글입니다.", e);
    }
}

// ✅ 좋은 예: 예외 체계
public class BusinessException extends RuntimeException {
    private final ErrorCode errorCode;
}

public class PostNotFoundException extends BusinessException {
    public PostNotFoundException(Long id) {
        super(ErrorCode.POST_NOT_FOUND, "게시글을 찾을 수 없습니다: " + id);
    }
}
```

---

## 원칙 7: 테스트 커버리지

### 목표
- **단위 테스트**: 70% 이상
- **통합 테스트**: 주요 API 100%
- **E2E 테스트**: 핵심 시나리오

### 구현 예시

```java
// ✅ 단위 테스트
@Test
@DisplayName("게시글 생성 - 성공")
void createPost_validRequest_success() {
    // Given
    PostCreateRequest request = PostCreateRequest.builder()
        .title("테스트 제목")
        .content("테스트 내용")
        .build();

    User author = User.builder()
        .id(1L)
        .name("작성자")
        .build();

    when(userRepository.findById(1L)).thenReturn(Optional.of(author));
    when(postRepository.save(any(Post.class))).thenAnswer(i -> i.getArgument(0));

    // When
    PostResponse response = postService.createPost(request);

    // Then
    assertThat(response).isNotNull();
    assertThat(response.getTitle()).isEqualTo("테스트 제목");
    verify(postRepository, times(1)).save(any(Post.class));
}

// ✅ 통합 테스트
@SpringBootTest
@AutoConfigureMockMvc
class PostControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("게시글 생성 API - 성공")
    void createPostApi_validRequest_returns201() throws Exception {
        String requestJson = """
            {
              "title": "테스트 제목",
              "content": "테스트 내용"
            }
            """;

        mockMvc.perform(post("/api/portal/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestJson))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("테스트 제목"));
    }
}
```

### 테스트 작성 규칙
1. **AAA 패턴**: Arrange-Act-Assert
2. **하나의 테스트는 하나만 검증**
3. **테스트 이름은 명확하게**: `{method}_{condition}_{expected}`
4. **테스트는 독립적**: 순서에 의존하지 않음

---

## 원칙 8: 코드 리뷰

### 필수 체크리스트

#### 기능성
- [ ] 요구사항을 충족하는가?
- [ ] 엣지 케이스를 처리하는가?
- [ ] 에러 처리가 적절한가?

#### 설계
- [ ] 아키텍처 원칙을 따르는가?
- [ ] SOLID 원칙을 위반하지 않는가?
- [ ] 중복 코드가 없는가?

#### 가독성
- [ ] 네이밍이 명확한가?
- [ ] 복잡도가 적절한가?
- [ ] 주석이 필요한 곳에만 있는가?

#### 테스트
- [ ] 단위 테스트가 작성되었는가?
- [ ] 통합 테스트가 필요한가?
- [ ] 테스트 커버리지가 충분한가?

#### 성능
- [ ] N+1 쿼리가 없는가?
- [ ] 불필요한 DB 조회가 없는가?
- [ ] 캐싱이 필요한가?

#### 보안
- [ ] SQL Injection 위험이 없는가?
- [ ] XSS 위험이 없는가?
- [ ] 민감한 정보가 로그에 남지 않는가?

---

## 원칙 9: 리팩토링

### 정의
기능 변경 없이 코드 구조를 개선한다.

### 리팩토링이 필요한 신호

#### 1. 긴 메서드 (Long Method)
```java
// 20줄 이상 → 분리 필요
public void processOrder(Order order) {
    // 100줄의 코드...
}
```

#### 2. 큰 클래스 (Large Class)
```java
// 너무 많은 책임 → 분리 필요
public class OrderService {
    // 30개의 메서드...
}
```

#### 3. 중복 코드 (Duplicated Code)
```java
// 같은 로직이 3번 이상 → 추출 필요
```

#### 4. 복잡한 조건문 (Complex Conditional)
```java
// ❌ 나쁜 예
if (user.getRole() == Role.ADMIN ||
    (user.getRole() == Role.USER && user.isPremium()) ||
    (user.getRole() == Role.GUEST && post.isPublic())) {
    // ...
}

// ✅ 좋은 예
if (user.canAccessPost(post)) {
    // ...
}

public boolean canAccessPost(Post post) {
    return isAdmin() ||
           (isUser() && isPremium()) ||
           (isGuest() && post.isPublic());
}
```

### 리팩토링 기법

#### Extract Method
```java
// Before
public void calculateTotal(Order order) {
    double total = 0;
    for (Item item : order.getItems()) {
        total += item.getPrice() * item.getQuantity();
    }
    double tax = total * 0.1;
    double finalTotal = total + tax;
    order.setTotal(finalTotal);
}

// After
public void calculateTotal(Order order) {
    double subtotal = calculateSubtotal(order.getItems());
    double tax = calculateTax(subtotal);
    double finalTotal = subtotal + tax;
    order.setTotal(finalTotal);
}

private double calculateSubtotal(List<Item> items) {
    return items.stream()
        .mapToDouble(item -> item.getPrice() * item.getQuantity())
        .sum();
}

private double calculateTax(double amount) {
    return amount * 0.1;
}
```

#### Replace Magic Number
```java
// Before
if (user.getAge() >= 18) {
    // ...
}

// After
private static final int ADULT_AGE = 18;

if (user.getAge() >= ADULT_AGE) {
    // ...
}
```

---

## 원칙 10: 정적 분석 도구 사용

### Backend (Java)
```gradle
// build.gradle
plugins {
    id 'checkstyle'
    id 'pmd'
    id 'jacoco'
}

checkstyle {
    toolVersion = '10.12.0'
    configFile = file("${rootDir}/config/checkstyle/checkstyle.xml")
}

jacoco {
    toolVersion = "0.8.10"
}
```

### Frontend (TypeScript)
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "complexity": ["error", 10],
    "max-lines-per-function": ["error", 50]
  }
}
```

### AI API (Python)
```toml
# pyproject.toml
[tool.black]
line-length = 88
target-version = ['py311']

[tool.pylint]
max-line-length = 88
disable = ["C0111", "C0103"]

[tool.mypy]
python_version = "3.11"
strict = true
```

---

## 코드 품질 측정

### 메트릭

| 메트릭 | 목표 | 측정 도구 |
|--------|------|-----------|
| **테스트 커버리지** | 70% 이상 | JaCoCo, Jest |
| **순환 복잡도** | 10 이하 | SonarQube |
| **코드 중복률** | 5% 이하 | SonarQube |
| **기술 부채** | A 등급 | SonarQube |

### 품질 게이트
```yaml
# sonar-project.properties
sonar.qualitygate.wait=true
sonar.coverage.jacoco.xmlReportPaths=build/reports/jacoco/test/jacocoTestReport.xml
sonar.coverage.exclusions=**/*Test.java,**/*Config.java

# 품질 기준
sonar.qualitygate.coverage.minimum=70
sonar.qualitygate.duplications.maximum=5
sonar.qualitygate.complexity.maximum=10
```

---

## 체크리스트

코드 작성 전:
- [ ] 함수가 한 가지 일만 하는가?
- [ ] 중복 코드가 없는가?
- [ ] 네이밍이 명확한가?

코드 작성 후:
- [ ] 테스트를 작성했는가?
- [ ] 정적 분석 도구를 실행했는가?
- [ ] 리팩토링이 필요한가?

PR 제출 전:
- [ ] 모든 테스트가 통과하는가?
- [ ] 커버리지 목표를 달성했는가?
- [ ] 코드 리뷰 체크리스트를 확인했는가?

---

**이 원칙은 PROJECT_CONSTITUTION.md 제3조를 구체화한 문서입니다.**
**모든 코드는 이 품질 기준을 충족해야 합니다.**
