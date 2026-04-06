#!/usr/bin/env bash
# Post-tool event reporter for Pixel Office admin dashboard
# Sends tool usage events to /api/admin/office/events via curl
# Non-blocking: failures are silently ignored (|| true)

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.command // .tool_input.pattern // "unknown"' | head -c 100)

# Only send if dev server is likely running
curl -s --max-time 1 -X POST http://localhost:3000/api/admin/office/events \
  -H "Content-Type: application/json" \
  -d "{\"tool\":\"$TOOL\",\"file\":\"$FILE\",\"timestamp\":\"$(date -Iseconds)\"}" \
  > /dev/null 2>&1 || true
