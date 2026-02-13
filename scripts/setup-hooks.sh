#!/bin/bash
# Install git hooks for The Construct
# Run once after cloning: ./scripts/setup-hooks.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
HOOKS_DIR="$REPO_DIR/.git/hooks"

echo "Installing git hooks..."

cp "$SCRIPT_DIR/pre-commit.sh" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"

echo "Git hooks installed:"
echo "  - pre-commit: typecheck + tests + lint"
echo ""
echo "To bypass in emergencies: git commit --no-verify"
