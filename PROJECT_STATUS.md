# Local verification — November 4, 2026

## Opening-snapshot continuation

- Added strict opening-observation validation, exact reconciliation boundaries, unknown/null preservation, separate opening UI, reviewed local import/export and manual corrections. No complete ledger, cash, basis, purchase dates, gains or historical series are inferred from screenshots. The existing 3D/manual-ledger/demo modes are preserved and stay mounted for session retention.
- Private screenshots were independently checked; the private import is stored outside the repository under HQ runtime. Obscured fields remain unknown. No private amounts, holdings lists, screenshots, or imports were embedded in source/tests/commits. Only synthetic fixtures are used in tests.
- Current suite: **48 tests passed**, no skipped tests; lint and Next.js build/TypeScript/static generation passed. Includes opening validation, unknown cash, partial residual, share-class distinction, unsupported dollar precision, bounded imports and invalid calendars. Source review corrected pending import invalidation after manual corrections. A read-only OneDrive build cache caused a Windows unlink error; moving only generated cache to ignored HQ runtime allowed a clean successful build.
- Build and browser completion evidence are recorded in the local HQ status/handoff. Remaining missing observations require owner confirmation; this feature does not turn incomplete screenshots into verified brokerage history.

## Current result — private local portfolio stage

- Added an empty-by-default manual workspace alongside the preserved synthetic demo and 3D city. Supports exact fractional-share events, deposits/withdrawals, buy/sell fees, dividends and splits, weighted-average cost, separate gross sale proceeds/realized results, and dated price observations. No trades or brokerage connections occur.
- Strict versioned JSON import is bounded, fully replayed and reviewed before replacement. Missing held prices produce unavailable totals, with no price carry-forward or historical holdings inference. Device persistence is opt-in/unencrypted, export is private, and all storage mutations guard against stale cross-tab overwrites/deletes. Session records survive city/demo navigation.
- Fixed missing/negative financial inputs, overflow, explicit ETF unknown-bucket reconciliation, controlled chart mouse/keyboard selection, multiyear timestamps, scene failure recovery and global cursor leakage. A local canvas-text sprite removes external font loading; texture cleanup retains the 3D design.
- Current final checks: **31 tests passed, no skipped tests; ESLint passed; Next.js compilation, TypeScript and static generation passed** for `/`, `/_not-found` and `/manual-ledger-format`. Dependency audit: **zero vulnerabilities**, including development dependencies, after a scoped `minimatch@11.0.1` override. Updated advisory metadata also narrowed the original affected range; no framework/linter downgrade was used.
- Browser QA used generated TEST records only, session storage disabled. Verified invalid import rejection, review before replacement, $983 valuation / $803 cash / $48 realized / $30 unrealized / $83 investment-result reconciliation, missing-price history, unfunded withdrawal rejection, subsequent deposit ($823 current cash without rewriting the earlier snapshot), and retained session records through city/demo navigation. All 12 synthetic ranges, keyboard endpoints and mouse-to-keyboard continuity were verified in the preceding bug-fix checks. No new warn/error console entries during final workflow checks.
- Mobile manual workspace: 390px viewport, 375px document content width including scrollbar behavior; no page overflow. Evidence `HQ/runtime/polybot-manual-mobile-qa.jpg` contains **generated QA records, not the owner's holdings**. QA records were cleared by reloading the unsaved test tab; no personal data was searched for, imported, saved or committed.
- Read-only connector inventory: no Supabase projects, no matching Vercel projects; requested GitHub branch remains the canonical source. BTC Terminal snapshot capability works but is a chat research tool, not an application streaming credential. No snapshot was embedded as live app data. Proposed SQL remains unapplied after schema review identified gaps for faithful event persistence.
- Prepared read-only GitHub CI (locked install, tests, lint, build; no deployment) and `docs/INTEGRATION_GATES.md`. A local pass does not imply a completed remote CI run.
- Required owner steps remain private complete brokerage records, authorized licensed feed selection, and specific cloud/production approval. Live collection, authenticated cloud storage, real brokerage reconciliation, tax lots, TWR/XIRR, verified daily/monthly attribution, ETF look-through, benchmarks and other module integrations are not implemented or claimed complete.
- OS reduced-motion toggling, forced WebGL failure, real iPhone touch/performance, file-picker/download behavior and actual cross-tab/storage-denial recovery were not fully exercised. Source review covers recovery/storage paths. Browser profile storage is unencrypted and should be backed up privately.
- Earlier startup evidence below is retained as history; its 8-test and dependency-finding counts are superseded by this section. Frozen baselines and the parent Python collector remain unchanged. No cloud resources, credentials, paid services, schedules, deployment or trading were activated.

## Checkout and scope

- Repository: `lik-08/polybot`; branch `feature/3d-portfolio-v5-research`; starting commit `8f095e0154c87d8ed3d999bd0e05b9be407f7b3d`.
- Independent checkout inside HQ `polybot-working/github-polybot`. Existing parent checkout changes, portfolio-dashboard, and frozen baselines were preserved. Changes here remain local and uncommitted; nothing was pushed or deployed.
- Synthetic demo only. No credentials read/copied, environment secrets created, cloud resources provisioned, migrations applied, accounts connected, trades enabled, or collectors started. The supplied Three.js source ZIP was unnecessary; npm packages supply Three.js.

## Changes

- Replaced unavailable `lucide-react@0.450.0` with published `0.451.0`; generated `package-lock.json`. Resolved Next.js 16.4.5, React 19.3.1, R3F 9.8.2, Drei 10.7.9 and Three.js 0.180.0 on Node 26.13.0/npm 11.20.0.
- Corrected city building `height` prop while retaining intended geometry and design. Reduced-motion preferences now disable Float/Stars animation and continuous frame rendering, retaining orbit interaction.
- Reset chart hover/slider together on timeframe changes; show seconds for 1m/5m timestamps in America/Detroit.
- Fixed mobile grid intrinsic-width overflow and wrapping hero controls; retained horizontal scrolling within module/timeframe controls.
- Kept Next-generated TypeScript configuration/declarations and agent guidance. Ignore incremental TypeScript cache output. README/blueprint now record local setup evidence.

## Passed

- Final `npm test`: **8 passed**, 0 failed/skipped. Covers deposit/withdrawal vs investment gain, sales, dividends, fractional shares, price contribution, ETF exposure and invalid inputs.
- Final `npm run lint`: passed, no diagnostics.
- Final `npm run build`: passed compilation, TypeScript, static generation of `/` and `/_not-found`.
- `npm ls --depth=0`: no missing/invalid direct dependencies. `git diff --check`: passed.
- `npm audit --omit=dev`: **0 vulnerabilities**. Full audit: **16 moderate development-tool findings** in the ESLint/minimatch chain. Suggested forced ESLint downgrade was not applied; these findings remain open.
- Browser observed the WebGL city, Portfolio Room entry/return, all five module entries, synthetic/NOT LIVE labels, TradingView attribution, all 12 timeframe controls, keyboard scrub to first sample with zero contributions, short-range second timestamps, hover reset on 5Y switch, and low-graphics disable/restore. No warn/error console entries during the checked interactions.
- At 390 x 844, room and low-graphics page document width is 375 (viewport 390 including scrollbar), with no page horizontal overflow; controls scroll internally. Before correction, page width was 644.
- Final development server started on `127.0.0.1:3000`; direct HTTP verification returned **200** and one listener (PID 31484 at verification). It is intentionally left running. Next telemetry disabled for this process.
- Separate HQ `PolyBot.cmd doctor`: passed. `PolyBot.cmd test`: **208 Python passed, 1 skipped; 6 Node passed**. Expected skip is absent Stage15. Initial restricted run had four Windows local socket permission failures; normal-access rerun passed. No Python source changes made.
- Bounded independent source/diff review found no actionable regressions in the reviewed app changes.

## Limits and environment observations

- Initial build could not write Next telemetry configuration; using `NEXT_TELEMETRY_DISABLED=1` resolved it. A later restricted build was blocked creating a generated directory; final normal-access build passed. No application security or type-checking safeguards were disabled.
- After the final server restart, the in-app browser retained a connection-refused error page and its URL policy blocked further tab operations. Earlier interaction checks had completed against the changed source; final server availability was separately verified through HTTP 200 and the listener check. Native Edge also rendered the city earlier. Temporary viewport override was reset.
- Reduced-motion behavior was source-reviewed and type/lint/build-checked; actual OS preference toggling, real iPhone touch, hardware performance budgets, offline font failure and all future blueprint milestones remain untested.
- Supabase/Vercel integration, owner authentication, real data/accounting reconciliation, feed freshness and brokerage/trading behavior were not exercised. Existing visible labels correctly describe the current synthetic starter.

## Run

From this checkout in PowerShell:

```powershell
$env:NEXT_TELEMETRY_DISABLED='1'
npm.cmd ci
npm.cmd test
npm.cmd run build
# Only if no development server is already listening on port 3000:
npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
```

The HQ `PolyBot.cmd start` launches the separate Python collector and is not the launch command for this Next.js app.
