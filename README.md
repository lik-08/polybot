# POLYBOT — 3D-first personal investing command center

**Current stage:** 3D-first Next.js workspace with a private manual event ledger and a separate synthetic demo. **NOT LIVE.** No Step connection, trade access, automated market quotes, Supabase project or deployment. No personal brokerage credentials or real holdings are bundled in the repository.

The existing `polybot-portfolio-command-center-v2.html` and V4 `POLYBOT_holographic_command_center.html` remain historical UI references. This is the canonical Next.js codebase. Current module entries: Command Deck, Stock Intel, Portfolio, BTC Terminal, Home Control. Portfolio supports manual records and a clearly separated synthetic chart demo; other integrations remain planned.

## Quick local run (Windows PowerShell)

1. Install [Node.js LTS](https://nodejs.org/en/download), [Git](https://git-scm.com/downloads), [VS Code](https://code.visualstudio.com/download). Reboot terminal after installing.
2. In VS Code terminal:

```powershell
git clone https://github.com/lik-08/polybot.git
cd polybot
git switch feature/3d-portfolio-v5-research
node -v
npm ci
npm test
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3000
```

3. Open http://localhost:3000. Click **Enter portfolio room** for your empty manual workspace, or **Explore synthetic demo** to scrub the demonstration chart. Return to the 3D city without losing session records.
4. The generated `package-lock.json` now records the verified dependency resolution. Use `npm ci` for reproducible installs. Review local changes before committing or pushing.

If starting from the ZIP instead, unzip and run `npm install`, `npm test`, `npm run dev` inside the extracted `polybot-v5-starter` folder.

### Local validation — November 4, 2026
Dependencies are now installed and locked. The unpublished `lucide-react@0.450.0` request was replaced with published `0.451.0`; building geometry now passes its intended `height` prop. Accounting tests, ESLint, and the Next.js build have been exercised locally. Browser checks cover the 3D city, room navigation, all 12 ranges, keyboard scrubbing, attribution, low-graphics mode, and mobile layout. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for final results and limitations. This remains a synthetic prototype, not a production-ready or live account application.

On this Windows workspace, set `$env:NEXT_TELEMETRY_DISABLED='1'` before build/dev to avoid Next.js telemetry configuration writes outside the checkout. The HQ Python commands belong to the separate collector; do not use `PolyBot.cmd start` to launch this Next.js app or start a second collector. The supplied Three.js source ZIP is not needed: this app uses its locked npm dependencies.

The affected TypeScript lint dependency now uses a targeted `minimatch@11.0.1` override; both full and production-only audits report zero vulnerabilities. The [upstream advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249) identifies the affected versions. Keep the override under review as the parent dependency adopts the fix; do not force unrelated framework downgrades.

## Private manual workspace

- Record deposits, withdrawals, fractional-share buys/sells, dividends, fees and splits. Cash must cover every event; sales cannot exceed held shares. Sale proceeds remain separate from external withdrawals.
- Weighted average cost includes purchase fees; realized gains deduct sale fees. This is an explicitly disclosed bookkeeping method, **not tax-lot accounting**.
- Enter dated manual prices. Valuations replay only events through that instant. Missing held prices produce an unavailable total; earlier prices and present holdings never fill missing history.
- Import a versioned JSON backup through review before replacement. See `/manual-ledger-format` in the running app. Limits: 512 KB, 1,000 events, 500 valuations and 100 tickers. No personal data is bundled or transmitted.
- Records are session-only by default, including city/demo navigation. Device storage is opt-in, unencrypted and subject to browser clearing. Export private backups. Cross-tab changes prevent stale saves/deletes; export unsaved changes before reloading on a conflict.
- Manual event/valuation forms accept device-local timestamps; leaving time blank records the submission time. Display uses America/Detroit. Snapshot metrics stop at their stated time even when newer ledger events exist.
- Day/month/TWR/XIRR, tax lots, verified sector/ETF attribution, benchmarking and live feeds remain future work. Unknown metrics are not simulated in the manual workspace.

See [integration gates](docs/INTEGRATION_GATES.md) for the owner inputs and secure cloud work that remain. The prepared GitHub Actions workflow runs locked installation, tests, lint and build only; it never deploys.

## Architecture and status

- Next.js, React 19, TypeScript, React Three Fiber + Drei + Three.js for the spatial city.
- TradingView Lightweight Charts v5 for high-precision crosshair and historical chart interactions, rendered in the immersive portfolio room with accessible DOM controls.
- Pure accounting and manual-ledger modules with regression checks for cash flows, average-cost sales, splits, fractions, exposure, invalid inputs and missing historical prices.
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

### Current feature-branch scope
Until this starter is merged into `main`, use `git switch feature/3d-portfolio-v5-research` after cloning. This branch is for review/testing and is **not a production launch**.

The minute-range synthetic chart deliberately uses 61 unique integer-second samples for 1m; other ranges use 101 points. Real quote feeds must never fabricate interpolation as actual trades.
