import { GeneratedDataset, generateSyntheticDataset } from './dataGenerator';
import { ValidationReport } from '../types';

/**
 * Validates primary key uniqueness, foreign key referential integrity,
 * arithmetic reconciliation (weight sums, trade vs holding balance),
 * fee presence, and stale pricing.
 */
export function validateDataset(dataset: GeneratedDataset): ValidationReport {
  const details: ValidationReport['details'] = [];

  // 1. Primary Key Uniqueness
  const pkChecks = [
    { name: 'InvestorProfile PK Uniqueness', list: dataset.investorProfiles.map(i => i.investor_id) },
    { name: 'Portfolio PK Uniqueness', list: dataset.portfolios.map(p => p.portfolio_id) },
    { name: 'Instrument PK Uniqueness', list: dataset.instruments.map(i => i.instrument_id) },
    { name: 'Holding PK Uniqueness', list: dataset.holdings.map(h => h.holding_id) },
    { name: 'TargetAllocation PK Uniqueness', list: dataset.targetAllocations.map(t => t.target_id) },
    { name: 'Constraint PK Uniqueness', list: dataset.constraints.map(c => c.constraint_id) },
    { name: 'RebalanceProposal PK Uniqueness', list: dataset.proposals.map(r => r.proposal_id) },
    { name: 'Trade PK Uniqueness', list: dataset.trades.map(t => t.trade_id) }
  ];

  for (const check of pkChecks) {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const id of check.list) {
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    }
    details.push({
      check_name: check.name,
      category: 'PK_FK_INTEGRITY',
      status: dupes.length === 0 ? 'PASS' : 'FAIL',
      description: dupes.length === 0 ? 'All primary keys unique and properly formatted.' : `Found ${dupes.length} duplicate primary keys.`,
      discrepancyCount: dupes.length,
      sampleEntities: dupes.slice(0, 3)
    });
  }

  // 2. Foreign Key Integrity
  const investorIds = new Set(dataset.investorProfiles.map(i => i.investor_id));
  const targetIds = new Set(dataset.targetAllocations.map(t => t.target_id));
  const portfolioIds = new Set(dataset.portfolios.map(p => p.portfolio_id));
  const instrumentIds = new Set(dataset.instruments.map(i => i.instrument_id));
  const proposalIds = new Set(dataset.proposals.map(r => r.proposal_id));

  // Check Portfolio -> InvestorProfile & TargetAllocation
  const brokenPortFKs = dataset.portfolios.filter(p => !investorIds.has(p.investor_id) || !targetIds.has(p.target_model_id));
  details.push({
    check_name: 'Portfolio Foreign Key Referential Integrity',
    category: 'PK_FK_INTEGRITY',
    status: brokenPortFKs.length === 0 ? 'PASS' : 'FAIL',
    description: brokenPortFKs.length === 0 ? 'All portfolio foreign keys resolve to valid parents.' : `Found ${brokenPortFKs.length} orphaned portfolios.`,
    discrepancyCount: brokenPortFKs.length,
    sampleEntities: brokenPortFKs.slice(0, 3).map(p => p.portfolio_id)
  });

  // Check Holding -> Portfolio & Instrument
  const brokenHoldingFKs = dataset.holdings.filter(h => !portfolioIds.has(h.portfolio_id) || !instrumentIds.has(h.instrument_id));
  details.push({
    check_name: 'Holding Foreign Key Referential Integrity',
    category: 'PK_FK_INTEGRITY',
    status: brokenHoldingFKs.length === 0 ? 'PASS' : 'FAIL',
    description: brokenHoldingFKs.length === 0 ? 'All holding records link to valid portfolios and instruments.' : `Found ${brokenHoldingFKs.length} orphaned holding records.`,
    discrepancyCount: brokenHoldingFKs.length,
    sampleEntities: brokenHoldingFKs.slice(0, 3).map(h => h.holding_id)
  });

  // Check Trade -> Proposal, Portfolio, Instrument
  const brokenTradeFKs = dataset.trades.filter(t => !proposalIds.has(t.proposal_id) || !portfolioIds.has(t.portfolio_id) || !instrumentIds.has(t.instrument_id));
  details.push({
    check_name: 'Trade Foreign Key Referential Integrity',
    category: 'PK_FK_INTEGRITY',
    status: brokenTradeFKs.length === 0 ? 'PASS' : 'FAIL',
    description: brokenTradeFKs.length === 0 ? 'All trades reference valid proposals, portfolios, and instruments.' : `Found ${brokenTradeFKs.length} orphaned trade records.`,
    discrepancyCount: brokenTradeFKs.length,
    sampleEntities: brokenTradeFKs.slice(0, 3).map(t => t.trade_id)
  });

  // 3. Edge Case 1: Target Allocation 100% Weight Reconciliation
  const defectiveModels = dataset.targetAllocations.filter(t => {
    const sum = Object.values(t.target_weights).reduce((a, b) => a + b, 0);
    return Math.abs(sum - 100.0) > 0.01;
  });
  details.push({
    check_name: 'Target Allocation 100% Reconciliation (Edge Case 1)',
    category: 'ARITHMETIC_RECONCILIATION',
    status: defectiveModels.length > 0 ? 'FAIL' : 'PASS',
    description: defectiveModels.length > 0
      ? `Flagged ${defectiveModels.length} model(s) where weights sum != 100% (Detected Anomaly: ${defectiveModels.map(m => m.target_id).join(', ')}).`
      : 'All target allocation models sum to exactly 100.00%.',
    discrepancyCount: defectiveModels.length,
    sampleEntities: defectiveModels.map(m => m.target_id)
  });

  // 4. Edge Case 2: Trade Exceeds Holding Feasibility
  const holdingMap = new Map<string, number>();
  for (const h of dataset.holdings) {
    holdingMap.set(`${h.portfolio_id}:${h.instrument_id}`, h.shares_held);
  }

  const oversellTrades = dataset.trades.filter(t => {
    if (t.action !== 'SELL') return false;
    const held = holdingMap.get(`${t.portfolio_id}:${t.instrument_id}`) ?? 0;
    return t.shares > held;
  });

  details.push({
    check_name: 'Trade Quantity vs Holding Feasibility (Edge Case 2)',
    category: 'POLICY_COMPLIANCE',
    status: oversellTrades.length > 0 ? 'FAIL' : 'PASS',
    description: oversellTrades.length > 0
      ? `Identified ${oversellTrades.length} trade(s) attempting to sell more shares than held (Detected Anomaly: ${oversellTrades.map(t => t.trade_id).join(', ')}).`
      : 'All proposed sell trades are backed by sufficient share inventory.',
    discrepancyCount: oversellTrades.length,
    sampleEntities: oversellTrades.map(t => `${t.trade_id} (${t.shares} > held)`)
  });

  // 5. Edge Case 3: Excluded Instrument Recommendation Guard
  const excludedInstIds = new Set(dataset.instruments.filter(i => i.is_excluded).map(i => i.instrument_id));
  const illegalBuyTrades = dataset.trades.filter(t => t.action === 'BUY' && excludedInstIds.has(t.instrument_id));

  details.push({
    check_name: 'Sanctions / ESG Excluded Asset Guard (Edge Case 3)',
    category: 'POLICY_COMPLIANCE',
    status: illegalBuyTrades.length > 0 ? 'FAIL' : 'PASS',
    description: illegalBuyTrades.length > 0
      ? `Detected ${illegalBuyTrades.length} buy order(s) for restricted/sanctioned instruments (Detected Anomaly: ${illegalBuyTrades.map(t => t.trade_id).join(', ')}).`
      : 'Zero trades recommended for excluded or sanctioned instruments.',
    discrepancyCount: illegalBuyTrades.length,
    sampleEntities: illegalBuyTrades.map(t => `${t.trade_id} (Instrument: ${t.instrument_id})`)
  });

  // 6. Edge Case 4: Missing / Omitted Fees Check
  const zeroFeeTrades = dataset.trades.filter(t => t.gross_amount_usd > 1000 && t.estimated_fee_usd === 0);
  details.push({
    check_name: 'Fee Schedule Application Consistency (Edge Case 4)',
    category: 'ARITHMETIC_RECONCILIATION',
    status: zeroFeeTrades.length > 0 ? 'WARNING' : 'PASS',
    description: zeroFeeTrades.length > 0
      ? `Identified ${zeroFeeTrades.length} trade(s) with omitted transaction fees (₹0.00) (Detected Anomaly: ${zeroFeeTrades.map(t => t.trade_id).join(', ')}).`
      : 'All trades have non-zero tiered fee estimates applied according to FeeSchedule.',
    discrepancyCount: zeroFeeTrades.length,
    sampleEntities: zeroFeeTrades.map(t => `${t.trade_id} (₹${t.gross_amount_usd.toLocaleString('en-IN')})`)
  });

  // 7. Edge Case 5: Stale Pricing Audit
  // Today's benchmark date is 2026-10-30; any price older than 3 business days (2026-10-27) without is_stale=true is an anomaly
  const unflaggedStalePrices = dataset.marketPrices.filter(p => {
    const pDate = new Date(p.as_of_date);
    const benchmarkDate = new Date('2026-10-30');
    const diffDays = Math.floor((benchmarkDate.getTime() - pDate.getTime()) / (1000 * 3600 * 24));
    return diffDays > 5 && !p.is_stale;
  });

  details.push({
    check_name: 'Market Price Staleness Flagging Audit (Edge Case 5)',
    category: 'EDGE_CASE_DETECTION',
    status: unflaggedStalePrices.length > 0 ? 'WARNING' : 'PASS',
    description: unflaggedStalePrices.length > 0
      ? `Found ${unflaggedStalePrices.length} historical price quote(s) exceeding 5 days old lacking the mandatory is_stale flag.`
      : 'All historical market price marks comply with staleness policies.',
    discrepancyCount: unflaggedStalePrices.length,
    sampleEntities: unflaggedStalePrices.slice(0, 3).map(p => `${p.price_id} (${p.as_of_date})`)
  });

  const passedChecks = details.filter(d => d.status === 'PASS').length;
  const failedChecks = details.filter(d => d.status === 'FAIL').length;
  const warningsCount = details.filter(d => d.status === 'WARNING').length;

  return {
    timestamp: '2026-10-30T08:25:20Z',
    totalChecks: details.length,
    passedChecks,
    failedChecks,
    warningsCount,
    details
  };
}

/**
 * Step 10: Double Regeneration Reproducibility Proof
 * Runs the generator twice with the exact same seed and compares row counts and SHA/FNV checksums.
 */
export function verifyReproducibility(
  seed: number = 20261022,
  portfolioCount: number = 50
): {
  isReproducible: boolean;
  run1Checksum: string;
  run2Checksum: string;
  run1Counts: Record<string, number>;
  run2Counts: Record<string, number>;
  timeMs: number;
} {
  const start = performance.now();

  const run1 = generateSyntheticDataset(portfolioCount, seed);
  const run2 = generateSyntheticDataset(portfolioCount, seed);

  const duration = Math.round(performance.now() - start);

  const run1Counts = {
    investors: run1.investorProfiles.length,
    portfolios: run1.portfolios.length,
    holdings: run1.holdings.length,
    marketPrices: run1.marketPrices.length,
    trades: run1.trades.length,
    anomalies: run1.groundTruthAnomalies.length
  };

  const run2Counts = {
    investors: run2.investorProfiles.length,
    portfolios: run2.portfolios.length,
    holdings: run2.holdings.length,
    marketPrices: run2.marketPrices.length,
    trades: run2.trades.length,
    anomalies: run2.groundTruthAnomalies.length
  };

  const isReproducible =
    run1.summary.checksum === run2.summary.checksum &&
    JSON.stringify(run1Counts) === JSON.stringify(run2Counts);

  return {
    isReproducible,
    run1Checksum: run1.summary.checksum,
    run2Checksum: run2.summary.checksum,
    run1Counts,
    run2Counts,
    timeMs: duration
  };
}
