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

    // Markdown Parser (for blog content)
    implementation("com.vladsch.flexmark:flexmark-all:0.64.8")
}
