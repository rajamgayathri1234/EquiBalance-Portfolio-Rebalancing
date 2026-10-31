export type UserAssetClass = 'Equity' | 'Debt' | 'Gold' | 'Cash';

export type UserRiskAppetite = 'Low' | 'Medium' | 'High';

export interface UserHolding {
  id: string;
  instrumentName: string;
  instrumentSymbol: string;
  assetClass: UserAssetClass;
  quantity: number;
  purchasePrice: number;
  currentMarketPrice: number;
}

export interface UserTargetAllocation {
  equityPct: number;
  debtPct: number;
  goldPct: number;
  cashPct: number;
}

export interface UserInvestorInfo {
  fullName: string;
  email: string;
  investmentGoal: string;
  riskAppetite: UserRiskAppetite;
  investmentExperience: string;
}

export interface UserPortfolioInfo {
  initialInvestmentAmount: number;
  availableCashAmount: number;
  investmentDuration: string;
  monthlyInvestmentAmount?: number;
  preferredAssetClasses: UserAssetClass[];
}

export interface UserPortfolioHistoryEntry {
  id: string;
  timestamp: string;
  action: 'INITIAL_CREATION' | 'PORTFOLIO_UPDATE' | 'REBALANCE_EXECUTED';
  totalValue: number;
  holdingsCount: number;
  driftMaxPct: number;
  description: string;
  snapshot: {
    portfolioInfo: UserPortfolioInfo;
    holdings: UserHolding[];
    targetAllocation: UserTargetAllocation;
  };
}

export interface UserPortfolio {
  id: string;
  userId: string;
  investorInfo: UserInvestorInfo;
  portfolioInfo: UserPortfolioInfo;
  holdings: UserHolding[];
  targetAllocation: UserTargetAllocation;
  createdAt: string;
  updatedAt: string;
  history: UserPortfolioHistoryEntry[];
}

export interface UserPortfolioCalculation {
  totalPortfolioValue: number;
  investedAmount: number;
  availableCashBalance: number;
  currentHoldingsValue: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPct: number;
  currentAllocation: Record<UserAssetClass, { value: number; weight: number }>;
  targetAllocation: Record<UserAssetClass, number>;
  driftByAssetClass: Record<UserAssetClass, number>;
  maxAllocationDrift: number;
  isOverweightByAssetClass: Record<UserAssetClass, boolean>;
  isUnderweightByAssetClass: Record<UserAssetClass, boolean>;
  proposedBuyOrders: UserRebalanceTrade[];
  proposedSellOrders: UserRebalanceTrade[];
  estimatedTotalFees: number;
  estimatedBrokerage: number;
  estimatedSTT: number;
  postRebalancingSummary: {
    totalValue: number;
    cashBalance: number;
    maxDriftPct: number;
    driftReductionPct: number;
    postAllocations: Record<UserAssetClass, { value: number; weight: number }>;
  };
}

export interface UserRebalanceTrade {
  tradeId: string;
  action: 'BUY' | 'SELL';
  instrumentSymbol: string;
  instrumentName: string;
  assetClass: UserAssetClass;
  shares: number;
  price: number;
  grossAmount: number;
  estimatedFee: number;
  sttFee: number;
  netAmount: number;
  preWeightPct: number;
  postWeightPct: number;
  targetWeightPct: number;
  reason: string;
}
