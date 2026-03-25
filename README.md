# OrchStep

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
