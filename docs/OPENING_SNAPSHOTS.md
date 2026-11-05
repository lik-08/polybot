# Opening observations without invented history

The opening-snapshot tab accepts a current or historical observed portfolio state without requiring a complete ledger. It does not seed the event ledger, create purchases/deposits, infer basis, or generate historical returns. The 3D city, full ledger and synthetic chart demo remain separate modes; session records survive mode/City navigation.

```json
{
  "version": 1,
  "kind": "opening-snapshot",
  "asOfDate": null,
  "source": "Synthetic format example",
  "reportedAccountValue": 120,
  "cash": 20,
  "holdings": [
    {"symbol": "AAA", "quantity": null, "displayedValue": 100, "costBasis": null}
  ]
}
```

Every field is required; unknown observations use `null`, including the date (`YYYY-MM-DD` when verified). Cost basis is total USD basis, never price per share. Quantity is retained as entered, with no rounding of fractional shares for display. Tickers are normalized, duplicates rejected, and distinct share classes are never merged.

Dollar reconciliation requires a known reported balance, known cash and all listed displayed values, within one cent. It does not certify that all positions were captured, that quantities/basis are known, or that transaction history is complete. The residual subtracts only known observations and stays an **unexplained difference**, even when cash is missing. Aggregation fails on unsupported precision/overflow rather than displaying misleading dollar totals.

Files are bounded to 512 KB / 100 holdings, validated locally, and reviewed before replacement. Editing summary/holdings invalidates an earlier pending import review. Session-only data has no remote ingestion or auto-persistence. Export a private backup before reload/close. `polybot-private-opening*.json` and `private-data/` are ignored by Git; never commit real records or screenshots.

Screenshot extraction must retain uncertainty: obscured quantities remain unknown, pending orders are not completed positions, displayed transaction dollars without dates/quantities do not become historical ledger entries, and chart balance growth is not investment return. Dates from a conversation or file name are not automatically treated as confirmed observation dates.
