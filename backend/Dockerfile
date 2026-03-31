# ==========================================
# Stage 1: Build
# ==========================================
FROM eclipse-temurin:17-jdk-jammy AS builder

WORKDIR /app

# Gradle wrapper & config (캐시 레이어)
COPY gradlew gradlew.bat gradle.properties settings.gradle.kts build.gradle.kts ./
COPY gradle/ gradle/

# 모듈별 build.gradle.kts (캐시 레이어)
COPY common/build.gradle.kts common/
COPY domain/build.gradle.kts domain/
COPY security/build.gradle.kts security/
COPY module-blog/build.gradle.kts module-blog/
COPY module-user/build.gradle.kts module-user/
COPY module-registry/build.gradle.kts module-registry/
COPY api-server/build.gradle.kts api-server/

# 의존성 다운로드 (캐시 레이어)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon || true

# 소스 코드 복사
COPY common/ common/
COPY domain/ domain/
COPY security/ security/
COPY module-blog/ module-blog/
COPY module-user/ module-user/
COPY module-registry/ module-registry/
COPY api-server/ api-server/

# 빌드 (테스트 제외)
RUN ./gradlew :api-server:bootJar --no-daemon -x test

# ==========================================
# Stage 2: Runtime
# ==========================================
FROM eclipse-temurin:17-jre-jammy

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

COPY --from=builder /app/api-server/build/libs/portfolio-portal-api.jar app.jar

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -fs http://localhost:8080/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
