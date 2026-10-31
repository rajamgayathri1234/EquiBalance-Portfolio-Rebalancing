import React, { useState, useEffect, useCallback } from 'react';
import { UserAccount } from '../types';
import {
  UserPortfolio,
  UserAssetClass,
  UserPortfolioCalculation
} from '../types/userPortfolio';
import { portfolioApi } from '../services/portfolioApi';
import { calculateUserPortfolioMetrics } from '../engine/userPortfolioEngine';
import { InvestmentProfileForm } from './InvestmentProfileForm';
import { formatINR } from '../utils/formatters';
import {
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Edit3,
  History,
  TrendingUp,
  Layers,
  Wallet,
  DollarSign,
  PieChart,
  ShoppingBag,
  ArrowRight,
  X,
  FileText
} from 'lucide-react';

interface CustomerViewProps {
  currentUser: UserAccount;
  onAuditLog?: (action: string, details: string) => void;
}

const ASSET_CLASS_LABELS: Record<UserAssetClass, string> = {
  Equity: 'Equity (Shares & Index ETFs)',
  Debt: 'Debt (Sovereign G-Sec & PSU Bonds)',
  Gold: 'Gold (Physical BeES & SGB)',
  Cash: 'Cash & Overnight Liquid Reserves'
};

const ASSET_CLASS_COLORS: Record<UserAssetClass, string> = {
  Equity: 'bg-blue-500',
  Debt: 'bg-emerald-500',
  Gold: 'bg-amber-500',
  Cash: 'bg-slate-400'
};

export const CustomerView: React.FC<CustomerViewProps> = ({
  currentUser,
  onAuditLog
}) => {
  const [portfolio, setPortfolio] = useState<UserPortfolio | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showProfileForm, setShowProfileForm] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isExecutingRebalance, setIsExecutingRebalance] = useState<boolean>(false);
  const [rebalanceSuccessMessage, setRebalanceSuccessMessage] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Load User Portfolio from database on mount or when currentUser changes
  const loadPortfolio = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await portfolioApi.getPortfolio(currentUser.id);
      if (res.success && res.portfolio) {
        setPortfolio(res.portfolio);
      } else {
        setPortfolio(null);
      }
    } catch (err) {
      console.warn('Error fetching portfolio:', err);
      setPortfolio(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  // Compute metrics from the user's actual portfolio
  const metrics: UserPortfolioCalculation | null = portfolio
    ? calculateUserPortfolioMetrics(portfolio)
    : null;

  // Handle successful form save
  const handleSaveSuccess = (savedPortfolio: UserPortfolio) => {
    setPortfolio(savedPortfolio);
    setShowProfileForm(false);
    setIsEditing(false);
    if (onAuditLog) {
      onAuditLog(
        isEditing ? 'USER_PORTFOLIO_UPDATED' : 'USER_PORTFOLIO_INITIALIZED',
        `Portfolio updated for ${currentUser.name} (${currentUser.email}). Total assets recorded.`
      );
    }
  };

  // Handle rebalance execution
  const handleExecuteRebalance = async () => {
    if (!metrics || !portfolio) return;
    const allTrades = [
      ...metrics.proposedSellOrders.map(t => ({
        action: 'SELL' as const,
        instrumentSymbol: t.instrumentSymbol,
        instrumentName: t.instrumentName,
        assetClass: t.assetClass,
        shares: t.shares,
        price: t.price,
        grossAmount: t.grossAmount,
        fees: t.estimatedFee
      })),
      ...metrics.proposedBuyOrders.map(t => ({
        action: 'BUY' as const,
        instrumentSymbol: t.instrumentSymbol,
        instrumentName: t.instrumentName,
        assetClass: t.assetClass,
        shares: t.shares,
        price: t.price,
        grossAmount: t.grossAmount,
        fees: t.estimatedFee
      }))
    ];

    if (allTrades.length === 0) return;

    setIsExecutingRebalance(true);
    try {
      const res = await portfolioApi.executeRebalance(allTrades, currentUser.id);
      if (res.success && res.portfolio) {
        setPortfolio(res.portfolio);
        setRebalanceSuccessMessage(
          `Successfully executed ${allTrades.length} policy-constrained rebalancing orders. Portfolio allocations normalized!`
        );
        if (onAuditLog) {
          onAuditLog(
            'USER_REBALANCE_EXECUTED',
            `Executed ${allTrades.length} rebalance orders for ${currentUser.name}. Max drift reduced.`
          );
        }
        setTimeout(() => setRebalanceSuccessMessage(null), 6000);
      }
    } catch (err) {
      console.error('Rebalance execution failed:', err);
    } finally {
      setIsExecutingRebalance(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 mx-auto text-cyan-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">
          Loading personal investment portfolio...
        </p>
        <span className="text-xs text-slate-500 font-mono">
          Authenticating Demat account {currentUser.email}
        </span>
      </div>
    );
  }

  // If user opened profile form or is editing
  if (showProfileForm || (isEditing && portfolio)) {
    return (
      <InvestmentProfileForm
        currentUser={currentUser}
        existingPortfolio={isEditing ? portfolio : null}
        onSaveSuccess={handleSaveSuccess}
        onCancel={portfolio ? () => { setShowProfileForm(false); setIsEditing(false); } : undefined}
        isEditing={isEditing}
      />
    );
  }

  // 1. EMPTY STATE: User has not entered portfolio information yet
  if (!portfolio || !metrics) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8 animate-in fade-in duration-300">
        {/* Empty State Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />

          {/* Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center font-bold text-2xl shadow-lg shadow-cyan-500/10">
            <PieChart className="w-8 h-8" />
          </div>

          {/* Empty State Titles */}
          <div className="space-y-2 max-w-xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              No Portfolio Found
            </h1>
            <p className="text-sm font-medium text-cyan-400">
              Please complete your investment profile.
            </p>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-1">
              Welcome, <strong className="text-slate-200">{currentUser.name}</strong>! Your account has been provisioned,
              but you haven&apos;t entered your actual portfolio holdings, available cash balance, or target asset allocation yet.
            </p>
          </div>

          {/* Value proposition bullet points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto pt-2">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Zero Fake Data</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Your portal strictly displays your genuine holdings and verified market valuations.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Automatic Drift Scan</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Mathematical comparison between your actual holdings and your target allocation.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Policy Rebalancing</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Deterministic buy & sell trade proposals with Indian brokerage and STT calculations.
              </p>
            </div>
          </div>

          {/* Primary Call to Action */}
          <div className="pt-4">
            <button
              onClick={() => setShowProfileForm(true)}
              className="py-3.5 px-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/25 inline-flex items-center gap-2.5 active:scale-[0.99] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Complete Your Investment Profile</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Account ID: {currentUser.id} &bull; Email: {currentUser.email} &bull; Currency: INR (₹)
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE PERSONALIZED CUSTOMER DASHBOARD
  const assetClassKeys: UserAssetClass[] = ['Equity', 'Debt', 'Gold', 'Cash'];
  const hasOrders = metrics.proposedBuyOrders.length > 0 || metrics.proposedSellOrders.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Rebalance Execution Success Alert */}
      {rebalanceSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-800 flex items-center justify-between gap-4 text-xs text-emerald-200 shadow-xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{rebalanceSuccessMessage}</span>
          </div>
          <button
            onClick={() => setRebalanceSuccessMessage(null)}
            className="text-emerald-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner: Investor Name, Account ID, and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Verified Demat Portfolio Portal
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/80">
              Personal Account
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
            <span>{portfolio.investorInfo.fullName || currentUser.name}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono font-normal">
              {portfolio.investorInfo.riskAppetite} Risk Mandate
            </span>
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2 font-mono">
            <span>Investor ID: <strong className="text-slate-300">{currentUser.id}</strong></span>
            <span>&bull;</span>
            <span>Goal: <strong className="text-slate-300">{portfolio.investorInfo.investmentGoal}</strong></span>
            <span>&bull;</span>
            <span>Horizon: <strong className="text-slate-300">{portfolio.portfolioInfo.investmentDuration}</strong></span>
            <span>&bull;</span>
            <span>Updated: <strong className="text-slate-300">{new Date(portfolio.updatedAt).toLocaleDateString()}</strong></span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* History modal button */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
            title="Inspect historical portfolio revisions and audits"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>History ({portfolio.history?.length || 1})</span>
          </button>

          {/* Edit Profile / Holdings button */}
          <button
            onClick={() => setIsEditing(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Portfolio</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Logged-in user actual submitted values) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Portfolio Value</span>
            <Wallet className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums mt-2">
            {formatINR(metrics.totalPortfolioValue)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Holdings ({formatINR(metrics.currentHoldingsValue)}) + Cash
          </span>
        </div>

        {/* Invested Amount & Unrealized P&L */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Invested Cost Basis</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums mt-2">
            {formatINR(metrics.investedAmount)}
          </div>
          <div className="flex items-center gap-1 text-xs mt-1">
            <span className="text-slate-400">Unrealized P&amp;L:</span>
            <span className={`font-mono font-bold ${
              metrics.unrealizedGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {metrics.unrealizedGainLoss >= 0 ? '+' : ''}{formatINR(metrics.unrealizedGainLoss)}
              ({metrics.unrealizedGainLossPct >= 0 ? '+' : ''}{metrics.unrealizedGainLossPct.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Available Cash Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Available Cash Balance</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono tabular-nums mt-2">
            {formatINR(metrics.availableCashBalance)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block font-mono">
            {metrics.totalPortfolioValue > 0
              ? `${((metrics.availableCashBalance / metrics.totalPortfolioValue) * 100).toFixed(1)}% of total assets`
              : '0.0%'}
          </span>
        </div>

        {/* Max Allocation Drift */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Max Allocation Drift</span>
            <PieChart className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2">
            <span
              className={
                metrics.maxAllocationDrift > 8
                  ? 'text-rose-400'
                  : metrics.maxAllocationDrift > 3
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }
            >
              {metrics.maxAllocationDrift.toFixed(1)}%
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block font-mono">
            {metrics.maxAllocationDrift <= 3 ? 'In Tolerance' : 'Rebalance Recommended'}
          </span>
        </div>
      </div>

      {/* Target Asset Allocation vs Current Asset Allocation Analysis */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Target Asset Allocation vs. Current Holdings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison between your designated policy targets and actual mark-to-market positions.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block"></span>
              <span>Current Weight</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-600 inline-block"></span>
              <span>Target Weight</span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {assetClassKeys.map(ac => {
            const current = metrics.currentAllocation[ac];
            const target = metrics.targetAllocation[ac];
            const drift = metrics.driftByAssetClass[ac];
            const isOver = metrics.isOverweightByAssetClass[ac];
            const isUnder = metrics.isUnderweightByAssetClass[ac];

            return (
              <div key={ac} className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${ASSET_CLASS_COLORS[ac]}`}></span>
                    <span className="font-semibold text-slate-200">{ASSET_CLASS_LABELS[ac]}</span>
                    {isOver && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 font-semibold">
                        Overweight
                      </span>
                    )}
                    {isUnder && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-semibold">
                        Underweight
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 font-mono text-xs">
                    <span className="text-slate-400">
                      Target: <strong className="text-slate-300">{target.toFixed(1)}%</strong>
                    </span>
                    <span className="text-slate-300">
                      Current: <strong className="text-white">{current.weight.toFixed(1)}%</strong> ({formatINR(current.value)})
                    </span>
                    <span
                      className={`tabular-nums font-semibold flex items-center gap-0.5 ${
                        isOver
                          ? 'text-amber-400'
                          : isUnder
                          ? 'text-cyan-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {drift > 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5 inline" />
                      ) : drift < 0 ? (
                        <ArrowDownRight className="w-3.5 h-3.5 inline" />
                      ) : null}
                      {drift > 0 ? `+${drift.toFixed(1)}%` : `${drift.toFixed(1)}%`}
                    </span>
                  </div>
                </div>

                {/* Progress Comparison Bars */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, current.weight)}%` }}
                    ></div>
                  </div>
                  <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-slate-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, target)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rebalancing Orders & Simulated Post-Rebalance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Table: Proposed Buy and Sell Orders */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Policy-Constrained Rebalancing Orders
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically generated trades to restore your portfolio to target allocation.
              </p>
            </div>
            {hasOrders && (
              <span className="text-xs font-mono text-cyan-400">
                {metrics.proposedSellOrders.length + metrics.proposedBuyOrders.length} Order(s) Recommended
              </span>
            )}
          </div>

          {!hasOrders ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400" />
              <p className="text-sm font-semibold text-white">
                Portfolio is in policy tolerance!
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All asset class allocations are well within the policy band. No buying or selling is required at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Proposed Sells */}
              {metrics.proposedSellOrders.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>Proposed Sell Orders (Trim Overweight Assets)</span>
                  </div>
                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
                          <th className="py-2.5 px-3">Action</th>
                          <th className="py-2.5 px-3">Security</th>
                          <th className="py-2.5 px-3">Asset Class</th>
                          <th className="py-2.5 px-3 text-right">Shares</th>
                          <th className="py-2.5 px-3 text-right">Mkt Price</th>
                          <th className="py-2.5 px-3 text-right">Gross (₹)</th>
                          <th className="py-2.5 px-3 text-right">Fees + STT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {metrics.proposedSellOrders.map(tr => (
                          <tr key={tr.tradeId} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-amber-400">SELL</span>
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <div className="font-bold text-white">{tr.instrumentSymbol}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{tr.instrumentName}</div>
                            </td>
                            <td className="py-2.5 px-3 font-sans text-slate-300">{tr.assetClass}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-white">{tr.shares.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">{formatINR(tr.price)}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-amber-300">{formatINR(tr.grossAmount)}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-slate-400">{formatINR(tr.estimatedFee)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Proposed Buys */}
              {metrics.proposedBuyOrders.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Proposed Buy Orders (Replenish Underweight Assets)</span>
                  </div>
                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
                          <th className="py-2.5 px-3">Action</th>
                          <th className="py-2.5 px-3">Security</th>
                          <th className="py-2.5 px-3">Asset Class</th>
                          <th className="py-2.5 px-3 text-right">Shares</th>
                          <th className="py-2.5 px-3 text-right">Mkt Price</th>
                          <th className="py-2.5 px-3 text-right">Gross (₹)</th>
                          <th className="py-2.5 px-3 text-right">Est. Fee</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {metrics.proposedBuyOrders.map(tr => (
                          <tr key={tr.tradeId} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-emerald-400">BUY</span>
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <div className="font-bold text-white">{tr.instrumentSymbol}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{tr.instrumentName}</div>
                            </td>
                            <td className="py-2.5 px-3 font-sans text-slate-300">{tr.assetClass}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-white">{tr.shares.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">{formatINR(tr.price)}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-emerald-300">{formatINR(tr.grossAmount)}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-slate-400">{formatINR(tr.estimatedFee)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post-Rebalancing Portfolio Summary & Fee Breakdown Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Post-Rebalancing Summary
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic forecast of portfolio alignment after trade execution.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Maximum Drift Reduction:</span>
                <span className="text-emerald-400 font-bold">
                  {metrics.maxAllocationDrift.toFixed(1)}% &rarr; {metrics.postRebalancingSummary.maxDriftPct.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Post-Trade Cash Reserve:</span>
                <span className="text-cyan-300 font-bold">
                  {formatINR(metrics.postRebalancingSummary.cashBalance)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Estimated Brokerage:</span>
                <span className="text-slate-200">
                  {formatINR(metrics.estimatedBrokerage)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Estimated STT Levies:</span>
                <span className="text-slate-200">
                  {formatINR(metrics.estimatedSTT)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                <span className="text-slate-300 font-semibold">Total Estimated Fees:</span>
                <span className="text-amber-400 font-bold">
                  {formatINR(metrics.estimatedTotalFees)}
                </span>
              </div>
            </div>

            {/* Post Allocations Mini Overview */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Simulated Post-Rebalance Weights:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {assetClassKeys.map(ac => (
                  <div key={ac} className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex justify-between">
                    <span className="text-slate-400 font-sans">{ac}:</span>
                    <span className="text-white font-bold">
                      {metrics.postRebalancingSummary.postAllocations[ac].weight.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Execute Rebalance Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleExecuteRebalance}
              disabled={isExecutingRebalance || !hasOrders}
              className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.99] cursor-pointer"
            >
              {isExecutingRebalance ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Orders via Exchange Router...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize &amp; Execute Rebalance</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Existing Demat Holdings Detail Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Current Demat Holdings Inventory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live market marks and cost basis for your actual submitted portfolio securities.
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 self-start sm:self-center"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Add or Edit Instruments</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
                <th className="py-3 px-3">Symbol</th>
                <th className="py-3 px-3">Instrument Legal Name</th>
                <th className="py-3 px-3">Asset Class</th>
                <th className="py-3 px-3 text-right">Shares</th>
                <th className="py-3 px-3 text-right">Purchase Price</th>
                <th className="py-3 px-3 text-right">Market Price</th>
                <th className="py-3 px-3 text-right">Total Market Val</th>
                <th className="py-3 px-3 text-right">Unrealized P&amp;L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {portfolio.holdings.map(h => {
                const cost = (Number(h.quantity) || 0) * (Number(h.purchasePrice) || 0);
                const currentVal = (Number(h.quantity) || 0) * (Number(h.currentMarketPrice) || 0);
                const pnl = currentVal - cost;
                const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;

                return (
                  <tr key={h.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-bold text-cyan-400">
                      {h.instrumentSymbol}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-200 font-medium">
                      {h.instrumentName}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${ASSET_CLASS_COLORS[h.assetClass] || 'bg-slate-500'}`}></span>
                      {h.assetClass}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-white">
                      {h.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-300">
                      {formatINR(h.purchasePrice)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-white font-semibold">
                      {formatINR(h.currentMarketPrice)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-cyan-300 font-bold">
                      {formatINR(currentVal)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold">
                      <span className={pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {pnl >= 0 ? '+' : ''}{formatINR(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Portfolio Records Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pb-3 border-b border-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-bold text-white text-base">
                  Portfolio Audit &amp; Revision History
                </h3>
                <p className="text-xs text-slate-400">
                  Preserved historical records for Demat account {currentUser.email}
                </p>
              </div>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {(portfolio.history || []).map((entry, idx) => (
                <div
                  key={entry.id || idx}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-cyan-400">
                      {entry.action.replace('_', ' ')}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans">
                    {entry.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                    <span>Total Value: <strong className="text-white">{formatINR(entry.totalValue)}</strong></span>
                    <span>Holdings: <strong className="text-slate-300">{entry.holdingsCount}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Close History Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
