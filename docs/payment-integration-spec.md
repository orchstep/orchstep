# Payment Infrastructure Specification

## Overview

OrchStep uses LemonSqueezy for payment processing, tax compliance, and license key generation.

## Architecture

```
User visits orchstep.com/pricing
  → Selects tier (Pro / Enterprise)
  → Redirected to LemonSqueezy checkout
  → Payment processed
  → LemonSqueezy webhook fires
  → Key generation service creates signed license key
  → Key emailed to customer + available in dashboard
  → User runs: orchstep license activate --key=ORCH-XXXX-XXXX-XXXX-XXXX
```

## LemonSqueezy Setup

### Products

| Product | Type | Price | Billing |
|---------|------|-------|---------|
| OrchStep Pro (Monthly) | Subscription | $49/user/month | Recurring |
| OrchStep Pro (Annual) | Subscription | $490/user/year | Recurring |
| OrchStep Enterprise | Custom | $25k-150k/year | Invoice |

### Webhooks

LemonSqueezy sends webhooks to your key generation service on these events:

| Event | Action |
|-------|--------|
| `subscription_created` | Generate license key, email to customer |
| `subscription_updated` | Update seat count in key if changed |
| `subscription_payment_success` | Extend expiry date |
| `subscription_payment_failed` | Flag for grace period |
| `subscription_cancelled` | Set expiry to end of current period |
| `subscription_expired` | No action (Shield handles grace period) |

### Key Generation Service

A small serverless function (Cloudflare Workers, Vercel Edge, or AWS Lambda) that:
1. Receives LemonSqueezy webhook
2. Validates webhook signature
3. Generates a signed license key (Ed25519)
4. Stores key metadata in a database (Turso/PlanetScale/Supabase)
5. Sends key to customer via email (SendGrid/Resend)
6. Returns key in LemonSqueezy customer portal

### License Key Generation

```
Input: { org: "Acme Corp", tier: "pro", seats: 50, expiry: "2027-03-26" }

1. Create JSON claims payload
2. Sign with Ed25519 private key (kept secret in key gen service)
3. Encode as base64url
4. Format as ORCH-XXXX-XXXX-XXXX-XXXX (split base64 into 4-char segments)

Output: ORCH-aBcD-eFgH-iJkL-mNoP
```

The public key is embedded in the orchstep binary (pkg/shield). The private key NEVER leaves the key generation service.

### Customer Portal

LemonSqueezy provides a hosted customer portal where users can:
- View their license key
- Update payment method
- Change seat count
- View invoices
- Cancel subscription

URL: `https://orchstep.lemonsqueezy.com/billing`

## Self-Serve Flow (Pro)

1. User visits orchstep.com/pricing
2. Clicks "Get Pro"
3. Redirected to LemonSqueezy checkout (embedded or hosted)
4. Enters: email, company name, seat count, payment info
5. Payment processed by LemonSqueezy (handles global tax)
6. Webhook → key generation → email with license key
7. User runs `orchstep license activate --key=...`
8. Pro features unlocked

## Enterprise Flow

1. User visits orchstep.com/enterprise
2. Fills contact form (company, size, requirements)
3. Sales conversation (email/call)
4. Custom quote generated
5. Invoice sent via LemonSqueezy or manual
6. Key generated manually with custom feature flags
7. Dedicated onboarding support

## Implementation Checklist

- [ ] Create LemonSqueezy account and configure store
- [ ] Create Pro Monthly and Pro Annual products
- [ ] Set up webhook endpoint (serverless function)
- [ ] Implement Ed25519 key signing in key gen service
- [ ] Set up email delivery (SendGrid/Resend)
- [ ] Embed LemonSqueezy checkout on orchstep.com/pricing
- [ ] Update pkg/shield to verify Ed25519 signatures (replace dev fallback)
- [ ] Set up customer portal link
- [ ] Test full flow: purchase → key → activate → Pro features
- [ ] Set up Stripe as backup (for when you outgrow LemonSqueezy)

## Security

- Webhook signatures verified on every request
- Ed25519 private key stored in service secrets (never in code)
- License keys are self-verifying (no phone-home needed)
- Customer data handled by LemonSqueezy (PCI compliant)
- Key gen service has no database access to orchstep engine
