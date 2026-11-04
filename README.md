# POLYBOT — 3D-first personal investing command center

**Current stage:** tested accounting primitives + 3D-first Next.js starter using **synthetic demo data only**. **NOT LIVE.** No Step connection, no trade access, no market quotes, no Supabase project, no deployment. No personal brokerage credentials or real holdings are stored here.

The existing `polybot-portfolio-command-center-v2.html` and V4 `POLYBOT_holographic_command_center.html` remain historical UI references. This project is the planned canonical Next.js codebase. Current modules: Command Deck, Stock Intel, Portfolio, BTC Terminal, Home Control. In this starter only the Portfolio Room is functional, and its values are simulated.

## Quick local run (Windows PowerShell)

1. Install [Node.js LTS](https://nodejs.org/en/download), [Git](https://git-scm.com/downloads), [VS Code](https://code.visualstudio.com/download). Reboot terminal after installing.
2. In VS Code terminal:

```powershell
git clone https://github.com/lik-08/polybot.git
cd polybot
node -v
npm install
npm test
npm run dev
```

3. Open http://localhost:3000. Click **Enter portfolio room**, scrub the chart, compare attribution, return to the 3D city.
4. Once package installation is confirmed, commit the generated `package-lock.json` for reproducible CI (`npm ci` thereafter).

If starting from the ZIP instead, unzip and run `npm install`, `npm test`, `npm run dev` inside the extracted `polybot-v5-starter` folder.

### Why there is no lockfile yet
This preparatory environment cannot access the npm registry, so `npm install`, `next build`, TypeScript compilation, and actual browser execution could not be verified. `node --test` **did** run successfully against the pure accounting code. The package version ranges are preparatory; resolve and audit dependencies on your machine, then commit the lockfile. Do **not** mark this production-ready until it builds and passes browser tests.

## Architecture and status

- Next.js, React 19, TypeScript, React Three Fiber + Drei + Three.js for the spatial city.
- TradingView Lightweight Charts v5 for high-precision crosshair and historical chart interactions, rendered in the immersive portfolio room with accessible DOM controls.
- A **pure** accounting module and eight passing tests for deposits, withdrawals, sales, dividends, fractional shares and ETF-sector exposure.
- An unexecuted, **review-required** Supabase SQL initial schema with owner-only RLS and a server-only snapshot writer. Do not apply until the Supabase project exists and an auth/access audit passes.
- Future integrations: secure manual Step holdings import, licensed market-data provider, durable quote collector, Supabase snapshots and realtime broadcast, accurate time-weighted returns, tax lots, ETF look-through, financial news citations and alerts.
- **Trading is intentionally disabled**; no automated sells, orders, or transfers.

## Data accuracy contract

A market **price** update is not the same as a share quantity update. The live app will require exact shares, cash balances and complete events. Market data origin, quote age, exchange coverage, account sync age and simulation state must always be visible. Do not infer old holdings from current positions or invent five years of history.

In production, the user's portfolio shall distinguish value change vs external deposits and withdrawals, sale proceeds vs money withdrawn, realized vs unrealized gains, and direct ETF group contributions vs look-through sector allocation. Historical values and returns will be displayed only when actual records support them.

## Credential safety

- Keep `.env.local` private; it is ignored by Git. Never commit private keys, trade tokens, brokerage login information or account exports.
- Browser-exposed variables **only** for safe publishable credentials; `NEXT_PUBLIC_` names are visible to every visitor.
- Supabase uses owner-only authentication + RLS. Service-side keys only on protected backend jobs, never in frontend bundles.
- A Vercel Hobby production domain can be public; use app-level authentication before loading personal account data.

## Production execution order

1. Run and test this 3D starter locally. Improve 3D performance on an 8-GB Windows laptop and iPhone.
2. Create Supabase project, review SQL schema and RLS with security advisors, add account/lot imports, confirm financial reconciliation with Step statements.
3. Establish Alpaca IEX demo price feed (or selected licensed provider); clearly label coverage/latency; no multi-user redistribution without approved rights.
4. Add Supabase scheduled collection, market calendar, exact snapshot interval and backfill, realtime Broadcast and stale-feed alerts.
5. Implement accounting-grade P&L, per-stock attribution, sector classification, ETF overlap, benchmarks, performance and alerts; test with verified records.
6. Connect Vercel Git deployment + secure domain + environment variables, preview testing, CI and performance budgets.
7. Owner daily usage; only after sufficient testing assess commercial multi-user setup and data licenses.

See [docs/RESEARCH_AND_SETUP.md](docs/RESEARCH_AND_SETUP.md) for evidence, app/plugin settings, responsibilities and fast computer-use vs manual workflow.