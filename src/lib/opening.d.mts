export interface OpeningHolding {
  symbol:string;
  quantity:number|null;
  displayedValue:number|null;
  /** Observed total USD basis, when supplied; never inferred from displayed value. */
  costBasis:number|null;
}
export interface OpeningSnapshot {
  version:1;
  kind:'opening-snapshot';
  /** Date only; null remains unknown. No timestamp is inferred. */
  asOfDate:string|null;
  source:string;
  reportedAccountValue:number|null;
  cash:number|null;
  holdings:OpeningHolding[];
}
export interface OpeningAnalysis {
  listedHoldingsValue:number|null;
  knownSubtotal:number|null;
  /** Reported value less all known displayed values and known cash. Never inferred cash. */
  unreconciled:number|null;
  /** Requires all displayed values, cash and reported value, within one cent. */
  reconciled:boolean;
  missing:string[];
  positionCount:number;
}
export function parseOpening(text:string):OpeningSnapshot;
export function analyzeOpening(document:OpeningSnapshot):OpeningAnalysis;
