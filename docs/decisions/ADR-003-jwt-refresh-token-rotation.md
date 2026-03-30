# ADR-003: JWT Refresh Token Rotation

**Status**: Accepted
**Date**: 2026-01-07
**Deciders**: kwangwon
**Tags**: #security #jwt #authentication #xss

---

## Context (배경)

### 현재 상황
초기 설계에서는 JWT Access Token + Refresh Token을 모두 로컬스토리지에 저장하고, Refresh Token을 만료 시까지 무제한 재사용하는 방식이었다.

### 문제점
- **XSS 취약**: 로컬스토리지는 JavaScript로 접근 가능하므로 악성 스크립트가 토큰을 탈취할 수 있음
- **재사용 무제한**: Refresh Token이 탈취되면 7일간 계속 새로운 Access Token 발급 가능
- **탈취 감지 불가**: 공격자가 토큰을 사용해도 정상 사용자와 구분할 방법이 없음
- **무효화 불가**: Stateless JWT 특성상 로그아웃해도 토큰은 만료 시까지 유효

### 요구사항
- XSS 공격으로부터 Refresh Token 보호
- 토큰 탈취 시 피해 최소화
- 로그아웃/비밀번호 변경 시 즉시 토큰 무효화
- Phase 1에서 Redis 없이 구현 (ADR-001 결정 준수)

---

## Decision (결정)

### 선택한 방안
**Refresh Token Rotation + HttpOnly Cookie + Token Family 기반 재사용 감지**

- **Refresh Token 저장**: HttpOnly Cookie (JavaScript 접근 불가)
- **Access Token 저장**: 메모리 또는 로컬스토리지 (1시간 후 자동 만료)
- **Rotation**: Refresh Token 사용 시마다 새 토큰 발급, 기존 토큰 즉시 무효화
- **Token Family**: 로그인 시 생성되는 고유 ID로 Rotation 체인 추적
- **재사용 감지**: 이미 무효화된 토큰 사용 시도 시 해당 Family 전체 무효화 (강제 로그아웃)
- **Blacklist 저장**: PostgreSQL refresh_tokens 테이블 (Redis 대신)

### 이유
1. **XSS 방지**: HttpOnly Cookie는 JavaScript에서 접근 불가, 탈취 경로 차단
2. **피해 최소화**: Rotation으로 탈취된 토큰은 1회만 유효, 재사용 시 즉시 감지
3. **즉시 무효화**: Token Family 단위로 일괄 무효화 가능 (로그아웃, 비밀번호 변경)
4. **Redis 불필요**: PostgreSQL 테이블로 Blacklist 관리 (ADR-001과 일관)

---

## Alternatives Considered (고려한 대안)

### 대안 1: 기존 설계 유지 (로컬스토리지 + 무제한 재사용)
**설명**: Access/Refresh Token 모두 로컬스토리지, Refresh Token 만료까지 재사용

**장점**:
- 구현 단순
- 서버 상태 관리 불필요 (완전 Stateless)

**단점**:
- XSS로 Refresh Token 탈취 시 7일간 악용 가능
- 토큰 무효화 방법 없음
- 탈취 사실 감지 불가

**채택하지 않은 이유**: 보안 취약점이 명확하고, 포트폴리오 프로젝트로서 보안 의식 부재로 보일 수 있음

### 대안 2: Redis Blacklist
**설명**: Refresh Token 무효화를 Redis에서 관리

**장점**:
- 빠른 조회 (O(1))
- TTL 기반 자동 만료

**단점**:
- ADR-001에서 Phase 1 Redis 제외를 결정함
- Redis 인프라 추가 → 복잡도 증가

**채택하지 않은 이유**: ADR-001 결정과 충돌. Phase 1 트래픽에서는 PostgreSQL 조회로 충분.

### 대안 3: Access Token만 사용 (Refresh Token 제거)
**설명**: Access Token을 장기간(7일) 발급하고 Refresh Token 자체를 없앰

**장점**:
- 구현 가장 단순
- Rotation/Blacklist 로직 불필요

**단점**:
- 토큰 탈취 시 7일간 무방비
- 무효화 불가 (완전 Stateless)
- 업계 표준과 거리 있음

**채택하지 않은 이유**: 보안상 최악의 선택. Access Token은 짧게, Refresh Token으로 갱신하는 것이 업계 표준.

---

## Consequences (결과)

### 긍정적 영향
- HttpOnly Cookie로 XSS 공격 경로 차단
- 토큰 탈취 시 1회 사용 후 자동 감지 → Family 전체 무효화
- 로그아웃/비밀번호 변경 시 즉시 모든 세션 종료 가능
- Redis 없이 PostgreSQL로 일관된 인프라 유지

### 부정적 영향
- Refresh 요청마다 DB 조회/쓰기 발생 (토큰 검증 + 새 토큰 저장)
- 만료된 토큰 정리를 위한 스케줄러 필요

### Trade-offs
- 완전 Stateless vs 보안 → 보안 우선 (DB에 토큰 상태 저장)
- DB 부하 vs Redis 도입 → Phase 1에서는 DB 부하 감수, Phase 2에서 Redis 전환 검토

---

## Implementation (구현)

### 필요한 작업
- [x] refresh_tokens 테이블 생성 (token_family 포함)
- [x] JwtTokenProvider 구현 (Rotation 지원)
- [x] AuthService 구현 (Refresh Token Rotation 로직)
- [x] AuthController (/login, /refresh, /logout)
- [ ] HttpOnly Cookie 설정 (현재는 JSON 응답 방식)
- [ ] Frontend Axios Interceptor 구현
- [ ] 만료 토큰 자동 삭제 (Scheduled Job)

### 영향받는 컴포넌트
- backend/security (JwtTokenProvider, JwtAuthenticationFilter)
- backend/domain (RefreshToken 엔티티, RefreshTokenRepository)
- backend/module-user (AuthService, AuthController)
- frontend (Axios Interceptor, Cookie 기반 인증)

---

## References (참고 자료)

- [아키텍처 리뷰 보고서](../review/architecture-review.md) - 권장사항 #3
- [JWT 보안 강화 설계 문서](../architecture/jwt-security-enhancement.md) - 상세 구현 가이드
- [ADR-001: 데이터베이스 통합](ADR-001-database-consolidation.md) - Redis 제외 결정

---

**Created**: 2026-01-07
**Last Updated**: 2026-01-07
