# Installation

## All Methods

| Method | Command |
|--------|---------|
| Quick install | `curl -fsSL https://orchstep.dev/install.sh \| sh` |
| Homebrew | `brew tap orchstep/tap && brew install orchstep` |
| npm | `npm install -g orchstep` |
| pip | `pip install orchstep` |
| Docker | `docker pull orchstep/orchstep:latest` |
| GitHub Action | `uses: orchstep/setup-orchstep@v1` |
| Direct download | [GitHub Releases](https://github.com/orchstep/orchstep/releases) |

## Verify Installation

```bash
orchstep version
```

## LLM Agent Installation

Agents can self-install using whichever method matches their environment:

```bash
# Check if installed
orchstep version --format json 2>/dev/null

# Install if not
npm install -g orchstep    # Node environment
pip install orchstep       # Python environment
```
