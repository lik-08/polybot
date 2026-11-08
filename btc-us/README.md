# Polybot US — BTC 15-minute paper research module

**Status: local research only. No execution, no automated trading, and no proven profitability.**

This standalone Python package is designed for your **Polymarket US** BTC Up/Down 15m terminal. The international Polymarket CLOB (Gamma, Polygon tokens, wallet keys) is a different venue and must **not** be used to trade US market accounts. We deliberately write our own US-compatible research engine instead of copying incompatible international order code.

## What works

- Parse your existing Polybot BTC Terminal snapshot JSON (`market`, BRTI reference, 1m candles, US UP/DOWN executable bid/ask, fee coefficient).
- **Fail closed** on missing/old BRTI prices, missing/stale order books, large spreads, absent fee coefficients, API errors, candle gaps and final-two-minute entries.
- Estimate a provisional probability using 1-minute realized BRTI volatility and a simple diffusion model; take the most conservative estimate across three volatility scenarios.
- Deduct the **per-market US taker fee** `theta * ask * (1-ask)` and conservative hypothetical slippage before checking a 4-cent minimum edge.
- Return **PAPER_CANDIDATE**, **NO_EDGE**, or **SKIP**. Never output an executable order or a claim of verified accuracy.
- Calculate hypothetical settle-at-expiry P&L with the real **US tie-goes-UP rule** (opening and closing minute-average BRTI prices); user-supplied outcomes are explicitly unverified.
- Query Polymarket US public search via the **official** `polymarket-us` SDK (`discover` command). This fetches **only public market metadata**; it does not place orders or fetch BRTI by itself.

## Run locally

On Windows PowerShell, from the `btc-us` folder of your cloned `polybot` repository:

```powershell
py -m unittest discover -s tests -v
py -m polybot_us.cli discover --query "BTC Up or Down 15m"
py -m polybot_us.cli assess path\to\saved-terminal-snapshot.json
py -m polybot_us.cli settle --side UP --ask 0.62 --theta 0.095 --open 75663.67 --close 75700.00 --contracts 1
```

To enable the optional US public discovery command, install the SDK first:

```powershell
py -m pip install polymarket-us
```

`assess` requires a **fresh JSON file** in the same structure as the `get_btc_terminal_snapshot` read-only output (the nested `structuredContent` object, not the wrapper). Since a snapshot goes stale after 15 seconds, a saved old snapshot should return `SKIP` by design. Build an approved read-only streaming bridge to evaluate continuously; do not disable freshness tests to make a stale file pass.

## Trade evidence gates before considering live orders

1. Native US live data: reliably receive official BRTI 60-sample target/final averages and **executable**, two-sided US order-book quotes. Latest terminal snapshot currently fails this gate (`Order book HTTP 404`).
2. Persist timestamped tick/quote data and an immutable strategy-version/config key.
3. Run at least 100 **independent**, automatically verified paper outcomes spanning at least seven Eastern trading days. Realistic fills must incorporate depth, cancellations, fees, latency and missing orders (not just guaranteed fills at the best ask).
4. Require positive net P&L after costs, well-calibrated probabilities, statistically defensible lower confidence bounds, and maximum drawdown within the configured risk budget.
5. Keep execution separately permissioned, require human approval and a kill switch. There is **no** live execution adapter here.

## Research inputs and provenance

Design concepts adapted *independently* from public ideas in:

- https://github.com/LukasNSteel/polybtc — stale-quote research, volatility robust estimates, fee/capture assumptions (international market; not used as an API).
- https://github.com/cryptuon/polybot — shadow-first, human-approved execution, safety/observability.
- https://github.com/aulekator/Polymarket-BTC-15-Minute-Trading-Bot — modular signal sources, risk gates.
- https://github.com/Polymarket/polymarket-us-python — official US public SDK.
- https://polymarket.us/event/btc-updown-15m-2026-11-07-0615z — BTC 15m BRTI last-minute-60-observation averaging and tie rules.
- https://www.polymarketexchange.com/files/notices/Exchange%20Fees%20Update%20%282026.03.27%29.pdf — US C × theta × p(1−p) fee method; always use each market's current coefficient.

**No code copied from these repositories.** Trade ideas are unproven on Polymarket US and must be independently calibrated; existing terminal performance is 0 settled paper outcomes. Model ignores 60-tick averaging microstructure, changes in market-regime distribution, liquidity and latency. Expected probability and net edge are estimates, not guarantees. Python standard library powers the testable core; the official SDK is optional for discovery.
