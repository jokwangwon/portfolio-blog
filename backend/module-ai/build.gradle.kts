plugins {
    id("io.spring.dependency-management")
}

dependencies {
    // Module Dependencies
    implementation(project(":common"))
    implementation(project(":domain"))

    // Spring Web + WebFlux + Validation + Security
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-webflux") // for WebClient
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-security")

    // Caffeine Cache
    implementation("com.github.ben-manes.caffeine:caffeine")

    // LangChain4j
    implementation("dev.langchain4j:langchain4j:0.36.2")
    implementation("dev.langchain4j:langchain4j-google-ai-gemini:0.36.2")
    implementation("dev.langchain4j:langchain4j-ollama:0.36.2")

    // Langfuse (Phase 2: OpenTelemetry 기반 통합 예정)
    // implementation("com.langfuse:langfuse-java:0.2.0")

    // Test
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("io.projectreactor:reactor-test")
}
