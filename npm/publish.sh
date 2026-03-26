#!/bin/bash
set -e
# Publish orchstep npm package
# Requires: npm login (one-time)
# Usage: ./publish.sh

VERSION=$(node -e "console.log(require('./package.json').version)")
echo "Publishing orchstep@$VERSION to npm..."

npm publish --access public

echo "Published! Verify: npm info orchstep"
