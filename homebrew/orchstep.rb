# This formula is auto-updated by GoReleaser on each release.
# Manual edits will be overwritten.

class Orchstep < Formula
  desc "YAML-first workflow orchestration engine"
  homepage "https://orchstep.dev"
  version "0.0.0"  # Updated by GoReleaser
  license :cannot_represent  # Proprietary

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/orchstep/orchstep/releases/download/v#{version}/orchstep_#{version}_darwin_arm64.tar.gz"
      sha256 "PLACEHOLDER"  # Updated by GoReleaser
    else
      url "https://github.com/orchstep/orchstep/releases/download/v#{version}/orchstep_#{version}_darwin_amd64.tar.gz"
      sha256 "PLACEHOLDER"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/orchstep/orchstep/releases/download/v#{version}/orchstep_#{version}_linux_arm64.tar.gz"
      sha256 "PLACEHOLDER"
    else
      url "https://github.com/orchstep/orchstep/releases/download/v#{version}/orchstep_#{version}_linux_amd64.tar.gz"
      sha256 "PLACEHOLDER"
    end
  end

  def install
    bin.install "orchstep"
  end

  test do
    system "#{bin}/orchstep", "version"
  end
end
