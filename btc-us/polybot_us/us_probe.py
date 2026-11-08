"""Probe Polymarket US public market metadata, BBO and book without credentials.

Do not confuse an event slug with its *market* slug. This module reports raw
official US responses; it never builds an order or infers a reliable fill.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import re
from typing import Any


def probe_market(slug: str, client: Any) -> dict[str, Any]:
    """Return read-only observations. Fail closed on errors or malformed data."""
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{2,199}", slug):
        return {"status": "SKIP", "reason": "invalid US market slug", "orders_enabled": False}
    try:
        market = client.markets.retrieve_by_slug(slug)
        bbo_response = client.markets.bbo(slug)
        book_response = client.markets.book(slug)
        if not isinstance(market, dict):
            raise ValueError("market metadata not an object")
        if not isinstance(bbo_response, dict) or not isinstance(book_response, dict):
            raise ValueError("US quote response not an object")
        bbo = bbo_response.get("marketData")
        book = book_response.get("marketData")
        if not isinstance(bbo, dict) or not isinstance(book, dict):
            raise ValueError("missing marketData envelope in official SDK response")
        if bbo.get("bestBid") is None or bbo.get("bestAsk") is None:
            return {"status": "SKIP", "reason": "no live two-sided best bid/ask", "orders_enabled": False}
        return {
            "status": "OBSERVED_UNVERIFIED",
            "capturedAt": datetime.now(timezone.utc).isoformat(),
            "marketSlug": slug,
            "market": market,
            "bestBidOffer": bbo,
            "orderBook": book,
            "orders_enabled": False,
            "warning": "Raw read-only quotes. No BRTI pricing, verified timestamp, or execution approval.",
        }
    except (Exception,) as exc:
        # Do not leak credentials or exceptions. Even invalid/inactive slugs fail closed.
        return {"status": "SKIP", "reason": "official US public data unavailable or malformed",
                "error_type": type(exc).__name__, "orders_enabled": False}


def main() -> None:
    parser = argparse.ArgumentParser(description="Read official public Polymarket US quotes (no orders)")
    parser.add_argument("--slug", required=True, help="US MARKET slug, not event slug")
    args = parser.parse_args()
    try:
        from polymarket_us import PolymarketUS
    except ImportError:
        parser.error("Install the official SDK first: py -m pip install polymarket-us")
    client = PolymarketUS()
    try:
        output = probe_market(args.slug, client)
    finally:
        client.close()
    print(json.dumps(output, indent=2, default=str))


if __name__ == "__main__":
    main()
