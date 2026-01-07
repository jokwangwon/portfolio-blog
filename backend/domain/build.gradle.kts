plugins {
    id("io.spring.dependency-management")
}

dependencies {
    // Module Dependencies
    implementation(project(":common"))

    // Spring Data JPA
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")

    // PostgreSQL Driver
    runtimeOnly("org.postgresql:postgresql")

    // QueryDSL
    val querydslVersion: String by rootProject.extra
    implementation("com.querydsl:querydsl-jpa:$querydslVersion:jakarta")
    annotationProcessor("com.querydsl:querydsl-apt:$querydslVersion:jakarta")
    annotationProcessor("jakarta.annotation:jakarta.annotation-api")
    annotationProcessor("jakarta.persistence:jakarta.persistence-api")

    // Hibernate Types (for JSON support)
    implementation("io.hypersistence:hypersistence-utils-hibernate-60:3.7.0")
}
