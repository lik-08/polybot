# POLYBOT — Canonical Master Project Blueprint
**Version:** 5.1 · November 4, 2026
**Status:** 3D-first local Next.js workspace, private manual event ledger, reviewed import/export, dated manual valuations, and separate synthetic chart demo. NOT an authenticated, broker-synced, live-market app. Supabase and Vercel project creation remain pending. Current verification is in `../PROJECT_STATUS.md`.
**Canonical specification:** This file (`POLYBOT_MASTER_BLUEPRINT.md`) is the single point of reference for future feature additions. GitHub repository was verified as `lik-08/polybot` (connected, public, empty at start of v5); it is the intended single source of truth. Keep private finance data out of it.

## 1. Product purpose and build principle
Build the tool **for its owner first**, use it daily to learn which financial decisions it improves, then consider offering a secure multi-user product. Maintain the original immersive **3D holographic city / enter a building / enter a portfolio room** concept. Do not replace it with a conventional flat dashboard. Precise charts and accounting can be implemented as readable surfaces inside the 3D environment.

**Owner's desired experience:** A live portfolio number that rises and falls as quotes arrive; a chart that moves like a stock/BTC line; finger, mouse, keyboard or future voice control to scrub exact times; explanations of which stock, sector and ETF group contributed to every change; clear day/month/multi-year profit and money-flow accounting. The wider POLYBOT app retains its other modules.

## 2. Baseline and files recovered
- Original `polybot-portfolio-command-center-v2.html` (Library): cyan/dark-blue holographic selector; rotating 360° module carousel; **Command Deck, Stock Intel, Portfolio, BTC Terminal, Home Control**; 20-holding Step manual snapshot; limited browser microphone commands; research console. **Not live.**
- V3 (`POLYBOT_holographic_command_center_v3.html`): adds depth-styled interactive portfolio room, chart scrubbing, 15M/30M/day/week/month/year/ALL, range extremes, simulated contribution groups.
- V4 (`POLYBOT_holographic_command_center.html`): preserves V3 and adds minute-to-5-year controls; play/pause chart-demo animation; current-like changing chart readout with conspicuous *simulated data* label; illustrative today/month/selected-range P&L; deposits, withdrawals, sale proceeds, dividends and realized-profit fields; sector-vs-investment-group contributor toggle; strongest/weakest rankings. **This is still standalone HTML and synthetic numbers — not Three.js, not Step sync, not live pricing.**

## 3. Final app navigation and interaction
- 3D environment built with Three.js + React Three Fiber; holographic rotating command modules; enter a portfolio room with a floating portfolio display, portfolio value, P&L tiles, sector holograms and other existing POLYBOT modules. Mobile touch, desktop pointer and keyboard work.
- Chart has fixed timeframes **1m, 5m, 15m, 30m, 1h, 1D, 1W, 1M, 3M, 1Y, 5Y, ALL**. Here lowercase **m = minute**, uppercase **M = month**. Each range shows actual available history only.
- Chart must be scrubbable via touch drag/click hover. Crosshair tooltip: localized date & time (America/Detroit) with market timezone if different, total account value, investment gain/loss for the selected subperiod, percentage, deposits, withdrawals and top positive/negative contributors. Show precise range high/low and time, without claim of exchange-tick precision if only 1-minute snapshots exist.
- Show **live status/freshness**: Streaming/real-time from stated feed, delayed by X minutes, stale, market closed, manual data, or simulation. Last quote and last holdings sync timestamps. **Never animate arbitrary dollar movement and label it live.** Only actual quote updates change the live money figure. Realtime does not imply all exchanges are represented; verify feed coverage.
- Investment groups selector (AI/tech, ETF foundation, power/electrification, others) versus **economic sectors** (technology, industrials, utilities, energy, healthcare, consumer, financials etc.). Select any segment or stock for dollar contribution, percentage return, weight, current value, and recent movement. Rank *highest lift* and *largest drag* over selected range. Every contribution reconciles to overall investment P&L (plus separately disclosed income/fees/rounding).
- ETFs: distinguish **direct holdings** from **underlying economic exposure**. Implement look-through using holdings weights and their update dates, with unclassified bucket for stale/unavailable data. Prevent double counting in allocation totals; expose overlapping positions (e.g. NVIDIA held directly and inside VOO).
- Risk analysis: compare portfolio with benchmarks such as VOO, track maximum drawdown, core/satellite mix, sector exposure, concentration, correlation and alerts with meaningful context. No automated trades in initial release.

## 4. Financial accounting and user-facing definitions
**Must never confuse price change, new money, selling, or cash withdrawals.** Show clearly labeled USD and percent values. Calculate with event-level holdings and broker cash history, not only screenshots of a daily balance.

| Product metric | Exact meaning / intended calculation |
|---|---|
| **Total portfolio value** | Sum of market value of shares/fractional shares + brokerage cash + any supported assets, measured at same timestamp. |
| **Period investment gain/loss ($)** | Cash-flow-adjusted investment result. For a period with beginning and ending valuations and external transfers: ending value − beginning value − external deposits + external withdrawals, with timing-aware methods for precise subperiods. Include credited dividends; account separately for disclosed fees. |
| **Time-weighted return (%)** | Chain subperiod returns separated by external cash flows, using valuations at flows; avoids treating deposits as investment performance. |
| **Money-weighted return (%)** | Investor-experience return incorporating timing and size of deposits and withdrawals (XIRR with suitable cash flow records). |
| **Unrealized P&L** | Open position market value minus allocated cost basis, adjusted for splits and corporate actions. |
| **Realized P&L** | Sales proceeds minus cost basis of lots sold and associated fees; method, trade dates, and pre-tax status disclosed. |
| **Sold today / selected period** | Gross proceeds of securities sold (internal change from securities to brokerage cash); **not an external withdrawal** and not the same as realized profit. |
| **Cash withdrawn** | Cash transferred OUT of brokerage to an external account. Show today, month and selected range. |
| **Cash deposited** | External cash contributions to brokerage; not investment gains. |
| **Dividends** | Gross cash dividends credited, by instrument/date, with separate tax withholding/fees as available; avoid double counting within total portfolio gain. |
| **Net cash flow** | Deposits − withdrawals, with sales and purchases excluded as internal allocation changes. |
| **Holding/sector contribution** | Position quantity history × price changes for each relevant subperiod, adjusted for buy/sell timestamps and corporate actions; sum by direct groups and optionally ETF look-through sectors without double counting. |

Daily session P&L should use a defined benchmark (previous regular close or start of session); month uses prior month-end/start-of-month rules. Provide separate **realized vs unrealized** panels that do not double count realized gains in the daily performance calculation. Report if no accurate basis/transaction history exists and do not infer taxes. Handle days without trading, holidays, pre/post-market toggles and stock-vs-crypto trading hours.

### Visible metrics in portfolio room
1. Large continuously updated **account value** (only actual data in live mode) and daily dollar and % P&L.
2. Always-visible **today investment P&L** and **this-month investment P&L**.
3. At selected crosshair / range: period gain/loss, realized P&L, unrealized P&L, cash withdrawn, cash deposited, sold proceeds, dividends, and account change.
4. Show `day`, `week`, `month`, `3 months`, `year`, `5 years`, `all` plus the minute/hour ranges; crosshair, high/low, gains/losses, contribution ranking and source/freshness work in every supported range.
5. Live attribution: group and sector contributors with biggest up/down, plus total contribution reconciliation and top individual stocks.
6. Clearly indicate when some metric cannot be calculated because the Step connection, transaction lots, costs, exact quantities, or sufficient history is missing.

### Historical availability
A 5Y control is a **feature**, not a claim that five years of the owner's records currently exist. Start persisting forward. Only reconstruct earlier history when the broker can supply trades/deposits/splits and licensed historical prices; do not backfill with the *current* holdings as though owned five years ago. For long ranges, downsample stored data carefully for performance while retaining raw historical records and accurate extrema.

## 5. Core data architecture
- **Client:** Next.js App Router, React/TypeScript, React Three Fiber/Three.js/Drei 3D scene, GSAP animations where appropriate, accessible fallback UI, TradingView Lightweight Charts rendered to a readable panel/surface in the room, responsive iPhone/desktop gestures.
- **Market feed:** research and confirm a licensed stock market-data provider (Alpaca/IEX or alternate); permissions for real-time US equities and ETFs, coverage quality, trade/quote latency, authenticated streaming, REST backfill, rate limits, after-hours, historical terms and resale/redistribution rights **before** implementation. 20 tickers is the approximate initial size; confirm exact supported count.
- **Broker data:** Step/DriveWealth holdings access may not provide a public self-serve API. Begin manual ticker + **exact fractional share quantity**, cash and event/lot imports. Research read-only aggregation if available; never ask for brokerage credentials in chat. Track provenance, import corrections and sync quality. Screenshots alone cannot reconstruct precise historical P&L.
- **Storage:** Supabase/Postgres with user/auth isolation and row-level security. Tables (at minimum): users, accounts, securities, position_lots, holdings_snapshots, cash_ledger (deposits/withdrawals/dividends/fees), trade_events, corporate_actions, quotes, account_value_snapshots, intraday_contributions, ETF_holdings_exposures, calendar_markers, provider_sync_status, feature_changelog. Use timezones, raw ingestion timestamps, unique/upsert keys, duplicate detection, retention limits and migrations. Protect API keys server-side.
- **Collection:** independent scheduled/streaming backend worker plus retry/backoff & data reconciliation, and a frontend subscription/polling layer. Avoid assuming Vercel Hobby cron supports minute-level jobs. Avoid unnecessary persistence of every quote if compression/aggregations suffice; choose 1m/5m sampling based on real feed/cost and device performance. Market values change only when new prices arrive.
- **Calculation service:** time-weighted and dollar P&L, XIRR where supported, realized lot method, current weights, sector and group attribution, checks that components reconcile with value changes and net cash flows, historical snap backfill where evidence supports it.
- **Security/privacy:** owner-only authentication initially, least-privilege read-only financial integration, encrypted secrets, row-level security, audit logs, backup/recovery, API budgets and rate limits. No auto trading; no transfer initiation.
- **Testing:** unit tests on deposits vs profits, transfers vs sale proceeds, splits, fractional shares, dividends, 0-share exits, negative markets, timestamps, missing/stale quotes; end-to-end iPhone touch/crosshair and keyboard, data mismatch alerts, connection dropouts, and performance on an 8 GB Windows laptop.

## 6. Roles and prerequisites — complete task inventory
### Owner provides / decides
- Confirm whether the existing Next.js/GitHub repository already exists; if yes provide the repository URL/name so we enhance it rather than recreate it.
- Install **Node.js LTS**, VS Code, Git if needed; provide screenshots of terminal errors only when they arise.
- Enter/import actual tickers and **fractional share quantities**, brokerage cash, and any available cost basis/transaction history. Decide what to do when Step sync is unavailable. Never send passwords or authentication tokens.
- Identify whether “took out” refers to brokerage withdrawal, gross stock sale, realized gain, or all of the above; **initial app tracks all separately** until decided.
- Choose data provider and pay for it **only after** trial coverage, licensing and costs are reviewed. Approve any paid service, live connection or deployment.
- Confirm preferred opening experience (city flythrough → building → portfolio room), chart style, and prioritization as further features are added; avoid locking into commercial launch prematurely.

### Assistant/research/development work
- Read this blueprint and current project/repository in every modification session; review and preserve earlier modules and existing code.
- Investigate live market-data freshness/rights/pricing, Step integration/export options and potential provider limitations. Compare costs and coverage; do not guess.
- Build the real **Three.js 3D room** first, then precise raycast/touch chart interaction, live quote collector, share/event imports and calculated totals.
- Implement and test daily/monthly/range P&L and fund transfers; implement sector/ETF look-through and contributor tables. Provide visible data-quality labels.
- Connect Supabase, GitHub, Vercel and optional assistant module only with appropriate permissions and configured keys. Audit security before any external users.
- Test accuracy against user-provided Step statements before calling the product live or marketable.
- Maintain this document, a tracked product backlog, change log and source control with every accepted addition. New chats should edit **the same canonical file and repository**, not spin off new prototypes.

## 7. Acceptance tests for the next production milestone
- [ ] Original Command Deck, Stock Intel, Portfolio, BTC Terminal and Home Control entry points still function.
- [ ] Actual 3D navigable room renders well on iPhone and Windows laptop; chart remains readable.
- [ ] 12 timeframe buttons work, including 1m and 5Y, and identify missing history instead of fabricating it.
- [ ] Touch, mouse and keyboard crosshair display correct timestamp/value and extremes.
- [ ] New genuine quote causes portfolio total + chart to update; stale/closed conditions visibly stop updates.
- [ ] Deposit of $100 changes account value +$100 but **does not** create $100 P&L.
- [ ] Withdraw $30 is classified as transferred-out cash, not a $30 loss.
- [ ] Sell $50 of stock without withdrawing creates $50 sale proceeds, not $50 withdrawn; realized P&L depends on cost basis.
- [ ] Dividend is counted once as investment income even if reinvested.
- [ ] Daily and monthly P&L plus range P&L reconcile to timestamped data; no double counting with realized/unrealized.
- [ ] Each segment's contribution rolls up to total market gain/loss; economic sector/ETF look-through excludes duplicates and exposes unclassified coverage.
- [ ] Price and holdings staleness disclosed; not one simulated value is mislabeled live.
- [ ] Secure auth, backups, monitoring and rate limits in place before public use.

## 8. Development order — 3D stays first
1. Audit existing repo/project and consolidate one repository, one master blueprint and one demo asset.
2. Create/update actual Next.js/React Three Fiber 3D city and portfolio-room shell with moving camera, mobile-safe interactions and a holographic 3D chart surface.
3. Reuse prototype interactivity: 12 range buttons, crosshair/time tooltip, performance and cash-flow tiles, contribution toggles, highs/lows.
4. Integrate accurate manual holdings, fractions, cash ledger, trades and cost basis; test accounting before live launch.
5. Validate real market-data provider; build quote stream/collector and Supabase history; show data status and market-hours handling.
6. Implement real attribution, ETF sector look-through, daily/monthly/range P&L, realized/unrealized and benchmark/risk panels; reconcile to Step.
7. Add secure auth, optional automated read-only brokerage import, optional AI explanations with verified citations, observability and multi-user product hardening.
8. Owner uses it daily and reports problems; prioritize fixes and proven utility before pricing/marketing.

## 9. Canonical technical stack
Node.js LTS • Next.js + React/TypeScript • Three.js/React Three Fiber/Drei • GSAP • Tailwind CSS • TradingView Lightweight Charts (or equivalent precise interactive plotting surface) • Supabase • GitHub • Vercel • licensed market-data provider (to choose after research). No requirement for Java programming.

## 10. Changelog
- **2026-11-04 v5.1:** Added a private local USD event ledger with exact fractional shares, deposits/withdrawals/trades/dividends/fees/splits, average-cost results, and missing-price-aware historical replay. Added manual forms, reviewed import/export, opt-in device storage with cross-tab conflict protection, preserved city/demo navigation, import documentation and a non-deploying CI workflow. Corrected accounting validation/ETF reconciliation/overflow, synchronized chart mouse/keyboard selection, removed remote scene-font loading and protected 3D failures. Full dependency audit cleared via targeted patched minimatch override. Integration gates document missing owner data and live/cloud prerequisites.
- **2026-11-04 local validation:** Installed and locked dependencies; corrected unavailable icon dependency and city building height prop. Preserved 3D visuals while respecting reduced motion, resetting chart hover on range changes, showing second-level short-range timestamps, and constraining mobile grid width. No cloud, personal-account, live-data or trading integration was activated. Local verification evidence is recorded in `../PROJECT_STATUS.md`.
- **2026-10-29–2026-11-01:** Original POLYBOT interactive snapshot with five modules and 20-holding explorer, rotating holographic selector and planned holographic city/room environment.
- **2026-11-04 v3:** Codified 3D-first direction, chart crosshair, ranges, movement attribution, ETF diversification/overlap and Next.js/Three.js architecture.
- **2026-11-04 v4:** Expanded to minute/hour/day/week/month/quarter/year/five-year/all timeframes; always-visible daily and monthly P&L; exact separate withdrawals, deposits, sale proceeds, dividends, realized and unrealized gains; sector-versus-group rankings; live number behavior/freshness; historical availability, data architecture, owner/developer task inventory, testable acceptance criteria and future commercialization safeguards. Updated interactive **simulated** HTML prototype accordingly.

## 11. Future change protocol
When user asks for a feature, treat it as a **change request to this ongoing POLYBOT product**. Compare it with the prior blueprint, add requirements/acceptance tests, modify the same repository or prototype if available, version the changes, and explain what has been prototyped versus what requires credentials/data/deployment. Use stable project names and paths rather than recreating unrelated prototypes. Chat memory is a discovery aid, not a guarantee that files or GitHub commits are updated; always commit/save actual artifacts.


## 12. Research and integration audit — v5 (2026-11-04)
- Verified single connected GitHub repository: `lik-08/polybot`; initially public and empty. ChatGPT connectors for Supabase and Vercel are present but each listed **zero projects**. No live integrations/deployments/permissions were activated.
- Verified **Next.js supports Windows, Node >=20.9**; use Node LTS and React 19 / React Three Fiber stable v9, not v10 alpha. The 3D city remains the core experience. Source: https://nextjs.org/docs/app/getting-started/installation and https://r3f.docs.pmnd.rs/getting-started/installation
- Live chart: use TradingView Lightweight Charts v5 inside a readable floating 3D panel for accurate touch/mouse crosshair; preserve attribution and link. Source: https://tradingview.github.io/lightweight-charts/tutorials/how_to/tooltips and https://github.com/tradingview/lightweight-charts
- Verified Alpaca Basic provides **free IEX-only US equity feed and up to 30 simultaneous ticker subscriptions**, not the entire consolidated tape. Do not represent IEX quotes as Step exact valuation. Commercial redistribution rights must be separately verified. Source: https://docs.alpaca.markets/us/docs/about-market-data-api
- **Supabase Cron** supports high-frequency scheduling and Edge Function invocation; **Vercel Hobby Cron** is once/day. Continuous ticks may require a separate long-lived collector, and scheduling must respect data API and hosting rate limits. Sources: https://supabase.com/docs/guides/cron and https://vercel.com/docs/cron-jobs/usage-and-pricing
- Plaid investment holdings refresh on daily/multi-daily cadence rather than every minute, and Step compatibility has **not** been verified. Maintain exact manual/share event import first; price feeds separate. Source: https://plaid.com/docs/investments/
- Vercel Hobby preview protection does **not** protect a public production domain; app-level auth and owner-only Supabase RLS are mandatory before displaying real holdings. Sources: https://vercel.com/docs/deployment-protection and https://supabase.com/docs/guides/database/postgres/row-level-security
- Prepared modular `polybot-v5-starter/` Next.js starter (3D city, portfolio room, 12 range selectors, hover/crosshair, synthetic grouped attribution, accessible fallback, separate accounting primitives and initial RLS migration). Only **accounting unit tests** run in authoring environment (8 passed). npm packages/Next build were not verifiable here due to network constraints. No fake live claim.
- Detailed current research, account/connector status, complete integration settings, secrets, testing gates, commercial blockers, and accelerated **Computer Use vs manual Windows execution** are in `docs/RESEARCH_AND_SETUP.md` included in the starter.
- **Feature additions must be made to this master blueprint and the same `lik-08/polybot` repo**, not a new app. For future changes, update testing/acceptance, changelog and user-facing simulation/live state.

### v5 acceptance gates (added)
- [ ] GitHub source files initialized, package-lock committed after trusted local install, `npm test`, `npm run build`, TypeScript, ESLint and browser tests pass.
- [ ] 3D scene renders on laptop and iPhone, lower-detail mode performs acceptably, accessibility keyboard/touch tests pass.
- [ ] Supabase project exists and RLS owner isolation is tested with two different users, not just an anonymous mock.
- [ ] Licensed quote source covers exact user tickers, quote freshness and stock exchange feed are correctly displayed; server-only keys.
- [ ] Step balance/transactions imported privately, holdings & period returns reconcile to actual statements.
- [ ] Live updates, sector/ETF look-through and causal explanations are tested with independent verified data.
- [ ] Alerts, hosting and API cost budget reviewed; paid upgrades explicitly approved.
- [ ] Public production domain cannot reveal any financial record before user auth and authorization.

### v5 changelog
- **2026-11-04 v5:** Deep researched official docs/GitHub stack, validated available connected GitHub repo and zero Supabase/Vercel projects, created modular Next.js 3D starter, added initial private data-model migration and eight passing pure accounting checks, documented provider limitations, security settings, plugin inventory, and quickest Desktop / Computer Use workflows. No paid resources or live connections activated.

### 2026-11-04 implementation correction
- Source-control branch `feature/3d-portfolio-v5-research` is the review candidate, not a live deployment. 1m demo chart uses unique second timestamps; non-functional city buildings are not represented as working routes.
