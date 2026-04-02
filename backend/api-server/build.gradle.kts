plugins {
    id("org.springframework.boot")
    id("io.spring.dependency-management")
    java
}

dependencies {
    // Module Dependencies (All modules)
    implementation(project(":common"))
    implementation(project(":domain"))
    implementation(project(":security"))
    implementation(project(":module-blog"))
    implementation(project(":module-user"))
    implementation(project(":module-registry"))

    // Spring Boot Starters
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-webflux") // AiClient용
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")

    // Database Migration
    implementation("org.flywaydb:flyway-core:9.22.3")

    // API Documentation
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.3.0")

    // Structured JSON Logging
    implementation("net.logstash.logback:logstash-logback-encoder:7.4")

    // Error Tracking (Sentry)
    implementation("io.sentry:sentry-spring-boot-starter-jakarta:6.34.0")
    implementation("io.sentry:sentry-logback:6.34.0")

    // Development Tools
    developmentOnly("org.springframework.boot:spring-boot-devtools")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.testcontainers:testcontainers:1.19.3")
    testImplementation("org.testcontainers:postgresql:1.19.3")
    testImplementation("org.testcontainers:junit-jupiter:1.19.3")
}

tasks.bootRun {
    // .env 파일에서 환경변수 로드 (OAuth2 키 등 민감정보)
    // 우선순위: backend/.env.local > 프로젝트루트/.env
    val candidates = listOf(
        rootProject.file(".env.local"),
        rootProject.file("../.env"),
    )
    val envFile = candidates.firstOrNull { it.exists() }
    if (envFile != null) {
        envFile.readLines()
            .filter { it.isNotBlank() && !it.trimStart().startsWith("#") && it.contains("=") }
            .forEach { line ->
                val (key, rawValue) = line.split("=", limit = 2)
                // 인라인 주석 제거: "value  # comment" → "value"
                val value = rawValue.replace(Regex("\\s+#.*$"), "")
                environment(key.trim(), value.trim())
            }
    }
}

tasks.bootJar {
    enabled = true
    archiveFileName.set("portfolio-portal-api.jar")
}

tasks.jar {
    enabled = false
}

tasks.test {
    useJUnitPlatform()
    testLogging {
        showStandardStreams = true
        events("failed")
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
    }
}
