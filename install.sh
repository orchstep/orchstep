#!/bin/sh
set -e

# OrchStep Installer
# Usage: curl -fsSL https://orchstep.dev/install.sh | sh

REPO="orchstep/orchstep"
INSTALL_DIR="/usr/local/bin"

# Detect OS
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
    x86_64|amd64) ARCH="amd64" ;;
    arm64|aarch64) ARCH="arm64" ;;
    *) echo "Error: Unsupported architecture: $ARCH"; exit 1 ;;
esac

case "$OS" in
    darwin|linux) ;;
    *) echo "Error: Unsupported OS: $OS. Use Windows installer from GitHub Releases."; exit 1 ;;
esac

# Get latest version
echo "Fetching latest OrchStep version..."
VERSION=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" 2>/dev/null | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')

if [ -z "$VERSION" ]; then
    echo "Error: Could not determine latest version. Check https://github.com/$REPO/releases"
    exit 1
fi

echo "Installing OrchStep v$VERSION ($OS/$ARCH)..."

# Download
FILENAME="orchstep_${VERSION}_${OS}_${ARCH}.tar.gz"
URL="https://github.com/$REPO/releases/download/v${VERSION}/${FILENAME}"

TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

if ! curl -fsSL "$URL" -o "$TMP_DIR/$FILENAME"; then
    echo "Error: Download failed. Check https://github.com/$REPO/releases"
    exit 1
fi

tar -xzf "$TMP_DIR/$FILENAME" -C "$TMP_DIR"

# Install
if [ -w "$INSTALL_DIR" ]; then
    cp "$TMP_DIR/orchstep" "$INSTALL_DIR/orchstep"
else
    echo "Installing to $INSTALL_DIR (requires sudo)..."
    sudo cp "$TMP_DIR/orchstep" "$INSTALL_DIR/orchstep"
fi

chmod +x "$INSTALL_DIR/orchstep"

echo ""
echo "OrchStep v$VERSION installed successfully!"
echo "Run 'orchstep version' to verify."
