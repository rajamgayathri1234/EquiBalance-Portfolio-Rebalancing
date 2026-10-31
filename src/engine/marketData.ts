import { Instrument, FeeSchedule, Constraint, TargetAllocation, AssetClass, MarketPrice } from '../types';
import { DeterministicPRNG } from './prng';

export const MASTER_INSTRUMENTS: Omit<Instrument, 'instrument_id'>[] = [
  // Domestic Indian Equity (Nifty 50, Next 50, Banking, IT)
  {
    ticker: 'NIFTYBEES',
    asset_name: 'Nippon India ETF Nifty 50 BeES',
    asset_class: 'US_EQUITY', // Domestic Indian Large-Cap Blend
    sub_asset_class: 'Nifty 50 Large Cap Benchmark',
    is_excluded: false,
    exclusion_reason: null,
    liquidity_tier: 'TIER_1_HIGH',
    lot_size_min: 1,
    expense_ratio_pct: 0.04
  },
  {
    ticker: 'JUNIORBEES',
    asset_name: 'Nippon India ETF Junior BeES (Nifty Next 50)',
    asset_class: 'US_EQUITY',
    sub_asset_class: 'Nifty Next 50 Large/Mid Blend',
    is_excluded: false,
    exclusion_reason: null,
    liquidity_tier: 'TIER_1_HIGH',
    lot_size_min: 1,
    expense_ratio_pct: 0.12
  },
  {
    ticker: 'BANKBEES',
    asset_name: 'Nippon India ETF Nifty Bank BeES',
    asset_class: 'US_EQUITY',
    sub_asset_class: 'Banking & Financial Services',
    is_excluded: false,
    exclusion_reason: null,
    liquidity_tier: 'TIER_1_HIGH',
    lot_size_min: 1,
    expense_ratio_pct: 0.18
  },
  {
    ticker: 'ITBEES',
    asset_name: 'Nippon India ETF Nifty IT',
    asset_class: 'US_EQUITY',
    sub_asset_class: 'Information Technology & Software',
    is_excluded: false,
    exclusion_reason: null,
    liquidity_tier: 'TIER_1_HIGH',
    lot_size_min: 1,
    expense_ratio_pct: 0.22
  },
  // International Equity available on NSE/BSE
  {
    ticker: 'MON100',
    asset_name: 'Motilal Oswal Nasdaq 100 ETF',
    asset_class: 'INTL_EQUITY',
    sub_asset_class: 'Global Tech & US Mega-Cap',
    is_excluded: false,
    exclusion_reason: null,
    liquidity_tier: 'TIER_1_HIGH',
    lot_size_min: 1,
    expense_ratio_pct: 0.58
  },
  {
    ticker: 'MAFANG',
    asset_name: 'Mirae Asset NYSE FANG+ ETF',
    asset_class: 'INTL_EQUITY',
    sub_asset_class: 'Global Innovation & Artificial Intelligence',
    is_excluded: false,
    exclusion_reason: null,
    liquidity_tier: 'TIER_1_HIGH',
    lot_size_min: 1,
    expense_ratio_pct: 0.65
  },
  // Midcap & Emerging Equity
  {
    ticker: 'MID150BEES',
    asset_name: 'Nippon India ETF Nifty Midcap 150',
    asset_class: 'EM_EQUITY',
    sub_asset_class: 'Indian Midcap Growth Benchmark',
    is_excluded: false,
    exclusion_reason: null,
    liquidity_tier: 'TIER_1_HIGH',
    lot_size_min: 1,
    expense_ratio_pct: 0.20
  },
  // Fixed Income (G-Sec & Bharat Bond)
  {
    ticker: 'BHARATBOND',
    asset_name: 'Edelweiss Bharat Bond ETF - April 2031',
    asset_class: 'FIXED_INCOME',
    sub_asset_class: 'Target Maturity CPSE AAA PSU Debt',
    is_excluded: false,
    exclusion_reason: null,
    liquidity_tier: 'TIER_1_HIGH',
    lot_size_min: 1,
    expense_ratio_pct: 0.0005
  },
  {
    ticker: 'GSEC10Y',
    asset_name: 'Nippon India ETF Nifty 8-13 yr G-Sec',
    asset_class: 'FIXED_INCOME',
    sub_asset_class: 'Sovereign Government of India 10Y Benchmark',
    is_excluded: false,
    exclusion_reason: null,
    liquidity_tier: 'TIER_1_HIGH',
    lot_size_min: 1,
    expense_ratio_pct: 0.14
  },
  {
    ticker: 'CPSEETF',
    asset_name: 'CPSE ETF (Central Public Sector Enterprises)',
    asset_class: 'FIXED_INCOME',
    sub_asset_class: 'High Dividend Yield Maharatna/Navratna',
    is_excluded: false,
    exclusion_reason: null,
    liquidity_tier: 'TIER_2_MEDIUM',
    lot_size_min: 1,
    expense_ratio_pct: 0.05
  },
  // Real Estate (Indian REITs)
  {
    ticker: 'EMBASSY',
    asset_name: 'Embassy Office Parks REIT',
    asset_class: 'REAL_ESTATE',
    sub_asset_class: 'Grade-A Commercial Office Portfolio',
    is_excluded: false,
    exclusion_reason: null,
    liquidity_tier: 'TIER_1_HIGH',
    lot_size_min: 1,
    expense_ratio_pct: 0.45
  },
  // Commodities (Physical Gold)
  {
    ticker: 'GOLDBEES',
    asset_name: 'Nippon India ETF Gold BeES',
    asset_class: 'COMMODITIES',
    sub_asset_class: '99.5% Pure Physical Gold Bullion',
    is_excluded: false,
    exclusion_reason: null,
    liquidity_tier: 'TIER_1_HIGH',
    lot_size_min: 1,
    expense_ratio_pct: 0.79
  },
  // Cash Equivalent (Liquid BeES Overnight)
  {
    ticker: 'LIQUIDBEES',
    asset_name: 'Nippon India ETF Liquid BeES (Daily NAV)',
    asset_class: 'CASH_EQUIVALENT',
    sub_asset_class: 'Tri-party Repo (TREPS) & Overnight Call Money',
    is_excluded: false,
    exclusion_reason: null,
    liquidity_tier: 'TIER_1_HIGH',
    lot_size_min: 1,
    expense_ratio_pct: 0.69
  },
  // DELIBERATELY EXCLUDED INSTRUMENT for Compliance & Anomaly testing
  {
    ticker: 'SEBI-RST',
    asset_name: 'Restricted Penny Shell & SEBI Debarred Entities Corp',
    asset_class: 'US_EQUITY',
    sub_asset_class: 'SEBI Debarred Entity (Sanctions & Surveillance List)',
    is_excluded: true,
    exclusion_reason: 'SEBI Debarred List & Enhanced Surveillance Measure (ESM Stage II)',
    liquidity_tier: 'TIER_3_LOW',
    lot_size_min: 10,
    expense_ratio_pct: 1.50
  }
];

export const STANDARD_FEE_SCHEDULE: FeeSchedule = {
  fee_schedule_id: 'FEE-SCH-01',
  name: 'Standard Indian Institutional & Retail Brokerage (SEBI / STT)',
  base_fee_usd: 20.0, // ₹20 flat base brokerage fee
  tier_1_max_usd: 500000.0, // Up to ₹5,00,000 (10 bps = 0.10%)
  tier_1_rate_bps: 10,
  tier_2_max_usd: 2500000.0, // Up to ₹25,00,000 (5 bps = 0.05%)
  tier_2_rate_bps: 5,
  tier_3_rate_bps: 2, // 2 bps (0.02%) for trades above ₹25,00,000
  sec_transaction_fee_rate: 0.001 // Indian STT (Securities Transaction Tax: 0.1% on equity delivery SELL)
};

export const STANDARD_CONSTRAINTS: Constraint[] = [
  {
    constraint_id: 'CST-000001',
    portfolio_id: 'GLOBAL',
    constraint_type: 'EXCLUDE_INSTRUMENT',
    parameters: { instrument_id: 'INS-000014' }, // SEBI-RST
    is_hard_constraint: true,
    description: 'Prohibit purchase of SEBI debarred / restricted surveillance list instruments',
    is_active: true
  },
  {
    constraint_id: 'CST-000002',
    portfolio_id: 'GLOBAL',
    constraint_type: 'MIN_CASH_BUFFER',
    parameters: { min_cash_pct: 2.0 },
    is_hard_constraint: true,
    description: 'Maintain minimum 2.0% cash liquidity reserve post-rebalance in Liquid BeES/Cash',
    is_active: true
  },
  {
    constraint_id: 'CST-000003',
    portfolio_id: 'GLOBAL',
    constraint_type: 'MIN_TRADE_SIZE',
    parameters: { min_trade_usd: 1000.0 }, // ₹1,000 minimum trade
    is_hard_constraint: false,
    description: 'Filter trades under ₹1,000 to minimize DP charges and transaction friction',
    is_active: true
  },
  {
    constraint_id: 'CST-000004',
    portfolio_id: 'GLOBAL',
    constraint_type: 'MAX_SINGLE_WEIGHT',
    parameters: { max_weight_pct: 40.0 },
    is_hard_constraint: true,
    description: 'Cap exposure in any single instrument at 40% of total portfolio value',
    is_active: true
  }
];

export const STANDARD_TARGET_MODELS: TargetAllocation[] = [
  {
    target_id: 'TGT-000001',
    model_name: 'Aggressive Growth 80/20',
    risk_category: 'AGGRESSIVE_GROWTH',
    target_weights: {
      US_EQUITY: 50.0,
      INTL_EQUITY: 20.0,
      EM_EQUITY: 10.0,
      FIXED_INCOME: 10.0,
      REAL_ESTATE: 5.0,
      COMMODITIES: 3.0,
      CASH_EQUIVALENT: 2.0
    },
    rebalance_threshold_pct: 5.0,
    min_cash_buffer_pct: 2.0,
    description: 'Long-term capital appreciation model heavily weighted toward global equities.'
  },
  {
    target_id: 'TGT-000002',
    model_name: 'Balanced Core 60/40',
    risk_category: 'BALANCED',
    target_weights: {
      US_EQUITY: 35.0,
      INTL_EQUITY: 15.0,
      EM_EQUITY: 5.0,
      FIXED_INCOME: 35.0,
      REAL_ESTATE: 5.0,
      COMMODITIES: 2.0,
      CASH_EQUIVALENT: 3.0
    },
    rebalance_threshold_pct: 4.0,
    min_cash_buffer_pct: 3.0,
    description: 'Traditional classic balanced mandate with moderate volatility and steady income.'
  },
  {
    target_id: 'TGT-000003',
    model_name: 'Conservative Income 30/70',
    risk_category: 'CONSERVATIVE',
    target_weights: {
      US_EQUITY: 15.0,
      INTL_EQUITY: 10.0,
      EM_EQUITY: 0.0,
      FIXED_INCOME: 60.0,
      REAL_ESTATE: 5.0,
      COMMODITIES: 3.0,
      CASH_EQUIVALENT: 7.0
    },
    rebalance_threshold_pct: 3.0,
    min_cash_buffer_pct: 5.0,
    description: 'Capital preservation mandate prioritizing downside protection and cash flow.'
  },
  {
    target_id: 'TGT-000004',
    model_name: 'Moderate Growth 70/30',
    risk_category: 'GROWTH',
    target_weights: {
      US_EQUITY: 45.0,
      INTL_EQUITY: 18.0,
      EM_EQUITY: 7.0,
      FIXED_INCOME: 20.0,
      REAL_ESTATE: 5.0,
      COMMODITIES: 2.0,
      CASH_EQUIVALENT: 3.0
    },
    rebalance_threshold_pct: 5.0,
    min_cash_buffer_pct: 2.0,
    description: 'Growth-oriented model with strategic fixed income ballast.'
  },
  // DELIBERATE ANOMALY MODEL: Weights fail to sum to 100% (sums to 108%)
  {
    target_id: 'TGT-000005',
    model_name: 'Defective Allocation (Anomaly: Sums to 108%)',
    risk_category: 'BALANCED',
    target_weights: {
      US_EQUITY: 45.0,
      INTL_EQUITY: 25.0,
      EM_EQUITY: 10.0,
      FIXED_INCOME: 20.0,
      REAL_ESTATE: 5.0,
      COMMODITIES: 3.0,
      CASH_EQUIVALENT: 0.0 // 45 + 25 + 10 + 20 + 5 + 3 = 108%
    },
    rebalance_threshold_pct: 5.0,
    min_cash_buffer_pct: 2.0,
    description: 'Deliberate test model injected with arithmetic weight error to test validation rejection.',
    is_anomalous: true
  }
];

/**
 * Generate 250 trading days of historical market prices using deterministic random walk
 */
export function generate250TradingDaysPrices(
  instruments: Instrument[],
  prng: DeterministicPRNG,
  baseDate: Date = new Date('2026-10-30')
): { allPrices: MarketPrice[]; latestPriceMap: Map<string, MarketPrice> } {
  const allPrices: MarketPrice[] = [];
  const latestPriceMap = new Map<string, MarketPrice>();

  // Base prices per ticker in INR (₹)
  const baselinePrices: Record<string, number> = {
    NIFTYBEES: 285.50,
    JUNIORBEES: 668.20,
    BANKBEES: 530.20,
    ITBEES: 410.10,
    MON100: 165.40,
    MAFANG: 82.30,
    MID150BEES: 184.50,
    BHARATBOND: 1240.00,
    GSEC10Y: 108.40,
    CPSEETF: 92.10,
    EMBASSY: 395.00,
    GOLDBEES: 74.80,
    LIQUIDBEES: 1000.00,
    'SEBI-RST': 112.00
  };

  // Generate 250 business dates
  const tradingDates: string[] = [];
  const curDate = new Date(baseDate);
  while (tradingDates.length < 250) {
    curDate.setDate(curDate.getDate() - 1);
    const day = curDate.getDay();
    if (day !== 0 && day !== 6) { // Skip weekends
      const yyyy = curDate.getFullYear();
      const mm = String(curDate.getMonth() + 1).padStart(2, '0');
      const dd = String(curDate.getDate()).padStart(2, '0');
      tradingDates.push(`${yyyy}-${mm}-${dd}`);
    }
  }
  tradingDates.reverse(); // chronological order

  for (const inst of instruments) {
    let currentPrice = baselinePrices[inst.ticker] || 100.0;
    const vol = inst.asset_class === 'FIXED_INCOME' || inst.asset_class === 'CASH_EQUIVALENT' ? 0.003 : 0.015;

    for (let dayIdx = 0; dayIdx < tradingDates.length; dayIdx++) {
      const dateStr = tradingDates[dayIdx];
      const dailyReturn = prng.nextGaussian(0.0003, vol);
      const prevPrice = currentPrice;
      currentPrice = Math.max(1.0, Number((currentPrice * (1 + dailyReturn)).toFixed(2)));
      const changePct = Number((((currentPrice - prevPrice) / prevPrice) * 100).toFixed(2));
      const volumeUsd = Math.round(prng.nextFloat() * 50000000 + 5000000);

      const priceRecord: MarketPrice = {
        price_id: `PRC-${inst.instrument_id}-${dateStr}`,
        instrument_id: inst.instrument_id,
        as_of_date: dateStr,
        price_usd: currentPrice,
        change_pct_24h: changePct,
        volume_usd: volumeUsd,
        is_stale: false
      };

      allPrices.push(priceRecord);

      // Latest price is the last date
      if (dayIdx === tradingDates.length - 1) {
        latestPriceMap.set(inst.instrument_id, priceRecord);
      }
    }
  }

  return { allPrices, latestPriceMap };
}
