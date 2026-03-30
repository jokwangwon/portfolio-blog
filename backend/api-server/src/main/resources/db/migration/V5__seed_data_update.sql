-- ==========================================
-- V5: Seed Data 업데이트
-- SDD 명세 기준 카테고리 6개, 태그 10개로 확장
-- AI Benchmark 서비스 등록
-- ==========================================

-- 추가 카테고리 (기존 4개 + 2개 추가)
INSERT INTO categories (name, slug, description) VALUES
  ('DevOps', 'devops', 'CI/CD, 인프라 관련'),
  ('AI & ML', 'ai-ml', 'AI/머신러닝 관련')
ON CONFLICT (name) DO NOTHING;

-- 기존 카테고리 slug/description 업데이트 (SDD 명세 기준)
UPDATE categories SET description = '기술 관련 글' WHERE slug = 'technology';
UPDATE categories SET description = '알고리즘 학습 노트' WHERE slug = 'algorithm';
UPDATE categories SET slug = 'projects', description = '프로젝트 소개' WHERE slug = 'project';
UPDATE categories SET slug = 'gb10-lab', name = 'GB10 Lab', description = 'Dell GB10 경험' WHERE slug = 'troubleshooting';

-- 추가 태그 (기존 7개 + 3개 추가, 일부 리네이밍)
INSERT INTO tags (name, slug) VALUES
  ('Java', 'java'),
  ('Spring', 'spring'),
  ('Next.js', 'nextjs'),
  ('Docker', 'docker'),
  ('PostgreSQL', 'postgresql'),
  ('Rust', 'rust')
ON CONFLICT (name) DO NOTHING;

-- 기존 태그 중 SDD 명세에 맞지 않는 것 리네이밍
UPDATE tags SET name = 'FastAPI', slug = 'fastapi' WHERE slug = 'fastapi';

-- AI Benchmark 서비스 등록 (Service Registry)
INSERT INTO service_registry (service_name, display_name, base_url, health_path, summary_path, is_active)
VALUES ('ai-benchmark', 'AI 모델 벤치마크', 'http://ai-api-server:8000',
        '/health', '/api/summary', true)
ON CONFLICT (service_name) DO NOTHING;
