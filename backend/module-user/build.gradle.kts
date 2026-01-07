plugins {
    id("io.spring.dependency-management")
}

dependencies {
    // Module Dependencies
    implementation(project(":common"))
    implementation(project(":domain"))
    implementation(project(":security"))

    // Spring Web
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // Spring Data JPA
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")

    // Spring Security (needed for authentication)
    implementation("org.springframework.boot:spring-boot-starter-security")

    // Spring Transaction
    implementation("org.springframework:spring-tx")

    // Email (for future email verification)
    implementation("org.springframework.boot:spring-boot-starter-mail")
}
