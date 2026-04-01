#!/bin/bash
# PostToolUse Hook: Edit/Write 후 자동 lint 실행
# 실패 시 피드백만 제공 (exit 0), 차단하지 않음

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# file_path가 없으면 무시
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

PROJECT_DIR=$(cd "$(dirname "$0")/../.." && pwd)

# Java 파일: gradle checkstyleMain (설정 있을 경우만)
if [[ "$FILE_PATH" == *.java ]]; then
  if [ -f "$PROJECT_DIR/backend/gradlew" ]; then
    cd "$PROJECT_DIR/backend"
    ./gradlew compileJava --quiet 2>&1 | tail -5
  fi
  exit 0
fi

# TypeScript/TSX 파일: eslint
if [[ "$FILE_PATH" == *.ts || "$FILE_PATH" == *.tsx ]]; then
  if [ -f "$PROJECT_DIR/frontend/package.json" ] && [ -d "$PROJECT_DIR/frontend/node_modules" ]; then
    cd "$PROJECT_DIR/frontend"
    npx eslint --no-warn-ignored "$FILE_PATH" 2>&1 | tail -10
  fi
  exit 0
fi

# Markdown 파일: 문서 참조 검증 (빠른 단일 파일 체크)
if [[ "$FILE_PATH" == *.md ]]; then
  DIR=$(dirname "$FILE_PATH")
  ERRORS=0
  while IFS= read -r ref; do
    [[ "$ref" == http* ]] && continue
    TARGET="$DIR/$ref"
    if [ ! -f "$TARGET" ]; then
      echo "BROKEN REF: $FILE_PATH -> $ref" >&2
      ERRORS=$((ERRORS + 1))
    fi
  done < <(grep -oP '\[.*?\]\(\K[^)#]+\.md' "$FILE_PATH" 2>/dev/null || true)
  if [ $ERRORS -gt 0 ]; then
    echo "$ERRORS broken reference(s) found in $FILE_PATH" >&2
  fi
  exit 0
fi

exit 0
