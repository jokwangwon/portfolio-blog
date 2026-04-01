#!/bin/bash
# PreToolUse Hook: 위험한 Bash 명령 차단
# exit 2 = 차단, exit 0 = 허용

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# rm -rf 방지 (프로젝트 루트에서의 대규모 삭제)
if [[ "$COMMAND" =~ rm[[:space:]]+-rf?[[:space:]]+[./] ]]; then
  echo "Destructive command blocked: $COMMAND" >&2
  echo "Use more targeted deletion or ask user for confirmation." >&2
  exit 2
fi

# git push --force 방지
if [[ "$COMMAND" =~ git[[:space:]]+push[[:space:]]+.*--force ]]; then
  echo "Force push blocked. Use --force-with-lease or ask user." >&2
  exit 2
fi

# git reset --hard 방지
if [[ "$COMMAND" =~ git[[:space:]]+reset[[:space:]]+--hard ]]; then
  echo "Hard reset blocked. Check with user before discarding changes." >&2
  exit 2
fi

exit 0
