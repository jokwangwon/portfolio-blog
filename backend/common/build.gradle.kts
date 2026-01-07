plugins {
    id("io.spring.dependency-management")
}

dependencies {
    // Spring Boot Starter (without auto-configuration)
    implementation("org.springframework.boot:spring-boot-starter")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // Jackson
    implementation("com.fasterxml.jackson.core:jackson-databind")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")

    // Utilities
    implementation("org.apache.commons:commons-lang3")
}
