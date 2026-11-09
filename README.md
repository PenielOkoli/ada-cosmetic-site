# GARDIN Cosmetics

Responsive pre-launch site built with Next.js 16 App Router, React 19, TypeScript,
and Tailwind CSS. It retains the green/pink design, local campaign media, looping
video, and 30 October 2026 pre-launch countdown. There is no cart or payment
integration yet. Waitlist details are forwarded server-side to the existing
Formspree endpoint.

## Local development

Use an up-to-date supported Node.js 22 or 24 LTS patch.

```bash
npm ci
npm run dev -- --port 3010
```

Open http://localhost:3010. The main page is in `src/app/page.tsx`, styling in
`src/app/globals.css`, and media in `public/`.

## Verification

```bash
npm run lint
npm test
npm run build
npm run typecheck
npm run verify:production
npm run audit:production
```

Build before running the standalone type check so Next.js can regenerate its
route types. Do not run build/type generation and the type check concurrently.
The production verification script starts/stops its own loopback-only server on
an available port and never sends a real signup to Formspree.

## Deployment and security

Set `SITE_URL` to the canonical HTTPS origin if using a custom domain. Copy
`.env.example` to an ignored local env file for configuration; do not commit keys.
Vercel provides its deployment hostname automatically.

See [SECURITY.md](SECURITY.md) for controls, residual risks, hosting-level
configuration, and the payment-launch checklist. In-process rate limits are
best-effort only; persistent WAF/rate limits and privacy/legal review remain
required. No payment-provider approval or regulatory compliance is implied.

The development-tool overrides patch minimatch's glob amplification issue and
postcss-selector-parser's selector-parsing issue; review/remove these overrides
when upstream dependencies incorporate the fixed versions.
