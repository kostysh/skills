#!/bin/bash
# Validate TypeScript development environment
# Run: bash scripts/validate-setup.sh

set -e

echo "=== TypeScript Environment Validation ==="
echo

# Check Node.js
echo -n "Node.js: "
if command -v node &> /dev/null; then
    node --version
else
    echo "NOT FOUND (required)"
    exit 1
fi

# Check pnpm
echo -n "pnpm: "
if command -v pnpm &> /dev/null; then
    pnpm --version
else
    echo "NOT FOUND (recommended: npm install -g pnpm)"
fi

# Check TypeScript
echo -n "TypeScript: "
if command -v tsc &> /dev/null; then
    tsc --version
elif [ -f "node_modules/.bin/tsc" ]; then
    ./node_modules/.bin/tsc --version
else
    echo "NOT FOUND (install: pnpm add -D typescript)"
fi

# Check Biome
echo -n "Biome: "
if command -v biome &> /dev/null; then
    biome --version
elif [ -f "node_modules/.bin/biome" ]; then
    ./node_modules/.bin/biome --version
else
    echo "NOT FOUND (install: pnpm add -D @biomejs/biome)"
fi

# Check ESLint (optional)
echo -n "ESLint: "
if command -v eslint &> /dev/null; then
    eslint --version
elif [ -f "node_modules/.bin/eslint" ]; then
    ./node_modules/.bin/eslint --version
else
    echo "NOT INSTALLED (optional - for type-aware rules)"
fi

echo
echo "=== Configuration Files ==="

# Check tsconfig.json
echo -n "tsconfig.json: "
if [ -f "tsconfig.json" ]; then
    echo "FOUND"
else
    echo "NOT FOUND"
fi

# Check biome.json
echo -n "biome.json: "
if [ -f "biome.json" ]; then
    echo "FOUND"
else
    echo "NOT FOUND (run: pnpm biome init)"
fi

# Check package.json
echo -n "package.json: "
if [ -f "package.json" ]; then
    echo "FOUND"

    # Check for type: module
    if grep -q '"type": "module"' package.json; then
        echo "  - ESM mode: enabled"
    else
        echo "  - ESM mode: NOT enabled (add \"type\": \"module\")"
    fi
else
    echo "NOT FOUND"
fi

echo
echo "=== Validation Complete ==="
