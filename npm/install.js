#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");

const REPO = "orchstep/orchstep";
const BIN_DIR = path.join(__dirname, "bin");
// Use package.json version — binary version must match
const PKG_VERSION = require("./package.json").version;

function getPlatform() {
  const platform = process.platform;
  const arch = process.arch;

  const osMap = { darwin: "darwin", linux: "linux", win32: "windows" };
  const archMap = { x64: "amd64", arm64: "arm64" };

  const os = osMap[platform];
  const cpu = archMap[arch];

  if (!os || !cpu) {
    console.error(`Unsupported platform: ${platform}/${arch}`);
    process.exit(1);
  }

  return { os, arch: cpu };
}

function getLatestVersion() {
  return new Promise((resolve, reject) => {
    https.get(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      { headers: { "User-Agent": "orchstep-npm" } },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json.tag_name.replace(/^v/, ""));
          } catch (e) {
            reject(new Error("Failed to parse version"));
          }
        });
      }
    ).on("error", reject);
  });
}

// verifyChecksum aborts the install unless the downloaded archive's SHA-256
// matches the entry in the release's checksums.txt. HTTPS protects transit, but
// this also catches a corrupted download or a tampered release asset.
function verifyChecksum(file, filename, version) {
  const url = `https://github.com/${REPO}/releases/download/v${version}/checksums.txt`;
  let sums;
  try {
    sums = execSync(`curl -fsSL "${url}"`).toString();
  } catch (e) {
    throw new Error(`could not fetch checksums.txt for verification: ${e.message}`);
  }
  const entry = sums
    .split("\n")
    .map((l) => l.trim().split(/\s+/))
    .find((p) => p.length === 2 && p[1] === filename);
  if (!entry) {
    throw new Error(`no checksum listed for ${filename}`);
  }
  const want = entry[0].toLowerCase();
  const got = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  if (got !== want) {
    throw new Error(`checksum mismatch for ${filename}: expected ${want}, got ${got}`);
  }
  console.log("Checksum verified.");
}

async function install() {
  const { os, arch } = getPlatform();

  // Use package version, not latest — ensures binary matches package
  const version = PKG_VERSION;

  const ext = os === "windows" ? "zip" : "tar.gz";
  const filename = `orchstep_${version}_${os}_${arch}.${ext}`;
  const url = `https://github.com/${REPO}/releases/download/v${version}/${filename}`;

  console.log(`Installing OrchStep v${version} (${os}/${arch})...`);

  // Create bin directory
  fs.mkdirSync(BIN_DIR, { recursive: true });

  // Download and extract
  const tmpFile = path.join(BIN_DIR, filename);

  try {
    execSync(`curl -fsSL "${url}" -o "${tmpFile}"`, { stdio: "inherit" });

    verifyChecksum(tmpFile, filename, version);

    if (ext === "tar.gz") {
      execSync(`tar -xzf "${tmpFile}" -C "${BIN_DIR}"`, { stdio: "inherit" });
    } else {
      // Windows .zip: extract with `tar` (bsdtar ships with Windows 10 1803+ and
      // handles zip) rather than `unzip`, which is not present on a stock Windows.
      execSync(`tar -xf "${tmpFile}" -C "${BIN_DIR}"`, { stdio: "inherit" });
    }

    // Cleanup archive
    fs.unlinkSync(tmpFile);

    // Make executable
    const binPath = path.join(BIN_DIR, os === "windows" ? "orchstep.exe" : "orchstep");
    if (os !== "windows") {
      fs.chmodSync(binPath, 0o755);
    }

    console.log(`OrchStep v${version} installed successfully.`);
  } catch (e) {
    console.error("Installation failed:", e.message);
    console.error(`Download manually from: https://github.com/${REPO}/releases`);
    process.exit(1);
  }
}

install();
