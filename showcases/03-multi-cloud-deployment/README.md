# Showcase: Multi-Cloud Deployment (AWS / GCP)

Deploy infrastructure on AWS or GCP using the same OrchStep workflow, selected by a single variable.

## What This Proves

- **Interface equivalence**: AWS and GCP modules expose the same task interface (`provision`), making them interchangeable
- **Switch/case cloud selection**: `vars.cloud_provider` drives a `switch` block — only the selected provider's module runs
- **2-layer module chaining (both paths)**: `demo-aws-infra` -> `demo-aws-networking`, `demo-gcp-infra` -> `demo-gcp-networking`
- **Same output shape**: Both cloud modules produce compatible outputs, so downstream steps work regardless of provider
- **Region mapping**: Provider-specific region variables (`region_aws`, `region_gcp`) route to the correct module config

## Architecture

```
orchstep.yml (this file)
|
+-- [switch: cloud_provider]
|   |
|   +-- case "aws":
|   |   +-- demo-aws-infra ---------- COMPOSITE MODULE (Layer 2)
|   |       +-- demo-aws-networking -- Leaf: VPC, subnets, SGs (Layer 3)
|   |       +-- demo-aws-ec2 -------- Leaf: EC2 instances
|   |       +-- demo-aws-rds -------- Leaf: Database
|   |
|   +-- case "gcp":
|       +-- demo-gcp-infra ---------- COMPOSITE MODULE (Layer 2)
|           +-- demo-gcp-networking -- Leaf: VPC, subnets, firewall (Layer 3)
|
+-- health-check --------------------- Leaf: Post-deploy verification (existing module)
```

## Variable Flow

```
vars.cloud_provider ("aws" | "gcp")
  -> switch selector — determines which module branch executes

vars.region_aws ("ap-southeast-2")
  -> aws config.region (only used when cloud_provider == "aws")
    -> demo-aws-infra passes to network config.region

vars.region_gcp ("australia-southeast1")
  -> gcp config.region (only used when cloud_provider == "gcp")
    -> demo-gcp-infra passes to network config.region
```

## Run

```bash
# Default: AWS in ap-southeast-2
orchstep run

# Deploy to GCP instead
orchstep run --var cloud_provider=gcp

# AWS in a different region
orchstep run --var cloud_provider=aws --var region_aws=us-east-1

# List all available tasks
orchstep list
```

## Customization

To use this as a template for real multi-cloud deployments:
1. Replace module sources with your own cloud modules (Terraform, Pulumi, etc.)
2. Add Azure as a third case in the `switch` block
3. Normalize outputs across providers so downstream steps remain cloud-agnostic
