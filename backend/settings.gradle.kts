rootProject.name = "portfolio-portal-backend"

// 모듈 선언
include(
    "common",
    "domain",
    "security",
    "module-blog",
    "module-user",
    "module-registry",
    "api-server"
)
// module-ai, module-benchmark → ai-backend 독립 서비스로 이전
