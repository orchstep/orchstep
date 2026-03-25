# OrchStep Community Launch Checklist

## Pre-Launch Verification

### Repos
- [ ] orchstep (public) — README is polished, all links work
- [ ] orchstep-core (private) — confirmed private, no accidental public access
- [ ] orchstep-pro (private) — confirmed private
- [ ] Old repos archived: orchstep/modules, orchstep/orchstep-demos

### Binary
- [ ] GoReleaser produces binaries for all 5 platforms
- [ ] install.sh works end-to-end
- [ ] `orchstep version` shows correct version
- [ ] `orchstep run` works with demo workflows
- [ ] `orchstep mcp serve` starts MCP server
- [ ] `orchstep module search` returns results
- [ ] `orchstep license status` shows community mode

### Content
- [ ] All 5 official modules present and documented
- [ ] All 10 demos migrated and working
- [ ] Function reference docs complete (7 functions)
- [ ] Spec docs complete (variables, control flow, error handling, templates)
- [ ] 4 LLM skill documents published
- [ ] Pricing page content ready
- [ ] License terms draft reviewed

### Distribution Channels
- [ ] GitHub Releases — first release published
- [ ] Homebrew formula — tap works
- [ ] npm package — `npm install -g orchstep` works
- [ ] pip package — `pip install orchstep` works
- [ ] Docker image — `docker pull orchstep/orchstep` works
- [ ] GitHub Action — `orchstep/orchstep/action@main` works

### Website
- [ ] orchstep.dev — docs site live
- [ ] orchstep.com — pricing page live
- [ ] SSL certificates active
- [ ] Analytics configured

## Launch Day

### Announcements (publish within 2 hours of each other)

1. **Hacker News** — "Show HN: OrchStep — YAML workflow orchestration that runs anywhere"
2. **Reddit r/devops** — "OrchStep: Open orchestration engine for DevOps and AI agents"
3. **Reddit r/selfhosted** — "OrchStep: Self-hosted workflow orchestration (no SaaS required)"
4. **Dev.to** — Full blog post
5. **Twitter/X** — Thread
6. **LinkedIn** — Announcement post

### Post-Launch (Week 1)
- [ ] Monitor GitHub issues
- [ ] Respond to HN/Reddit comments within 1 hour
- [ ] Publish "Building OrchStep" blog post (technical deep-dive)
- [ ] Submit to DevOps Weekly newsletter
- [ ] Submit to Changelog podcast
- [ ] Publish MCP server to MCP tool directories
- [ ] Publish skills to Claude Code skill registries
