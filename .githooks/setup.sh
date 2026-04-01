#!/usr/bin/env bash
# Git hooks 초기 설정 스크립트
# 프로젝트 클론 후 한 번만 실행: bash .githooks/setup.sh

set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)

echo "=== Harness Setup ==="

# 1. Git hooks 경로 설정
git config core.hooksPath .githooks
echo "[1/2] Git hooks path set to .githooks/"

# 2. hook 파일 실행 권한 부여
chmod +x "$ROOT/.githooks/pre-commit"
echo "[2/2] pre-commit hook made executable"

echo ""
echo "Setup complete. Pre-commit hook is now active."
echo "To verify: git commit --allow-empty -m 'test hook'"
