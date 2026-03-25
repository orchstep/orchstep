# Demo 07: Developer Onboarding Automation

## Pain Point

Onboarding a new developer involves dozens of manual steps: installing tools, cloning the right repos, setting up databases, verifying services, and sharing tribal knowledge about what to do next. Different teams need different tools and repos. The process is error-prone, inconsistent, and can take days when it should take hours.

Most teams maintain a wiki page that's perpetually out of date, or a shell script that only works on one person's machine.

## What This Demo Shows

OrchStep turns the onboarding checklist into a repeatable, team-aware pipeline:

- **Conditional logic per team** - The `team` variable (backend/frontend/sre) controls which tools are checked and which repos are cloned
- **Step outputs for data flow** - The repo count, migration count, and healthy service count all flow forward into the welcome message
- **Sequential dependency** - Database seeding only runs after repos are cloned; health checks run after seeding
- **Personalized output** - The welcome message aggregates data from all previous steps

## Running the Demo

```bash
# Default: backend team
orchstep run

# Frontend developer
orchstep run --var team=frontend --var developer_name="Alex Kim"

# SRE team member
orchstep run --var team=sre --var developer_name="Sam Chen"
```

## Adapting for Production

1. **Replace echo with real commands** - Swap simulated output for actual `git clone`, `docker compose up`, `psql` commands
2. **Add error handling** - Use `on_error` to catch failures (e.g., port conflicts, auth issues) and provide remediation steps
3. **Add idempotency** - Check if repos already exist before cloning, skip migrations already applied
4. **Integrate with IT systems** - Add steps to provision LDAP accounts, grant GitHub org access, create Jira boards
5. **Team-specific modules** - Extract each team's setup into an OrchStep module for independent versioning
6. **Add a `teardown` task** - For offboarding or environment reset
