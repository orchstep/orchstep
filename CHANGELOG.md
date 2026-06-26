# Changelog

All notable changes to OrchStep are documented here. This is the canonical
changelog: it is shown on each [GitHub release](https://github.com/orchstep/orchstep/releases)
and on the docs site at [orchstep.dev/changelog](https://orchstep.dev/changelog).

The format is based on [Keep a Changelog](https://keepachangelog.com/), and
OrchStep follows [Semantic Versioning](https://semver.org/).

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
