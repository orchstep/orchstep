"""OrchStep CLI wrapper — downloads and runs the platform binary."""

import os
import platform
import subprocess
import sys
import tarfile
import tempfile
import urllib.request
import json

REPO = "orchstep/orchstep"
BIN_NAME = "orchstep"


def get_bin_path():
    """Get the path to the installed binary."""
    bin_dir = os.path.join(os.path.dirname(__file__), "bin")
    name = BIN_NAME + (".exe" if platform.system() == "Windows" else "")
    return os.path.join(bin_dir, name)


def get_platform():
    """Detect OS and architecture."""
    os_map = {"Darwin": "darwin", "Linux": "linux", "Windows": "windows"}
    arch_map = {"x86_64": "amd64", "AMD64": "amd64", "arm64": "arm64", "aarch64": "arm64"}

    os_name = os_map.get(platform.system())
    arch_name = arch_map.get(platform.machine())

    if not os_name or not arch_name:
        print(f"Unsupported platform: {platform.system()}/{platform.machine()}", file=sys.stderr)
        sys.exit(1)

    return os_name, arch_name


def get_latest_version():
    """Fetch the latest release version from GitHub."""
    url = f"https://api.github.com/repos/{REPO}/releases/latest"
    req = urllib.request.Request(url, headers={"User-Agent": "orchstep-pip"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        return data["tag_name"].lstrip("v")


def install_binary():
    """Download and install the binary for this platform."""
    os_name, arch_name = get_platform()
    version = get_latest_version()

    ext = "zip" if os_name == "windows" else "tar.gz"
    filename = f"orchstep_{version}_{os_name}_{arch_name}.{ext}"
    url = f"https://github.com/{REPO}/releases/download/v{version}/{filename}"

    print(f"Installing OrchStep v{version} ({os_name}/{arch_name})...")

    bin_dir = os.path.join(os.path.dirname(__file__), "bin")
    os.makedirs(bin_dir, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        archive_path = os.path.join(tmp, filename)
        urllib.request.urlretrieve(url, archive_path)

        if ext == "tar.gz":
            with tarfile.open(archive_path, "r:gz") as tar:
                tar.extractall(path=bin_dir)
        else:
            import zipfile
            with zipfile.ZipFile(archive_path, "r") as z:
                z.extractall(bin_dir)

    bin_path = get_bin_path()
    if os_name != "windows":
        os.chmod(bin_path, 0o755)

    print(f"OrchStep v{version} installed.")


def main():
    """Run the orchstep binary, installing if needed."""
    bin_path = get_bin_path()

    if not os.path.exists(bin_path):
        install_binary()

    result = subprocess.run([bin_path] + sys.argv[1:])
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
