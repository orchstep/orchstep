# Changelog

All notable changes to OrchStep are documented here. This is the canonical
changelog: it is shown on each [GitHub release](https://github.com/orchstep/orchstep/releases)
and on the docs site at [orchstep.dev/changelog](https://orchstep.dev/changelog).

The format is based on [Keep a Changelog](https://keepachangelog.com/), and
OrchStep follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.15.2] - 2026-11-23

### Changed
- **npm package now published with trusted publishing (OIDC).** Releases on npm
  carry a provenance attestation linking each version to the GitHub Actions run
  that built it, and no long-lived npm token is used. No change to the CLI.

## [0.15.1] - 2026-11-23

Works with any AI agent. Tested end to end (skills, MCP tools and CLI runs) in
Claude Code, Kimi Code CLI and OpenCode, with Kimi, DeepSeek and Claude models.

### Added
- **Skills install into ~80 agents with one command:** `npx skills add orchstep/orchstep`
  (Codex, Cursor, GitHub Copilot, Gemini CLI, Kimi Code, OpenCode, Cline, Windsurf, ...),
  or copy them into the shared `.agents/skills/` directory. The capture skill no longer
  assumes Claude Code. MCP setup is documented for Codex, Kimi Code, OpenCode, Cursor,
  Gemini CLI, VS Code/Copilot and Claude.
- `orchstep run --stdin` / `--no-stdin` and `ORCHSTEP_NO_STDIN=1`.
- Docs: [migrating from Jenkins, GoCD and other CI servers](https://orchstep.dev/migrating/from-ci-servers).

### Fixed
- **`orchstep run` no longer hangs inside AI agents and some CI runners.** Agent
  shells (Claude Code, Codex, Kimi Code, OpenCode and others) start commands with
  stdin attached to a pipe that never closes, and `run` waited for it to end. Stdin
  is now read only when the workflow uses `{{ stdin }}` or `--stdin-var` is set; a
  read that is still waiting after 3 seconds prints a hint. New flags: `--stdin`
  (always read) and `--no-stdin` (never read; also `ORCHSTEP_NO_STDIN=1`).
- **MCP `orchstep_list_tasks` with a `file` argument failed** with "unknown flag:
  --file". It now passes the file correctly. `orchstep_lint` and
  `orchstep_module_search` no longer treat a value starting with `-` as a flag.

## [0.15.0] - 2026-11-22

### Security
- **`orchstep serve` hardened against malicious web pages — upgrade recommended.**
  On v0.14.0 and earlier, a web page open in your browser while `orchstep serve`
  was running could send requests to the dashboard: start tasks with chosen
  variables (cross-site request forgery) and, via DNS rebinding, read files the
  dashboard can display. The dashboard now validates the `Host` header on loopback
  binds, rejects cross-site requests (`Origin` / `Sec-Fetch-Site`), and requires
  `Content-Type: application/json` on state-changing requests. The CLI, `curl` and
  scripts are unaffected. See the [security advisory](https://github.com/orchstep/orchstep/security/advisories).
- **`serve --host <non-loopback>` now requires `--token`**, so the dashboard can no
  longer be exposed to a network without authentication. Token comparison is
  constant-time and `Authorization` must use the `Bearer` scheme.
- **Dependency and toolchain updates** clearing every reachable known
  vulnerability (`govulncheck`: 0), including go-git 5.19.3 (path traversal via
  crafted refs, symlink-following worktree operations, credential leak on
  cross-host redirect — all on the remote-module fetch path), x/crypto 0.59,
  x/net 0.63, x/text 0.44, go-billy 5.9.2 and Go 1.26.11.
- **Installer verifies checksums.** `install.sh` checks the archive against the
  release's `checksums.txt` (SHA-256) and aborts on a mismatch. New
  `ORCHSTEP_INSTALL_DIR` and `ORCHSTEP_VERSION` overrides.

### Added
- **`shellquote` template function** (alias `shq`): renders a value as a single,
  inert POSIX shell word — `do: git checkout {{ vars.branch | shellquote }}`.
  Use it for any value you don't fully control (`--var`, MCP arguments, HTTP
  outputs). Available in step commands, outputs and assert conditions.
- **MCP `orchstep_plan` tool**: a read-only dry-run returning the JSON plan
  (rendered commands, condition verdicts, variable provenance) so an agent can
  show what will execute before calling `orchstep_run`.
- **MCP `orchstep_run` returns the structured JSON run result** and accepts an
  `environment` argument (`--env`).
- **MCP tool annotations** (`readOnlyHint`, `destructiveHint`, …) on every tool,
  protocol-version negotiation (2024-11-05 through 2025-11-25), and the real
  build version in `serverInfo`.
- **Claude Code plugin.** This repo is a Claude Code marketplace:
  `/plugin install orchstep --marketplace orchstep/orchstep` installs the five
  public skills plus the MCP server in one step.
- **License terms published.** The engine binary is free for individual and
  commercial use under the one-page [OrchStep Binary License](EULA.md), now shipped
  inside every release archive.

### Changed
- Pro-only commands (`team`, `audit`, `governance`, `inspect`, `report`, private
  registry `module` subcommands) are hidden from `--help` unless licensed. They
  still run and explain what they need.
- MCP tool calls reject task names, environments and var keys that would be
  parsed as CLI flags.

### Fixed
- Docs and the task-runner skill used `orchstep run --format json`; the flag is
  `--output json` (and `--json` for `validate`).
- MCP docs and the mcp-integration skill now describe the real tools.

## [0.14.0] - 2026-06-27

### Added
- **Scoped environment.** Environment variables now scope like application vars: a
  called task's own `env:`/`dotenv:` are its defaults, the calling step's `env:`
  overrides them, and they **unwind when the task returns** — so a callee's
  environment no longer leaks into the caller's later steps or sibling tasks
  (batteries-included + inversion-of-control, no global leakage).
- **Project dotenv in `orchstep_config.yml`.** Declare a `dotenv:` list in the
  project config; it's applied after `--env` (so `deploy_{{ vars.environment }}.env`
  resolves; `?` = optional). This is the externalized, declared home for dotenv —
  OrchStep no longer auto-loads a stray `.env`/`.envrc` from the current directory
  (loading is always from a committed file, a trust boundary).
- **Module instances — `instance_profile` + `isolate`.** A called module can now run
  as a self-contained, configured instance instead of only as a caller-driven
  library. `instance_profile: <name>` loads the module's OWN bundled context — its
  `environments/<name>` vars, its `dotenv:`, and its `env:`, resolved relative to the
  module (`"@caller"` follows the caller's active environment name). `isolate: true`
  runs it clean-room, excluding the caller's context and overrides. The two combine
  into four modes — Inherited (default, unchanged), Configured, Sealed, Pinned. The
  module's bundled context is scoped: it unwinds on return, so two instances of one
  module in a single run stay independent. (This also closes a gap: a module's own
  `dotenv:`/`env:` are now loaded for the first time.)


- **Ad-hoc runner (`orchstep do`).** Run any shell command or script with your
  OrchStep context — `{{ vars.X }}` / `{{ env.X }}` resolved from `defaults`,
  environment groups/environments (`--env`), `dotenv`, and `--var`/`--vars-file` —
  without writing a task. Bare passthrough output, real exit code. Four input
  modes: inline (`orchstep do 'echo {{ vars.version }}'`), stdin/pipe, a script
  file (`--script`, usable as a shebang `#!/usr/bin/env -S orchstep do --script`),
  and an interactive **stateful** REPL. `--render` previews the rendered command
  without running it. With **no `orchstep.yml` at all**, it discovers a
  conventional `environments/` directory (rich per-environment application vars,
  including whole objects, layered by group) and `.env`/`.envrc`, and injects both
  into any command — "dotenv++ for applications" (**OrchShell**). The repeatable
  `--dotenv` flag loads dotenv files *after* `--env`, so a templated profile path
  like `deploy_{{ vars.environment }}.env` resolves (with `?` for optional files).
- **Working directory (`dir:`).** Set the working directory for a task or step's
  shell commands. Valid at workflow, task, and step level, with precedence
  step > task > workflow > the workflow directory. Relative paths resolve against
  the workflow file's directory (so workflows are location-independent); absolute
  paths are used as-is and `~` is expanded. Great for monorepos:
  ```yaml
  tasks:
    test:
      dir: backend          # every step runs in ./backend
      steps:
        - { name: unit, func: shell, do: go test ./... }
  ```

### Fixed
- Workflow descriptions in the banner and task menu now preserve their original
  line breaks, blank lines, and indentation instead of being reflowed into one
  paragraph.
- Friendlier, actionable load/run errors:
  - Missing `<required>` environment variables now explain what is required, how
    to provide it (shell `export` or a `dotenv:` file), and link the docs.
  - `task not found` now suggests `orchstep list-tasks`.
  - `workflow file not found` now suggests `orchstep init` or `--file`.
  - `dotenv file not found` now explains the optional `?` suffix and links the docs.
  - `required.orchstep` version mismatch and `module not found` now link the docs.

## [0.13.0] - 2026-06-26

### Added
- **Update check.** OrchStep now checks for newer versions and security
  advisories. After a successful command (at most once every 48 hours), it makes
  one best-effort, fail-silent request and prints an upgrade or security notice
  with the install link; it is silent when you are up to date.
- Privacy by design: the check sends only the version, OS/arch, and a CI flag —
  no identifiers, no IP stored, no workflow content. Disable it entirely with
  `ORCHSTEP_NO_UPDATE_CHECK=1` (the `DO_NOT_TRACK` convention is also honored).
  See [Telemetry & Privacy](https://orchstep.dev/getting-started/telemetry).

## [0.12.0] - 2026-06-24

### Added
- **Saved run aliases.** `orchstep run <alias>` resolves a saved alias to a task
  plus its run options; manage them with the `alias` subcommand. (This release
  also fixed the alias feature so it ships in the released binary.)

## [0.11.0] - 2026-06-24

### Added
- **Web dashboard (`orchstep serve`).** A local web UI to launch runs, watch live
  execution and the flow graph, drill into per-step context, and browse history.

## [0.10.0] - 2026-06-17

### Added
- Signed releases: each release now ships a keyless cosign signature and an SPDX
  SBOM per archive.
- Declarative environment management: `env:` / `dotenv:`, the `<required>`
  sentinel, and secret masking via `config.env_policy`.

---

Older history is available in the
[GitHub releases](https://github.com/orchstep/orchstep/releases).

[0.14.0]: https://github.com/orchstep/orchstep/releases/tag/v0.14.0
[0.13.0]: https://github.com/orchstep/orchstep/releases/tag/v0.13.0
[0.12.0]: https://github.com/orchstep/orchstep/releases/tag/v0.12.0
[0.11.0]: https://github.com/orchstep/orchstep/releases/tag/v0.11.0
[0.10.0]: https://github.com/orchstep/orchstep/releases/tag/v0.10.0
