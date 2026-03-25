# Getting Started with OrchStep

## Installation

```bash
# Quick install (macOS/Linux)
curl -fsSL https://orchstep.dev/install.sh | sh

# Homebrew
brew tap orchstep/tap && brew install orchstep

# npm
npm install -g orchstep

# pip
pip install orchstep
```

## Your First Workflow

Create `orchstep.yml`:

```yaml
name: hello-world
desc: "My first OrchStep workflow"

tasks:
  hello:
    desc: "Say hello"
    steps:
      - name: greet
        func: shell
        do: echo "Hello from OrchStep!"
```

Run it:

```bash
orchstep run hello
```

## Next Steps

- Browse [demos/](../demos/) for real-world examples
- Read the [specification](../spec/) to learn the YAML format
- Install [modules](../modules/) to extend functionality
