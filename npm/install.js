#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");

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

    if (ext === "tar.gz") {
      execSync(`tar -xzf "${tmpFile}" -C "${BIN_DIR}"`, { stdio: "inherit" });
    } else {
      execSync(`unzip -o "${tmpFile}" -d "${BIN_DIR}"`, { stdio: "inherit" });
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
