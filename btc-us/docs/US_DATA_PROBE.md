# Public US market/quote probe (no trading)

This is an inspection utility for the [official Polymarket US Python SDK](https://github.com/Polymarket/polymarket-us-python). Unlike international Polymarket code, it uses `markets.retrieve_by_slug`, `markets.bbo`, and `markets.book` for **US market slugs**. All calls are public and anonymous. It never authenticates or submits orders.

## Windows PowerShell

```powershell
cd polybot\btc-us
py -m pip install polymarket-us
py -m polybot_us.us_probe --slug cpc-btc-updown-15m-2026-11-07-2030z
py -m unittest discover -s tests -v
```

The sample slug is historical and may be closed or unavailable. For live use, first discover the current US market slug:

```powershell
py -m polybot_us.cli discover --query "BTC Up or Down 15m"
```

**The event slug is not guaranteed to be the market slug.** Use the actual `slug` of a returned US market. The probe outputs a raw, timestamped read-only observation or `SKIP` when public data is missing/erroring. The quote timestamp in the response is *our receipt time*, not a verified exchange feed timestamp, so its age is not evidence of execution availability. An `OBSERVED_UNVERIFIED` result is not a trading signal and is not yet wired to `assess_snapshot`.

## Still needed

1. Validate US SDK market-book response shapes on real open BTC contracts.
2. Normalize separate YES/NO book-side quotes and official BRTI tick-averaged settlement references, with their own exchange timestamps and freshness checks.
3. Add recording/replay and a venue-aware paper fill/latency model, rather than assuming every best-ask order fills.
4. Collect at least 100 independently verified settlements across seven trading days before interpreting win rates or profitability.

Don't switch to the international CLOB or bypass freshness/skip checks when public US data is absent.
