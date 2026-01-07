# 보안 원칙 (Security Principles)

> **PROJECT_CONSTITUTION.md 제7조를 상세화한 문서**

**우선순위**: 🔴 **CRITICAL**
**참조**: PROJECT_CONSTITUTION.md 제7조

---

## 보안 원칙 서문

보안은 기능 개발 후 추가하는 것이 아니라, **설계 단계부터 포함**되어야 합니다.

### 보안 우선순위
1. 🔴 **Critical**: 즉시 수정 필요 (배포 중단)
2. 🟠 **High**: 다음 배포 전 수정
3. 🟡 **Medium**: 2주 이내 수정
4. 🟢 **Low**: 다음 스프린트에 수정

---

## 원칙 1: 인증 및 인가 (Authentication & Authorization)

### 1.1 JWT 토큰 보안

#### 토큰 저장 위치
```typescript
// ✅ 좋은 예: httpOnly 쿠키 (XSS 방지)
// Backend에서 쿠키 설정
response.addCookie(
    Cookie.builder()
        .name("accessToken")
        .value(token)
        .httpOnly(true)
        .secure(true)  // HTTPS만
        .sameSite(SameSite.STRICT)
        .maxAge(3600)
        .build()
);

// ❌ 나쁜 예: localStorage (XSS 취약)
localStorage.setItem('token', token);  // XSS 공격 시 탈취 가능
```

#### 토큰 검증
```java
@Component
public class JwtTokenProvider {

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("만료된 토큰: {}", e.getMessage());
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("유효하지 않은 토큰: {}", e.getMessage());
            return false;
        }
    }

    // ❌ 나쁜 예: 예외 무시
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;  // 어떤 에러인지 로깅하지 않음
        }
    }
}
```

### 1.2 비밀번호 보안

#### 해싱
```java
// ✅ 좋은 예: BCrypt (OWASP 권장)
@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);  // 강도 12
    }
}

public class UserService {
    private final PasswordEncoder passwordEncoder;

    public void createUser(SignupRequest request) {
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User user = User.builder()
            .password(hashedPassword)
            .build();
        userRepository.save(user);
    }
}

// ❌ 나쁜 예: 평문 저장
user.setPassword(request.getPassword());  // 절대 금지!

// ❌ 나쁜 예: 약한 해싱
String hashed = DigestUtils.md5Hex(password);  // MD5는 취약
```

#### 비밀번호 정책
```java
@NotBlank
@Size(min = 8, max = 100)
@Pattern(
    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
    message = "비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다."
)
private String password;
```

### 1.3 권한 검증

```java
// ✅ 좋은 예: 메서드 레벨 권한 검증
@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/{id}")
public ResponseEntity<Void> deletePost(@PathVariable Long id) {
    postService.deletePost(id);
    return ResponseEntity.noContent().build();
}

// ✅ 좋은 예: 리소스 소유자 확인
@PreAuthorize("@postSecurityService.isOwner(#id, principal)")
@PutMapping("/{id}")
public ResponseEntity<PostResponse> updatePost(
    @PathVariable Long id,
    @RequestBody PostUpdateRequest request
) {
    PostResponse response = postService.updatePost(id, request);
    return ResponseEntity.ok(response);
}

@Service
public class PostSecurityService {
    public boolean isOwner(Long postId, UserPrincipal principal) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new PostNotFoundException(postId));
        return post.getAuthor().getId().equals(principal.getId());
    }
}

// ❌ 나쁜 예: 권한 검증 없음
@DeleteMapping("/{id}")
public ResponseEntity<Void> deletePost(@PathVariable Long id) {
    postService.deletePost(id);  // 누구나 삭제 가능
    return ResponseEntity.noContent().build();
}
```

---

## 원칙 2: 입력 검증 (Input Validation)

### 2.1 SQL Injection 방지

```java
// ✅ 좋은 예: JPA/QueryDSL (안전)
@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByTitleContainingIgnoreCase(String title);
}

// QueryDSL
public List<Post> searchPosts(String keyword) {
    return queryFactory
        .selectFrom(post)
        .where(post.title.containsIgnoreCase(keyword))
        .fetch();
}

// ⚠️ 주의: Native Query는 바인딩 사용
@Query(value = "SELECT * FROM posts WHERE title LIKE :keyword", nativeQuery = true)
List<Post> searchByTitle(@Param("keyword") String keyword);

// ❌ 나쁜 예: 문자열 연결 (SQL Injection 취약)
public List<Post> searchPosts(String keyword) {
    String sql = "SELECT * FROM posts WHERE title LIKE '%" + keyword + "%'";
    return jdbcTemplate.query(sql, new PostRowMapper());
}
```

### 2.2 XSS 방지

#### Backend
```java
// ✅ 좋은 예: HTML 이스케이프
import org.springframework.web.util.HtmlUtils;

public PostResponse createPost(PostCreateRequest request) {
    String sanitizedContent = HtmlUtils.htmlEscape(request.getContent());
    Post post = Post.builder()
        .content(sanitizedContent)
        .build();
    return postRepository.save(post);
}
```

#### Frontend
```typescript
// ✅ 좋은 예: DOMPurify 사용
import DOMPurify from 'dompurify';

export const SafeHTML: React.FC<{ html: string }> = ({ html }) => {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target']
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};

// ❌ 나쁜 예: 직접 삽입
export const UnsafeHTML: React.FC<{ html: string }> = ({ html }) => {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;  // XSS 취약
};
```

### 2.3 입력 검증

```java
// ✅ 좋은 예: Bean Validation
public class PostCreateRequest {

    @NotBlank(message = "제목은 필수입니다.")
    @Size(min = 1, max = 200, message = "제목은 1~200자 이내여야 합니다.")
    private String title;

    @NotBlank(message = "내용은 필수입니다.")
    @Size(max = 100000, message = "내용은 100,000자 이내여야 합니다.")
    private String content;

    @Pattern(regexp = "^[a-z0-9-]+$", message = "슬러그는 소문자, 숫자, 하이픈만 가능합니다.")
    private String slug;

    @Email(message = "유효한 이메일 주소를 입력하세요.")
    private String authorEmail;
}

@RestController
public class PostController {

    @PostMapping
    public ResponseEntity<PostResponse> createPost(
        @Valid @RequestBody PostCreateRequest request  // @Valid로 검증
    ) {
        PostResponse response = postService.createPost(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

// ❌ 나쁜 예: 검증 없음
@PostMapping
public ResponseEntity<PostResponse> createPost(@RequestBody PostCreateRequest request) {
    // 검증 없이 바로 저장
    postService.createPost(request);
}
```

---

## 원칙 3: 환경 변수 및 시크릿 관리

### 3.1 환경 변수 사용

```bash
# ✅ .env 파일 (Git 무시)
DB_PASSWORD=SuperSecretPassword123!
JWT_SECRET=veryLongAndRandomSecretKey12345
AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# ✅ .env.example (Git 커밋)
DB_PASSWORD=your_db_password_here
JWT_SECRET=your_jwt_secret_here
AWS_ACCESS_KEY=your_aws_access_key_here
AWS_SECRET_KEY=your_aws_secret_key_here
```

```java
// ✅ 좋은 예: 환경 변수 사용
@Configuration
public class DatabaseConfig {

    @Value("${db.password}")
    private String dbPassword;

    @Bean
    public DataSource dataSource() {
        return DataSourceBuilder.create()
            .password(dbPassword)
            .build();
    }
}

// ❌ 나쁜 예: 하드코딩
public class DatabaseConfig {
    private static final String DB_PASSWORD = "SuperSecretPassword123!";  // 절대 금지!
}
```

### 3.2 시크릿 암호화

```yaml
# application.yml
spring:
  datasource:
    password: ENC(encrypted_value_here)  # Jasypt 암호화

# 암호화 방법
java -cp jasypt.jar org.jasypt.intf.cli.JasyptPBEStringEncryptionCLI \
  input="SuperSecretPassword123!" \
  password="master_key" \
  algorithm=PBEWithMD5AndDES
```

---

## 원칙 4: CORS 및 CSRF

### 4.1 CORS 설정

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(
                "http://localhost:3000",  // 개발
                "https://yourdomain.com"  // 프로덕션
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}

// ❌ 나쁜 예: 모든 오리진 허용
.allowedOrigins("*")  // CSRF 공격 가능
.allowCredentials(true)  // 위와 함께 사용 시 보안 위험
```

### 4.2 CSRF 보호

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // REST API는 CSRF 비활성화 (JWT 사용)
            .csrf(csrf -> csrf.disable())

            // 쿠키 기반 세션 사용 시 CSRF 활성화
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            );

        return http.build();
    }
}
```

---

## 원칙 5: 데이터 암호화

### 5.1 전송 중 암호화 (HTTPS)

```properties
# application.properties
server.ssl.enabled=true
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-password=${SSL_KEY_STORE_PASSWORD}
server.ssl.key-store-type=PKCS12
server.ssl.key-alias=tomcat

# HTTP를 HTTPS로 리다이렉트
server.http.port=8080
server.port=8443
```

```java
@Configuration
public class HttpsRedirectConfig {

    @Bean
    public ServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory() {
            @Override
            protected void postProcessContext(Context context) {
                SecurityConstraint securityConstraint = new SecurityConstraint();
                securityConstraint.setUserConstraint("CONFIDENTIAL");
                SecurityCollection collection = new SecurityCollection();
                collection.addPattern("/*");
                securityConstraint.addCollection(collection);
                context.addConstraint(securityConstraint);
            }
        };

        tomcat.addAdditionalTomcatConnectors(redirectConnector());
        return tomcat;
    }

    private Connector redirectConnector() {
        Connector connector = new Connector("org.apache.coyote.http11.Http11NioProtocol");
        connector.setScheme("http");
        connector.setPort(8080);
        connector.setSecure(false);
        connector.setRedirectPort(8443);
        return connector;
    }
}
```

### 5.2 저장 데이터 암호화

```java
// ✅ 좋은 예: JPA Converter로 민감 데이터 암호화
@Converter
public class EmailEncryptionConverter implements AttributeConverter<String, String> {

    private final CryptoService cryptoService;

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) return null;
        return cryptoService.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return cryptoService.decrypt(dbData);
    }
}

@Entity
public class User {
    @Convert(converter = EmailEncryptionConverter.class)
    private String email;  // DB에 암호화되어 저장
}
```

---

## 원칙 6: 세션 및 쿠키 보안

### 6.1 세션 관리

```java
@Configuration
public class SessionConfig {

    @Bean
    public SessionProperties sessionProperties() {
        SessionProperties properties = new SessionProperties();
        properties.setTimeout(Duration.ofMinutes(30));  // 30분 타임아웃
        properties.setCookie(cookieProperties());
        return properties;
    }

    private CookieProperties cookieProperties() {
        CookieProperties cookie = new CookieProperties();
        cookie.setHttpOnly(true);  // XSS 방지
        cookie.setSecure(true);    // HTTPS만
        cookie.setSameSite(SameSite.STRICT);  // CSRF 방지
        return cookie;
    }
}
```

### 6.2 JWT Refresh Token 전략

```java
public class JwtTokenProvider {

    public TokenDto generateToken(Authentication authentication) {
        Date now = new Date();

        // Access Token: 짧은 만료 시간 (30분)
        String accessToken = Jwts.builder()
            .setSubject(authentication.getName())
            .setIssuedAt(now)
            .setExpiration(new Date(now.getTime() + 1800000))  // 30분
            .signWith(getSigningKey())
            .compact();

        // Refresh Token: 긴 만료 시간 (7일)
        String refreshToken = Jwts.builder()
            .setSubject(authentication.getName())
            .setIssuedAt(now)
            .setExpiration(new Date(now.getTime() + 604800000))  // 7일
            .signWith(getSigningKey())
            .compact();

        return TokenDto.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .build();
    }
}

// Refresh Token은 DB에 저장하여 검증
@Entity
public class RefreshToken {
    @Id
    private String token;

    @ManyToOne
    private User user;

    private LocalDateTime expiryDate;

    @Column(nullable = false)
    private boolean revoked = false;  // 탈취 시 무효화
}
```

---

## 원칙 7: 로깅 및 모니터링

### 7.1 민감 정보 로깅 금지

```java
// ✅ 좋은 예: 민감 정보 마스킹
@Slf4j
public class UserService {

    public void login(LoginRequest request) {
        log.info("로그인 시도: email={}", maskEmail(request.getEmail()));
        // 비밀번호는 절대 로깅하지 않음
    }

    private String maskEmail(String email) {
        return email.replaceAll("(^[^@]{3}|(?!^)\\G)[^@]", "$1*");
        // example@domain.com → exa***@domain.com
    }
}

// ❌ 나쁜 예: 민감 정보 그대로 로깅
log.info("로그인 시도: {}", request);  // 비밀번호 포함
log.debug("JWT Token: {}", token);  // 토큰 노출
```

### 7.2 보안 이벤트 감사 로그

```java
@Component
@Slf4j
public class SecurityAuditLogger {

    public void logLoginSuccess(String email, String ip) {
        log.info("LOGIN_SUCCESS | email={} | ip={} | timestamp={}",
            maskEmail(email), ip, LocalDateTime.now());
    }

    public void logLoginFailure(String email, String ip, String reason) {
        log.warn("LOGIN_FAILURE | email={} | ip={} | reason={} | timestamp={}",
            maskEmail(email), ip, reason, LocalDateTime.now());
    }

    public void logUnauthorizedAccess(String endpoint, String ip) {
        log.error("UNAUTHORIZED_ACCESS | endpoint={} | ip={} | timestamp={}",
            endpoint, ip, LocalDateTime.now());
    }
}
```

---

## 원칙 8: 에러 메시지 보안

### 8.1 에러 응답에서 민감 정보 제거

```java
// ✅ 좋은 예: 일반적인 에러 메시지
@ExceptionHandler(BadCredentialsException.class)
public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException e) {
    return ResponseEntity
        .status(HttpStatus.UNAUTHORIZED)
        .body(ErrorResponse.builder()
            .message("이메일 또는 비밀번호가 올바르지 않습니다.")  // 일반적인 메시지
            .build());
}

// ❌ 나쁜 예: 구체적인 에러 메시지
@ExceptionHandler(BadCredentialsException.class)
public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException e) {
    return ResponseEntity
        .status(HttpStatus.UNAUTHORIZED)
        .body(ErrorResponse.builder()
            .message("비밀번호가 틀렸습니다.")  // 계정 존재 여부 노출
            .stackTrace(e.getStackTrace())  // 시스템 정보 노출
            .build());
}
```

---

## 원칙 9: 의존성 보안

### 9.1 의존성 취약점 스캔

```bash
# Backend (Gradle)
./gradlew dependencyCheckAnalyze

# Frontend (npm)
npm audit
npm audit fix

# AI API (Python)
pip-audit
safety check
```

### 9.2 의존성 버전 관리

```gradle
// build.gradle
dependencies {
    // ✅ 정확한 버전 명시
    implementation 'org.springframework.boot:spring-boot-starter-web:3.2.0'

    // ❌ 범위 버전 (예측 불가능)
    implementation 'org.springframework.boot:spring-boot-starter-web:3.+'
}
```

---

## 원칙 10: Rate Limiting

### 10.1 API Rate Limiting

```java
@Configuration
public class RateLimitConfig {

    @Bean
    public RateLimiter apiRateLimiter() {
        return RateLimiter.create(100);  // 초당 100 요청
    }
}

@Aspect
@Component
public class RateLimitAspect {

    private final RateLimiter rateLimiter;

    @Around("@annotation(rateLimit)")
    public Object rateLimit(ProceedingJoinPoint joinPoint, RateLimit rateLimit) throws Throwable {
        if (!rateLimiter.tryAcquire()) {
            throw new RateLimitExceededException("요청 한도를 초과했습니다. 잠시 후 다시 시도하세요.");
        }
        return joinPoint.proceed();
    }
}

// 사용
@RateLimit
@PostMapping("/login")
public ResponseEntity<TokenDto> login(@RequestBody LoginRequest request) {
    // ...
}
```

---

## 보안 체크리스트

### 개발 전
- [ ] 환경 변수 설정 완료
- [ ] HTTPS 인증서 준비
- [ ] 보안 라이브러리 버전 확인

### 개발 중
- [ ] 모든 입력 검증
- [ ] SQL Injection 방지
- [ ] XSS 방지
- [ ] 권한 검증 구현
- [ ] 비밀번호 해싱
- [ ] 민감 정보 로깅 금지

### 배포 전
- [ ] 의존성 취약점 스캔
- [ ] HTTPS 활성화
- [ ] CORS 설정 확인
- [ ] Rate Limiting 적용
- [ ] 보안 헤더 설정

### 배포 후
- [ ] 보안 로그 모니터링
- [ ] 취약점 정기 스캔
- [ ] 의존성 업데이트

---

**이 원칙은 PROJECT_CONSTITUTION.md 제7조를 구체화한 문서입니다.**
**모든 코드는 이 보안 기준을 충족해야 합니다.**
