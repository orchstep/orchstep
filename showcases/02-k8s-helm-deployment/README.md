# Showcase: Kubernetes + Helm Microservice Deployment

Deploy a microservice to Kubernetes using OrchStep's 2-layer module composition with Helm chart management and conditional rollback.

## What This Proves

- **2-layer module chaining**: This workflow -> `demo-k8s-deploy` -> `demo-k8s-namespace`
- **Helm integration**: Separate Helm module manages chart lifecycle alongside K8s deployment
- **Conditional rollback**: If health check fails, the deployment automatically rolls back
- **Scoped variable flow**: `namespace` flows from this workflow through K8s deploy down to namespace provisioning
- **Output chaining**: Health check result drives rollback conditional logic

## Architecture

```
orchstep.yml (this file)
|
+-- demo-k8s-deploy -------------- COMPOSITE MODULE (Layer 2)
|   +-- demo-k8s-namespace ------- Leaf: namespace, quotas, RBAC (Layer 3)
|
+-- demo-helm --------------------- Leaf: Helm chart install/upgrade
+-- health-check ------------------ Leaf: Post-deploy verification (existing module)
```

## Variable Flow

```
vars.namespace ("production")
  -> k8s config.namespace
    -> demo-k8s-deploy passes to ns config.namespace
      -> demo-k8s-namespace creates/ensures namespace

vars.app_name ("order-service")
  -> k8s config.app_name -> used for deployment naming
  -> helm config.release_name -> used for Helm release naming

conditional flow:
  steps.check_health.healthy == "false"
    -> triggers rollback_if_unhealthy step
```

## Run

```bash
# Default: order-service in production namespace
orchstep run

# Override app and image tag
orchstep run --var app_name=cart-service --var image_tag=v2.0.0

# Deploy to staging with fewer replicas
orchstep run --var namespace=staging --var replicas=1

# List all available tasks
orchstep list
```

## Customization

To use this as a template for real Kubernetes deployments:
1. Replace module sources with your own K8s modules (or real kubectl/helm wrappers)
2. Update `defaults.vars` with your actual registry, chart repo, and service name
3. Add environment-specific config via `env_groups` and `environments`
