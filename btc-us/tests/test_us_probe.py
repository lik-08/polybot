"""Offline tests for read-only public US market probing."""
import unittest
from types import SimpleNamespace
from polybot_us.us_probe import probe_market


class FakeMarkets:
    def retrieve_by_slug(self, slug):
        return {"slug": slug}
    def bbo(self, slug):
        return {"marketData": {"bestBid": {"value": "0.50", "currency": "USD"},
                               "bestAsk": {"value": "0.52", "currency": "USD"}}}
    def book(self, slug):
        return {"marketData": {"bids": [], "offers": []}}


class ProbeTests(unittest.TestCase):
    def setUp(self):
        self.client = SimpleNamespace(markets=FakeMarkets())
        self.slug = "cpc-btc-updown-15m-2026-11-07-2030z"

    def test_observations_are_always_read_only(self):
        result = probe_market(self.slug, self.client)
        self.assertEqual(result["status"], "OBSERVED_UNVERIFIED")
        self.assertFalse(result["orders_enabled"])
        self.assertIn("bestBidOffer", result)

    def test_invalid_slug_skips_without_network_calls(self):
        result = probe_market("BTC UP/DOWN", self.client)
        self.assertEqual(result["status"], "SKIP")

    def test_missing_marketdata_skips(self):
        self.client.markets.bbo = lambda slug: {}
        result = probe_market(self.slug, self.client)
        self.assertEqual(result["status"], "SKIP")
        self.assertFalse(result["orders_enabled"])

    def test_missing_ask_skips(self):
        self.client.markets.bbo = lambda slug: {"marketData": {"bestBid": 0.5, "bestAsk": None}}
        result = probe_market(self.slug, self.client)
        self.assertEqual(result["status"], "SKIP")

    def test_404_skips_without_order_retry(self):
        def fail(slug):
            raise RuntimeError("HTTP 404")
        self.client.markets.book = fail
        result = probe_market(self.slug, self.client)
        self.assertEqual(result["status"], "SKIP")
        self.assertEqual(result["error_type"], "RuntimeError")


if __name__ == "__main__":
    unittest.main()
