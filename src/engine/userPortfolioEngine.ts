import {
  UserPortfolio,
  UserPortfolioCalculation,
  UserRebalanceTrade,
  UserAssetClass,
  UserHolding
} from '../types/userPortfolio';

// Indian Brokerage and Regulatory Fee calculation (SEBI / STT)
export function calculateUserTradeFee(grossAmount: number, isSell: boolean, isEquity: boolean = true): {
  totalFee: number;
  brokerage: number;
  stt: number;
} {
  if (grossAmount <= 0) return { totalFee: 0, brokerage: 0, stt: 0 };

  const baseBrokerage = 20.0; // ₹20 flat base brokerage fee
  let variableBrokerage = 0;

  if (grossAmount <= 500000) {
    variableBrokerage = grossAmount * (10 / 10000); // 10 bps (0.10%)
  } else if (grossAmount <= 2500000) {
    variableBrokerage = 500000 * (10 / 10000) + (grossAmount - 500000) * (5 / 10000); // 5 bps (0.05%)
  } else {
    variableBrokerage =
      500000 * (10 / 10000) +
      2000000 * (5 / 10000) +
      (grossAmount - 2500000) * (2 / 10000); // 2 bps (0.02%)
  }

  const brokerage = Number((baseBrokerage + variableBrokerage).toFixed(2));
  // Indian STT (Securities Transaction Tax): 0.1% (0.001) on delivery SELL orders
  const stt = isSell && isEquity ? Number((grossAmount * 0.001).toFixed(2)) : 0;
  const totalFee = Number((brokerage + stt).toFixed(2));

  return { totalFee, brokerage, stt };
}

// Recommended benchmark instruments for replenishing underweight asset classes if no existing holding is present
const BENCHMARK_INSTRUMENTS: Record<UserAssetClass, { symbol: string; name: string; defaultPrice: number }> = {
  Equity: { symbol: 'NIFTYBEES', name: 'Nippon India ETF Nifty 50 BeES', defaultPrice: 285.50 },
  Debt: { symbol: 'BHARATBOND', name: 'Edelweiss Bharat Bond ETF - Target Maturity', defaultPrice: 1240.00 },
  Gold: { symbol: 'GOLDBEES', name: 'Nippon India ETF Gold BeES', defaultPrice: 74.80 },
  Cash: { symbol: 'LIQUIDBEES', name: 'Nippon India ETF Liquid BeES (Daily NAV)', defaultPrice: 1000.00 }
};

export function calculateUserPortfolioMetrics(portfolio: UserPortfolio): UserPortfolioCalculation {
  const assetClasses: UserAssetClass[] = ['Equity', 'Debt', 'Gold', 'Cash'];

  // 1. Calculate values for each holding and total holdings value
  let totalHoldingsCost = 0;
  let totalHoldingsMarketVal = 0;

  const currentAllocation: Record<UserAssetClass, { value: number; weight: number }> = {
    Equity: { value: 0, weight: 0 },
    Debt: { value: 0, weight: 0 },
    Gold: { value: 0, weight: 0 },
    Cash: { value: Number(portfolio.portfolioInfo.availableCashAmount) || 0, weight: 0 }
  };

  const holdingValuationMap = new Map<
    string,
    { holding: UserHolding; marketValue: number; costBasis: number }
  >();

  for (const h of portfolio.holdings || []) {
    const qty = Number(h.quantity) || 0;
    const buyPrice = Number(h.purchasePrice) || 0;
    const curPrice = Number(h.currentMarketPrice) || 0;

    const cost = qty * buyPrice;
    const mktVal = qty * curPrice;

    totalHoldingsCost += cost;
    totalHoldingsMarketVal += mktVal;

    const ac = h.assetClass || 'Equity';
    if (currentAllocation[ac]) {
      currentAllocation[ac].value += mktVal;
    }

    holdingValuationMap.set(h.id, {
      holding: h,
      marketValue: mktVal,
      costBasis: cost
    });
  }

  const availableCash = Number(portfolio.portfolioInfo.availableCashAmount) || 0;
  const totalPortfolioValue = Number((totalHoldingsMarketVal + availableCash).toFixed(2));
  const investedAmount = Number(totalHoldingsCost.toFixed(2));
  const unrealizedGainLoss = Number((totalHoldingsMarketVal - totalHoldingsCost).toFixed(2));
  const unrealizedGainLossPct =
    investedAmount > 0 ? Number(((unrealizedGainLoss / investedAmount) * 100).toFixed(2)) : 0;

  // 2. Compute weights and target drift
  const targetAllocation: Record<UserAssetClass, number> = {
    Equity: Number(portfolio.targetAllocation.equityPct) || 0,
    Debt: Number(portfolio.targetAllocation.debtPct) || 0,
    Gold: Number(portfolio.targetAllocation.goldPct) || 0,
    Cash: Number(portfolio.targetAllocation.cashPct) || 0
  };

  const driftByAssetClass: Record<UserAssetClass, number> = {
    Equity: 0,
    Debt: 0,
    Gold: 0,
    Cash: 0
  };

  const isOverweightByAssetClass: Record<UserAssetClass, boolean> = {
    Equity: false,
    Debt: false,
    Gold: false,
    Cash: false
  };

  const isUnderweightByAssetClass: Record<UserAssetClass, boolean> = {
    Equity: false,
    Debt: false,
    Gold: false,
    Cash: false
  };

  let maxAllocationDrift = 0;

  for (const ac of assetClasses) {
    const val = currentAllocation[ac].value;
    const weight = totalPortfolioValue > 0 ? Number(((val / totalPortfolioValue) * 100).toFixed(2)) : 0;
    currentAllocation[ac].weight = weight;

    const target = targetAllocation[ac];
    const drift = Number((weight - target).toFixed(2));
    driftByAssetClass[ac] = drift;

    if (Math.abs(drift) > maxAllocationDrift) {
      maxAllocationDrift = Math.abs(drift);
    }

    if (drift > 1.0) {
      isOverweightByAssetClass[ac] = true;
    } else if (drift < -1.0) {
      isUnderweightByAssetClass[ac] = true;
    }
  }

  // 3. Generate Policy-Constrained Rebalancing Orders
  const proposedBuyOrders: UserRebalanceTrade[] = [];
  const proposedSellOrders: UserRebalanceTrade[] = [];
  let simulatedCash = availableCash;
  let totalEstimatedBrokerage = 0;
  let totalEstimatedSTT = 0;

  // Track simulated post-trade holdings
  const simulatedHoldings = new Map<string, { holding: UserHolding; currentQty: number; currentPrice: number }>();
  for (const h of portfolio.holdings || []) {
    simulatedHoldings.set(h.id, {
      holding: h,
      currentQty: Number(h.quantity) || 0,
      currentPrice: Number(h.currentMarketPrice) || 0
    });
  }

  const MIN_TRADE_SIZE = 1000.0; // Minimum trade constraint: ₹1,000

  // STEP A: SELL OVERWEIGHT ASSET CLASSES FIRST
  for (const ac of assetClasses) {
    if (ac === 'Cash') continue; // Cash is trimmed by buying other assets
    const drift = driftByAssetClass[ac];

    // If overweight beyond 1.5% tolerance
    if (drift > 1.5 && totalPortfolioValue > 0) {
      const excessAmount = (drift / 100) * totalPortfolioValue;

      // Find holdings in this asset class, ordered by largest market value
      const classHoldings = (portfolio.holdings || [])
        .filter(h => h.assetClass === ac)
        .sort((a, b) => {
          const valA = (Number(a.quantity) || 0) * (Number(a.currentMarketPrice) || 0);
          const valB = (Number(b.quantity) || 0) * (Number(b.currentMarketPrice) || 0);
          return valB - valA;
        });

      let remainingExcessToTrim = excessAmount;

      for (const h of classHoldings) {
        if (remainingExcessToTrim < MIN_TRADE_SIZE) break;
        const price = Number(h.currentMarketPrice) || 0;
        const qty = Number(h.quantity) || 0;
        if (price <= 0 || qty <= 0) continue;

        const holdingVal = qty * price;
        // Trim up to 80% of position or remaining excess
        const targetSellVal = Math.min(holdingVal * 0.8, remainingExcessToTrim);
        if (targetSellVal < MIN_TRADE_SIZE) continue;

        let sharesToSell = Math.floor(targetSellVal / price);
        if (sharesToSell <= 0) continue;
        if (sharesToSell > qty) sharesToSell = qty;

        const grossAmount = Number((sharesToSell * price).toFixed(2));
        const feeResult = calculateUserTradeFee(grossAmount, true, ac === 'Equity');

        totalEstimatedBrokerage += feeResult.brokerage;
        totalEstimatedSTT += feeResult.stt;

        const netProceeds = Number((grossAmount - feeResult.totalFee).toFixed(2));
        simulatedCash += netProceeds;
        remainingExcessToTrim -= grossAmount;

        const preWeight = Number(((holdingVal / totalPortfolioValue) * 100).toFixed(2));
        const postVal = (qty - sharesToSell) * price;
        const postWeight = Number(((postVal / totalPortfolioValue) * 100).toFixed(2));

        const simItem = simulatedHoldings.get(h.id);
        if (simItem) {
          simItem.currentQty -= sharesToSell;
        }

        proposedSellOrders.push({
          tradeId: `TRD-SELL-${proposedSellOrders.length + 1}-${h.instrumentSymbol}`,
          action: 'SELL',
          instrumentSymbol: h.instrumentSymbol,
          instrumentName: h.instrumentName,
          assetClass: ac,
          shares: sharesToSell,
          price: price,
          grossAmount: grossAmount,
          estimatedFee: feeResult.totalFee,
          sttFee: feeResult.stt,
          netAmount: netProceeds,
          preWeightPct: preWeight,
          postWeightPct: postWeight,
          targetWeightPct: Number(((targetAllocation[ac] / (classHoldings.length || 1))).toFixed(2)),
          reason: `Trim overweight ${ac} (+${drift.toFixed(1)}% drift) towards policy target.`
        });
      }
    }
  }

  // STEP B: BUY UNDERWEIGHT ASSET CLASSES USING AVAILABLE LIQUIDITY
  // Maintain minimum cash buffer (e.g. at least target cash or 2%)
  const minRequiredCashReserve = Number((((targetAllocation.Cash || 2.0) / 100) * totalPortfolioValue).toFixed(2));
  let deployableCash = Math.max(0, simulatedCash - minRequiredCashReserve);

  for (const ac of assetClasses) {
    if (ac === 'Cash' || deployableCash < MIN_TRADE_SIZE) continue;
    const drift = driftByAssetClass[ac];

    // If underweight beyond -1.5%
    if (drift < -1.5 && totalPortfolioValue > 0) {
      const deficitAmount = Math.abs(drift / 100) * totalPortfolioValue;
      const targetBuyAmount = Math.min(deficitAmount, deployableCash);

      if (targetBuyAmount < MIN_TRADE_SIZE) continue;

      // Check if user already holds an instrument in this class
      const existingHolding = (portfolio.holdings || []).find(h => h.assetClass === ac);
      const symbol = existingHolding ? existingHolding.instrumentSymbol : BENCHMARK_INSTRUMENTS[ac].symbol;
      const name = existingHolding ? existingHolding.instrumentName : BENCHMARK_INSTRUMENTS[ac].name;
      const price = existingHolding ? Number(existingHolding.currentMarketPrice) : BENCHMARK_INSTRUMENTS[ac].defaultPrice;

      if (price <= 0) continue;

      const sharesToBuy = Math.floor(targetBuyAmount / price);
      if (sharesToBuy <= 0) continue;

      const grossBuyAmount = Number((sharesToBuy * price).toFixed(2));
      const feeResult = calculateUserTradeFee(grossBuyAmount, false, ac === 'Equity');
      const totalCost = Number((grossBuyAmount + feeResult.totalFee).toFixed(2));

      if (deployableCash >= totalCost && (simulatedCash - totalCost) >= 0) {
        deployableCash -= totalCost;
        simulatedCash -= totalCost;
        totalEstimatedBrokerage += feeResult.brokerage;

        const currentVal = existingHolding ? Number(existingHolding.quantity) * price : 0;
        const preWeight = Number(((currentVal / totalPortfolioValue) * 100).toFixed(2));
        const postVal = currentVal + grossBuyAmount;
        const postWeight = Number(((postVal / totalPortfolioValue) * 100).toFixed(2));

        if (existingHolding) {
          const simItem = simulatedHoldings.get(existingHolding.id);
          if (simItem) simItem.currentQty += sharesToBuy;
        }

        proposedBuyOrders.push({
          tradeId: `TRD-BUY-${proposedBuyOrders.length + 1}-${symbol}`,
          action: 'BUY',
          instrumentSymbol: symbol,
          instrumentName: name,
          assetClass: ac,
          shares: sharesToBuy,
          price: price,
          grossAmount: grossBuyAmount,
          estimatedFee: feeResult.totalFee,
          sttFee: 0,
          netAmount: totalCost,
          preWeightPct: preWeight,
          postWeightPct: postWeight,
          targetWeightPct: targetAllocation[ac],
          reason: `Replenish underweight ${ac} (${drift.toFixed(1)}% drift) towards target allocation.`
        });
      }
    }
  }

  const estimatedTotalFees = Number((totalEstimatedBrokerage + totalEstimatedSTT).toFixed(2));

  // 4. Simulate Post-Rebalancing Allocation & Residual Drift
  const postAllocations: Record<UserAssetClass, { value: number; weight: number }> = {
    Equity: { value: 0, weight: 0 },
    Debt: { value: 0, weight: 0 },
    Gold: { value: 0, weight: 0 },
    Cash: { value: Number(simulatedCash.toFixed(2)), weight: 0 }
  };

  let simulatedTotalPostValue = Number(simulatedCash.toFixed(2));

  for (const [id, item] of simulatedHoldings.entries()) {
    if (item.currentQty <= 0) continue;
    const val = Number((item.currentQty * item.currentPrice).toFixed(2));
    const ac = item.holding.assetClass || 'Equity';
    postAllocations[ac].value += val;
    simulatedTotalPostValue += val;
  }

  // Account for newly added benchmark buy instruments if any
  for (const buy of proposedBuyOrders) {
    const existing = (portfolio.holdings || []).find(h => h.instrumentSymbol === buy.instrumentSymbol);
    if (!existing) {
      postAllocations[buy.assetClass].value += buy.grossAmount;
      simulatedTotalPostValue += buy.grossAmount;
    }
  }

  let postMaxDriftPct = 0;
  for (const ac of assetClasses) {
    const weight = simulatedTotalPostValue > 0 ? Number(((postAllocations[ac].value / simulatedTotalPostValue) * 100).toFixed(2)) : 0;
    postAllocations[ac].weight = weight;
    const target = targetAllocation[ac];
    const residualDrift = Math.abs(weight - target);
    if (residualDrift > postMaxDriftPct) {
      postMaxDriftPct = residualDrift;
    }
  }

  const driftReductionPct = Math.max(0, Number((maxAllocationDrift - postMaxDriftPct).toFixed(2)));

  return {
    totalPortfolioValue,
    investedAmount,
    availableCashBalance: availableCash,
    currentHoldingsValue: Number(totalHoldingsMarketVal.toFixed(2)),
    unrealizedGainLoss,
    unrealizedGainLossPct,
    currentAllocation,
    targetAllocation,
    driftByAssetClass,
    maxAllocationDrift: Number(maxAllocationDrift.toFixed(2)),
    isOverweightByAssetClass,
    isUnderweightByAssetClass,
    proposedBuyOrders,
    proposedSellOrders,
    estimatedTotalFees,
    estimatedBrokerage: Number(totalEstimatedBrokerage.toFixed(2)),
    estimatedSTT: Number(totalEstimatedSTT.toFixed(2)),
    postRebalancingSummary: {
      totalValue: Number(simulatedTotalPostValue.toFixed(2)),
      cashBalance: Number(simulatedCash.toFixed(2)),
      maxDriftPct: Number(postMaxDriftPct.toFixed(2)),
      driftReductionPct,
      postAllocations
    }
  };
}
