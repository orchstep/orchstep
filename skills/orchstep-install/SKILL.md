---
name: orchstep-install
description: Install, upgrade, verify or uninstall the OrchStep CLI on the user's machine (macOS, Linux, Windows, containers, CI), then connect it to this agent. Use when the user says "install orchstep", "set up orchstep", "upgrade orchstep", "orchstep: command not found", or wants to start using OrchStep and the `orchstep` command is missing.
---

# OrchStep Install

Get a working `orchstep` command on the user's machine with as little effort from
them as possible, then hook it up to this agent. Works in any agent that can run
shell commands (Claude Code, Codex, Cursor, Gemini CLI, Copilot, Kimi Code,
OpenCode and others). "Run" below means your shell-command tool.

## Rules
- **Never use `sudo` or anything that asks for a password.** Agent shells can't
  answer prompts, so the command hangs or fails. Install into a user-writable
  directory instead. If the user explicitly wants a system-wide install, give them
  the command to run in their own terminal.
- **Never disable checksum verification.** Every method below verifies the
  release's SHA-256 checksum. If verification fails, stop and tell the user; don't
  retry with a different, unverified download.
- **Ask before changing shell profiles** (`~/.zshrc`, `~/.bashrc`, PowerShell
  profile). Show the exact line you'd add.
- Keep it short: one method, verify, done. Don't install through several methods.

## Step 1: Check what's there
Run `orchstep version`.
- Prints a version: it's installed. Go to Step 4, or to "Upgrade" if the user asked for that.
- `command not found`: also check `~/.local/bin/orchstep version` (a previous
  install may just be missing from PATH). If that works, skip to Step 3.

## Step 2: Install with the first method that fits
Check in this order and use the first one available (`command -v <tool>`; on
Windows `Get-Command <tool>`):

| Situation | Command | Notes |
|---|---|---|
| macOS or Linux with Homebrew | `brew install orchstep/tap/orchstep` | No sudo. Upgrades with `brew upgrade orchstep` |
| Node.js/npm available (any OS, including Windows) | `npm install -g orchstep` | If it fails with EACCES, the npm prefix needs root: use the next row instead of sudo |
| pipx available | `pipx install orchstep` | Isolated install |
| Python 3 with pip | `python3 -m pip install --user orchstep` (Windows: `py -m pip install --user orchstep`) | If pip refuses with "externally-managed-environment", use the next row |
| macOS or Linux, none of the above | `curl -fsSL https://orchstep.dev/install.sh \| ORCHSTEP_INSTALL_DIR="$HOME/.local/bin" sh` | Verifies the checksum; installs to `~/.local/bin` so no sudo is needed |
| Container image / Docker-only machine | `docker run --rm -v "$PWD:/work" -w /work orchstep/orchstep:latest version` | For a Dockerfile: `COPY --from=orchstep/orchstep:latest /usr/local/bin/orchstep /usr/local/bin/orchstep` |
| CI (GitHub Actions) | `uses: orchstep/setup-orchstep@v1` | Or `orchstep/run-orchstep@v1` to install and run a task in one step |

npm and pip wrappers download the native binary on install (or first run) and
verify it against the release's `checksums.txt`.

## Step 3: Verify and fix PATH
1. Run `orchstep version`. Success looks like `OrchStep 0.x.y`.
2. If it's not found but the install succeeded, the install directory isn't on PATH:
   - curl install: `~/.local/bin`
   - pip `--user`: run `python3 -m site --user-base` and add its `bin` (Windows: `Scripts`)
   - npm: run `npm prefix -g` and add its `bin` (Windows: the prefix itself)

   For this session, call the binary by its full path. For future terminals, offer
   to add `export PATH="$HOME/.local/bin:$PATH"` (or the right directory) to the
   user's shell profile, and ask first.
3. Run a real smoke test in a scratch directory:
   ```bash
   mkdir -p /tmp/orchstep-check && cd /tmp/orchstep-check
   orchstep init        # writes a starter orchstep.yml
   orchstep list-tasks
   orchstep run hello < /dev/null   # use whichever task list-tasks shows
   ```
   If `orchstep init` refuses because a file exists, use a fresh directory.

## Step 4: Connect it to this agent (offer, don't force)
- **Skills:** if this skill was installed with `npx skills add orchstep/orchstep`,
  the other OrchStep skills (workflow design, capture, task runner, MCP
  integration, module creation) are already installed. Otherwise suggest it.
- **MCP server:** the server is built into the binary (`orchstep mcp serve`).
  Configure it for the agent you're running in; the `orchstep-mcp-integration`
  skill has the exact config for Claude Code, Codex, Cursor, Gemini CLI, Kimi
  Code, OpenCode and VS Code/Copilot. Claude Code users can instead run
  `/plugin install orchstep --marketplace orchstep/orchstep`.

## Step 5: Tell the user what they can do next
Keep it to three lines:
- `orchstep` in a project opens the task menu (run it in their own terminal; it
  needs an interactive screen, which agent shells don't have).
- `orchstep serve` opens the local web console.
- Ask you to design a workflow for their project (workflow design skill) or to
  capture a job you just did together (capture skill).

## Upgrade
Upgrade with the same method that installed it (check with `which orchstep` /
`Get-Command orchstep`):
- Homebrew: `brew upgrade orchstep`
- npm: `npm install -g orchstep@latest`
- pipx: `pipx upgrade orchstep`; pip: `python3 -m pip install --user -U orchstep`
- curl: rerun the Step 2 curl command (it installs the latest release)

Then run `orchstep version`. If an older version still shows, there are two
installs: run `which -a orchstep` (Windows: `where.exe orchstep`) and tell the
user which one is first on PATH.

## Uninstall
- Homebrew: `brew uninstall orchstep`
- npm: `npm uninstall -g orchstep`
- pipx: `pipx uninstall orchstep`; pip: `python3 -m pip uninstall orchstep`
- curl: delete the binary (`rm ~/.local/bin/orchstep`)

Workflow files and `.orchstep/` directories in projects belong to the user; don't
delete them unless asked.

## Troubleshooting
| Symptom | Fix |
|---|---|
| `orchstep run` waits forever with no output (versions before 0.15.1) | Upgrade. Workaround: add `< /dev/null` |
| "checksum mismatch" | Stop. Report it; don't bypass. Retry later or try another method |
| Corporate proxy blocks GitHub downloads | npm/pip honour `HTTPS_PROXY`; or download the release archive manually from https://github.com/orchstep/orchstep/releases and verify it with `checksums.txt` |
| Unsupported OS/arch | Releases exist for macOS, Linux and Windows on amd64 and arm64 only |

Docs: https://orchstep.dev/getting-started/installation
