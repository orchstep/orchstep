# Demo 10: Compliance Evidence Collection

## Pain Point

Preparing for SOC2, HIPAA, or ISO 27001 audits requires collecting evidence across dozens of control domains. This typically involves:

- **Manual screenshot gathering** - Engineers spend days taking screenshots of AWS console pages, Jira boards, and deployment logs
- **Inconsistent evidence** - Each collection cycle produces different artifacts in different formats
- **Point-in-time gaps** - Evidence must reflect a specific date, but manual collection spans days, creating temporal inconsistencies
- **Audit fatigue** - Quarterly evidence collection disrupts engineering work for a week each cycle
- **Missing artifacts** - Auditors request additional evidence weeks later, requiring another scramble

Compliance teams need repeatable, timestamped evidence packages that cover all control domains consistently.

## What This Demo Shows

OrchStep automates the full evidence collection cycle:

- **Multi-domain coverage** - Five control domains (access control, encryption, backups, network security, change management) each as a dedicated step
- **Consistent output format** - Every step produces structured evidence with the same naming convention and metadata
- **Parameterized audit type** - The same pipeline works for SOC2 and HIPAA by switching the `audit_type` variable
- **Aggregated summary** - The final step pulls pass/fail counts from all domains into a single report
- **Timestamped artifacts** - The `collection_date` variable ensures all evidence references the same point in time

## Running the Demo

```bash
# Default: SOC2 audit
orchstep run

# HIPAA compliance
orchstep run --var audit_type=hipaa

# Specific collection date
orchstep run --var audit_type=soc2 --var collection_date=2026-03-01
```

## Adapting for Production

1. **Connect to real APIs** - Replace simulated output with AWS CLI (`aws iam list-users`), Terraform state queries, and CI/CD API calls
2. **Add audit-specific controls** - SOC2 and HIPAA have different control requirements; use conditional steps based on `audit_type`
3. **Store evidence in a compliance platform** - Upload artifacts to Vanta, Drata, or a dedicated S3 bucket with versioning
4. **Add evidence validation** - Assert that controls pass before including them in the package (e.g., fail if MFA coverage is below 100%)
5. **Schedule automated runs** - Use cron to run evidence collection weekly or monthly, catching drift between audit cycles
6. **Add drift detection** - Compare current evidence against the last collection to flag changes (new users without MFA, expired certificates, etc.)
7. **Generate auditor-ready PDFs** - Add a final step that renders the evidence package into a formatted PDF with table of contents
8. **Multi-account support** - Loop over multiple AWS accounts or environments to collect evidence across your entire organization
