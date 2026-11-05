# Integration handoff — local ledger first

The local manual ledger runs without accounts, API keys, paid services or cloud projects. November 4, 2026 connector inspection returned no Supabase projects and no matching Vercel projects. The connected BTC Terminal exposes read-only research snapshots; its tool connection is not an application API credential or continuous feed. Do not copy a snapshot into the app and call it live.

## Completed local foundation

- Exact fractional long shares, USD cash, dated deposits/withdrawals, trades, dividends, fees and splits; complete event-by-event validation.
- Weighted average cost, separate gross sale proceeds, realized/unrealized results and manual dated valuations. This is not tax-lot reporting or a broker reconciliation.
- Missing-price nulls, original observation times, no current-holdings backfill, reviewed backup import/export and opt-in unencrypted device storage.
- Existing 3D city, accessible entry, low-graphics/reduced-motion paths and separate synthetic chart demo remain available.

## Required owner inputs for a live portfolio

1. Complete private brokerage records (exact quantities, cash, dated trades/transfers, fees and corporate actions), entered in the app or imported locally. Do not paste brokerage credentials or private statements into GitHub.
2. Choice and authorization of a read-only data provider after coverage, licensing and budget review. No provider is selected or activated by this change.
3. Specific approval for cloud project creation and production deployment. Owner-only authentication must precede any cloud personal-data ingestion. Keep service credentials on the server; never ask for secrets in chat.

## Supabase work before any migration

The existing proposed SQL remains unapplied. It does not yet faithfully store the new event contract: trade symbol/quantity/execution price/cost basis, split factor, event ordering and correction links need schema design. Required work:

- Define stable non-null import IDs, corrections/revisions, event provenance, observation source/age and deduplication; map every local field without silent losses.
- Enforce finite numeric values, valid event shapes and timestamps, bounded retention and update timestamps.
- Configure an owner allowlist or disabled public signup. Per-user RLS alone does not create an owner-only product.
- Test anonymous denial, two-user isolation, forged owner/portfolio IDs, reassignment, grants, and browser snapshot-write denial; audit views/functions and service-role boundaries.
- Apply reviewed tracked migrations once to a new non-production project, then run advisors and actual authorization tests. Do not repeatedly paste the preparatory SQL.

## Hosting and feeds

- Create a separate Next.js preview project from this repository only; never deploy HQ runtime, baseline checkouts, private imports or `.env` files.
- Choose an appropriate persistent read-only feed worker and global budgets; do not infer minute-level collection from frontend hosting or a chat tool.
- Verify market calendar, source timestamps, feed coverage, missing/stale behavior, reconnect/idempotency and holding synchronization before showing a live balance.
- Add validated period-boundary valuations before day/month/TWR/XIRR/attribution/sector/ETF/benchmark panels. Unknown stays unknown.
- Trading, paid services, production hosting and schedules remain disabled pending their specific authorization.

## Verification automation

The prepared GitHub Actions workflow only installs locked packages and runs tests, lint and build, with read-only permissions and no secrets, services or deployment. A local pass is not evidence that remote Actions has run; record the actual run result after publishing the branch.
