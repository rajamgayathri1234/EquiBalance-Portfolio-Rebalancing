import {
  Portfolio,
  Holding,
  Instrument,
  MarketPrice,
  TargetAllocation,
  FeeSchedule,
  Constraint,
  Trade,
  RebalanceProposal,
  PortfolioRebalanceSimulation,
  AssetClass,
  PolicyViolation
} from '../types';

/**
 * Calculates tiered transaction fees according to standard FeeSchedule.
 */
export function calculateTradeFee(
  schedule: FeeSchedule,
  grossAmountUsd: number,
  isSell: boolean
): number {
  if (grossAmountUsd <= 0) return 0;

  let fee = schedule.base_fee_usd;

  if (grossAmountUsd <= schedule.tier_1_max_usd) {
    fee += grossAmountUsd * (schedule.tier_1_rate_bps / 10000);
  } else if (grossAmountUsd <= schedule.tier_2_max_usd) {
    fee += schedule.tier_1_max_usd * (schedule.tier_1_rate_bps / 10000);
    fee += (grossAmountUsd - schedule.tier_1_max_usd) * (schedule.tier_2_rate_bps / 10000);
  } else {
    fee += schedule.tier_1_max_usd * (schedule.tier_1_rate_bps / 10000);
    fee += (schedule.tier_2_max_usd - schedule.tier_1_max_usd) * (schedule.tier_2_rate_bps / 10000);
    fee += (grossAmountUsd - schedule.tier_2_max_usd) * (schedule.tier_3_rate_bps / 10000);
  }

  // SEC regulatory fee only on SELL transactions
  if (isSell) {
    fee += grossAmountUsd * schedule.sec_transaction_fee_rate;
  }

  return Number(fee.toFixed(2));
}

/**
 * Core Policy-Constrained Rebalancing Engine
 */
export function simulatePortfolioRebalance(
  portfolio: Portfolio,
  holdings: Holding[],
  instruments: Map<string, Instrument>,
  latestPrices: Map<string, MarketPrice>,
  targetModel: TargetAllocation,
  feeSchedule: FeeSchedule,
  constraints: Constraint[] = []
): PortfolioRebalanceSimulation {
  const assetClasses: AssetClass[] = [
    'US_EQUITY',
    'INTL_EQUITY',
    'EM_EQUITY',
    'FIXED_INCOME',
    'REAL_ESTATE',
    'COMMODITIES',
    'CASH_EQUIVALENT'
  ];

  // 1. Calculate current asset values and total portfolio value
  const currentAllocations: Record<AssetClass, { value: number; weight: number }> = {
    US_EQUITY: { value: 0, weight: 0 },
    INTL_EQUITY: { value: 0, weight: 0 },
    EM_EQUITY: { value: 0, weight: 0 },
    FIXED_INCOME: { value: 0, weight: 0 },
    REAL_ESTATE: { value: 0, weight: 0 },
    COMMODITIES: { value: 0, weight: 0 },
    CASH_EQUIVALENT: { value: portfolio.cash_balance, weight: 0 }
  };

  const holdingValuationMap = new Map<string, { value: number; price: number; shares: number; inst: Instrument }>();

  let totalHoldingsValue = 0;

  for (const h of holdings) {
    const inst = instruments.get(h.instrument_id);
    const priceRecord = latestPrices.get(h.instrument_id);
    if (!inst || !priceRecord) continue;

    const val = Number((h.shares_held * priceRecord.price_usd).toFixed(2));
    totalHoldingsValue += val;
    currentAllocations[inst.asset_class].value += val;

    holdingValuationMap.set(h.instrument_id, {
      value: val,
      price: priceRecord.price_usd,
      shares: h.shares_held,
      inst
    });
  }

  const totalPortfolioValue = Number((totalHoldingsValue + portfolio.cash_balance).toFixed(2));

  // Compute percentage weights and drift
  const driftByAssetClass: Record<AssetClass, number> = {} as any;
  let maxDriftPct = 0;

  for (const ac of assetClasses) {
    const weight = totalPortfolioValue > 0 ? (currentAllocations[ac].value / totalPortfolioValue) * 100 : 0;
    currentAllocations[ac].weight = Number(weight.toFixed(2));

    const targetWeight = targetModel.target_weights[ac] || 0;
    const drift = Number((weight - targetWeight).toFixed(2));
    driftByAssetClass[ac] = drift;

    if (Math.abs(drift) > maxDriftPct) {
      maxDriftPct = Math.abs(drift);
    }
  }

  // 2. Identify active constraints
  const minTradeConstraint = constraints.find(c => c.constraint_type === 'MIN_TRADE_SIZE' && c.is_active);
  const minTradeUsd = minTradeConstraint?.parameters.min_trade_usd ?? 500;

  const minCashConstraint = constraints.find(c => c.constraint_type === 'MIN_CASH_BUFFER' && c.is_active);
  const minCashPct = minCashConstraint?.parameters.min_cash_pct ?? targetModel.min_cash_buffer_pct;

  const maxWeightConstraint = constraints.find(c => c.constraint_type === 'MAX_SINGLE_WEIGHT' && c.is_active);
  const maxSingleWeightPct = maxWeightConstraint?.parameters.max_weight_pct ?? 40.0;

  const violations: PolicyViolation[] = [];
  const proposedTrades: Trade[] = [];

  // Check if target model itself is corrupted (e.g. weights do not sum to 100%)
  const totalTargetWeight = Object.values(targetModel.target_weights).reduce((a, b) => a + b, 0);
  if (Math.abs(totalTargetWeight - 100.0) > 0.1) {
    violations.push({
      rule_code: 'ERR_TARGET_WEIGHT_SUM',
      severity: 'CRITICAL_ERROR',
      message: `Target allocation model '${targetModel.model_name}' sums to ${totalTargetWeight.toFixed(1)}%, failing 100% reconciliation requirement.`,
      remedy: 'Normalize target weights in TargetAllocation model to exact 100.00%.'
    });
  }

  // Tracking post-trade simulation state
  const simulatedHoldings = new Map<string, number>();
  for (const h of holdings) {
    simulatedHoldings.set(h.instrument_id, h.shares_held);
  }
  let simulatedCash = portfolio.cash_balance;
  let totalEstimatedFees = 0;

  // 3. Step A: Process SELLS first to generate liquidity and reduce overweight positions
  for (const ac of assetClasses) {
    if (ac === 'CASH_EQUIVALENT') continue;
    const drift = driftByAssetClass[ac];

    // If asset class is overweight by more than rebalance threshold
    if (drift > targetModel.rebalance_threshold_pct) {
      const excessUsd = (drift / 100) * totalPortfolioValue;

      // Find holdings in this asset class to trim
      const acHoldings = holdings
        .filter(h => instruments.get(h.instrument_id)?.asset_class === ac)
        .sort((a, b) => (holdingValuationMap.get(b.instrument_id)?.value ?? 0) - (holdingValuationMap.get(a.instrument_id)?.value ?? 0));

      let acRemainingExcess = excessUsd;

      for (const h of acHoldings) {
        if (acRemainingExcess < minTradeUsd) break;

        const valInfo = holdingValuationMap.get(h.instrument_id);
        if (!valInfo || valInfo.price <= 0) continue;

        // Proportional trimming
        const sellDollarAmount = Math.min(valInfo.value * 0.7, acRemainingExcess);
        if (sellDollarAmount < minTradeUsd) continue;

        let sharesToSell = Math.floor(sellDollarAmount / valInfo.price);
        if (sharesToSell <= 0) continue;

        // Guard against selling more than held
        if (sharesToSell > h.shares_held) {
          sharesToSell = h.shares_held;
        }

        const grossSellUsd = Number((sharesToSell * valInfo.price).toFixed(2));
        const fee = calculateTradeFee(feeSchedule, grossSellUsd, true);
        const netProceeds = Number((grossSellUsd - fee).toFixed(2));

        simulatedCash += netProceeds;
        totalEstimatedFees += fee;
        simulatedHoldings.set(h.instrument_id, (simulatedHoldings.get(h.instrument_id) || 0) - sharesToSell);
        acRemainingExcess -= grossSellUsd;

        const preWeight = Number(((valInfo.value / totalPortfolioValue) * 100).toFixed(2));
        const postVal = (valInfo.shares - sharesToSell) * valInfo.price;
        const postWeight = Number(((postVal / totalPortfolioValue) * 100).toFixed(2));

        proposedTrades.push({
          trade_id: `TRD-2026-${String(proposedTrades.length + 1).padStart(6, '0')}`,
          proposal_id: `RB-2026-${portfolio.portfolio_id.slice(-6)}`,
          portfolio_id: portfolio.portfolio_id,
          instrument_id: h.instrument_id,
          action: 'SELL',
          shares: sharesToSell,
          limit_or_market_price: valInfo.price,
          gross_amount_usd: grossSellUsd,
          estimated_fee_usd: fee,
          net_amount_usd: netProceeds,
          pre_weight_pct: preWeight,
          post_weight_pct: postWeight,
          target_weight_pct: Number(((targetModel.target_weights[ac] / (acHoldings.length || 1))).toFixed(2)),
          execution_status: 'PROPOSED',
          compliance_notes: `Trim overweight ${ac} to reduce drift.`
        });
      }
    }
  }

  // 4. Step B: Process BUYS for underweight asset classes using available liquidity
  const minRequiredCashReserve = Number(((minCashPct / 100) * totalPortfolioValue).toFixed(2));
  let deployableCash = Math.max(0, simulatedCash - minRequiredCashReserve);

  for (const ac of assetClasses) {
    if (ac === 'CASH_EQUIVALENT' || deployableCash < minTradeUsd) continue;
    const drift = driftByAssetClass[ac];

    // If asset class is underweight
    if (drift < -targetModel.rebalance_threshold_pct) {
      const deficitUsd = Math.abs(drift / 100) * totalPortfolioValue;
      const targetAllocationForAc = Math.min(deficitUsd, deployableCash);

      // Find primary instrument for this asset class
      const candidates = Array.from(instruments.values()).filter(i => i.asset_class === ac);
      if (candidates.length === 0) continue;

      // Select high-liquidity non-excluded instrument
      const primaryInst = candidates.find(i => !i.is_excluded && i.liquidity_tier === 'TIER_1_HIGH') || candidates[0];
      const priceRecord = latestPrices.get(primaryInst.instrument_id);
      if (!priceRecord || priceRecord.price_usd <= 0) continue;

      // Policy check: Excluded instrument check
      if (primaryInst.is_excluded) {
        violations.push({
          rule_code: 'ERR_EXCLUDED_ASSET',
          severity: 'CRITICAL_ERROR',
          instrument_id: primaryInst.instrument_id,
          message: `Instrument ${primaryInst.ticker} is on the compliance exclusion list (${primaryInst.exclusion_reason}).`,
          remedy: 'Select an alternate permitted benchmark instrument for this asset class.'
        });
      }

      // Check price staleness
      if (priceRecord.is_stale) {
        violations.push({
          rule_code: 'WARN_STALE_PRICE',
          severity: 'WARNING',
          instrument_id: primaryInst.instrument_id,
          message: `Market price for ${primaryInst.ticker} (${priceRecord.as_of_date}) is stale (> 3 days old).`,
          remedy: 'Request fresh market quote before order routing.'
        });
      }

      let buyDollars = Math.min(targetAllocationForAc, deployableCash);
      if (buyDollars < minTradeUsd) continue;

      const sharesToBuy = Math.floor(buyDollars / priceRecord.price_usd);
      if (sharesToBuy <= 0) continue;

      const grossBuyUsd = Number((sharesToBuy * priceRecord.price_usd).toFixed(2));
      const fee = calculateTradeFee(feeSchedule, grossBuyUsd, false);
      const totalCost = Number((grossBuyUsd + fee).toFixed(2));

      if (deployableCash >= totalCost) {
        deployableCash -= totalCost;
        simulatedCash -= totalCost;
        totalEstimatedFees += fee;

        const currentShares = simulatedHoldings.get(primaryInst.instrument_id) || 0;
        simulatedHoldings.set(primaryInst.instrument_id, currentShares + sharesToBuy);

        const currentVal = holdingValuationMap.get(primaryInst.instrument_id)?.value ?? 0;
        const preWeight = Number(((currentVal / totalPortfolioValue) * 100).toFixed(2));
        const postWeight = Number((((currentVal + grossBuyUsd) / totalPortfolioValue) * 100).toFixed(2));

        // Check single instrument max weight
        if (postWeight > maxSingleWeightPct) {
          violations.push({
            rule_code: 'WARN_CONCENTRATION_CAP',
            severity: 'WARNING',
            instrument_id: primaryInst.instrument_id,
            message: `Proposed post-trade weight of ${postWeight}% in ${primaryInst.ticker} approaches cap (${maxSingleWeightPct}%).`,
            remedy: 'Distribute allocation across multiple instruments in asset class.'
          });
        }

        proposedTrades.push({
          trade_id: `TRD-2026-${String(proposedTrades.length + 1).padStart(6, '0')}`,
          proposal_id: `RB-2026-${portfolio.portfolio_id.slice(-6)}`,
          portfolio_id: portfolio.portfolio_id,
          instrument_id: primaryInst.instrument_id,
          action: 'BUY',
          shares: sharesToBuy,
          limit_or_market_price: priceRecord.price_usd,
          gross_amount_usd: grossBuyUsd,
          estimated_fee_usd: fee,
          net_amount_usd: totalCost,
          pre_weight_pct: preWeight,
          post_weight_pct: postWeight,
          target_weight_pct: targetModel.target_weights[ac],
          execution_status: 'PROPOSED',
          compliance_notes: `Replenish underweight ${ac} towards target weight.`
        });
      }
    }
  }

  // 5. Simulate post-trade asset allocations and residual drift
  const simulatedPostAllocations: Record<AssetClass, { value: number; weight: number }> = {
    US_EQUITY: { value: 0, weight: 0 },
    INTL_EQUITY: { value: 0, weight: 0 },
    EM_EQUITY: { value: 0, weight: 0 },
    FIXED_INCOME: { value: 0, weight: 0 },
    REAL_ESTATE: { value: 0, weight: 0 },
    COMMODITIES: { value: 0, weight: 0 },
    CASH_EQUIVALENT: { value: Number(simulatedCash.toFixed(2)), weight: 0 }
  };

  let simulatedTotalPostValue = Number(simulatedCash.toFixed(2));

  for (const [instId, shares] of simulatedHoldings.entries()) {
    const inst = instruments.get(instId);
    const priceRecord = latestPrices.get(instId);
    if (!inst || !priceRecord || shares <= 0) continue;

    const val = Number((shares * priceRecord.price_usd).toFixed(2));
    simulatedTotalPostValue += val;
    simulatedPostAllocations[inst.asset_class].value += val;
  }

  simulatedTotalPostValue = Number(simulatedTotalPostValue.toFixed(2));

  const simulatedPostDrift: Record<AssetClass, number> = {} as any;
  let postMaxDriftPct = 0;

  for (const ac of assetClasses) {
    const weight = simulatedTotalPostValue > 0 ? (simulatedPostAllocations[ac].value / simulatedTotalPostValue) * 100 : 0;
    simulatedPostAllocations[ac].weight = Number(weight.toFixed(2));

    const targetWeight = targetModel.target_weights[ac] || 0;
    const drift = Number((weight - targetWeight).toFixed(2));
    simulatedPostDrift[ac] = drift;

    if (Math.abs(drift) > postMaxDriftPct) {
      postMaxDriftPct = Math.abs(drift);
    }
  }

  // Check cash buffer breach
  if (simulatedCash < minRequiredCashReserve) {
    violations.push({
      rule_code: 'ERR_CASH_BUFFER_BREACH',
      severity: 'CRITICAL_ERROR',
      message: `Post-trade cash balance (₹${simulatedCash.toLocaleString('en-IN')}) falls below required ${minCashPct}% buffer (₹${minRequiredCashReserve.toLocaleString('en-IN')}).`,
      remedy: 'Scale back BUY orders to preserve minimum cash reserve.'
    });
  }

  const driftStatus = maxDriftPct > 8.0 ? 'CRITICAL_DRIFT' : maxDriftPct > 4.0 ? 'MILD_DRIFT' : 'IN_TOLERANCE';

  return {
    portfolio_id: portfolio.portfolio_id,
    portfolio_name: portfolio.portfolio_name,
    total_portfolio_value: totalPortfolioValue,
    cash_balance: portfolio.cash_balance,
    current_allocations: currentAllocations,
    target_allocations: targetModel.target_weights,
    drift_by_asset_class: driftByAssetClass,
    max_drift_pct: Number(maxDriftPct.toFixed(2)),
    drift_status: driftStatus,
    proposed_trades: proposedTrades,
    simulated_post_allocations: simulatedPostAllocations,
    simulated_post_drift: simulatedPostDrift,
    post_max_drift_pct: Number(postMaxDriftPct.toFixed(2)),
    violations,
    total_fees_usd: Number(totalEstimatedFees.toFixed(2)),
    cash_after_trades: Number(simulatedCash.toFixed(2))
  };
}
