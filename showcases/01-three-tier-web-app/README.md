# Showcase: Classic 3-Tier Web Application

Deploy a production-grade 3-tier web application on AWS using OrchStep's module composition.

## What This Proves

- **3-layer module chaining**: This workflow → `demo-aws-infra` → `demo-aws-networking`
- **Interface/implementation separation**: This workflow defines WHAT (a 3-tier app), modules define HOW (AWS resources)
- **Scoped variable flow**: `region` and `vpc_cidr` flow from this workflow through 3 module layers via config
- **Output chaining**: VPC ID flows from networking → infra → this workflow → ASG and DNS modules
- **Mixed module types**: Composite module (`demo-aws-infra`) alongside leaf modules (`demo-aws-asg`, `demo-aws-r53`)

## Architecture

```
orchstep.yml (this file)
|
+-- demo-aws-infra --------------- COMPOSITE MODULE (Layer 2)
|   +-- demo-aws-networking ------ Leaf: VPC, subnets, security groups (Layer 3)
|   +-- demo-aws-ec2 ------------- Leaf: EC2 instances
|   +-- demo-aws-rds ------------- Leaf: Database provisioning
|
+-- demo-aws-asg ----------------- Leaf: Auto-scaling + load balancer
+-- demo-aws-r53 ----------------- Leaf: DNS records
+-- demo-health-check ------------ Leaf: Post-deploy verification (existing module)
```

## Variable Flow

```
vars.region ("ap-southeast-2")
  -> infra config.region
    -> demo-aws-infra passes to network config.region
      -> demo-aws-networking uses for VPC creation

vars.vpc_cidr ("10.0.0.0/16")
  -> infra config.vpc_cidr
    -> demo-aws-infra passes to network config.vpc_cidr
      -> demo-aws-networking creates VPC with this CIDR

outputs flow back up:
  demo-aws-networking.vpc_id
    -> demo-aws-infra.provision.vpc_id
      -> this workflow uses for ASG subnet assignment
```

## Run

```bash
# Default: ap-southeast-2, production
orchstep run

# Override region and environment
orchstep run --var region=eu-west-1 --var environment=staging

# List all available tasks
orchstep list
```

## Customization

To use this as a template for real infrastructure:
1. Replace module sources with your own AWS modules (or real Terraform wrappers)
2. Update `defaults.vars` with your actual domain, region, and app name
3. Add environment-specific config via `env_groups` and `environments`
