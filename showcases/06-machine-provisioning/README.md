# Showcase: Developer Machine Provisioning

Provision a developer workstation with role-based tooling, shell configuration, and SSH setup using OrchStep's desired-state convergence model.

## What This Proves

- **2-layer module chaining**: This workflow -> `demo-machine-setup` -> `demo-package-manager`
- **Desired-state convergence**: Run repeatedly and the machine converges to the declared state — already-installed packages are skipped
- **OS abstraction**: `demo-package-manager` detects the OS and uses the appropriate package manager (brew, apt, yum)
- **Role-based provisioning**: `switch/case` on `vars.role` selects the right package list (frontend, backend, fullstack)
- **Task-level variables**: Package lists are defined as task vars, keeping them scoped and composable
- **Validation loop**: Post-install validation ensures the declared state was actually achieved

## Architecture

```
orchstep.yml (this file)
|
+-- demo-machine-setup ------------ COMPOSITE MODULE (Layer 2)
|   +-- demo-package-manager ------ Leaf: OS-aware package install/verify (Layer 3)
|
+-- env-check --------------------- Leaf: Environment validation (existing module)
```

## Variable Flow

```
vars.role ("fullstack" | "frontend" | "backend")
  -> switch/case selects package list from task.vars
    -> "frontend": common + node, npm, yarn, typescript, eslint
    -> "backend":  common + go, python3, pip, postgres-client, redis-cli
    -> "fullstack": common + node, npm, go, python3, docker-compose, terraform

steps.select_packages.packages
  -> setup install_tools with.packages
    -> demo-machine-setup passes to demo-package-manager
  -> setup validate_state with.packages
  -> envcheck tools with.tools

vars.shell_type ("zsh")
  -> setup configure_shell with.shell
    -> demo-machine-setup configures dotfiles for selected shell
```

## Run

```bash
# Default: fullstack role with zsh
orchstep run

# Frontend developer setup
orchstep run --var role=frontend

# Backend developer with fish shell
orchstep run --var role=backend --var shell_type=fish

# Custom email for SSH/Git config
orchstep run --var email=jane@company.com

# List all available tasks
orchstep list
```

## Customization

To use this as a template for real machine provisioning:
1. Replace module sources with your own package management wrappers (Ansible, Chef, Nix)
2. Add role-specific package lists for your organization (data-science, devops, etc.)
3. Add company-specific steps (VPN setup, certificate installation, IDE configuration)
