-- ==========================================
-- V3: service_registry + service_cache 테이블 생성
-- 독립 서비스 등록 및 상태 캐싱 (ADR-006)
-- ==========================================

-- 서비스 등록 정보
CREATE TABLE service_registry (
    id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    base_url VARCHAR(500) NOT NULL,
    health_path VARCHAR(200) NOT NULL DEFAULT '/health',
    summary_path VARCHAR(200) NOT NULL DEFAULT '/api/summary',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE service_registry IS '독립 서비스 등록 정보 (Service Contract)';

-- 서비스 상태 캐시 (마지막 조회 결과)
CREATE TABLE service_cache (
    id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL REFERENCES service_registry(service_name),
    status VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
    summary_data JSONB,
    last_checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    response_time_ms INTEGER,
    error_message TEXT,
    consecutive_failures INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE service_cache IS '서비스 상태 캐시 (폴링 결과 저장)';
COMMENT ON COLUMN service_cache.status IS 'UP, DOWN, DEGRADED, UNKNOWN';
COMMENT ON COLUMN service_cache.consecutive_failures IS '연속 실패 횟수 (3회 시 is_active=false)';

CREATE INDEX idx_service_cache_name ON service_cache(service_name, last_checked_at DESC);

-- service_registry updated_at 트리거
CREATE TRIGGER update_service_registry_updated_at
    BEFORE UPDATE ON service_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
