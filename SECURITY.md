# GARDIN security baseline and production checklist

This is a pre-launch/waitlist site, not a live shop. There is no card collection,
payment processing, customer login, inventory, or order database. This hardening
does not certify legal compliance, eliminate all vulnerabilities, or make the site
ready to sell cosmetics. Do not collect card details through Formspree.

## Implemented

- Supported Next.js/React release lines with pinned versions and a lockfile.
- Per-request script CSP nonces, dynamic/no-store HTML, no eval in production,
  anti-framing, MIME sniffing protection, restricted browser permissions, HSTS
  in production, and no public browser source maps or framework header.
- Same-origin JSON-only waitlist submissions. Configure SITE_URL for a custom
  domain; Vercel's deployment hostname is accepted from its server environment.
- 4 KB streamed-body cap, read timeout, length/type/field validation, honeypot,
  rate-limit responses, bounded memory buckets using hashed keys, and safe errors.
- Formspree is the only upstream submission target; redirects are rejected,
  requests time out, and no customer payloads are written to application logs.
- Secrets/env files are ignored by Git. Never commit or paste live API keys.
- Images can only be optimized from local /images/ assets, not arbitrary hosts,
  private networks, redirects, or SVG sources.

The CSP intentionally permits inline **styles**, not arbitrary inline **scripts**,
for next/image style attributes and the existing design. Google Fonts remains a
third-party dependency/data flow and needs privacy review or self-hosting.

## Required before production/payment launch

1. Review the diff, run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`,
   `npm run build`, and `npm run audit:production`. Patch new findings promptly.
2. Use an up-to-date supported Node.js LTS patch, HTTPS, MFA for GitHub/Vercel/
   Formspree/payment accounts, least-privilege collaborators, and separate
   sandbox/production credentials. Review repository history for leaked secrets.
3. Configure persistent host-level/WAF rate limits and bot protection for
   `/api/subscribe`. The in-process fallback is NOT shared across serverless
   instances and resets on deploy. On non-Vercel hosts, unverified clients share
   a fallback bucket; configure trusted ingress and distributed limits there.
4. Check nonce-bearing HTML is not CDN-cached. Verify browser hydration, fonts,
   images, video, form validation, and CSP reports on a preview deployment before
   promoting it. Do not loosen script CSP to make new integrations work blindly.
5. Confirm Formspree anti-spam settings and lawful collection/retention/privacy
   notices. Audit international transfers for Vercel, Formspree, fonts, logs,
   and any future email/database provider with a Turkish legal professional.
6. Obtain seller eligibility, payment-provider approval, and Turkish tax,
   consumer-sales, invoicing, and cosmetics compliance advice before taking money.
   Individual payment-link eligibility is NOT a blanket tax/product exemption.
7. Build a separately reviewed order backend before implementing cart/checkout:
   authoritative server prices in integer kurus/TRY, inventory checks, private
   orders, verified signed callbacks, amount/currency/order matching, idempotent
   payment transitions, refunds, reconciliation, and no storage of PAN/CVV.
8. Add monitoring, alerting, retention limits, tested backups, incident procedures,
   and an independent security test before a live payment rollout.

Nothing here changes deployed hosting/account settings automatically. No payment
accounts were opened, no real signup/payment was sent by the automated tests,
and no legal text or consent was fabricated on the seller's behalf.
