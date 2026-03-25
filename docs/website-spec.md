# Website Specification

## Domains

| Domain | Purpose | Platform |
|--------|---------|----------|
| orchstep.dev | Developer docs, spec reference, getting started | Static site (Astro/Next.js/Hugo) |
| orchstep.com | Commercial: pricing, blog, company, enterprise | Same platform or separate |

Both can resolve to the same site with different entry paths.

## Site Map

### orchstep.dev (Developer-facing)

```
/                     → Overview + quick start
/docs/                → Getting started guide
/docs/installation    → All installation methods
/docs/spec/           → YAML language specification
/docs/functions/      → Function interface reference
/docs/modules/        → Module system guide
/docs/skills/         → LLM agent skill documents
/docs/mcp/            → MCP server documentation
/examples/            → Usage examples (from demos/)
/modules/             → Module registry browser
/blog/                → Technical blog
```

### orchstep.com (Commercial-facing)

```
/                     → Landing page (value prop, testimonials, CTA)
/pricing              → Pricing comparison (Community vs Pro vs Enterprise)
/enterprise           → Enterprise contact form
/blog/                → Company blog (shared with .dev)
/about                → Company/team info
/license              → License terms
/privacy              → Privacy policy
/terms                → Terms of service
```

## Pricing Page Content

### Community (Free)

**For developers and small teams**

- Full workflow execution engine
- Unlimited steps, concurrency, and functions
- Public module registry (@orchstep/*, @community/*, @ai/*)
- CLI + MCP server for LLM agent integration
- Skill documents for AI-assisted development

**$0 forever. No credit card required.**

[Download →]

### Pro ($49/user/month)

**For teams that need collaboration and governance**

Everything in Community, plus:
- Private module registry
- Team workflow sharing & registry
- Role-based access control (RBAC)
- Audit log streaming
- AI agent governance (execution policies, approval workflows, cost limits)
- orchstep-inspect (interactive execution explorer)
- orchstep-report (advanced reporting)

**$49/user/month or $490/user/year (save 17%)**

[Get Pro →]

### Enterprise (Custom)

**For organizations with compliance and security requirements**

Everything in Pro, plus:
- SSO / SAML / SCIM
- Compliance certifications
- SLA with priority support
- Custom module policies
- Dedicated onboarding

[Contact Sales →]

## Technology Recommendation

**Astro** with Starlight (docs theme) is recommended:
- Static site generation (fast, cheap to host)
- Built-in docs features (search, sidebar, versioning)
- MDX support (interactive components in docs)
- Deploys to Cloudflare Pages / Vercel / Netlify for free
- Content can be sourced from the orchstep public repo's docs/

## Implementation Checklist

- [ ] Choose platform (Astro + Starlight recommended)
- [ ] Set up Cloudflare Pages for hosting
- [ ] Configure orchstep.dev and orchstep.com DNS
- [ ] Import docs from orchstep public repo
- [ ] Create landing page
- [ ] Create pricing page with LemonSqueezy checkout embed
- [ ] Create enterprise contact form
- [ ] Set up blog
- [ ] Write launch blog post
- [ ] Set up analytics (Plausible or Fathom — privacy-respecting)
