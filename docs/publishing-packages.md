# Publishing OrchStep Packages

## Prerequisites

### npm
1. Create an npm account at npmjs.com
2. Run `npm login` locally
3. Add `NPM_TOKEN` to GitHub repo secrets (Settings > Secrets > Actions)

### PyPI
1. Create a PyPI account at pypi.org
2. Generate an API token at pypi.org/manage/account/token/
3. Add `PYPI_TOKEN` to GitHub repo secrets

## Automatic Publishing

When a GitHub Release is published (e.g., v0.1.0), the `publish-packages.yml` workflow automatically:
1. Updates the package version from the release tag
2. Publishes to npm and PyPI

## Manual Publishing

### npm
```bash
cd npm
npm version 0.1.0 --no-git-tag-version
npm publish --access public
```

### PyPI
```bash
cd pip
python -m build --sdist --wheel
python -m twine upload dist/*
```

## Required Secrets
| Secret | Where | Purpose |
|--------|-------|---------|
| `NPM_TOKEN` | orchstep/orchstep repo | npm publish auth |
| `PYPI_TOKEN` | orchstep/orchstep repo | PyPI publish auth |
