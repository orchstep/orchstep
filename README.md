# OrchStep

![Tests](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Forchstep%2Forchstep%2Fmain%2Ftest-results.json)
![Release](https://img.shields.io/github/v/release/orchstep/orchstep)
![License](https://img.shields.io/badge/license-Apache%202.0-blue)

**YAML-first workflow orchestration engine.** Run anywhere, no vendor lock-in.

OrchStep orchestrates multi-step workflows defined in YAML. It delegates to your existing tools (terraform, kubectl, aws, docker) rather than reimplementing them.

## Quick Start

```bash
# Install
curl -fsSL https://orchstep.dev/install.sh | sh

# Or via package managers
brew tap orchstep/tap && brew install orchstep
npm install -g orchstep
pip install orchstep

# Run a demo
cd demos/01-post-deploy-smoke-test
orchstep run
```

## What's in This Repo

| Directory | Contents |
|-----------|----------|
| `spec/` | OrchStep YAML language specification |
| `modules/` | Official and community module registry |
| `skills/` | LLM agent skill documents |
| `mcp/` | MCP server interface specification |
| `demos/` | Example workflows for real-world use cases |
| `docs/` | User documentation |

## Quality & Testing

The OrchStep engine is rigorously tested with a comprehensive regression suite:

| Metric | Value |
|--------|-------|
| Regression test specs | **431** |
| Pass rate | **100%** (431/431) |
| Feature categories tested | **14** (execution, variables, control flow, loops, error handling, HTTP, git, templates, environment, config, assertions, modules, data flow, advanced) |
| Platforms verified | **6** (darwin/amd64, darwin/arm64, linux/amd64, linux/arm64, windows/amd64, windows/arm64) |
| CI pipeline | Automated on every commit — build, lint, vet, unit tests, full regression suite |

Every release is gated by the full regression suite. The test infrastructure includes mock HTTP servers, mock CLI simulators, and authenticated git operation tests to ensure real-world reliability.

### What's Tested

- **Workflow execution** — task pipelines, step sequencing, shell command execution
- **Variable management** — 4-level scoping, precedence, dynamic resolution, type preservation
- **Control flow** — if/elif/else, switch/case, loops (items/count/range/until), task delegation
- **Error handling** — retry with exponential backoff + jitter, try/catch/finally, timeouts, on-error modes
- **HTTP integration** — GET/POST/PUT/DELETE, authentication (bearer/basic/API key), JSON parsing, batch requests
- **Git operations** — clone, checkout, push, fetch, branches, tags, submodules, authenticated operations
- **Module system** — config schemas, exports, versioning, dependencies, nesting, remote git modules, lockfiles
- **Templates** — Go templates, Sprig functions, JavaScript expressions, regex extraction
- **Environment** — .env file loading, inheritance modes, groups, hierarchical configs

## The Engine

The OrchStep engine is distributed as a compiled binary. Install it using any method above, then use the spec and modules in this repo to build workflows.

## Distribution

| Channel | Install Command |
|---------|----------------|
| **curl** | `curl -fsSL https://orchstep.dev/install.sh \| sh` |
| **Homebrew** | `brew tap orchstep/tap && brew install orchstep` |
| **npm** | `npm install -g orchstep` |
| **pip** | `pip install orchstep` |
| **Docker** | `docker pull orchstep/orchstep:latest` |
| **GitHub Action** | `uses: orchstep/orchstep/action@main` |

All channels pull binaries from [GitHub Releases](https://github.com/orchstep/orchstep/releases).

| Directory | Contents |
|-----------|----------|
| `homebrew/` | Homebrew formula (auto-updated by GoReleaser) |
| `npm/` | npm wrapper package |
| `pip/` | pip wrapper package |
| `docker/` | Docker image configuration |
| `action/` | GitHub Action for CI/CD |

## For LLM Agents

OrchStep is designed for AI agent integration:

- **CLI:** `orchstep run task --format json` for structured output
- **MCP Server:** `orchstep mcp serve` for native tool_call integration
- **Skills:** Install skill documents from `skills/` to teach agents OrchStep patterns

## Editions

| Edition | Price | Features |
|---------|-------|----------|
| **Community** | Free forever | Full execution engine, all functions, unlimited concurrency, public modules |
| **Pro** | $49/user/month | + Team registry, RBAC, audit logs, AI governance, advanced tooling |
| **Enterprise** | Custom pricing | + SSO/SAML, compliance certifications, SLA, priority support |

[See pricing →](https://orchstep.com/pricing)

## Module Registry

OrchStep has a tiered module ecosystem:

- `@orchstep/*` — Official modules maintained by the OrchStep team
- `@community/*` — Verified community contributions
- `@ai/*` — LLM-generated modules (auto-validated)

Browse available modules in the `modules/` directory or search with:
```bash
orchstep module search deploy
```

## Contributing

We welcome module contributions from humans and AI agents! See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Open content in this repo (spec, modules, skills, demos, docs) is licensed under Apache 2.0.
The OrchStep engine binary has a separate [proprietary license](https://orchstep.com/license).
