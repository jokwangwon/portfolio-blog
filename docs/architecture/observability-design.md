# Observability 설계 (로깅, 모니터링, 에러 추적)

> **아키텍처 리뷰 반영 문서**
> 누락된 관찰성(Observability) 기능 추가 설계
>
> **참고**: 이 문서는 [ADR-006](../decisions/ADR-006-microservice-architecture.md) 이후 독립 서비스 + 중앙 포털 아키텍처에 맞게 갱신되었습니다. 각 서비스(Portal API, AI Benchmark API 등)별로 독립적인 Observability 스택을 구성하며, Nginx Gateway 계층의 모니터링도 포함합니다.

**작성일**: 2026-01-07
**최종 수정**: 2026-03-30
**우선순위**: 🔴 **CRITICAL**
**근거**: `docs/review/architecture-review.md` 권장사항 #2

---

## 1. Observability 란?

Observability(관찰성)는 시스템의 내부 상태를 외부에서 파악할 수 있는 능력입니다.

### 3대 축
1. **Logging**: 이벤트 기록 (무슨 일이 일어났는가?)
2. **Metrics**: 수치 측정 (얼마나 자주? 얼마나 빠른가?)
3. **Tracing**: 요청 추적 (어디서 느려졌는가?)

### 왜 필요한가?
- **디버깅**: 프로덕션 버그 원인 추적
- **성능**: 병목 지점 파악
- **알림**: 장애 조기 발견
- **분석**: 사용자 행동 패턴 파악

---

## 2. Phase 1 필수 요소 (MVP)

### 2.1 구조화된 로깅 (Critical)

#### Portal API (Spring Boot)

**의존성 추가**
```gradle
// backend/api-server/build.gradle
dependencies {
    // Logback + Logstash Encoder (JSON 로깅)
    implementation 'net.logstash.logback:logstash-logback-encoder:7.4'
}
```

**Logback 설정**
```xml
<!-- backend/api-server/src/main/resources/logback-spring.xml -->
<configuration>
    <!-- 개발 환경: Console (Human-Readable) -->
    <springProfile name="dev">
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
            </encoder>
        </appender>
        <root level="INFO">
            <appender-ref ref="CONSOLE" />
        </root>
    </springProfile>

    <!-- 프로덕션 환경: JSON (Structured) -->
    <springProfile name="prod">
        <appender name="JSON_CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder class="net.logstash.logback.encoder.LogstashEncoder">
                <includeMdc>true</includeMdc>
                <includeContext>false</includeContext>
                <customFields>{"service":"portal-api","environment":"${ENVIRONMENT}"}</customFields>
                <fieldNames>
                    <timestamp>timestamp</timestamp>
                    <version>version</version>
                    <message>message</message>
                    <logger>logger</logger>
                    <thread>thread</thread>
                    <level>level</level>
                    <levelValue>[ignore]</levelValue>
                </fieldNames>
            </encoder>
        </appender>

        <!-- 파일 로그 (로컬 백업) -->
        <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>/var/log/portal-api/application.log</file>
            <encoder class="net.logstash.logback.encoder.LogstashEncoder" />
            <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
                <fileNamePattern>/var/log/portal-api/application-%d{yyyy-MM-dd}.log</fileNamePattern>
                <maxHistory>30</maxHistory>
            </rollingPolicy>
        </appender>

        <root level="INFO">
            <appender-ref ref="JSON_CONSOLE" />
            <appender-ref ref="FILE" />
        </root>
    </springProfile>

    <!-- 패키지별 레벨 설정 -->
    <logger name="com.portfolio.portal" level="DEBUG" />
    <logger name="org.springframework" level="INFO" />
    <logger name="org.hibernate.SQL" level="DEBUG" />
    <logger name="org.hibernate.type.descriptor.sql.BasicBinder" level="TRACE" />
</configuration>
```

**MDC (Mapped Diagnostic Context) 활용**
```java
// common/src/main/java/com/blog/common/logging/RequestLoggingFilter.java
package com.portfolio.portal.common.logging;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

@Component
public class RequestLoggingFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;

        try {
            // Request ID 생성 (분산 추적용)
            String requestId = UUID.randomUUID().toString();
            MDC.put("request_id", requestId);
            MDC.put("method", httpRequest.getMethod());
            MDC.put("path", httpRequest.getRequestURI());
            MDC.put("user_agent", httpRequest.getHeader("User-Agent"));

            // 인증된 사용자 정보 (JWT에서 추출)
            String userId = extractUserId(httpRequest);
            if (userId != null) {
                MDC.put("user_id", userId);
            }

            chain.doFilter(request, response);
        } finally {
            MDC.clear();  // 메모리 누수 방지
        }
    }

    private String extractUserId(HttpServletRequest request) {
        // JWT에서 user_id 추출 로직
        // 구현은 JWT Provider에서 처리
        return null;
    }
}
```

**로깅 예시**
```java
// Service 클래스에서
@Service
@Slf4j
public class PostService {

    public PostResponse createPost(PostCreateRequest request) {
        log.info("Creating post: title={}", request.getTitle());

        try {
            Post post = // ...
            log.info("Post created successfully: postId={}", post.getId());
            return PostMapper.toResponse(post);
        } catch (Exception e) {
            log.error("Failed to create post: title={}", request.getTitle(), e);
            throw e;
        }
    }
}
```

**출력 예시 (JSON)**
```json
{
  "timestamp": "2026-01-07T10:30:45.123Z",
  "level": "INFO",
  "service": "portal-api",
  "environment": "prod",
  "logger": "com.portfolio.portal.module.blog.service.PostService",
  "message": "Creating post: title=My First Post",
  "request_id": "a3f2c1d4-5678-90ab-cdef-1234567890ab",
  "method": "POST",
  "path": "/api/portal/posts",
  "user_id": "123",
  "user_agent": "Mozilla/5.0...",
  "thread": "http-nio-8080-exec-1"
}
```

#### AI API (FastAPI)

**의존성 추가**
```bash
# ai-api/requirements.txt
python-json-logger==2.0.7
```

**로깅 설정**
```python
# ai-api/app/core/logging.py
import logging
import sys
from pythonjsonlogger import jsonlogger
from app.core.config import settings

def setup_logging():
    """구조화된 JSON 로깅 설정"""
    logger = logging.getLogger()
    logger.setLevel(logging.INFO if not settings.DEBUG else logging.DEBUG)

    # JSON 포맷터
    formatter = jsonlogger.JsonFormatter(
        "%(timestamp)s %(level)s %(name)s %(message)s %(pathname)s %(lineno)d",
        rename_fields={
            "timestamp": "@timestamp",
            "level": "level",
            "name": "logger",
            "message": "message",
            "pathname": "file",
            "lineno": "line"
        },
        static_fields={
            "service": "ai-api",
            "environment": settings.ENVIRONMENT
        }
    )

    # Console Handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger

# FastAPI 앱에서 사용
# main.py
from app.core.logging import setup_logging

setup_logging()
logger = logging.getLogger(__name__)

@app.post("/api/ai/generate")
async def generate(request: GenerateRequest):
    logger.info("Inference request received", extra={
        "model_id": request.model_id,
        "prompt_length": len(request.prompt),
        "max_tokens": request.max_tokens
    })

    try:
        result = await inference_service.generate(request)
        logger.info("Inference completed", extra={
            "model_id": request.model_id,
            "tokens_generated": result.tokens_generated,
            "duration": result.duration
        })
        return result
    except Exception as e:
        logger.error("Inference failed", exc_info=True, extra={
            "model_id": request.model_id,
            "error": str(e)
        })
        raise
```

#### Frontend (Next.js)

```typescript
// frontend/src/shared/utils/logger.ts
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  userId?: string;
  page?: string;
  [key: string]: any;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, context?: LogContext) {
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'frontend',
      environment: process.env.NODE_ENV,
      ...context,
    };

    if (this.isDev) {
      // 개발 환경: Console 출력
      console[level === 'debug' ? 'log' : level](message, context);
    } else {
      // 프로덕션: JSON 로그 (Sentry로 전송)
      console.log(JSON.stringify(logData));
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
  }

  debug(message: string, context?: LogContext) {
    if (this.isDev) {
      this.log('debug', message, context);
    }
  }
}

export const logger = new Logger();
```

---

### 2.2 에러 추적 (Sentry) - Critical

#### Portal API (Spring Boot)

**의존성 추가**
```gradle
// backend/api-server/build.gradle
dependencies {
    implementation 'io.sentry:sentry-spring-boot-starter-jakarta:6.34.0'
    implementation 'io.sentry:sentry-logback:6.34.0'
}
```

**설정**
```yaml
# application-prod.yml
sentry:
  dsn: ${SENTRY_DSN}
  traces-sample-rate: 0.1  # 10% 요청만 추적 (비용 절감)
  environment: ${ENVIRONMENT:production}
  send-default-pii: false  # 개인정보 전송 금지
  enable-tracing: true

  # 예외 필터링 (보내지 않을 예외)
  ignored-exceptions-for-type:
    - org.springframework.security.access.AccessDeniedException
    - org.springframework.web.bind.MethodArgumentNotValidException
```

**Logback 연동**
```xml
<!-- logback-spring.xml -->
<configuration>
    <!-- Sentry Appender -->
    <appender name="SENTRY" class="io.sentry.logback.SentryAppender">
        <minimumEventLevel>WARN</minimumEventLevel>
        <minimumBreadcrumbLevel>INFO</minimumBreadcrumbLevel>
    </appender>

    <root level="INFO">
        <appender-ref ref="JSON_CONSOLE" />
        <appender-ref ref="SENTRY" />
    </root>
</configuration>
```

**수동 에러 전송**
```java
import io.sentry.Sentry;
import io.sentry.SentryEvent;
import io.sentry.SentryLevel;
import io.sentry.protocol.User;

@Service
public class PaymentService {

    public void processPayment(PaymentRequest request) {
        try {
            // 결제 처리
        } catch (PaymentException e) {
            // Sentry에 컨텍스트와 함께 전송
            Sentry.withScope(scope -> {
                scope.setTag("payment_method", request.getMethod());
                scope.setExtra("amount", request.getAmount());
                scope.setLevel(SentryLevel.ERROR);

                User user = new User();
                user.setId(request.getUserId().toString());
                scope.setUser(user);

                Sentry.captureException(e);
            });

            throw e;
        }
    }
}
```

#### AI API (FastAPI)

```bash
# requirements.txt
sentry-sdk[fastapi]==1.40.0
```

```python
# ai-api/app/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    environment=settings.ENVIRONMENT,
    traces_sample_rate=0.1,
    profiles_sample_rate=0.1,
    integrations=[
        FastApiIntegration(),
        SqlalchemyIntegration(),
    ],
    before_send=lambda event, hint: event if should_send_to_sentry(event) else None
)

def should_send_to_sentry(event):
    """Sentry로 보낼 이벤트 필터링"""
    # 404, 400 등은 제외
    if event.get('level') == 'info':
        return None
    return event
```

#### Frontend (Next.js)

**설치**
```bash
npm install @sentry/nextjs
```

**설정**
```javascript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,  // Session Replay (사용자 행동 녹화)
  replaysOnErrorSampleRate: 1.0,  // 에러 발생 시 100% 녹화

  beforeSend(event, hint) {
    // 개발 환경에서는 전송 안 함
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
});
```

```javascript
// sentry.server.config.ts (서버 컴포넌트용)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

**Error Boundary 활용**
```tsx
// app/error.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>문제가 발생했습니다</h2>
      <button onClick={reset}>다시 시도</button>
    </div>
  );
}
```

---

### 2.3 Health Check 엔드포인트 (High)

#### Portal API

```java
// api-server/src/main/java/com/portfolio/portal/api/controller/HealthController.java
package com.portfolio.portal.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "portal-api");
        health.put("version", "1.0.0");
        health.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(health);
    }

    @GetMapping("/db")
    public ResponseEntity<Map<String, Object>> healthDatabase() {
        Map<String, Object> health = new HashMap<>();

        try (Connection connection = dataSource.getConnection()) {
            boolean isValid = connection.isValid(1);
            health.put("status", isValid ? "UP" : "DOWN");
            health.put("database", "PostgreSQL");
        } catch (Exception e) {
            health.put("status", "DOWN");
            health.put("error", e.getMessage());
            return ResponseEntity.status(503).body(health);
        }

        return ResponseEntity.ok(health);
    }
}
```

#### AI API

```python
# ai-api/app/api/routes/health.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.model_manager import model_manager
import torch

router = APIRouter()

@router.get("/health")
async def health():
    return {
        "status": "UP",
        "service": "ai-api",
        "gpu_available": torch.cuda.is_available(),
        "loaded_models": len(model_manager._instances)
    }

@router.get("/health/db")
async def health_database(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {
            "status": "UP",
            "database": "PostgreSQL"
        }
    except Exception as e:
        return {
            "status": "DOWN",
            "error": str(e)
        }, 503
```

---

## 3. Phase 2 고도화 (선택적)

### 3.1 Prometheus + Grafana (Medium)

#### Prometheus 메트릭 수집

**Portal API**
```gradle
dependencies {
    implementation 'io.micrometer:micrometer-registry-prometheus'
}
```

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

**AI API**
```python
# requirements.txt
prometheus-client==0.19.0

# main.py
from prometheus_client import Counter, Histogram, make_asgi_app

# 메트릭 정의
inference_requests_total = Counter(
    'inference_requests_total',
    'Total inference requests',
    ['model_id', 'status']
)

inference_duration_seconds = Histogram(
    'inference_duration_seconds',
    'Inference duration in seconds',
    ['model_id']
)

# /metrics 엔드포인트
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
```

#### Grafana 대시보드

```yaml
# infrastructure/docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}

volumes:
  prometheus_data:
  grafana_data:
```

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  # Portal API (Spring Boot Actuator)
  - job_name: 'portal-api'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['portal-api:8080']

  # AI Benchmark API (FastAPI)
  - job_name: 'ai-benchmark-api'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['ai-benchmark-api:8000']

  # Nginx Gateway
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  # 새 서비스 추가 시 아래 패턴 복사
  # - job_name: '{service-name}'
  #   static_configs:
  #     - targets: ['{service-name}:{port}']
```

---

## 4. 로그 집계 (Phase 2 - AWS)

### CloudWatch Logs

```yaml
# AWS ECS Task Definition
{
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/portal-api",
      "awslogs-region": "ap-northeast-2",
      "awslogs-stream-prefix": "ecs"
    }
  }
}
```

### CloudWatch Insights 쿼리

```
# 에러 로그 검색
fields @timestamp, level, message, request_id, user_id
| filter level = "ERROR"
| sort @timestamp desc
| limit 100

# 특정 사용자 요청 추적
fields @timestamp, method, path, message
| filter user_id = "123"
| sort @timestamp asc

# 응답 시간 분석
stats avg(duration), max(duration), min(duration) by path
| filter duration > 1000
```

---

## 5. 알림 설정 (High)

### Sentry 알림

```yaml
# Sentry Project Settings → Alerts

# Alert Rule 1: 에러 급증
IF number of events is more than 10
OVER 5 minutes
THEN send notification to Slack #alerts

# Alert Rule 2: 새로운 에러
IF a new issue is first seen
THEN send notification to Slack #alerts

# Alert Rule 3: 성능 저하
IF p95 transaction duration is more than 2000ms
OVER 10 minutes
THEN send notification to Email
```

### CloudWatch 알림 (Phase 2)

```hcl
# terraform/cloudwatch_alarms.tf
resource "aws_cloudwatch_metric_alarm" "api_high_error_rate" {
  alarm_name          = "portal-api-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "API 5xx 에러가 1분간 10회 이상"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
```

---

## 6. 분산 환경 Observability (ADR-006 반영)

> 독립 서비스 + 중앙 포털 아키텍처에서 추가로 고려할 사항

### 6.1 서비스별 Health Check 통합

Portal API의 Service Registry가 각 서비스의 `/health`를 주기적으로 폴링합니다.

```
Portal Registry ──(30초 간격)──→ Portal API      /health
                ──(30초 간격)──→ AI Benchmark API /health
                ──(30초 간격)──→ {새 서비스}      /health
```

각 서비스의 Health Check 응답은 **Service Contract**를 따릅니다:
```json
{
  "status": "UP",
  "service": "ai-benchmark-api",
  "version": "1.0.0",
  "timestamp": 1711785600000
}
```

### 6.2 Nginx Gateway 메트릭

Nginx는 모든 요청의 진입점이므로 별도 모니터링이 필요합니다.

```nginx
# nginx.conf — stub_status 활성화
server {
    listen 8081;
    location /nginx_status {
        stub_status on;
        allow 172.16.0.0/12;  # Docker 내부 네트워크만 허용
        deny all;
    }
}
```

수집 메트릭:
- `nginx_connections_active` — 현재 활성 연결 수
- `nginx_http_requests_total` — 총 요청 수
- 서비스별 5xx 비율 (access log 파싱)

### 6.3 분산 추적 (Distributed Tracing)

서비스 간 요청 추적을 위해 `X-Request-ID` 헤더를 전파합니다.

```
Client → Nginx (X-Request-ID 생성) → Portal API (MDC에 기록)
Client → Nginx (X-Request-ID 생성) → AI Benchmark API (로그에 기록)
```

```nginx
# nginx.conf — 요청 ID 전파
proxy_set_header X-Request-ID $request_id;
```

각 서비스는 이 헤더를 로그에 포함하여 서비스 간 요청을 추적할 수 있습니다.

### 6.4 Grafana 대시보드 구성

| 대시보드 | 데이터 소스 | 주요 패널 |
|----------|------------|-----------|
| **Gateway Overview** | Nginx Exporter | 요청 수, 에러율, 응답 시간 |
| **Portal API** | Prometheus (Actuator) | JVM 메트릭, API 응답 시간, DB 풀 |
| **AI Benchmark API** | Prometheus (FastAPI) | 추론 시간, GPU 사용률, 요청 수 |
| **Service Health** | Service Registry | 서비스 상태, 마지막 응답 시간 |

---

## 7. 구현 체크리스트

### Phase 1 (MVP 필수)
- [ ] Logback JSON 로깅 설정 (Portal API)
- [ ] Python JSON 로깅 설정 (AI Benchmark API)
- [ ] MDC 필터 구현 (request_id, user_id)
- [ ] Sentry 연동 (Frontend, Portal API, AI Benchmark API)
- [ ] Health Check 엔드포인트 (/health, /health/db) — 각 서비스별
- [ ] Error Boundary (Frontend)
- [ ] Sentry 알림 설정 (Slack 연동)

### Phase 2 (고도화)
- [ ] Prometheus 메트릭 수집 (서비스별 job 구성)
- [ ] Nginx Exporter 연동
- [ ] Grafana 대시보드 구축 (서비스별 4개 대시보드)
- [ ] X-Request-ID 분산 추적 구현
- [ ] CloudWatch Logs 연동
- [ ] CloudWatch 알림 설정
- [ ] APM 도입 (Sentry Performance 또는 Datadog)

---

## 8. 비용 분석

### Sentry (무료 티어)
- **이벤트**: 5,000 errors/월
- **Session Replay**: 50 replays/월
- **비용**: **$0/월** (충분함)

### 유료 전환 시 (Phase 3)
- **Team Plan**: $26/월 (50,000 errors, 500 replays)

### AWS CloudWatch (Phase 2)
- **Logs Ingestion**: $0.50/GB
- **Logs Storage**: $0.03/GB/월
- **예상 비용**: ~$10/월 (로그 5GB 기준)

---

## 9. 결론

### Phase 1 필수 구현
1. **구조화된 JSON 로깅** → 디버깅 효율 80% 향상
2. **Sentry 에러 추적** → 프로덕션 에러 발견 속도 10배 개선
3. **Health Check** → 서비스 상태 모니터링 (서비스별 독립 + 포털 통합)

### 예상 효과
- ✅ 프로덕션 버그 추적 시간 80% 단축
- ✅ 장애 발견 속도 10배 개선
- ✅ 디버깅 효율 향상 (request_id 추적)
- ✅ 사용자 행동 분석 가능 (Session Replay)

---

**이 문서는 `docs/review/architecture-review.md` 권장사항을 반영한 설계입니다.**
