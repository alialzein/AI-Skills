#!/usr/bin/env bash
#
# install.sh — make every skill in this repo available to Claude Code on this machine.
#
# It symlinks each skill under ./skills/<name> into ~/.claude/skills/<name>, so the
# skills stay in sync with the repo (pull the repo, the skills update automatically).
#
# Usage:
#   ./install.sh            # symlink all skills into ~/.claude/skills
#   ./install.sh --copy     # copy instead of symlink (use for ephemeral/CI environments)
#
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$REPO_DIR/skills"
DEST_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
MODE="symlink"

[[ "${1:-}" == "--copy" ]] && MODE="copy"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "No skills/ directory found at $SRC_DIR" >&2
  exit 1
fi

mkdir -p "$DEST_DIR"

for skill_path in "$SRC_DIR"/*/; do
  [[ -d "$skill_path" ]] || continue
  [[ -f "$skill_path/SKILL.md" ]] || { echo "skip (no SKILL.md): $skill_path"; continue; }

  name="$(basename "$skill_path")"
  dest="$DEST_DIR/$name"

  # Remove any existing install so re-runs are idempotent.
  rm -rf "$dest"

  if [[ "$MODE" == "copy" ]]; then
    cp -r "$skill_path" "$dest"
    echo "copied  -> $dest"
  else
    ln -s "$skill_path" "$dest"
    echo "linked  -> $dest"
  fi
done

echo
echo "Done. Installed skills:"
ls -1 "$DEST_DIR"
