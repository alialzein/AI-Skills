#!/usr/bin/env bash
#
# SessionStart hook: copy this repo's skills into ~/.claude/skills so they are
# available in ephemeral environments (e.g. Claude Code on the web), where
# ~/.claude/skills is wiped between sessions.
#
# Activate by copying ../settings.json.example to ../settings.json.
# Reads SessionStart JSON from stdin (ignored) and prints a JSON result that
# asks Claude Code to re-scan skills once the copy is done.
#
set -euo pipefail

REPO_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

# Idempotent copy install (symlinking the whole ~/.claude/skills dir is unsupported,
# so we copy each skill folder individually).
if [[ -f "$REPO_DIR/install.sh" ]]; then
  bash "$REPO_DIR/install.sh" --copy >/dev/null 2>&1 || true
fi

# Tell Claude Code to reload skills so freshly-installed ones are picked up.
printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","reloadSkills":true}}\n'
