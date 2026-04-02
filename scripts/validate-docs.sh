#!/usr/bin/env bash
# 문서 상호 참조 검증 스크립트
# 사용법: bash scripts/validate-docs.sh
# 종료 코드: 0 = 모든 참조 유효, 1 = 깨진 참조 발견
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
ERRORS=0
WARNINGS=0
CHECKED=0

echo "=== Documentation Cross-Reference Validation ==="
echo "Root: $ROOT"
echo ""

# 1. docs/ 내 모든 마크다운 파일의 상대 경로 참조 검증
echo "[1/3] Checking docs/ cross-references..."
while IFS= read -r file; do
  DIR=$(dirname "$file")
  while IFS= read -r ref; do
    # 절대 URL 건너뛰기
    [[ "$ref" == http* ]] && continue
    [[ "$ref" == mailto* ]] && continue

    # 상대 경로 해결
    TARGET=$(cd "$DIR" && python3 -c "import os; print(os.path.realpath('$ref'))" 2>/dev/null || echo "$DIR/$ref")

    CHECKED=$((CHECKED + 1))
    if [ ! -f "$TARGET" ]; then
      echo "  BROKEN: $file"
      echo "    -> $ref (resolved: $TARGET)"
      ERRORS=$((ERRORS + 1))
    fi
  done < <(grep -oE '\[[^]]*\]\([^)#[:space:]]+\.md' "$file" 2>/dev/null | sed 's/.*](//' | sed 's/)$//' || true)
done < <(find "$ROOT/docs" -name '*.md' -type f 2>/dev/null)

# 2. CLAUDE.md 내 백틱 경로 참조 검증
echo "[2/3] Checking CLAUDE.md path references..."
if [ -f "$ROOT/CLAUDE.md" ]; then
  while IFS= read -r ref; do
    [[ "$ref" == http* ]] && continue
    # Skip glob patterns and templates (e.g., SESSION_*.md, SESSION_{날짜}.md)
    [[ "$ref" == *'*'* || "$ref" == *'{'* ]] && continue
    CHECKED=$((CHECKED + 1))
    if [ ! -f "$ROOT/$ref" ]; then
      echo "  BROKEN in CLAUDE.md: $ref"
      ERRORS=$((ERRORS + 1))
    fi
  done < <(grep -oE '`[^`]*\.md`' "$ROOT/CLAUDE.md" 2>/dev/null | sed 's/^`//;s/`$//' || true)
fi

# 3. INDEX.md 참조 검증
echo "[3/3] Checking INDEX.md references..."
if [ -f "$ROOT/docs/INDEX.md" ]; then
  while IFS= read -r ref; do
    [[ "$ref" == http* ]] && continue
    TARGET="$ROOT/docs/$ref"
    CHECKED=$((CHECKED + 1))
    if [ ! -f "$TARGET" ]; then
      echo "  BROKEN in INDEX.md: $ref (resolved: $TARGET)"
      ERRORS=$((ERRORS + 1))
    fi
  done < <(grep -oE '\[[^]]*\]\([^)#[:space:]]+\.md' "$ROOT/docs/INDEX.md" 2>/dev/null | sed 's/.*](//' | sed 's/)$//' || true)
fi

# 결과 요약
echo ""
echo "=== Results ==="
echo "References checked: $CHECKED"
echo "Broken references:  $ERRORS"
echo "Warnings:           $WARNINGS"

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "FAILED: $ERRORS broken reference(s) found."
  exit 1
fi

echo ""
echo "PASSED: All documentation cross-references are valid."
exit 0
