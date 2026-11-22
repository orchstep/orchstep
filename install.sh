#!/bin/sh
set -e

# OrchStep Installer
# Usage: curl -fsSL https://orchstep.dev/install.sh | sh

REPO="orchstep/orchstep"
INSTALL_DIR="${ORCHSTEP_INSTALL_DIR:-/usr/local/bin}"

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

# Get latest version (override: ORCHSTEP_VERSION=0.14.0)
VERSION="${ORCHSTEP_VERSION#v}"
if [ -z "$VERSION" ]; then
echo "Fetching latest OrchStep version..."
VERSION=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" 2>/dev/null | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')
fi

if [ -z "$VERSION" ]; then
    echo "Error: Could not determine latest version. Check https://github.com/$REPO/releases"
    exit 1
fi

echo "Installing OrchStep v$VERSION ($OS/$ARCH)..."

# Download
FILENAME="orchstep_${VERSION}_${OS}_${ARCH}.tar.gz"
URL="https://github.com/$REPO/releases/download/v${VERSION}/${FILENAME}"

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

if ! curl -fsSL "$URL" -o "$TMP_DIR/$FILENAME"; then
    echo "Error: Download failed. Check https://github.com/$REPO/releases"
    exit 1
fi

# Verify the archive against the release's published SHA-256 checksums
# (checksums.txt is itself cosign-signed: checksums.txt.sig / .pem).
if ! curl -fsSL "https://github.com/$REPO/releases/download/v${VERSION}/checksums.txt" -o "$TMP_DIR/checksums.txt"; then
    echo "Error: Could not download checksums.txt for v$VERSION; refusing to install an unverified binary."
    exit 1
fi
EXPECTED=$(awk -v f="$FILENAME" '$2 == f { print $1 }' "$TMP_DIR/checksums.txt")
if command -v sha256sum >/dev/null 2>&1; then
    ACTUAL=$(sha256sum "$TMP_DIR/$FILENAME" | awk '{print $1}')
elif command -v shasum >/dev/null 2>&1; then
    ACTUAL=$(shasum -a 256 "$TMP_DIR/$FILENAME" | awk '{print $1}')
else
    echo "Error: Need sha256sum or shasum to verify the download."
    exit 1
fi
if [ -z "$EXPECTED" ] || [ "$EXPECTED" != "$ACTUAL" ]; then
    echo "Error: Checksum mismatch for $FILENAME (expected '${EXPECTED:-<missing>}', got '$ACTUAL'). Aborting."
    exit 1
fi
echo "Checksum verified (sha256 $ACTUAL)."

tar -xzf "$TMP_DIR/$FILENAME" -C "$TMP_DIR"

# Install
mkdir -p "$INSTALL_DIR" 2>/dev/null || true
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
