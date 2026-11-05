export type LedgerEventKind='deposit'|'withdrawal'|'buy'|'sell'|'dividend'|'fee'|'split';
export interface LedgerEvent {
  id:string;
  /** ISO timestamp with seconds and an explicit timezone; normalized to UTC milliseconds. */
  at:string;
  kind:LedgerEventKind;
  symbol?:string;
  quantity?:number;
  price?:number;
  amount?:number;
  fee?:number;
  factor?:number;
}
export interface ManualValuation {at:string;prices:Record<string,number>}
export interface LedgerDocument {version:1;events:LedgerEvent[];valuations:ManualValuation[]}
export interface LedgerPosition {symbol:string;quantity:number;/** Total remaining USD cost including purchase fees. */costBasis:number}
export interface LedgerSnapshot {at:string;value:number|null;cash:number;unrealized:number|null;complete:boolean;missing:string[]}
export interface LedgerAnalysis {
  cash:number;
  deposits:number;
  withdrawals:number;
  /** Gross sale proceeds, an internal movement rather than an external withdrawal. */
  saleProceeds:number;
  dividends:number;
  /** All purchase, sale and standalone fees; purchase fees also remain in cost basis. */
  fees:number;
  /** Average-cost realized gains net of sale fees. Not tax-lot accounting. */
  realized:number;
  positions:LedgerPosition[];
  snapshots:LedgerSnapshot[];
}
export function parseLedger(text:string):LedgerDocument;
export function analyzeLedger(document:LedgerDocument):LedgerAnalysis;
