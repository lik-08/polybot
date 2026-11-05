# POLYBOT — Verified Research, Dependencies, Plugins & Execution Plan
**Research audit:** November 4, 2026 · **Scope:** owner-first app, future multi-user commercialization. This is a specification and starter, **not** proof of a live implementation.

## Verified architecture decisions

| Decision | What official sources establish | POLYBOT application |
|---|---|---|
| Node / Next | Next.js supports Windows; minimum Node v20.9; create-next-app defaults to TypeScript, App Router, ESLint and Tailwind. https://nextjs.org/docs/app/getting-started/installation | Node LTS; TypeScript/Next App Router. Create one canonical repo; do not start unrelated projects. |
| 3D stack | Stable React Three Fiber v9 pairs with React 19. v10 is alpha. https://r3f.docs.pmnd.rs/getting-started/installation | R3F v9 + Three.js + Drei. 3D city stays central. Feature-gated graphics settings for 8GB laptop/mobile. |
| Precise graph | Lightweight Charts v5 supports `series.update(...)`, crosshair callbacks and accurate coordinate/time APIs; requires TradingView attribution link. https://tradingview.github.io/lightweight-charts/tutorials/how_to/tooltips and https://github.com/tradingview/lightweight-charts | Use as a readable floating 3D-room panel with accessible 2D overlay/fallback, NOT replace the 3D world. Preserve source attribution. |
| Live prices | Alpaca Basic (free) only covers real-time IEX US stocks/ETFs, 30 websocket symbols, and has historical restrictions. Paid Algo Trader Plus was listed as $99/month when checked; plan and terms can change. https://docs.alpaca.markets/us/docs/about-market-data-api | Start with free research feed, test 20-symbol portfolio accuracy, mark `IEX-only` and quote age. A visually animated number is never allowed to masquerade as a quote. Explore SIP only if needed/affordable. |
| Streaming | Alpaca supports WebSockets but commonly only one connection per account. https://docs.alpaca.markets/us/docs/streaming-market-data | A SINGLE secure server-side market-data consumer/fan-out, never expose Alpaca secrets or open one feed per user browser. A cron poller is fallback, not tick-perfect. |
| Collection | Vercel Hobby cron once/day minimum; Supabase Cron schedules jobs from seconds to yearly and invokes Edge Functions. https://vercel.com/docs/cron-jobs/usage-and-pricing and https://supabase.com/docs/guides/cron | Vercel hosts frontend/API; Supabase Cron + secured Edge Function can sample 1m/5m. Verify latency, invocation quotas and plan costs; a continuous websocket needs an appropriate persistent worker, not a serverless cron alone. |
| Secure DB & Realtime | Supabase owner RLS and Broadcast recommended for scalable realtime. https://supabase.com/docs/guides/database/postgres/row-level-security and https://supabase.com/docs/guides/realtime/subscribing-to-database-changes | Apply audited migrations only after Supabase project exists; private user financial data. Use private Broadcast channels when multi-user. Browser never uses service/admin secrets. |
| Broker sync | Plaid investments data updated ~1–4 times/day rather than minute by minute; some institutions have limited coverage. https://plaid.com/docs/investments/ | Begin manual exact holdings and dated cash/trade imports. Verify STEP/DriveWealth coverage with the provider inside a consent flow. Never claim Step API support without proof. |
| Hosting privacy | Vercel Hobby protects preview deployments with authentication, **not public production domains**. https://vercel.com/docs/deployment-protection | Add application-level Supabase Auth before showing real brokerage balances; do not rely on deployment protection alone. |
| Data licensing | Chart library's Apache-2.0 license does not grant quote resale rights. TradingView attribution required. https://github.com/tradingview/lightweight-charts | Before marketing POLYBOT to users, separately negotiate/verify exchange/vendor display, redistribution and commercial usage rights. |

## Feature-complete specification and implementation gates

**A. 3D shell:** command city, click/tap to enter portfolio building, portfolio room, floating chart panels, smooth transitions, optional voice controls only with permission, accessible buttons/fallback, screen-size adaptation, low-graphics mode and `prefers-reduced-motion` support. Keep Command Deck, Stock Intel, Portfolio, BTC Terminal, Home Control entries. Performance budgets: test on Windows 8GB laptop and iPhone; cap DPR, minimize lights/draw calls, suspend invisible 3D frames, unload unused scenes, monitor memory and FPS. Don't add large post-processing effects by default.

**B. Personal index & charts:** 1m, 5m, 15m, 30m, 1h, 1D, 1W, 1M, 3M, 1Y, 5Y, ALL. Chart line calculated from exact fractional shares * time-aligned market prices + actual brokerage cash. Crosshair touch drag/click/keyboard: time in America/Detroit, account value, market P&L, top contributor, max/min with accurate timestamp. Realtime display only responds to genuine market values and identifies feed status (streaming IEX, 15m delayed, stale, closed, simulation). Persist snapshots and backfill only where supported.

**C. Accounting:** cash-flow-adjusted dollar returns; time-weighted returns at external cash flow boundaries; XIRR as optional investor-experience measure; daily P&L vs prior close; selected-week/month P&L vs proper period boundary. Show cash deposited, cash withdrawn, stock sold, realized profit, unrealized profit, dividends, net flows, fees/withholding individually. Never equate sales with withdrawals or combine realized and unrealized without double counting. Include fractional shares, corporate actions, splits, dividend reinvestment, trade/settlement timestamps, fee handling, closed markets and missing basis. Tests MUST reconcile ending value to starting value + external flows + investment P&L.

**D. Attribution:** per-holding dollar and percentage changes, weighted group contributions, sector rank and ETF look-through. Distinguish direct group buckets (AI, ETF foundation, power/grid, rest) from underlying economic sectors. Underlying ETF data has weights/as-of date and uncovered portion. Prevent double-counting overlap (VOO/NVDA); permit comparison with VOO benchmark, max drawdown, beta/correlation, concentration and sector weights. If coverage stale/missing say unknown.

**E. Assistant/alerts:** user asks why portfolio moved; quote data and trade records identify drivers, verified cited news explains possible catalysts, uncertainty labeled. Never invent reasons or automatically trade. Read-only alerts for thresholds can be a later integration, with rate limiting, daily digest and user opt-ins. AI explanations require a chosen model/API, privacy policy and explicit cost budget.

**F. Multi-user later:** Auth, verified permissions, isolated portfolios, encryption, privacy and export/deletion, billing, audit logs, market data licensing, load tests, terms and support processes. FIRST prove owner utility; no commercial launch by default.

## Account & integration inventory (inspected November 4, 2026)

| Service | Current observed status | What to do | Settings & permissions |
|---|---|---|---|
| GitHub via ChatGPT | Connected as `lik-08`; `lik-08/polybot` exists, public, empty | Use as single code repository. Keep test/demo data only on public main. | Enable 2FA; review repository visibility; don't commit `.env.local` or account exports; protected main/PR checks once CI works. |
| Supabase via ChatGPT | Connected connector; **no projects** returned | Create dedicated POLYBOT project, then set Auth, RLS and secret handling after code audit. | Owner authentication, no public finance data, RLS policy tests, key rotation, PITR/backups if plan provides, SQL advisors, Vault, Cron and rate limits. |
| Vercel via ChatGPT | Connected connector; **no projects** returned | Import GitHub repo after local build runs; preview first, avoid production until auth. | Root directory `/`, Framework Next.js, Node supported LTS, production env/secrets (server-only), preview env, spend alerts/budget, deployment protection. |
| Market provider (Alpaca candidate) | Not connected to POLYBOT | Create API account separately if chosen; verify ticker coverage and licensing. | Read-only market data credentials; server-side secret; use IEX label; track quote freshness/errors, cap usage. |
| Step brokerage | No verified programmatic read-only sync | Manually import securities, *exact fractional shares*, dates, deposits, withdrawals, sales, fees and cash to begin. Later test available aggregator. | Never give broker login directly to ChatGPT or put statements in public repo; user-authorized read-only sync only. |
| VS Code / Node / Git / browser | Windows laptop anticipated; local installs not verified | Install Node LTS, Git, VS Code; optional GitHub Desktop; open repo. | Windows terminal, browser WebGL enabled, current graphics drivers. No Java runtime needed. |
| ChatGPT Work Computer Use | User may choose Work mode; desktop control availability depends on plan and app | Can ask Work to operate your computer/repo through a supported computer session and debug interactively. | Explicit connection/session, review actions before approving; do not share secret keys in chat. Use constrained scope. |
| Optional error monitoring | Not yet installed | Add Sentry-like monitoring when app has real users; start with native Vercel/Supabase logs. | Redact portfolio personally identifiable records; error privacy and sampling. |
| Optional analytics | Not yet installed | Add privacy-first aggregate product analytics after owner workflow works. | Consent, retention policy, no raw dollar figures in analytics events. |

**ChatGPT plugins:** GitHub, Supabase, and Vercel are already connected as tools. Do not add unnecessary plugins for Node/Three.js/TradingView: those are npm packages/SDKs inside the app. ChatGPT account connections are not the same as creating a Vercel project, a Supabase project or authorizing an external market-data provider.

## Necessary secrets and variables (once projects exist)

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` may be exposed to browser ONLY with working RLS; never client-side service role keys.
- `SUPABASE_SECRET_KEY` stays only in protected server functions, with least-privilege access. Prefer Supabase Vault for scheduler secrets.
- `ALPACA_API_KEY_ID`, `ALPACA_API_SECRET_KEY` stay server-only, never `NEXT_PUBLIC_` or public repo.
- Additional optional LLM key stays server-only; not needed for first portfolio MVP.
- `*.env`, `.env.local`, `.vercel` must remain ignored; rotate leaks immediately. Keep production, preview, development environment separate.

## Best execution order with no wasted paid setup

**Stage 0 — Ready now:** Download starter or clone once GitHub files are uploaded; `npm install`, `npm test`, `npm run dev`. Confirm city, portfolio room, simulated touch crosshair, low-graphics mode; fix actual compiler/graphics errors on desktop. `package-lock.json` must be committed after installing; verify security advisories with `npm audit` before live use.

**Stage 1 — Actual holdings:** Owner exports or manually enters Step records privately. Implement import validation, cash ledger, lots and all tested accounting methods. Verify daily/monthly P&L against statement; show unknown when missing data. Do not switch to live status just because a ticker quote works.

**Stage 2 — Supabase:** Create project, install `@supabase/supabase-js` and `@supabase/ssr` AFTER choosing Auth flow. Apply reviewed migration via CLI; run RLS/security advisor tests. Set owner-only auth. No public access.

**Stage 3 — Live data:** Create read-only market API credentials if provider agreed; implement secured backend quote collector and client refresh. Test IEX coverage, no stale prices, market hours, retries, rate limit, logs. For frequent snapshots, Supabase Cron + Edge Function may collect 1m/5m; for continuous full feed use persistent worker subject to plan/cost. Implement idempotency, dedup, retention and quote timestamp source.

**Stage 4 — Attribution, history and research:** True daily/month/range performance, sector/ETF look-through from licensed fund constituent data, benchmark, risk attribution and company-news citations. Add missing-history indicators for 5Y. Keep verified historical records, and expose both contribution dollars and percent.

**Stage 5 — Deploy and harden:** Link GitHub to Vercel, preview deploy, protected access, environment variables, CI tests, branch protection, backups, logging, performance budgets and cost alert. Commercialization only after market-data distribution/licensing, multi-tenant security, disclosures, and sustained personal validation.

## Fastest ways to execute on Windows desktop

**A. Computer Use / ChatGPT Work (fastest assisted route, if available):** Use ChatGPT's Work mode with its supported connected browser/computer features. Open local VS Code and GitHub repo, grant needed session permissions, then ask: "Open `lik-08/polybot` and the POLYBOT blueprint. Install dependencies, run tests, start dev server, find and fix errors, preserve the 3D city/portfolio room, commit a feature branch, and show me the preview before any production deploy. Never expose secrets or pay for services without asking." This is interactive, not unattended in this ordinary chat. Review proposed writes and approvals.

**B. Manual route (reliable fallback):** Install Node LTS + Git + VS Code. Clone GitHub repo if starter code is committed; otherwise unzip the provided starter. Open the folder in VS Code Terminal (PowerShell):

```powershell
node -v
npm -v
npm install
npm test
npm run dev
```

Open `http://localhost:3000`. If `npm run dev` works, do `npm run build` and `npm run lint`. Publish code with `git add .`, `git commit -m "Initialize POLYBOT 3D starter"`, `git push` only after reviewing changed files; do not commit API keys.

**C. AI developer workflow with reduced manual copy/paste:** Use ChatGPT Work with the local project, or a code assistant installed in VS Code that can modify working files and run commands after explicit permissions. Keep all changes in the SAME repository and require `npm test`, `npm run build`, screenshots and a changelog before merging.

## Explicit constraints / no overpromises

- **Today:** This starter's `node --test` accounting checks passed in this environment; Next build/runtime cannot yet be verified because registry network access is blocked here. GitHub repo exists; Supabase and Vercel projects do not yet exist. Live features are not connected.
- **Minute chart:** a 1m *view* is different from a 1m *data freshness* promise. Free IEX may not match Step's consolidated market valuations; source and delays must be disclosed.
- **Five years:** only possible using records from the period and licensed historical prices; do not backfill currently owned shares into prior years.
- **Cost:** Start no-paid with demo and manual portfolio, then measure provider usage. No automatic deployment, paid subscriptions or auto-trading.

## Primary sources
- Next.js: https://nextjs.org/docs/app/getting-started/installation
- React Three Fiber v9 and Next: https://r3f.docs.pmnd.rs/getting-started/installation
- Lightweight Charts: https://tradingview.github.io/lightweight-charts/tutorials/how_to/tooltips ; https://github.com/tradingview/lightweight-charts
- Alpaca data: https://docs.alpaca.markets/us/docs/about-market-data-api ; https://docs.alpaca.markets/us/docs/streaming-market-data
- Supabase Cron: https://supabase.com/docs/guides/cron ; https://supabase.com/docs/guides/functions/schedule-functions
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase realtime Broadcast: https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
- Vercel cron: https://vercel.com/docs/cron-jobs/usage-and-pricing
- Vercel deployment protection: https://vercel.com/docs/deployment-protection
- Plaid investments: https://plaid.com/docs/investments/

## Current source-control status and local execution (Nov 4, 2026)

- Canonical source repository: `https://github.com/lik-08/polybot`. Main branch initially contains only the starter README. The researched 3D starter is prepared on branch `feature/3d-portfolio-v5-research`; do not claim it is merged or deployed unless that is verified.
- Fastest manual Windows path (once the branch exists): clone, `git switch feature/3d-portfolio-v5-research`, `npm install`, `npm test`, `npm run build`, `npm run dev`, open http://localhost:3000. Node must meet current Next.js minimum.
- Fastest assisted path: use ChatGPT Work/Desktop Computer Use to open VS Code in the cloned repo, inspect files, run the same commands, read errors and edit on a feature branch. Work is a user-initiated mode, not something this chat can silently enable. Review code changes before merges or Vercel production deployments.
- Do not add any brokerage or paid data plugins unless needed, and do not enable trade/write permissions for a portfolio tracker. Required connections initially: GitHub; Supabase and Vercel when the owner approves creating projects. A read-only market-data provider is needed for actual quotes; optional read-only broker aggregation after Step support is verified.
- Protect API keys in Vercel/Supabase backend environment secrets; public browser variables only for publishable keys. Authenticate before exposing user balances. Personal investment data must not be pushed to a public GitHub repository.
- Fix applied before GitHub submission: a one-minute range has at most 61 unique Unix-second samples; avoid duplicate time keys in Lightweight Charts. The 3D demo keeps non-portfolio buildings non-navigable until their modules exist.