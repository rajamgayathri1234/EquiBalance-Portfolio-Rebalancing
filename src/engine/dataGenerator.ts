import {
  InvestorProfile,
  Portfolio,
  Instrument,
  MarketPrice,
  Holding,
  TargetAllocation,
  Constraint,
  FeeSchedule,
  RebalanceProposal,
  Trade,
  GroundTruthAnomaly,
  DatasetSummary
} from '../types';
import { DeterministicPRNG, calculateChecksum } from './prng';
import {
  MASTER_INSTRUMENTS,
  STANDARD_FEE_SCHEDULE,
  STANDARD_CONSTRAINTS,
  STANDARD_TARGET_MODELS,
  generate250TradingDaysPrices
} from './marketData';
import { simulatePortfolioRebalance } from './rebalancer';

export interface GeneratedDataset {
  investorProfiles: InvestorProfile[];
  portfolios: Portfolio[];
  instruments: Instrument[];
  marketPrices: MarketPrice[];
  latestPriceMap: Map<string, MarketPrice>;
  holdings: Holding[];
  targetAllocations: TargetAllocation[];
  constraints: Constraint[];
  feeSchedules: FeeSchedule[];
  proposals: RebalanceProposal[];
  trades: Trade[];
  groundTruthAnomalies: GroundTruthAnomaly[];
  summary: DatasetSummary;
}

const FIRST_NAMES = [
  'Rajesh', 'Priya', 'Vikram', 'Ananya', 'Rohan', 'Sunita', 'Amit', 'Deepa',
  'Aditya', 'Kavita', 'Suresh', 'Meera', 'Arjun', 'Pooja', 'Karthik', 'Divya',
  'Rahul', 'Sneha', 'Sanjay', 'Neha', 'Varun', 'Ritu', 'Nikhil', 'Swati',
  'Gaurav', 'Pallavi', 'Vivek', 'Tanvi', 'Harish', 'Ishita', 'Manoj', 'Shreya'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Iyer', 'Malhotra', 'Gupta', 'Rao', 'Verma', 'Nair',
  'Chatterjee', 'Reddy', 'Singhania', 'Kulkarni', 'Mehta', 'Joshi', 'Nambiar', 'Deshmukh',
  'Agarwal', 'Menon', 'Bhat', 'Pillai', 'Banerjee', 'Trivedi', 'Kapoor', 'Saxena'
];

/**
 * Deterministic Synthetic Data Generator
 * Scales from 50 (Starter) to 1,000 (Benchmark) portfolios.
 */
export function generateSyntheticDataset(
  portfolioTargetCount: number = 50,
  seed: number = 20261022
): GeneratedDataset {
  const prng = new DeterministicPRNG(seed);

  // 1. Generate Instruments Master
  const instruments: Instrument[] = MASTER_INSTRUMENTS.map((inst, idx) => ({
    ...inst,
    instrument_id: `INS-${String(idx + 1).padStart(6, '0')}`
  }));

  const instrumentMap = new Map<string, Instrument>();
  instruments.forEach(i => instrumentMap.set(i.instrument_id, i));

  // 2. Generate 250 trading days prices
  const { allPrices, latestPriceMap } = generate250TradingDaysPrices(instruments, prng);

  // 3. Setup Target Allocations
  const targetAllocations = [...STANDARD_TARGET_MODELS];
  const targetMap = new Map<string, TargetAllocation>();
  targetAllocations.forEach(t => targetMap.set(t.target_id, t));

  // 4. Setup Constraints and Fee Schedules
  const constraints = [...STANDARD_CONSTRAINTS];
  const feeSchedules = [STANDARD_FEE_SCHEDULE];

  // 5. Generate InvestorProfiles & Portfolios
  const investorProfiles: InvestorProfile[] = [];
  const portfolios: Portfolio[] = [];
  const holdings: Holding[] = [];

  const riskTolerances = [
    'CONSERVATIVE',
    'MODERATE_CONSERVATIVE',
    'BALANCED',
    'GROWTH',
    'AGGRESSIVE_GROWTH'
  ] as const;

  const portfolioTypes = [
    'DEMAT_INDIVIDUAL',
    'HUF_ACCOUNT',
    'CORPORATE',
    'TRUST',
    'TAXABLE_INDIVIDUAL'
  ] as const;

  for (let i = 1; i <= portfolioTargetCount; i++) {
    const invId = `INV-${String(i).padStart(6, '0')}`;
    const portId = `PORT-${invId}-01`;
    const firstName = prng.choice(FIRST_NAMES);
    const lastName = prng.choice(LAST_NAMES);
    const risk = prng.choice([...riskTolerances]);
    const portType = prng.choice([...portfolioTypes]);
    const horizonYears = prng.nextInt(3, 35);
    const taxBracket = prng.choice([10, 20, 30, 39]); // Indian income tax slab rates

    investorProfiles.push({
      investor_id: invId,
      full_name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@investor.in`,
      risk_tolerance: risk,
      investment_horizon_years: horizonYears,
      tax_bracket_pct: taxBracket,
      kyc_status: 'VERIFIED',
      created_at: '2024-01-15T09:00:00Z'
    });

    // Assign target model based on risk
    let modelId = 'TGT-000002'; // default balanced
    if (risk === 'CONSERVATIVE' || risk === 'MODERATE_CONSERVATIVE') modelId = 'TGT-000003';
    else if (risk === 'GROWTH') modelId = 'TGT-000004';
    else if (risk === 'AGGRESSIVE_GROWTH') modelId = 'TGT-000001';

    // Starting cash in INR: ₹1,50,000 to ₹18,00,000
    const cashBalance = Number((prng.nextInt(15, 180) * 10000).toFixed(2));

    // Generate 4-7 holdings per portfolio across different instruments
    const availableNonExcluded = instruments.filter(inst => !inst.is_excluded);
    const numHoldings = prng.nextInt(4, 7);
    const shuffledInst = [...availableNonExcluded].sort(() => prng.nextFloat() - 0.5).slice(0, numHoldings);

    for (const inst of shuffledInst) {
      const priceRecord = latestPriceMap.get(inst.instrument_id);
      const currentPrice = priceRecord ? priceRecord.price_usd : 100.0;
      // Holding size between 50 and 800 shares
      const shares = prng.nextInt(50, 800);
      const costBasis = Number((currentPrice * (1 + prng.nextGaussian(0, 0.08))).toFixed(2));
      const unrealizedPnl = Number(((currentPrice - costBasis) * shares).toFixed(2));

      holdings.push({
        holding_id: `HOLD-${portId}-${inst.instrument_id}`,
        portfolio_id: portId,
        instrument_id: inst.instrument_id,
        shares_held: shares,
        cost_basis_per_share: costBasis,
        unrealized_gain_loss: unrealizedPnl,
        last_updated_at: '2026-10-30T16:00:00Z'
      });
    }

    portfolios.push({
      portfolio_id: portId,
      investor_id: invId,
      portfolio_name: `${lastName} ${portType.replace('_', ' ')} Portfolio`,
      portfolio_type: portType,
      currency: 'INR',
      cash_balance: cashBalance,
      target_model_id: modelId,
      drift_status: 'IN_TOLERANCE', // will be evaluated
      max_drift_pct: 0,
      last_rebalanced_at: '2026-07-15T14:30:00Z',
      created_at: '2024-02-01T10:00:00Z',
      status: 'ACTIVE'
    });
  }

  // 6. Generate Rebalance Proposals & Trades for all Portfolios
  const proposals: RebalanceProposal[] = [];
  const trades: Trade[] = [];

  for (const port of portfolios) {
    const portHoldings = holdings.filter(h => h.portfolio_id === port.portfolio_id);
    const targetModel = targetMap.get(port.target_model_id) || targetAllocations[0];

    const sim = simulatePortfolioRebalance(
      port,
      portHoldings,
      instrumentMap,
      latestPriceMap,
      targetModel,
      STANDARD_FEE_SCHEDULE,
      constraints
    );

    port.max_drift_pct = sim.max_drift_pct;
    port.drift_status = sim.drift_status;

    const proposalId = `RB-2026-${port.portfolio_id.slice(-6)}`;
    const totalBuy = sim.proposed_trades.filter(t => t.action === 'BUY').reduce((acc, t) => acc + t.gross_amount_usd, 0);
    const totalSell = sim.proposed_trades.filter(t => t.action === 'SELL').reduce((acc, t) => acc + t.gross_amount_usd, 0);

    const proposal: RebalanceProposal = {
      proposal_id: proposalId,
      portfolio_id: port.portfolio_id,
      status: sim.violations.some(v => v.severity === 'CRITICAL_ERROR') ? 'DRAFT' : 'PENDING_APPROVAL',
      total_trades_count: sim.proposed_trades.length,
      total_buy_usd: Number(totalBuy.toFixed(2)),
      total_sell_usd: Number(totalSell.toFixed(2)),
      estimated_total_fees_usd: sim.total_fees_usd,
      pre_trade_drift_score: sim.max_drift_pct,
      post_trade_drift_score: sim.post_max_drift_pct,
      policy_check_status: sim.violations.length === 0 ? 'PASS' : sim.violations.some(v => v.severity === 'CRITICAL_ERROR') ? 'FAIL' : 'WARNING',
      policy_violations: sim.violations,
      created_at: '2026-10-30T17:00:00Z',
      approved_by: null,
      approved_at: null,
      audit_notes: `Generated by EquiBalance policy engine. Total orders: ${sim.proposed_trades.length}.`
    };

    proposals.push(proposal);

    for (const tr of sim.proposed_trades) {
      tr.proposal_id = proposalId;
      trades.push(tr);
    }
  }

  // 7. Inject 5 Labelled Required Edge Cases & Produce Separate Ground Truth
  const groundTruthAnomalies: GroundTruthAnomaly[] = [];

  // Anomaly 1: Portfolio weights fail to sum to 100%
  if (portfolios.length >= 2) {
    const targetPort = portfolios[1];
    targetPort.target_model_id = 'TGT-000005'; // Defective model summing to 108%
    targetPort.anomaly_flag = 'WEIGHTS_NOT_100_PCT';

    groundTruthAnomalies.push({
      anomaly_id: 'ANOM-001',
      entity_type: 'TargetAllocation',
      entity_id: 'TGT-000005',
      issue_type: 'WEIGHTS_NOT_100_PCT',
      expected_detection_rule: 'ERR_TARGET_WEIGHT_SUM: sum(target_weights) == 100.0%',
      severity: 'CRITICAL',
      description: `Target allocation model 'TGT-000005' assigned to ${targetPort.portfolio_id} sums to 108.0%, violating the 100% full-investment invariant.`,
      resolution_guidance: 'Recalibrate model asset weights in TargetAllocation table to equal 100.0%.',
      detected_by_system: true,
      status: 'OPEN'
    });
  }

  // Anomaly 2: Trade exceeds holding
  if (trades.length >= 5 && holdings.length >= 5) {
    const victimTrade = trades[0];
    const victimHolding = holdings.find(h => h.portfolio_id === victimTrade.portfolio_id && h.instrument_id === victimTrade.instrument_id);
    if (victimHolding) {
      victimTrade.action = 'SELL';
      victimTrade.shares = victimHolding.shares_held + 750; // Attempting to sell more than held!
      victimTrade.gross_amount_usd = Number((victimTrade.shares * victimTrade.limit_or_market_price).toFixed(2));
      victimTrade.anomaly_label = 'TRADE_EXCEEDS_HOLDING';

      groundTruthAnomalies.push({
        anomaly_id: 'ANOM-002',
        entity_type: 'Trade',
        entity_id: victimTrade.trade_id,
        issue_type: 'TRADE_EXCEEDS_HOLDING',
        expected_detection_rule: 'ERR_SELL_EXCEEDS_POSITION: trade.shares <= holding.shares_held',
        severity: 'CRITICAL',
        description: `Sell trade ${victimTrade.trade_id} specifies ${victimTrade.shares} shares, exceeding current inventory of ${victimHolding.shares_held} shares in ${victimTrade.portfolio_id}.`,
        resolution_guidance: 'Cap sell order quantity to maximum settled holding balance.',
        detected_by_system: true,
        status: 'OPEN'
      });
    }
  }

  // Anomaly 3: Excluded instrument recommended
  if (trades.length >= 3) {
    const victimTrade = trades[2];
    victimTrade.instrument_id = 'INS-000014'; // SEBI-RST (Restricted Penny / Debarred Entity)
    victimTrade.action = 'BUY';
    victimTrade.compliance_notes = 'VIOLATION: Injected order for SEBI debarred surveillance list security.';
    victimTrade.anomaly_label = 'EXCLUDED_INSTRUMENT_RECOMMENDED';

    groundTruthAnomalies.push({
      anomaly_id: 'ANOM-003',
      entity_type: 'Trade',
      entity_id: victimTrade.trade_id,
      issue_type: 'EXCLUDED_INSTRUMENT_RECOMMENDED',
      expected_detection_rule: 'ERR_EXCLUDED_ASSET: instrument.is_excluded == false for all BUY orders',
      severity: 'CRITICAL',
      description: `Buy trade ${victimTrade.trade_id} recommends purchasing INS-000014 (SEBI-RST), an asset prohibited by SEBI Debarred Entities circular & Enhanced Surveillance Measures.`,
      resolution_guidance: 'Cancel buy order and route cash towards non-restricted diversified benchmark ETF (NIFTYBEES).',
      detected_by_system: true,
      status: 'OPEN'
    });
  }

  // Anomaly 4: Fees omitted
  if (trades.length >= 4) {
    const victimTrade = trades[3];
    victimTrade.estimated_fee_usd = 0.00; // Zero fee injected!
    victimTrade.net_amount_usd = victimTrade.gross_amount_usd;
    victimTrade.anomaly_label = 'FEES_OMITTED';

    groundTruthAnomalies.push({
      anomaly_id: 'ANOM-004',
      entity_type: 'Trade',
      entity_id: victimTrade.trade_id,
      issue_type: 'FEES_OMITTED',
      expected_detection_rule: 'ERR_FEE_MISSING: estimated_fee_usd > 0 for orders exceeding base threshold',
      severity: 'MEDIUM',
      description: `Trade ${victimTrade.trade_id} with gross value of ₹${victimTrade.gross_amount_usd.toLocaleString('en-IN')} has ₹0.00 estimated brokerage & STT fees, omitting mandatory transaction levies.`,
      resolution_guidance: 'Re-invoke FeeSchedule calculator to compute standard tiered brokerage and STT delivery levies.',
      detected_by_system: true,
      status: 'OPEN'
    });
  }

  // Anomaly 5: Stale price used without flag
  const stalePriceRecord = allPrices.find(p => p.instrument_id === 'INS-000006' && p.as_of_date === '2026-10-20');
  if (stalePriceRecord) {
    // Deliberately set is_stale to false even though date is over 8 days old
    stalePriceRecord.is_stale = false;
    groundTruthAnomalies.push({
      anomaly_id: 'ANOM-005',
      entity_type: 'MarketPrice',
      entity_id: stalePriceRecord.price_id,
      issue_type: 'STALE_PRICE_USED',
      expected_detection_rule: 'ERR_STALE_MARK: current_date - as_of_date <= 3 trading days',
      severity: 'HIGH',
      description: `Market price record ${stalePriceRecord.price_id} dates from ${stalePriceRecord.as_of_date} (> 7 business days old) but lacks mandatory is_stale warning flag.`,
      resolution_guidance: 'Flag price as stale and fetch updated closing tick before valuing holdings.',
      detected_by_system: true,
      status: 'OPEN'
    });
  }

  // 8. Compute deterministic dataset checksum
  const coreDump = JSON.stringify({
    seed,
    investors: investorProfiles.length,
    portfolios: portfolios.length,
    holdings: holdings.length,
    prices: allPrices.length,
    trades: trades.length,
    anomalies: groundTruthAnomalies.length,
    sampleP0Cash: portfolios[0]?.cash_balance,
    sampleT0Gross: trades[0]?.gross_amount_usd
  });
  const checksum = calculateChecksum(coreDump);

  const summary: DatasetSummary = {
    seed,
    investorCount: investorProfiles.length,
    portfolioCount: portfolios.length,
    instrumentCount: instruments.length,
    holdingCount: holdings.length,
    marketPriceCount: allPrices.length,
    targetAllocationCount: targetAllocations.length,
    constraintCount: constraints.length,
    feeScheduleCount: feeSchedules.length,
    proposalCount: proposals.length,
    tradeCount: trades.length,
    anomalyCount: groundTruthAnomalies.length,
    checksum,
    generatedAt: '2026-10-30T08:25:00Z'
  };

  return {
    investorProfiles,
    portfolios,
    instruments,
    marketPrices: allPrices,
    latestPriceMap,
    holdings,
    targetAllocations,
    constraints,
    feeSchedules,
    proposals,
    trades,
    groundTruthAnomalies,
    summary
  };
}
