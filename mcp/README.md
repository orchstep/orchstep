# OrchStep MCP Server

OrchStep provides an MCP (Model Context Protocol) server for native LLM agent integration.

## Quick Start

```bash
orchstep mcp serve
```

## Available Tools

| Tool | Read-only | Purpose |
|------|-----------|---------|
| `orchstep_list_tasks` | yes | List available tasks |
| `orchstep_plan` | yes | Dry-run a task (rendered commands, verdicts); nothing executes |
| `orchstep_run` | no | Execute a workflow task; returns the JSON run result |
| `orchstep_lint` | yes | Lint a workflow |
| `orchstep_module_search` | yes | Search the module registry |
| `orchstep_module_install` | no | Install a module |
| `orchstep_version` | yes | Get version and edition info |

Claude Code users: `/plugin install orchstep --marketplace orchstep/orchstep` registers this server automatically.

Full reference: [orchstep.dev/agents/mcp](https://orchstep.dev/agents/mcp).
