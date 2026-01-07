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

    // Email (for future email verification)
    implementation("org.springframework.boot:spring-boot-starter-mail")
}
