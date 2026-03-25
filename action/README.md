# Setup OrchStep GitHub Action

Install OrchStep in your GitHub Actions workflow.

## Usage

```yaml
steps:
  - uses: orchstep/orchstep/action@main
    with:
      version: latest  # or specific version like "1.0.0"

  - run: orchstep run deploy --var env=staging
```

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `version` | OrchStep version to install | `latest` |
