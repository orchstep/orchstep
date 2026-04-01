# OrchStep Showcases

Enterprise-grade compositions demonstrating OrchStep as an architectural platform.
Each showcase composes multiple modules into a real infrastructure pattern.

## How to Run

```bash
cd showcases/01-three-tier-web-app
orchstep run                    # Run with defaults
orchstep run --var region=...   # Override variables
orchstep list                   # List available tasks
```

## Showcases

| # | Showcase | Module Depth | Key Pattern |
|---|----------|-------------|-------------|
| 01 | [3-Tier Web App](01-three-tier-web-app/) | 3 layers | AWS infra composition, scoped vars across layers |
| 02 | [K8s + Helm](02-k8s-helm-deployment/) | 2 layers | Helm deployment, conditional rollback |
| 03 | [Multi-Cloud](03-multi-cloud-deployment/) | 2 layers | Interface/implementation swap (AWS/GCP) |
| 04 | [Platform Golden Path](04-platform-golden-path/) | 1 layer | Multi-module service standardization |
| 05 | [Compliance-Gated Release](05-compliance-gated-release/) | 1 layer | Governance, env-scoped vars, approval gates |
| 06 | [Machine Provisioning](06-machine-provisioning/) | 2 layers | Desired state convergence, OS abstraction |

## What Makes Showcases Different

| | Examples | Demos | Showcases |
|---|---------|-------|-----------|
| **Purpose** | Learn one feature | Solve one task | Build systems |
| **Complexity** | Single concept | Multi-step workflow | Multi-module composition |
| **Modules** | None or local | None | Registry modules (local + remote) |
| **Module depth** | 0-1 layer | 0 layers | 2-3 layers |
| **Target audience** | New users | Practitioners | Architects & enterprise |
