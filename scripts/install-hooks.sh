#!/usr/bin/env bash
# Installs git hooks for OscarPoolVibes.
# Run from the project root: bash scripts/install-hooks.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

if [ ! -d "$HOOKS_DIR" ]; then
  echo "ERROR: .git/hooks directory not found. Are you in a git repository?"
  exit 1
fi

cp "$SCRIPT_DIR/commit-msg" "$HOOKS_DIR/commit-msg"
chmod +x "$HOOKS_DIR/commit-msg"

echo "Git hooks installed successfully."
echo "  - commit-msg: validates conventional commit format with issue references"
