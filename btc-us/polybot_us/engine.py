"""US-specific, fail-closed BTC Up/Down research engine.

Uses published Polymarket US per-market fees and BRTI settlement rules.
No credentials, network calls, orders, trade approvals, or live execution.
The probability model is an *uncalibrated research estimate*; only paper candidates
are emitted after all data-quality and execution-cost checks pass.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from statistics import stdev
from typing import Any

MAX_REFERENCE_AGE = 10.0
MAX_BOOK_AGE = 10.0
MAX_SNAPSHOT_AGE = 15.0
MAX_SPREAD = 0.04
MIN_NET_EDGE = 0.04
ASSUMED_SLIPPAGE = 0.01
MIN_REMAINING_SECONDS = 120
MAX_PAPER_STAKE_USD = 5.0
FAVORITE_ASK_BAND = (0.50, 0.80)


def _parse_time(value: str) -> datetime:
    if not isinstance(value, str) or not value:
        raise ValueError("timestamp missing")
    stamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if stamp.tzinfo is None:
        raise ValueError("timestamp must include UTC offset")
    return stamp.astimezone(timezone.utc)


def _number(value: Any, name: str) -> float:
    if isinstance(value, bool) or value is None:
        raise ValueError(f"{name} missing")
    if isinstance(value, dict):
        value = value.get("value")
    out = float(value)
    if not math.isfinite(out):
        raise ValueError(f"{name} is not finite")
    return out


def _skip(reason: str, **extra: Any) -> dict[str, Any]:
    return {"status": "SKIP", "reason": reason, "real_orders_enabled": False, **extra}


def realized_minute_vol(candles: list[dict[str, Any]], *, now: datetime | None = None) -> float:
    """Sample standard deviation of returns from at least 20 completed BRTI 1m bars.

    Invalid/incomplete bars and discontinuous time series cause a hard failure.
    """
    valid = [c for c in candles if int(c.get("tickCount", 0)) >= 55]
    valid = valid[-61:]
    if len(valid) < 21:
        raise ValueError("fewer than 21 complete 1-minute BRTI bars")
    times = [int(c["time"]) for c in valid]
    if any(b - a != 60 for a, b in zip(times, times[1:])):
        raise ValueError("BRTI 1-minute bars have gaps")
    if now is not None:
        last_open_age = now.timestamp() - times[-1]
        if not 60 <= last_open_age <= 180:
            raise ValueError("latest completed BRTI candle is stale or in the future")
    closes = [_number(c.get("close"), "BRTI close") for c in valid]
    if any(p <= 0 for p in closes):
        raise ValueError("invalid BRTI closing price")
    returns = [math.log(b / a) for a, b in zip(closes, closes[1:])]
    sigma = stdev(returns)
    if sigma <= 0:
        raise ValueError("zero observed volatility; cannot estimate probability")
    return sigma


def _normal_probability(spot: float, target: float, seconds_left: float, sigma_minute: float) -> float:
    z = math.log(spot / target) / (sigma_minute * math.sqrt(seconds_left / 60.0))
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))


def assess_snapshot(snapshot: dict[str, Any], *, now: datetime | None = None) -> dict[str, Any]:
    """Assess the existing Polybot BTC Terminal snapshot; never sends orders.

    A market with missing BRTI, quotes, timestamps, fee coefficient or complete
    1-minute bars MUST return SKIP. UP wins a tie under US BRTI rules.
    """
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        raise ValueError("now must be timezone-aware")
    now = now.astimezone(timezone.utc)
    try:
        captured = _parse_time(snapshot["capturedAt"])
        market = snapshot["market"]
        reference = snapshot["reference"]
        quotes = snapshot["quotes"]
        chart = snapshot["chart"]
        if not isinstance(market, dict) or not isinstance(reference, dict) or not isinstance(quotes, dict):
            raise ValueError("invalid payload section")
        snapshot_age = (now - captured).total_seconds()
        if not 0 <= snapshot_age <= MAX_SNAPSHOT_AGE:
            return _skip("snapshot is stale or timestamp is in the future", snapshot_age_seconds=snapshot_age)
        if snapshot.get("dataCheck", {}).get("state") == "SKIP":
            return _skip("upstream terminal reported unreliable data")
        if snapshot.get("errors"):
            return _skip("upstream terminal reported data-fetch errors")
        if reference.get("source") != "Polymarket US BRTI" or chart.get("source") != "brti":
            return _skip("official BRTI reference required; Coinbase is context only")
        observed = _parse_time(reference["observedAt"])
        reference_age = (now - observed).total_seconds()
        if not 0 <= reference_age <= MAX_REFERENCE_AGE:
            return _skip("BRTI reference price is stale", reference_age_seconds=reference_age)
        if str(quotes.get("bookState", "")).lower() not in ("open", "live", "active", "trading"):
            return _skip("order book is not confirmed open")
        if quotes.get("bookAgeSeconds") is None:
            return _skip("order book age is unknown")
        book_age = _number(quotes["bookAgeSeconds"], "bookAgeSeconds") + snapshot_age
        if not 0 <= book_age <= MAX_BOOK_AGE:
            return _skip("order book is stale", book_age_seconds=book_age)
        start = _parse_time(market["windowStart"])
        end = _parse_time(market["windowEnd"])
        if end <= start or (end - start).total_seconds() != 900:
            return _skip("not a 15-minute market")
        remaining = (end - now).total_seconds()
        if now < start or remaining <= MIN_REMAINING_SECONDS:
            return _skip("market is not in its permitted entry window", remaining_seconds=remaining)
        if "btc" not in str(market.get("slug", "")).lower() or "15m" not in str(market.get("event", "")).lower():
            return _skip("market is not US BTC 15-minute Up/Down")
        spot = _number(reference["price"], "BRTI price")
        target = _number(market["priceToBeat"], "priceToBeat")
        theta = _number(market.get("feeCoefficient"), "feeCoefficient")
        if min(spot, target) <= 0 or not 0 <= theta <= 1:
            return _skip("invalid BRTI prices or fee coefficient")
        if chart.get("interval") != "1M":
            return _skip("1-minute completed BRTI candles required")
        minute_vol = realized_minute_vol(snapshot["recentCandles"], now=now)
        # Volatility uncertainty is a *research* robustness check, not calibration.
        vol_bands = (minute_vol * 0.7, minute_vol, minute_vol * 1.3)
        up_probs = [_normal_probability(spot, target, remaining, vol) for vol in vol_bands]
        candidates = []
        for side in ("up", "down"):
            ask = _number(quotes.get(side + "Buy"), side + "Buy")
            bid = _number(quotes.get(side + "Sell"), side + "Sell")
            if not 0 < bid <= ask < 1:
                return _skip("invalid or crossed market prices", side=side)
            spread = ask - bid
            if spread > MAX_SPREAD + 1e-10:
                return _skip("bid/ask spread exceeds risk limit", side=side, spread=round(spread, 4))
            # The BRTI resolution is UP on an exact tie (included in the UP model).
            robust_prob = min(up_probs) if side == "up" else min(1 - p for p in up_probs)
            fee_per_contract = theta * ask * (1.0 - ask)
            net_edge = robust_prob - ask - fee_per_contract - ASSUMED_SLIPPAGE
            candidates.append({
                "side": side.upper(),
                "ask": round(ask, 4), "bid": round(bid, 4),
                "robust_probability_estimate": round(robust_prob, 4),
                "estimated_fee_per_contract_usd": round(fee_per_contract, 5),
                "assumed_slippage_per_contract_usd": ASSUMED_SLIPPAGE,
                "net_edge_per_contract_estimate": round(net_edge, 4),
                "favorite_band_pass": FAVORITE_ASK_BAND[0] <= ask <= FAVORITE_ASK_BAND[1],
            })
        eligible = [c for c in candidates if c["favorite_band_pass"] and c["net_edge_per_contract_estimate"] >= MIN_NET_EDGE]
        selected = max(eligible, key=lambda c: c["net_edge_per_contract_estimate"], default=None)
        return {
            "status": "PAPER_CANDIDATE" if selected else "NO_EDGE",
            "reason": "Uncalibrated research-only estimate; no live order is authorized",
            "market": market["slug"], "remaining_seconds": round(remaining),
            "brti_price": spot, "price_to_beat": target,
            "realized_1m_log_return_std": round(minute_vol, 8),
            "fee_coefficient_from_market": theta,
            "proposals": candidates, "selected": selected,
            "max_paper_stake_usd": MAX_PAPER_STAKE_USD,
            "real_orders_enabled": False,
        }
    except (ValueError, TypeError, KeyError, IndexError, ZeroDivisionError) as error:
        return _skip(f"missing or invalid required market data: {error}")


def settle_paper_position(*, side: str, entry_ask: float, fee_coefficient: float,
                          closing_brti_average: float, opening_brti_average: float,
                          contracts: float = 1.0, slippage_per_contract: float = ASSUMED_SLIPPAGE) -> dict[str, Any]:
    """Counterfactual paper settlement using supplied official BRTI averages.

    Assumes full fill at ask plus fixed slippage, no execution/latency realism.
    User-supplied closing prices never count as independently verified outcomes.
    """
    if side.upper() not in ("UP", "DOWN") or not 0 < entry_ask < 1 or not 0 <= fee_coefficient <= 1:
        raise ValueError("invalid paper position")
    if contracts <= 0 or closing_brti_average <= 0 or opening_brti_average <= 0:
        raise ValueError("invalid paper contract quantity or BRTI average")
    up_wins = round(closing_brti_average, 2) >= round(opening_brti_average, 2)
    wins = up_wins if side.upper() == "UP" else not up_wins
    fee = contracts * fee_coefficient * entry_ask * (1.0 - entry_ask)
    invested = contracts * (entry_ask + slippage_per_contract) + fee
    payout = contracts if wins else 0.0
    return {"outcome": "UP" if up_wins else "DOWN", "wins": wins,
            "pnl_usd": round(payout - invested, 4), "entry_cost_usd": round(invested, 4),
            "payout_usd": round(payout, 4), "verified_outcome": False,
            "real_orders_enabled": False}
