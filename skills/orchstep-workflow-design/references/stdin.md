# Stdin/Pipe Reference

## How Piping Works

```bash
echo '{"status":"healthy"}' | orchstep run check
```

Piped data is auto-detected and made available as `{{ stdin }}`.

## Auto-Detection Priority

1. **JSON** — any valid JSON is parsed into objects/arrays
2. **YAML** — valid YAML that's a map or array is parsed
3. **Plain text** — everything else stays as a string

```bash
# JSON → access fields
curl -s https://api.example.com/health | orchstep run check
# {{ stdin.status }} = "healthy"
# {{ stdin.version }} = "2.1.0"

# Plain text → access as string
echo "hello world" | orchstep run
# {{ stdin }} = "hello world"
```

## Named stdin Variable

Use `--stdin-var` to inject stdin into a named `--var`:

```bash
curl -s api/health | orchstep run check --stdin-var resp
# {{ vars.resp.status }} = "healthy"
```

This is useful when you need to preserve the piped data alongside other
runtime variables, or when the workflow needs to access the data from
multiple tasks.

## Access in Workflow

```yaml
tasks:
  check:
    steps:
      - name: process
        func: shell
        do: |
          echo "Status: {{ stdin.status }}"
          echo "Version: {{ stdin.version }}"
```

Or with `--stdin-var`:

```yaml
tasks:
  deploy:
    steps:
      - name: use_response
        func: shell
        do: |
          echo "Deploying in region: {{ vars.resp.region }}"
```

## In Transform Steps

```yaml
- name: process
  func: transform
  do: |
    return {
      host: stdin.host,
      port: stdin.port,
      environment: vars.env
    };
```

Piped data is available as the `stdin` variable in JavaScript transforms,
alongside `vars`, `steps`, and `env`.