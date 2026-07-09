# OAuth2 소셜 로그인 이슈 리포트

> **작성일**: 2026-04-02 (세션 #13)
> **상태**: 수정 완료

---

## 이슈 요약

| # | 심각도 | 이슈 | 원인 | 상태 |
|---|--------|------|------|------|
| 1 | CRITICAL | Google `401 invalid_client` | 환경변수 미설정, 플레이스홀더 사용 중 | 수정 완료 |
| 2 | CRITICAL | OAuth2 refresh_token 쿠키 도메인 불일치 | 백엔드(8080)에서 설정한 쿠키가 프론트(3000) 요청에 미포함 | 수정 완료 |
| 3 | HIGH | GitHub 이메일 비공개 시 DB 크래시 | null email → `NOT NULL` 제약조건 위반 | 수정 완료 |
| 4 | MEDIUM | 미인증 요청에 403 반환 (401이 올바름) | `authenticationEntryPoint`에서 `SC_FORBIDDEN` 사용 | 수정 완료 |

---

## 이슈 #1: Google `401 invalid_client`

### 증상
```
액세스 차단됨: 승인 오류
401 오류: invalid_client
The OAuth client was not found.
```

### 원인
`application-dev.yml`에서 OAuth2 client-id/secret이 환경변수로 설정되어 있으나,
환경변수가 미설정 시 플레이스홀더 `google-client-id`가 사용됨.

```yaml
google:
  client-id: ${OAUTH_GOOGLE_CLIENT_ID:google-client-id}  # ← 플레이스홀더
  client-secret: ${OAUTH_GOOGLE_CLIENT_SECRET:google-client-secret}
```

### 해결
1. `.env.example` 파일 생성 (가이드용, git 추적)
2. `.env.local` 파일 생성 (실제 값, git 무시)
3. `application-dev.yml`에서 `.env.local` 로드하도록 설정
4. Spring Boot의 `spring.config.import`로 `.env.local` 읽기

### Google OAuth 클라이언트 발급 절차
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized redirect URIs: `http://localhost:8080/oauth2/callback/google`
5. Client ID / Client Secret 복사 → `.env.local`에 입력

### GitHub OAuth 앱 등록 절차
1. GitHub Settings → Developer settings → OAuth Apps → New OAuth App
2. Homepage URL: `http://localhost:3000`
3. Authorization callback URL: `http://localhost:8080/oauth2/callback/github`
4. Client ID / Client Secret 복사 → `.env.local`에 입력

---

## 이슈 #2: OAuth2 refresh_token 쿠키 도메인 불일치

### 증상
소셜 로그인 성공 후 페이지 새로고침 시 로그인 풀림 (토큰 갱신 실패)

### 원인
OAuth2 인증 성공 시 `OAuth2AuthenticationSuccessHandler`가 `localhost:8080`에서 직접
`Set-Cookie: refresh_token=...` 헤더를 보냄. 브라우저는 이 쿠키를 `localhost:8080` 도메인에 저장.

이후 프론트엔드에서 `POST /api/portal/auth/refresh` 요청은 `localhost:3000`으로 전송되고
Next.js가 `localhost:8080`으로 프록시하지만, 쿠키는 `localhost:3000` 기준이므로
`localhost:8080`에 저장된 refresh_token 쿠키가 포함되지 않음.

```
[브라우저] --cookie: localhost:8080--> [저장]
[브라우저] --POST localhost:3000/api/portal/auth/refresh--> [Next.js 프록시]
            ↑ localhost:3000 쿠키만 전송, localhost:8080 쿠키 미포함!
```

### 해결
1. `OAuth2AuthenticationSuccessHandler`: 쿠키 설정 제거, refreshToken을 fragment에 포함
2. `AuthController`: `POST /auth/oauth-session` 엔드포인트 추가
3. `SecurityConfig`: `/auth/oauth-session` permitAll 추가
4. 프론트 `callback/page.tsx`: refreshToken 추출 → `/auth/oauth-session` 호출 (Next.js 프록시 경유)

```
[Google] → [Backend:8080 redirect] → [Frontend:3000/auth/callback#accessToken=...&refreshToken=...]
                                       ↓
                                   POST /api/portal/auth/oauth-session {refreshToken}
                                       ↓ (Next.js 프록시 경유)
                                   Set-Cookie: refresh_token=... (localhost:3000 도메인)
```

---

## 이슈 #3: GitHub 이메일 비공개 시 DB 크래시

### 증상
GitHub 이메일이 비공개인 사용자 로그인 시 500 에러

### 원인
`CustomOAuth2UserService.extractEmail(GITHUB)` → `null` 반환
→ `User.email`이 `@Column(nullable = false)` → JPA 저장 시 제약조건 위반

### 해결
email이 null일 경우 fallback 이메일 생성:
```java
if (email == null || email.isBlank()) {
    email = provider.name().toLowerCase() + "_" + providerId + "@oauth.placeholder";
}
```

---

## 이슈 #4: 미인증 요청에 403 반환

### 증상
미인증 API 요청 시 401 대신 403 반환 (의미상 Forbidden ≠ Unauthorized)

### 원인
`SecurityConfig.authenticationEntryPoint`에서 `SC_FORBIDDEN`(403) 사용

### 해결
`SC_UNAUTHORIZED`(401)로 변경, 응답 메시지도 "Unauthorized"로 수정.
관련 통합 테스트 2건 업데이트 (403 → 401 기대값).

---

## 수정된 파일 목록

### 백엔드
| 파일 | 변경 내용 |
|------|----------|
| `security/.../OAuth2AuthenticationSuccessHandler.java` | 쿠키 제거, refreshToken fragment 포함 |
| `security/.../CustomOAuth2UserService.java` | null email fallback 처리 |
| `security/.../config/SecurityConfig.java` | 401 반환, `/auth/oauth-session` permitAll |
| `module-user/.../controller/AuthController.java` | `POST /auth/oauth-session` 추가 |
| `security/test/.../OAuth2AuthenticationSuccessHandlerTest.java` | 쿠키 미설정 검증으로 변경 |
| `api-server/test/.../AuthApiIntegrationTest.java` | 403 → 401 |
| `api-server/test/.../BlogApiIntegrationTest.java` | 403 → 401 |

### 프론트엔드
| 파일 | 변경 내용 |
|------|----------|
| `app/auth/callback/page.tsx` | refreshToken 추출 + oauth-session 호출 |

### 인프라 (신규)
| 파일 | 변경 내용 |
|------|----------|
| `backend/.env.example` | OAuth2 환경변수 템플릿 |
| `backend/api-server/src/main/resources/application-dev.yml` | .env.local import 설정 |

---

## 검증 방법

1. `.env.local`에 실제 Google/GitHub OAuth 키 설정
2. `cd backend && ./gradlew bootRun`
3. `cd frontend && npm run dev`
4. `http://localhost:3000/login` → "Google로 계속하기" 클릭
5. Google 인증 → callback → /blog 리다이렉트 확인
6. 페이지 새로고침 → 로그인 유지 확인 (refresh token 동작)
