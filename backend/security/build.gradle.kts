plugins {
    id("io.spring.dependency-management")
}

dependencies {
    // Module Dependencies
    implementation(project(":common"))
    implementation(project(":domain"))

    // Spring Security
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-web")

    // JWT
    val jjwtVersion: String by rootProject.extra
    implementation("io.jsonwebtoken:jjwt-api:$jjwtVersion")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:$jjwtVersion")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:$jjwtVersion")

    // OAuth2 Client (for social login)
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")

    // Test
    testImplementation("org.springframework.security:spring-security-test")
}
