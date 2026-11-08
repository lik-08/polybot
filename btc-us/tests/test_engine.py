"""Offline tests using synthetic fixture data, not historical performance evidence."""

import copy
import math
import unittest
from datetime import datetime, timedelta, timezone

from polybot_us.engine import assess_snapshot, realized_minute_vol, settle_paper_position

NOW = datetime(2026, 11, 7, 20, 34, 0, tzinfo=timezone.utc)


def sample():
    bars = []
    for idx in range(31):
        price = 75000 + idx * 2 + 10 * math.sin(idx * 0.7)
        bars.append({"time": 1794081780 + idx * 60, "close": price, "tickCount": 60})
    return {
        "capturedAt": "2026-11-07T20:34:00Z",
        "market": {"slug": "cpc-btc-updown-15m-2026-11-07-2030z",
                   "event": "btc-updown-15m-2026-11-07-2030z",
                   "windowStart": "2026-11-07T20:30:00Z", "windowEnd": "2026-11-07T20:45:00Z",
                   "priceToBeat": 75000, "feeCoefficient": 0.095},
        "reference": {"source": "Polymarket US BRTI", "observedAt": "2026-11-07T20:34:00Z", "price": 75090},
        "quotes": {"bookState": "open", "bookAgeSeconds": 1, "upBuy": 0.62, "upSell": 0.60,
                   "downBuy": 0.40, "downSell": 0.38},
        "chart": {"source": "brti", "interval": "1M"}, "recentCandles": bars,
        "dataCheck": {"state": "READY"}, "errors": []
    }


class EngineTests(unittest.TestCase):
    def test_high_edge_paper_candidate_only(self):
        result = assess_snapshot(sample(), now=NOW)
        self.assertEqual(result["status"], "PAPER_CANDIDATE")
        self.assertEqual(result["selected"]["side"], "UP")
        self.assertFalse(result["real_orders_enabled"])
        self.assertGreater(result["selected"]["net_edge_per_contract_estimate"], 0.04)

    def test_missing_quotes_fail_closed(self):
        data = sample()
        data["quotes"]["upBuy"] = None
        self.assertEqual(assess_snapshot(data, now=NOW)["status"], "SKIP")

    def test_upstream_error_fail_closed(self):
        data = sample()
        data["errors"] = ["Order book: Source returned HTTP 404"]
        self.assertEqual(assess_snapshot(data, now=NOW)["status"], "SKIP")

    def test_stale_reference_fail_closed(self):
        data = sample()
        data["reference"]["observedAt"] = "2026-11-07T20:33:00Z"
        self.assertEqual(assess_snapshot(data, now=NOW)["status"], "SKIP")

    def test_non_brti_fail_closed(self):
        data = sample()
        data["reference"]["source"] = "Coinbase"
        self.assertEqual(assess_snapshot(data, now=NOW)["status"], "SKIP")

    def test_spread_fail_closed(self):
        data = sample()
        data["quotes"]["upSell"] = 0.40
        self.assertEqual(assess_snapshot(data, now=NOW)["status"], "SKIP")

    def test_stale_candles_fail_closed(self):
        data = sample()
        data["recentCandles"] = [{**c, "time": c["time"] - 600} for c in data["recentCandles"]]
        self.assertEqual(assess_snapshot(data, now=NOW)["status"], "SKIP")

    def test_closed_order_book_fail_closed(self):
        data = sample()
        data["quotes"]["bookState"] = "closed"
        self.assertEqual(assess_snapshot(data, now=NOW)["status"], "SKIP")

    def test_missing_fee_fail_closed(self):
        data = sample()
        del data["market"]["feeCoefficient"]
        self.assertEqual(assess_snapshot(data, now=NOW)["status"], "SKIP")

    def test_cutoff_fail_closed(self):
        t = NOW + timedelta(minutes=10)
        data = sample()
        data["capturedAt"] = t.isoformat()
        data["reference"]["observedAt"] = t.isoformat()
        self.assertEqual(assess_snapshot(data, now=t)["status"], "SKIP")

    def test_no_edge_when_fair_price_below_cost(self):
        data = sample()
        data["reference"]["price"] = 75000
        self.assertEqual(assess_snapshot(data, now=NOW)["status"], "NO_EDGE")

    def test_nonconsecutive_bars_fail_closed(self):
        data = sample()
        data["recentCandles"][15]["time"] += 1
        self.assertEqual(assess_snapshot(data, now=NOW)["status"], "SKIP")

    def test_tie_resolves_up(self):
        up = settle_paper_position(side="UP", entry_ask=0.6, fee_coefficient=0.095,
                                   opening_brti_average=75000, closing_brti_average=75000)
        down = settle_paper_position(side="DOWN", entry_ask=0.4, fee_coefficient=0.095,
                                     opening_brti_average=75000, closing_brti_average=75000)
        self.assertEqual(up["outcome"], "UP")
        self.assertTrue(up["wins"])
        self.assertFalse(down["wins"])
        self.assertFalse(up["verified_outcome"])

    def test_fee_cost_included(self):
        out = settle_paper_position(side="UP", entry_ask=.5, fee_coefficient=.1,
                                    opening_brti_average=75000, closing_brti_average=75002,
                                    contracts=10)
        self.assertAlmostEqual(out["entry_cost_usd"], 5.35, places=4)


if __name__ == "__main__":
    unittest.main()
