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
    implementation(project(":module-benchmark"))

    // Spring Boot Starters
    implementation("org.springframework.boot:spring-boot-starter-web")
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

    // Development Tools
    developmentOnly("org.springframework.boot:spring-boot-devtools")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.testcontainers:testcontainers:1.19.3")
    testImplementation("org.testcontainers:postgresql:1.19.3")
    testImplementation("org.testcontainers:junit-jupiter:1.19.3")
}

tasks.bootJar {
    enabled = true
    archiveFileName.set("portfolio-portal-api.jar")
}

tasks.jar {
    enabled = false
}
