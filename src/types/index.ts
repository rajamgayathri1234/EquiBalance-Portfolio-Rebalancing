/**
 * Domain types for Policy-Constrained Portfolio Rebalancing System
 * Entities: InvestorProfile, Portfolio, Instrument, Holding, MarketPrice,
 * TargetAllocation, Trade, FeeSchedule, Constraint, RebalanceProposal, GroundTruth.
 */

export type RiskTolerance = 'CONSERVATIVE' | 'MODERATE_CONSERVATIVE' | 'BALANCED' | 'GROWTH' | 'AGGRESSIVE_GROWTH';

export type PortfolioType = 'DEMAT_INDIVIDUAL' | 'HUF_ACCOUNT' | 'CORPORATE' | 'TRUST' | 'NRI_PIS' | 'TAXABLE_INDIVIDUAL';

export type DriftStatus = 'IN_TOLERANCE' | 'MILD_DRIFT' | 'CRITICAL_DRIFT';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  panNumber?: string;
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  password?: string;
  createdAt: string;
}

export type AssetClass =
  | 'US_EQUITY'
  | 'INTL_EQUITY'
  | 'EM_EQUITY'
  | 'FIXED_INCOME'
  | 'REAL_ESTATE'
  | 'COMMODITIES'
  | 'CASH_EQUIVALENT';

export type LiquidityTier = 'TIER_1_HIGH' | 'TIER_2_MEDIUM' | 'TIER_3_LOW';

export type ProposalStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED';

export type TradeAction = 'BUY' | 'SELL' | 'HOLD';

export type TradeStatus = 'PROPOSED' | 'APPROVED' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';

export type PolicyCheckStatus = 'PASS' | 'WARNING' | 'FAIL';

export type AnomalyType =
  | 'WEIGHTS_NOT_100_PCT'
  | 'TRADE_EXCEEDS_HOLDING'
  | 'EXCLUDED_INSTRUMENT_RECOMMENDED'
  | 'FEES_OMITTED'
  | 'STALE_PRICE_USED';

export interface InvestorProfile {
  investor_id: string; // INV-000001
  full_name: string;
  email: string;
  risk_tolerance: RiskTolerance;
  investment_horizon_years: number;
  tax_bracket_pct: number;
  kyc_status: 'VERIFIED' | 'PENDING_REVIEW' | 'RESTRICTED';
  created_at: string;
}

export interface Portfolio {
  portfolio_id: string; // PORT-<investor-id>-01
  investor_id: string; // FK
  portfolio_name: string;
  portfolio_type: PortfolioType;
  currency: string;
  cash_balance: number;
  target_model_id: string; // FK
  drift_status: DriftStatus;
  max_drift_pct: number;
  last_rebalanced_at: string;
  created_at: string;
  status: 'ACTIVE' | 'PENDING_REBALANCE' | 'FROZEN' | 'REBALANCED';
  // Deliberate anomaly flag for synthetic testing
  anomaly_flag?: AnomalyType;
}

export interface Instrument {
  instrument_id: string; // INS-000001
  ticker: string;
  asset_name: string;
  asset_class: AssetClass;
  sub_asset_class: string;
  is_excluded: boolean;
  exclusion_reason: string | null;
  liquidity_tier: LiquidityTier;
  lot_size_min: number;
  expense_ratio_pct: number;
}

export interface MarketPrice {
  price_id: string; // PRC-<instrument-id>-<date>
  instrument_id: string; // FK
  as_of_date: string; // YYYY-MM-DD
  price_usd: number;
  change_pct_24h: number;
  volume_usd: number;
  is_stale: boolean;
}

export interface Holding {
  holding_id: string; // HOLD-<portfolio-id>-<instrument-id>
  portfolio_id: string; // FK
  instrument_id: string; // FK
  shares_held: number;
  cost_basis_per_share: number;
  unrealized_gain_loss: number;
  last_updated_at: string;
}

export interface TargetAllocation {
  target_id: string; // TGT-000001
  model_name: string;
  risk_category: RiskTolerance;
  target_weights: Record<AssetClass, number>; // Must sum to 100% in valid model
  rebalance_threshold_pct: number; // e.g. 5.0%
  min_cash_buffer_pct: number; // e.g. 2.0%
  description: string;
  is_anomalous?: boolean;
}

export interface Constraint {
  constraint_id: string; // CST-000001
  portfolio_id: string; // 'GLOBAL' or specific portfolio ID
  constraint_type:
    | 'EXCLUDE_INSTRUMENT'
    | 'MAX_SINGLE_WEIGHT'
    | 'MIN_TRADE_SIZE'
    | 'MIN_CASH_BUFFER'
    | 'WASH_SALE_LOCK'
    | 'SECTOR_CAP';
  parameters: {
    instrument_id?: string;
    max_weight_pct?: number;
    min_trade_usd?: number;
    min_cash_pct?: number;
    sector?: string;
  };
  is_hard_constraint: boolean;
  description: string;
  is_active: boolean;
}

export interface FeeSchedule {
  fee_schedule_id: string; // FEE-SCH-01
  name: string;
  base_fee_usd: number;
  tier_1_max_usd: number; // e.g. 10000
  tier_1_rate_bps: number; // e.g. 15 (0.15%)
  tier_2_max_usd: number; // e.g. 50000
  tier_2_rate_bps: number; // e.g. 10 (0.10%)
  tier_3_rate_bps: number; // e.g. 5 (0.05%)
  sec_transaction_fee_rate: number; // e.g. 0.0000278 for SELL
}

export interface RebalanceProposal {
  proposal_id: string; // RB-2026-000001
  portfolio_id: string; // FK
  status: ProposalStatus;
  total_trades_count: number;
  total_buy_usd: number;
  total_sell_usd: number;
  estimated_total_fees_usd: number;
  pre_trade_drift_score: number;
  post_trade_drift_score: number;
  policy_check_status: PolicyCheckStatus;
  policy_violations: PolicyViolation[];
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
  audit_notes: string;
}

export interface PolicyViolation {
  rule_code: string;
  severity: 'CRITICAL_ERROR' | 'WARNING' | 'COMPLIANCE_EXCEPTION';
  instrument_id?: string;
  message: string;
  remedy: string;
}

export interface Trade {
  trade_id: string; // TRD-2026-000001
  proposal_id: string; // FK
  portfolio_id: string; // FK
  instrument_id: string; // FK
  action: TradeAction;
  shares: number;
  limit_or_market_price: number;
  gross_amount_usd: number;
  estimated_fee_usd: number;
  net_amount_usd: number;
  pre_weight_pct: number;
  post_weight_pct: number;
  target_weight_pct: number;
  execution_status: TradeStatus;
  compliance_notes: string;
  anomaly_label?: AnomalyType;
}

export interface GroundTruthAnomaly {
  anomaly_id: string; // ANOM-001
  entity_type: 'Portfolio' | 'TargetAllocation' | 'Trade' | 'MarketPrice' | 'Holding';
  entity_id: string;
  issue_type: AnomalyType;
  expected_detection_rule: string;
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  description: string;
  resolution_guidance: string;
  detected_by_system: boolean;
  status: 'OPEN' | 'RESOLVED' | 'WAIVED_BY_COMPLIANCE';
}

export interface PortfolioRebalanceSimulation {
  portfolio_id: string;
  portfolio_name: string;
  total_portfolio_value: number;
  cash_balance: number;
  current_allocations: Record<AssetClass, { value: number; weight: number }>;
  target_allocations: Record<AssetClass, number>;
  drift_by_asset_class: Record<AssetClass, number>;
  max_drift_pct: number;
  drift_status: DriftStatus;
  proposed_trades: Trade[];
  simulated_post_allocations: Record<AssetClass, { value: number; weight: number }>;
  simulated_post_drift: Record<AssetClass, number>;
  post_max_drift_pct: number;
  violations: PolicyViolation[];
  total_fees_usd: number;
  cash_after_trades: number;
}

export interface DatasetSummary {
  seed: number;
  investorCount: number;
  portfolioCount: number;
  instrumentCount: number;
  holdingCount: number;
  marketPriceCount: number;
  targetAllocationCount: number;
  constraintCount: number;
  feeScheduleCount: number;
  proposalCount: number;
  tradeCount: number;
  anomalyCount: number;
  checksum: string;
  generatedAt: string;
}

export interface ValidationReport {
  timestamp: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningsCount: number;
  details: {
    check_name: string;
    category: 'PK_FK_INTEGRITY' | 'ARITHMETIC_RECONCILIATION' | 'POLICY_COMPLIANCE' | 'EDGE_CASE_DETECTION';
    status: 'PASS' | 'FAIL' | 'WARNING';
    description: string;
    discrepancyCount: number;
    sampleEntities?: string[];
  }[];
}

export type UserRole = 'CUSTOMER' | 'OPERATIONS' | 'COMPLIANCE' | 'ADMIN';
