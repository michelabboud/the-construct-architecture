#!/bin/bash
# Bootstrap The Construct's autonomous orchestration system into any project
# Usage: ./scripts/bootstrap-orchestration.sh /path/to/project "Project Name"

set -e

TARGET_DIR="${1:-.}"
PROJECT_NAME="${2:-$(basename "$(cd "$TARGET_DIR" && pwd)")}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/../templates/orchestration"

echo "Bootstrapping orchestration for: $PROJECT_NAME"
echo "Target: $(cd "$TARGET_DIR" && pwd)"
echo ""

# Verify template directory exists
if [ ! -d "$TEMPLATE_DIR" ]; then
    echo "ERROR: Template directory not found at $TEMPLATE_DIR"
    echo "Make sure you're running this from the-construct-architecture repo."
    exit 1
fi

# Create directories
mkdir -p "$TARGET_DIR/.claude/commands"

# Process STATE.md template
sed -e "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
    -e "s/{{TIMESTAMP}}/$TIMESTAMP/g" \
    "$TEMPLATE_DIR/STATE.md.template" > "$TARGET_DIR/STATE.md"
echo "  Created STATE.md"

# Process JOBS.md template
sed -e "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
    -e "s/{{TIMESTAMP}}/$TIMESTAMP/g" \
    "$TEMPLATE_DIR/JOBS.md.template" > "$TARGET_DIR/JOBS.md"
echo "  Created JOBS.md"

# Copy commands
for cmd in status.md run-autonomous.md add-job.md recover.md checkpoint.md; do
    if [ -f "$TEMPLATE_DIR/commands/$cmd" ]; then
        cp "$TEMPLATE_DIR/commands/$cmd" "$TARGET_DIR/.claude/commands/$cmd"
        echo "  Created .claude/commands/$cmd"
    fi
done

# Handle CLAUDE.md
if [ -f "$TARGET_DIR/CLAUDE.md" ]; then
    echo "" >> "$TARGET_DIR/CLAUDE.md"
    sed "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
        "$TEMPLATE_DIR/CLAUDE.md.template" >> "$TARGET_DIR/CLAUDE.md"
    echo "  Appended autonomous protocol to existing CLAUDE.md"
else
    sed "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
        "$TEMPLATE_DIR/CLAUDE.md.template" > "$TARGET_DIR/CLAUDE.md"
    echo "  Created CLAUDE.md"
fi

echo ""
echo "Done! Orchestration bootstrapped for $PROJECT_NAME."
echo ""
echo "Files created:"
echo "  STATE.md          - Live session state (survives context compaction)"
echo "  JOBS.md           - Task backlog and tracking"
echo "  CLAUDE.md         - Autonomous session protocol"
echo "  .claude/commands/ - Slash commands (status, run-autonomous, add-job, recover, checkpoint)"
echo ""
echo "Next steps:"
echo "  1. Add initial jobs to JOBS.md NEXT_UP section"
echo "  2. Open Claude Code in the project directory"
echo "  3. Run /project:run-autonomous to start working"
