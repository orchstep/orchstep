---
name: orchstep-mcp-integration
description: Use the OrchStep MCP server for native LLM agent integration. Use when an agent should list, preview (dry-run), lint, or run OrchStep workflows, or find and install modules, through MCP tools instead of the CLI.
---

# OrchStep MCP Integration

The OrchStep MCP (Model Context Protocol) server lets an agent call OrchStep as native tools instead of shelling out and scraping terminal text. It speaks JSON-RPC 2.0 over stdio.

## Starting the MCP Server

```bash
orchstep mcp serve
```

In Claude Code the easiest route is the plugin, which registers this server for you:

```text
/plugin install orchstep --marketplace orchstep/orchstep
```

## Available Tools

Every tool carries MCP behaviour annotations (`readOnlyHint`, `destructiveHint`, ...) so a client can auto-approve the read-only ones and ask before anything executes.

| Tool | Read-only | What it does |
|------|-----------|--------------|
| `orchstep_list_tasks` | yes | List the non-internal tasks in a workflow file |
| `orchstep_plan` | yes | Dry-run a task: rendered commands, condition verdicts, variable provenance. Nothing executes. *(next release)* |
| `orchstep_run` | no (destructive) | Execute a task and return the run result |
| `orchstep_lint` | yes | Lint a workflow file for errors and anti-patterns |
| `orchstep_module_search` | yes | Search the module registry |
| `orchstep_module_install` | no | Install a module from the registry |
| `orchstep_version` | yes | Report version and edition |

### orchstep_run

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `task` | string | yes | Task name to run |
| `file` | string | no | Workflow file (default `./orchstep.yml`) |
| `vars` | object of strings | no | Runtime variables, same as `--var key=value` |
| `environment` | string | no | Declared environment, same as `--env` *(next release)* |

```json
{
  "name": "orchstep_run",
  "arguments": { "task": "hello", "vars": { "greet_name": "agent" } }
}
```

From the next release the result text is the structured JSON run result (the same document `orchstep run --output json` prints), so the agent can branch on `status` and inspect `steps`:

```json
{
  "workflow": "orchstep-repo",
  "task": "hello",
  "status": "success",
  "steps": [
    {
      "task": "hello",
      "name": "greet",
      "status": "ok",
      "output": "Hello, agent! This message was orchestrated by OrchStep."
    }
  ]
}
```

A failed run sets `isError: true` on the tool result and includes the `error` field. Task names, environments and var keys that look like CLI flags (for example a task named `--file=...`) are rejected before anything runs.

### orchstep_plan

Takes the same arguments as `orchstep_run` and returns the dry-run plan (`orchstep run <task> --dry-run --output json`). Use it to show the user exactly what will execute, then call `orchstep_run`.

### orchstep_list_tasks

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `file` | string | no | Workflow file (default `./orchstep.yml`) |

Returns task names, one per line.

### orchstep_lint

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `file` | string | yes | Workflow file to lint |

### orchstep_module_search

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `query` | string | no | Matches name, description and tags |
| `tier` | string | no | `official`, `community` or `ai` |

### orchstep_module_install

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | yes | Full module name, e.g. `@orchstep/slack-notify` |

### orchstep_version

No arguments. Returns `{"version": "...", "edition": "community"}`.

## Usage Patterns

### Discover, preview, run

```
1. orchstep_list_tasks            -> see what exists
2. orchstep_plan  task="deploy"   -> show the user the rendered commands
3. orchstep_run   task="deploy"   -> execute after approval
4. read status / steps[]          -> report, or explain the failing step
```

### Validate before running

```
1. orchstep_lint file="orchstep.yml"
2. fix any reported problem
3. orchstep_run
```

### Reuse a module

```
1. orchstep_module_search query="slack"
2. orchstep_module_install name="@orchstep/slack-notify"
3. orchstep_run a task that uses it
```

## MCP Client Configuration

### Claude Code

Use the plugin (above), or add the server manually:

```bash
claude mcp add orchstep -- orchstep mcp serve
```

### Claude Desktop and other stdio clients

```json
{
  "mcpServers": {
    "orchstep": {
      "command": "orchstep",
      "args": ["mcp", "serve"]
    }
  }
}
```

The server runs tasks relative to its working directory; start the client from your project, or pass `file` explicitly.

## Tips for LLM Agents

- Call `orchstep_list_tasks` first instead of guessing task names.
- Call `orchstep_plan` before `orchstep_run` on anything that touches real systems.
- Treat the workflow as the source of truth: run the task rather than re-deriving its commands.
- Values you pass in `vars` are substituted into commands; workflow authors should pipe untrusted values through a quoting helper.
- Use `orchstep_module_search` before writing a workflow from scratch.
