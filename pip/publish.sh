#!/bin/bash
set -e
# Publish orchstep pip package
# Requires: pip install twine, PyPI API token
# Usage: ./publish.sh

echo "Building..."
python3 -m build --sdist --wheel

echo "Publishing to PyPI..."
python3 -m twine upload dist/*

echo "Published! Verify: pip install orchstep"
