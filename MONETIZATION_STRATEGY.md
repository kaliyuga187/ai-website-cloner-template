# AI Website Cloner Template — Monetization Strategy (DRAFT)

> Status: **draft**. Repo is a GitHub template that pairs with the `/clone-website` skill — point at a URL, run the skill, Claude Code rebuilds the site pixel-perfect via Chrome MCP + parallel builder agents. This is a tool that *enables* monetization, not a product that sells directly.

## What's monetizable

Three angles, ordered by lift-to-effort:

1. **Done-for-you cloning service** — operator runs the tool for clients.
2. **Premium template tiers** — paid variants with better defaults.
3. **Affiliate / referral on Claude Code** — natural fit since the tool requires it.

## Revenue mechanics

### A. Done-for-you service (primary, highest revenue/effort ratio)

- "Clone your competitor's landing page in 24 hours" — $499–$2,500 per clone.
- Customer hands over a URL + a goal (e.g., "replace their CTA with ours"); operator runs the tool, customizes the output, delivers a deployable Vite/React app.
- ICP: indie hackers, marketing teams, agencies pricing rapid iteration.

### B. Premium template add-ons (secondary)

- Free OSS template + paid add-ons:
  - $79 one-shot: "Multi-page clone pack" (extends `/clone-website` to whole sites, not just landing pages)
  - $149 one-shot: "Deploy-and-go" add-on (auto-deploys to Vercel/Netlify with custom domain wiring)
  - $29 one-shot: pre-built `TARGET.md` recipes for common site types (SaaS landing, ecom, portfolio)

### C. Affiliate / referral on Claude Code (tertiary)

- README already links to Claude Code docs. Add a referral link if Anthropic offers one.
- Low effort, low revenue, but free money if the affiliate exists.

### D. Carbium swap-fee hook — N/A

No on-chain surface. Skip.

## Sequencing

1. **Build a portfolio of 5 public clones** to advertise the service. These are also marketing assets.
2. **Open the done-for-you channel** via a single Gumroad or Stripe checkout page. Lowest-friction proof of demand.
3. **Premium add-ons ship after** ≥10 paid done-for-you jobs (proves the workflow + reveals which add-ons users actually want).

## Risks

- **Legal**: cloning trademarked/copyrighted sites for clients can be infringement. Restrict service to: client's own sites (redesign), public design references (inspiration only with substantial changes), or generic patterns. Add a one-line ToS.
- **Tool dependency**: requires Claude Code with Chrome MCP. Pricing must absorb the operator's Claude Code subscription cost.

## Out of scope for this draft

- Self-serve hosted version (users supply URL → automatic clone) — high abuse risk (DMCA, scraping ToS violations) without a human gate.
- Browser extension — out of repo scope.

## Open questions for the operator

- Comfortable being the human-in-the-loop for done-for-you, or hands-off only?
- Existing audience / distribution channel for the service? (Cold acquisition for $499 services is hard.)
- Legal appetite — restrict to client-owned sites only, or accept broader inbound?
