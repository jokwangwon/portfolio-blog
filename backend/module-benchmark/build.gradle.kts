plugins {
    id("io.spring.dependency-management")
}

dependencies {
    // Module Dependencies
    implementation(project(":common"))
    implementation(project(":domain"))

    // Spring Web
    implementation("org.springframework.boot:spring-boot-starter-web")
}
