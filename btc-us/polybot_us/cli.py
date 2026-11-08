"""Local-only CLI for Polymarket US research. No trading functions."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from .engine import assess_snapshot, settle_paper_position


def main() -> None:
    parser = argparse.ArgumentParser(description="Polybot US paper-only research tools")
    subs = parser.add_subparsers(dest="action", required=True)
    assess = subs.add_parser("assess", help="Evaluate a saved Polybot terminal JSON snapshot")
    assess.add_argument("snapshot", type=Path)
    settle = subs.add_parser("settle", help="Hypothetical settlement from supplied BRTI averages")
    settle.add_argument("--side", required=True, choices=["UP", "DOWN"])
    settle.add_argument("--ask", required=True, type=float)
    settle.add_argument("--theta", required=True, type=float)
    settle.add_argument("--open", required=True, type=float)
    settle.add_argument("--close", required=True, type=float)
    settle.add_argument("--contracts", type=float, default=1)
    discover = subs.add_parser("discover", help="Search US markets using official public SDK (no orders)")
    discover.add_argument("--query", default="BTC Up or Down 15m")
    args = parser.parse_args()
    if args.action == "assess":
        data = json.loads(args.snapshot.read_text(encoding="utf-8"))
        result = assess_snapshot(data)
    elif args.action == "settle":
        result = settle_paper_position(side=args.side, entry_ask=args.ask, fee_coefficient=args.theta,
                                       opening_brti_average=args.open, closing_brti_average=args.close,
                                       contracts=args.contracts)
    else:
        try:
            from polymarket_us import PolymarketUS
        except ImportError as exc:
            parser.error("Install the official read-only US SDK first: pip install polymarket-us")
            raise AssertionError from exc
        client = PolymarketUS()  # intentionally anonymous
        result = client.search.query({"query": args.query})
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
