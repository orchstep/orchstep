# Test-to-Example Pipeline & Enterprise Showcases (v0.3.0)

## The Problem

OrchStep's 147 internal test specs encode deep capabilities — retry composition, 6-level module nesting, conditional validation chains, remote registries — that the public repo didn't expose. The existing 84 examples covered basics but lacked depth. The 10 demos showed operational tasks but didn't demonstrate OrchStep as an architectural composition engine.

Enterprise buyers looking at the old demos saw "a fancy script runner," not "a platform I can build operational infrastructure on."

The gap was clear: OrchStep's engine could handle enterprise-grade orchestration, but the public content didn't prove it. Without proof, adoption stalls at the evaluation stage.

## The Solution — Three Tiers of Content

v0.3.0 introduces a deliberate content hierarchy. Each tier serves a different audience and a different stage of the adoption funnel.

### Tier 1: Examples (learn features)

97 total (was 84). Two new categories added, plus 13 new files across existing categories.

**New categories:**

- **17-task-discovery** (4 files) — Auto-discover tasks from `tasks/` directory, naming conventions, precedence rules, exclusion patterns. These examples were extracted from internal test specs that validated the task discovery engine. They teach users how OrchStep finds and prioritizes tasks without manual registration.

- **18-nested-patterns** (3 files) — Nested conditionals, switch-in-loop, deep elif chains. These patterns come directly from the conditional validation chain tests. They prove that OrchStep's control flow isn't limited to flat if/else — it handles the kind of nested logic real workflows require.

**New files in existing categories (13 total):**

- Environment groups — scoped variable sets per deployment target
- Step-to-task variable passing — data flow across orchestration boundaries
- Loop + retry composition — combining iteration with fault tolerance
- HTTP error handling — structured responses for API-driven workflows
- Git push and advanced clone — beyond basic checkout
- Remote module registry — pull modules from external sources
- Versioned modules — pin module versions for reproducibility
- Lockfiles — deterministic module resolution
- Monorepo scope — target specific packages in large repositories
- Text, select, and multiselect prompts — interactive workflow inputs

Each of these was generated from an internal test spec that proved the feature works. The examples strip out assertions and test scaffolding, keeping only the usage pattern.

### Tier 2: Demos (solve tasks)

10 existing demos, unchanged. These cover operational workflows: smoke tests, release notes, incident response, and similar. They remain the "get started quickly" content for individual practitioners.

Demos were not expanded in v0.3.0 because the gap wasn't in operational use cases — it was in architectural credibility.

### Tier 3: Showcases (build systems) — NEW

6 enterprise-grade compositions demonstrating OrchStep as an architectural platform. This is the new tier, and the primary deliverable of v0.3.0.

| # | Showcase | Module Depth | Enterprise Message |
|---|----------|-------------|-------------------|
| 01 | Classic 3-Tier Web App (EC2, ASG, R53, RDS) | 3 layers | Real AWS infrastructure with layered module composition |
| 02 | K8s + Helm Deployment | 2 layers | Container orchestration with config-driven Helm, conditional rollback |
| 03 | Multi-Cloud Deployment | 2 layers | Same workflow interface, swap AWS/GCP — vendor independence |
| 04 | Platform Golden Path | 1 layer | Standardize microservice creation across teams |
| 05 | Compliance-Gated Release | 1 layer | Governance built into pipeline, env-scoped approval gates |
| 06 | Machine Provisioning (macOS/Linux) | 2 layers | Bootstrap machines to desired state, OS abstraction |

Each showcase was designed to answer a specific enterprise objection:

- **"Can it handle real infrastructure?"** — Showcase 01 deploys a full 3-tier AWS stack through 3 layers of module composition.
- **"Does it work with containers?"** — Showcase 02 manages Kubernetes namespaces and Helm releases with conditional rollback logic.
- **"Are we locked into one cloud?"** — Showcase 03 swaps AWS for GCP using the same workflow interface, proving vendor independence.
- **"Can it standardize across teams?"** — Showcase 04 creates a golden path for microservice creation with opinionated defaults.
- **"Does it support governance?"** — Showcase 05 gates releases behind security scans and environment-scoped approvals.
- **"What about developer machines?"** — Showcase 06 provisions macOS and Linux workstations to a desired state with OS-aware package management.

### Demo Modules — NEW

18 new modules in the registry (23 total). These modules power the showcases and serve as reference implementations for module authors.

**4 composite modules** (modules that import other modules):

- `demo-aws-infra` — composes networking + compute + database into a coherent AWS stack
- `demo-k8s-deploy` — composes namespace creation + Helm release into a deployment pipeline
- `demo-gcp-infra` — composes GCP networking + compute for multi-cloud parity
- `demo-machine-setup` — composes package management + configuration for workstation provisioning

**14 leaf modules** covering:

- AWS: networking, EC2, RDS, ASG, Route 53
- GCP: networking
- Kubernetes: namespace, Helm
- Platform: repo-scaffold, CI pipeline, observability
- Governance: security-scan, approval-gate
- Provisioning: package-manager

All modules are simulated — no real cloud calls — but they have realistic config schemas, proper outputs, and full `orchstep-module.yml` metadata. An enterprise evaluator can read the module definitions and see exactly how they would structure their own modules for real infrastructure.

## Key Design Decisions

### Why showcases, not more demos?

Demos solve one operational task. They're useful for individual adoption but don't answer the enterprise question: "Can I build my infrastructure on this?"

Showcases prove OrchStep is a composition engine. They show multi-module, multi-layer workflows that resemble real infrastructure. When a platform engineering lead evaluates OrchStep, they need to see something that looks like their world — not a script that runs linters.

The decision to create a new tier rather than expanding demos was deliberate. Mixing simple operational tasks with complex architectural compositions in the same directory would dilute both messages. Showcases needed their own space to signal "this is enterprise-grade content."

### Why 3-layer module chaining?

Showcase 01 proves: `main workflow -> demo-aws-infra -> demo-aws-networking`. Three layers of module composition with scoped variables flowing cleanly across each boundary.

This matters because real infrastructure has layers. A deployment workflow calls an infrastructure module, which calls a networking module. If OrchStep can't handle this cleanly — with proper variable scoping, output propagation, and error handling at each layer — it's not ready for enterprise use.

The engine supports up to 5 layers. We demonstrated 3 because that's the sweet spot between proving depth and keeping showcases readable. Going to 5 layers would have made the examples harder to follow without adding meaningful proof.

### Why composite modules?

Modules that import other modules prove the module system's compositional depth. `demo-aws-infra` isn't just a wrapper — it composes networking + compute + database into a coherent stack, passing outputs from networking (VPC ID, subnet IDs) as inputs to compute and database.

This is what enterprise teams actually build. Nobody deploys an EC2 instance without a VPC. Nobody provisions a database without networking. Composite modules prove that OrchStep's module system handles real dependency graphs, not just flat collections of tasks.

### Why interface/implementation separation?

Main workflows define WHAT (deploy a 3-tier app). Modules define HOW (create AWS resources). This separation is the core architectural message of OrchStep.

Showcase 03 proves it concretely: the same workflow interface deploys to AWS or GCP by swapping the infrastructure module. The workflow author doesn't need to know whether they're deploying to `us-east-1` or `us-central1`. They declare what they want, and the module handles the rest.

This is the difference between "a script runner" and "a composition engine." Script runners couple what and how. Composition engines separate them. Enterprise buyers who see this separation immediately understand the long-term value: they can change implementations without rewriting workflows.

### IP protection

All content shows "how to USE OrchStep" — usage patterns, composition techniques, variable scoping, module authoring conventions. Zero engine internals, test assertions, or regression framework details are exposed.

The test-to-example pipeline was designed with this constraint from the start. Internal test specs contain assertions, edge case coverage, and regression markers that reveal engine behavior. The pipeline strips all of that, extracting only the orchestration patterns that users need to learn.

This protects the proprietary engine while maximizing the public content's educational value.

## Metrics

| Metric | Before v0.3.0 | After v0.3.0 |
|--------|---------------|--------------|
| Examples | 84 | 97 (+13) |
| Demos | 10 | 10 |
| Showcases | 0 | 6 |
| Demo modules | 5 | 23 (+18) |
| Composite modules | 0 | 4 |
| Max demonstrated module depth | 1 layer | 3 layers |

## What's Next

- **Part 2: Automated pipeline** — A skill that auto-generates examples from new test specs as they're written, keeping public content in sync with engine capabilities.
- **Dynamic test badge** — Auto-update the public README with test stats from orchstep-core CI runs, proving coverage without exposing test details.
- **Website integration** — Surface showcases on orchstep.dev with interactive navigation and module dependency diagrams.
