#!/bin/bash
# Pre-commit hook: enforces quality gates before every commit
# Install: ./scripts/setup-hooks.sh

set -e

echo "Running quality gates..."

echo "-> TypeCheck..."
npm run typecheck --silent
if [ $? -ne 0 ]; then
    echo "FAIL: TypeCheck failed. Fix errors before committing."
    exit 1
fi

echo "-> Tests..."
npm test -- --silent
if [ $? -ne 0 ]; then
    echo "FAIL: Tests failed. Fix failures before committing."
    exit 1
fi

echo "-> Lint..."
npm run lint --silent
if [ $? -ne 0 ]; then
    echo "FAIL: Lint failed. Fix warnings before committing."
    exit 1
fi

echo "OK: All quality gates passed."
