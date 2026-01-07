# 테스트 전략 (Test Strategy)

> **아키텍처 리뷰 반영 문서**
> 테스트 전략 수립 - 70% 커버리지 목표

**작성일**: 2026-01-07
**우선순위**: 🟠 **HIGH**
**근거**: `docs/review/architecture-review.md` 권장사항 #4

---

## 1. 테스트 전략 개요

### 1.1 테스트 피라미드

```
        /\
       /E2E\        ← 적음 (느림, 비용 높음)
      /------\
     /Integration\  ← 중간 (API, DB 통합)
    /------------\
   / Unit Tests  \  ← 많음 (빠름, 비용 낮음)
  /--------------\
```

**비율 목표**:
- Unit Tests: 70%
- Integration Tests: 20%
- E2E Tests: 10%

### 1.2 커버리지 목표

| 레이어 | 목표 커버리지 | 우선순위 |
|--------|--------------|---------|
| **Service (비즈니스 로직)** | 80% 이상 | Critical |
| **Controller (API)** | 70% 이상 | High |
| **Repository (쿼리)** | 60% 이상 | Medium |
| **Util/Helper** | 90% 이상 | High |
| **Entity** | 제외 (Getter/Setter) | - |

**전체 목표**: **70% 이상**

---

## 2. Backend 테스트 (Main API - Spring Boot)

### 2.1 Unit Tests (Service Layer)

#### 도구
- **JUnit 5**: 테스트 프레임워크
- **Mockito**: Mock 객체 생성
- **AssertJ**: 가독성 높은 Assertion

#### 예시: PostService 테스트

```java
// module-blog/src/test/java/com/blog/module/blog/service/PostServiceTest.java
package com.blog.module.blog.service;

import com.blog.domain.blog.entity.Post;
import com.blog.domain.blog.entity.User;
import com.blog.domain.blog.repository.PostRepository;
import com.blog.domain.blog.repository.UserRepository;
import com.blog.module.blog.dto.PostCreateRequest;
import com.blog.module.blog.dto.PostResponse;
import com.blog.module.blog.exception.PostNotFoundException;
import com.blog.module.blog.exception.UserNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PostService 테스트")
class PostServiceTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PostService postService;

    private User testUser;
    private Post testPost;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .build();

        testPost = Post.builder()
                .id(1L)
                .title("Test Post")
                .content("Test Content")
                .author(testUser)
                .build();
    }

    @Test
    @DisplayName("게시글 생성 - 성공")
    void createPost_validRequest_success() {
        // Given
        PostCreateRequest request = PostCreateRequest.builder()
                .title("New Post")
                .content("New Content")
                .authorId(1L)
                .build();

        given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
        given(postRepository.save(any(Post.class))).willReturn(testPost);

        // When
        PostResponse response = postService.createPost(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Test Post");
        verify(userRepository).findById(1L);
        verify(postRepository).save(any(Post.class));
    }

    @Test
    @DisplayName("게시글 생성 - 작성자 없음 → 예외")
    void createPost_userNotFound_throwsException() {
        // Given
        PostCreateRequest request = PostCreateRequest.builder()
                .title("New Post")
                .content("New Content")
                .authorId(999L)
                .build();

        given(userRepository.findById(999L)).willReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> postService.createPost(request))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessage("User not found: 999");

        verify(userRepository).findById(999L);
        verify(postRepository, never()).save(any());
    }

    @Test
    @DisplayName("게시글 조회 - 성공")
    void getPost_existingId_success() {
        // Given
        given(postRepository.findById(1L)).willReturn(Optional.of(testPost));

        // When
        PostResponse response = postService.getPost(1L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getTitle()).isEqualTo("Test Post");
    }

    @Test
    @DisplayName("게시글 조회 - 존재하지 않음 → 예외")
    void getPost_nonExistentId_throwsException() {
        // Given
        given(postRepository.findById(999L)).willReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> postService.getPost(999L))
                .isInstanceOf(PostNotFoundException.class);
    }
}
```

#### 테스트 네이밍 규칙
```
{메서드명}_{조건}_{예상결과}

✅ createPost_validRequest_success
✅ createPost_userNotFound_throwsException
✅ getPost_existingId_success
✅ deletePost_notAuthor_throwsUnauthorizedException
```

---

### 2.2 Integration Tests (Controller + Service + Repository)

#### 도구
- **Spring Boot Test**: `@SpringBootTest`
- **MockMvc**: HTTP 요청/응답 테스트
- **Testcontainers**: 실제 PostgreSQL 컨테이너 사용

#### 의존성
```gradle
// backend/api-server/build.gradle
dependencies {
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.testcontainers:testcontainers:1.19.3'
    testImplementation 'org.testcontainers:postgresql:1.19.3'
    testImplementation 'org.testcontainers:junit-jupiter:1.19.3'
}
```

#### Testcontainers 설정
```java
// api-server/src/test/java/com/blog/api/IntegrationTestBase.java
package com.blog.api;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public abstract class IntegrationTestBase {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("test_db")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}
```

#### 예시: Controller 통합 테스트
```java
// api-server/src/test/java/com/blog/api/controller/PostControllerTest.java
package com.blog.api.controller;

import com.blog.api.IntegrationTestBase;
import com.blog.module.blog.dto.PostCreateRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
@DisplayName("PostController 통합 테스트")
class PostControllerTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("게시글 생성 API - 성공")
    void createPost_validRequest_returns201() throws Exception {
        // Given
        PostCreateRequest request = PostCreateRequest.builder()
                .title("Integration Test Post")
                .content("This is a test content")
                .authorId(1L)
                .build();

        String requestBody = objectMapper.writeValueAsString(request);

        // When & Then
        mockMvc.perform(post("/api/v1/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title").value("Integration Test Post"))
                .andExpect(jsonPath("$.content").value("This is a test content"));
    }

    @Test
    @DisplayName("게시글 조회 API - 존재하지 않는 ID → 404")
    void getPost_nonExistentId_returns404() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/posts/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("POST_NOT_FOUND"));
    }
}
```

---

### 2.3 Repository Tests (QueryDSL, N+1 방지)

```java
// domain/src/test/java/com/blog/domain/blog/repository/PostRepositoryTest.java
package com.blog.domain.blog.repository;

import com.blog.domain.blog.entity.Category;
import com.blog.domain.blog.entity.Post;
import com.blog.domain.blog.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@DisplayName("PostRepository 테스트")
class PostRepositoryTest {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("Fetch Join - N+1 방지 확인")
    void findAllWithDetails_fetchJoin_noN1Problem() {
        // Given
        User user = entityManager.persist(User.builder().username("test").build());
        Category category = entityManager.persist(Category.builder().name("Tech").build());

        Post post1 = entityManager.persist(Post.builder()
                .title("Post 1")
                .author(user)
                .category(category)
                .build());

        Post post2 = entityManager.persist(Post.builder()
                .title("Post 2")
                .author(user)
                .category(category)
                .build());

        entityManager.flush();
        entityManager.clear();

        // When
        List<Post> posts = postRepository.findAllWithDetails();

        // Then
        assertThat(posts).hasSize(2);
        // Lazy Loading이 아니므로 추가 쿼리 없이 접근 가능
        assertThat(posts.get(0).getAuthor().getUsername()).isEqualTo("test");
        assertThat(posts.get(0).getCategory().getName()).isEqualTo("Tech");
    }
}
```

---

## 3. AI API 테스트 (FastAPI - Python)

### 3.1 Unit Tests

#### 도구
- **pytest**: 테스트 프레임워크
- **pytest-asyncio**: 비동기 테스트
- **pytest-mock**: Mock 객체

```bash
# requirements-dev.txt
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
pytest-mock==3.12.0
httpx==0.25.2  # FastAPI 테스트용
```

#### 예시: Service 테스트
```python
# ai-api/tests/services/test_inference_service.py
import pytest
from unittest.mock import Mock, AsyncMock, patch
from app.services.inference_service import InferenceService
from app.models.schemas.generate import GenerateRequest
from app.core.exceptions import ModelNotFoundException

@pytest.fixture
def inference_service():
    return InferenceService()

@pytest.mark.asyncio
async def test_generate_success(inference_service, mocker):
    """추론 성공 테스트"""
    # Given
    request = GenerateRequest(
        model_id="llama-3.1-8b-q4",
        prompt="Hello, world!",
        max_tokens=100
    )

    mock_model = Mock()
    mock_model.generate = AsyncMock(return_value={
        "text": "Generated text",
        "tokens_generated": 50,
        "duration": 2.5
    })

    mocker.patch.object(
        inference_service.model_manager,
        'load_model',
        return_value=mock_model
    )

    # When
    result = await inference_service.generate(request)

    # Then
    assert result["text"] == "Generated text"
    assert result["tokens_generated"] == 50
    assert result["duration"] == 2.5

@pytest.mark.asyncio
async def test_generate_model_not_found(inference_service):
    """모델 없음 - 예외 발생"""
    # Given
    request = GenerateRequest(
        model_id="non-existent-model",
        prompt="Test",
        max_tokens=100
    )

    # When & Then
    with pytest.raises(ModelNotFoundException):
        await inference_service.generate(request)
```

---

### 3.2 Integration Tests (API)

```python
# ai-api/tests/api/test_generate_api.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_generate_endpoint_success():
    """추론 API 성공 테스트"""
    # Given
    request_data = {
        "model_id": "llama-3.1-8b-q4",
        "prompt": "Hello, AI!",
        "max_tokens": 50,
        "temperature": 0.7
    }

    # When
    response = client.post("/api/v1/generate", json=request_data)

    # Then
    assert response.status_code == 200
    data = response.json()
    assert "text" in data
    assert "tokens_generated" in data
    assert "duration" in data

def test_generate_endpoint_invalid_model():
    """잘못된 모델 ID → 404"""
    # Given
    request_data = {
        "model_id": "invalid-model",
        "prompt": "Test",
        "max_tokens": 50
    }

    # When
    response = client.post("/api/v1/generate", json=request_data)

    # Then
    assert response.status_code == 404
    assert response.json()["detail"] == "Model not found"

def test_generate_endpoint_validation_error():
    """입력 검증 실패 → 422"""
    # Given
    request_data = {
        "model_id": "llama-3.1-8b-q4",
        "prompt": "",  # 빈 문자열
        "max_tokens": 5000  # 최대값 초과
    }

    # When
    response = client.post("/api/v1/generate", json=request_data)

    # Then
    assert response.status_code == 422
```

---

## 4. Frontend 테스트 (Next.js - React)

### 4.1 Unit Tests (Components)

#### 도구
- **Jest**: 테스트 프레임워크
- **React Testing Library**: 컴포넌트 테스트
- **MSW (Mock Service Worker)**: API Mock

```bash
# package.json
{
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "msw": "^2.0.11"
  }
}
```

#### 예시: 컴포넌트 테스트
```typescript
// frontend/src/modules/blog/components/PostCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostCard from './PostCard';

describe('PostCard', () => {
  const mockPost = {
    id: 1,
    title: 'Test Post',
    content: 'Test content',
    author: 'Test Author',
    createdAt: '2026-01-07T10:00:00Z',
  };

  it('게시글 정보를 올바르게 렌더링한다', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('클릭 시 onDelete 콜백이 호출된다', async () => {
    const handleDelete = jest.fn();
    render(<PostCard post={mockPost} onDelete={handleDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    expect(handleDelete).toHaveBeenCalledWith(1);
  });
});
```

---

### 4.2 API Mock (MSW)

```typescript
// frontend/src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/posts', () => {
    return HttpResponse.json([
      { id: 1, title: 'Post 1', content: 'Content 1' },
      { id: 2, title: 'Post 2', content: 'Content 2' },
    ]);
  }),

  http.post('/api/v1/posts', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: 3, ...body },
      { status: 201 }
    );
  }),
];
```

---

### 4.3 E2E Tests (Playwright)

```bash
npm install -D @playwright/test
```

```typescript
// frontend/tests/e2e/blog.spec.ts
import { test, expect } from '@playwright/test';

test.describe('블로그 기능', () => {
  test('게시글 목록 조회', async ({ page }) => {
    await page.goto('/blog');

    // 게시글 목록이 렌더링되는지 확인
    await expect(page.locator('article')).toHaveCount(10);
  });

  test('게시글 작성', async ({ page }) => {
    await page.goto('/blog/new');

    // 폼 입력
    await page.fill('input[name="title"]', 'E2E Test Post');
    await page.fill('textarea[name="content"]', 'E2E Test Content');

    // 제출
    await page.click('button[type="submit"]');

    // 성공 메시지 확인
    await expect(page.locator('text=게시글이 작성되었습니다')).toBeVisible();
  });
});
```

---

## 5. 테스트 자동화 (CI/CD)

### 5.1 GitHub Actions

```yaml
# .github/workflows/test.yml
name: Run Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Run tests with Gradle
        run: ./gradlew test

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/build/reports/jacoco/test/jacocoTestReport.xml

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend

      - name: Run tests
        run: npm test -- --coverage
        working-directory: ./frontend

  ai-api-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
        working-directory: ./ai-api

      - name: Run tests
        run: pytest --cov=app --cov-report=xml
        working-directory: ./ai-api
```

---

## 6. 커버리지 측정

### Backend (JaCoCo)
```gradle
// backend/api-server/build.gradle
plugins {
    id 'jacoco'
}

jacoco {
    toolVersion = "0.8.11"
}

test {
    finalizedBy jacocoTestReport
}

jacocoTestReport {
    dependsOn test
    reports {
        xml.required = true
        html.required = true
    }
}

jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = 0.70  // 70% 이상
            }
        }
    }
}
```

### Frontend (Jest)
```javascript
// frontend/jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### AI API (pytest-cov)
```bash
pytest --cov=app --cov-report=html --cov-report=term --cov-fail-under=70
```

---

## 7. 테스트 작성 우선순위

### Critical (즉시 작성)
1. **인증 로직** (로그인, JWT 검증, Refresh Token Rotation)
2. **게시글 CRUD** (생성, 조회, 수정, 삭제)
3. **N+1 쿼리 방지** (Fetch Join 동작 확인)
4. **입력 검증** (Validation)
5. **에러 처리** (GlobalExceptionHandler)

### High (Phase 1 완료 전)
6. **댓글 시스템**
7. **카테고리/태그 관리**
8. **AI 추론 API**
9. **벤치마크 결과 저장**
10. **파일 업로드**

### Medium (Phase 2)
11. **캐싱 동작 확인**
12. **성능 테스트** (JMeter)
13. **보안 테스트** (OWASP ZAP)
14. **E2E 전체 플로우**

---

## 8. 구현 체크리스트

### Backend
- [ ] Unit Tests (Service Layer) - 80% 커버리지
- [ ] Integration Tests (Controller + Repository) - Testcontainers
- [ ] Repository Tests (N+1 방지 확인)
- [ ] JaCoCo 설정 (70% 최소 커버리지)
- [ ] CI/CD 통합 (GitHub Actions)

### AI API
- [ ] Unit Tests (Service Layer) - pytest
- [ ] API Tests (FastAPI TestClient)
- [ ] pytest-cov 설정 (70% 최소 커버리지)

### Frontend
- [ ] Component Tests (React Testing Library)
- [ ] API Mock (MSW)
- [ ] E2E Tests (Playwright) - 주요 플로우
- [ ] Jest 커버리지 설정

---

## 9. 결론

### 테스트 전략 요약
1. **Unit Tests 70%** - 빠르고 안정적인 개발
2. **Integration Tests 20%** - API 동작 검증
3. **E2E Tests 10%** - 사용자 플로우 검증

### 예상 효과
- ✅ 리팩토링 안전성 향상
- ✅ 버그 발생률 80% 감소
- ✅ 개발 속도 장기적으로 30% 향상
- ✅ 코드 품질 개선

---

**이 문서는 `docs/review/architecture-review.md` 권장사항을 반영한 설계입니다.**
