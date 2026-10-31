import React, { useState } from 'react';
import {
  Portfolio,
  RebalanceProposal,
  Trade,
  Instrument,
  FeeSchedule
} from '../types';
import { formatINR } from '../utils/formatters';
import { Play, CheckCheck, Filter, Layers } from 'lucide-react';

interface OperationsViewProps {
  portfolios: Portfolio[];
  proposals: RebalanceProposal[];
  trades: Trade[];
  instruments: Map<string, Instrument>;
  feeSchedule: FeeSchedule;
  onBatchExecute: () => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  portfolios,
  proposals,
  trades,
  instruments,
  feeSchedule,
  onBatchExecute
}) => {
  const [driftFilter, setDriftFilter] = useState<'ALL' | 'CRITICAL' | 'MILD'>('ALL');
  const [isExecutingBatch, setIsExecutingBatch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter portfolios
  const filteredPortfolios = portfolios.filter(p => {
    if (driftFilter === 'CRITICAL' && p.drift_status !== 'CRITICAL_DRIFT') return false;
    if (driftFilter === 'MILD' && p.drift_status !== 'MILD_DRIFT') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.portfolio_id.toLowerCase().includes(q) || p.portfolio_name.toLowerCase().includes(q);
    }
    return true;
  });

  // Aggregate trades by Instrument for Order Routing Book
  const aggregatedOrders = React.useMemo(() => {
    const map = new Map<string, {
      ticker: string;
      assetName: string;
      assetClass: string;
      totalBuyShares: number;
      totalSellShares: number;
      netShares: number;
      totalGrossUsd: number;
      totalEstimatedFee: number;
    }>();

    for (const t of trades) {
      const inst = instruments.get(t.instrument_id);
      if (!inst) continue;

      if (!map.has(t.instrument_id)) {
        map.set(t.instrument_id, {
          ticker: inst.ticker,
          assetName: inst.asset_name,
          assetClass: inst.asset_class,
          totalBuyShares: 0,
          totalSellShares: 0,
          netShares: 0,
          totalGrossUsd: 0,
          totalEstimatedFee: 0
        });
      }

      const entry = map.get(t.instrument_id)!;
      if (t.action === 'BUY') {
        entry.totalBuyShares += t.shares;
        entry.netShares += t.shares;
      } else if (t.action === 'SELL') {
        entry.totalSellShares += t.shares;
        entry.netShares -= t.shares;
      }
      entry.totalGrossUsd += t.gross_amount_usd;
      entry.totalEstimatedFee += t.estimated_fee_usd;
    }

    return Array.from(map.values()).sort((a, b) => b.totalGrossUsd - a.totalGrossUsd);
  }, [trades, instruments]);

  const handleRunBatch = () => {
    setIsExecutingBatch(true);
    setTimeout(() => {
      onBatchExecute();
      setIsExecutingBatch(false);
    }, 700);
  };

  const totalBuyVolume = trades.filter(t => t.action === 'BUY').reduce((acc, t) => acc + t.gross_amount_usd, 0);
  const totalSellVolume = trades.filter(t => t.action === 'SELL').reduce((acc, t) => acc + t.gross_amount_usd, 0);
  const totalFees = trades.reduce((acc, t) => acc + t.estimated_fee_usd, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Title & Operations Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Operations Analyst Cockpit
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Batch Rebalance & Order Execution Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor firm-wide drift, aggregate block orders, and route rebalance proposals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunBatch}
            disabled={isExecutingBatch}
            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isExecutingBatch ? 'Executing Batch Runs...' : 'Execute All Eligible Proposals'}</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 font-medium">Active Portfolios In Scope</span>
          <div className="text-2xl font-bold text-white font-mono tabular-nums mt-2">
            {portfolios.length} Accounts
          </div>
          <span className="text-xs text-slate-500 mt-1 block font-mono">
            Critical Drift: {portfolios.filter(p => p.drift_status === 'CRITICAL_DRIFT').length}
          </span>
        </div>

        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 font-medium">Total Gross Buy Volume</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-2">
            {formatINR(totalBuyVolume, { showDecimals: false })}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {trades.filter(t => t.action === 'BUY').length} Buy Orders
          </span>
        </div>

        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 font-medium">Total Gross Sell Volume</span>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums mt-2">
            {formatINR(totalSellVolume, { showDecimals: false })}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {trades.filter(t => t.action === 'SELL').length} Sell Orders
          </span>
        </div>

        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 font-medium">Estimated Brokerage & STT</span>
          <div className="text-2xl font-bold text-slate-200 font-mono tabular-nums mt-2">
            {formatINR(totalFees)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Applied via {feeSchedule.name}
          </span>
        </div>
      </div>

      {/* Aggregated Order Book (Block Trading & Internal Crossing) */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-lg font-bold text-white">
                Aggregated Order Routing Book
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Block netting across all portfolios to minimize broker fees and market slippage.
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {aggregatedOrders.length} Unique Securities In Play
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Security</th>
                <th className="py-2.5 px-3">Asset Class</th>
                <th className="py-2.5 px-3 text-right">Buy Shares</th>
                <th className="py-2.5 px-3 text-right">Sell Shares</th>
                <th className="py-2.5 px-3 text-right">Net Direction</th>
                <th className="py-2.5 px-3 text-right">Total Value</th>
                <th className="py-2.5 px-3 text-right">Est. Fees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {aggregatedOrders.slice(0, 10).map(item => {
                const isNetBuy = item.netShares > 0;
                return (
                  <tr key={item.ticker} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-sans">
                      <div className="font-bold text-white">{item.ticker}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                        {item.assetName}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300">
                      {item.assetClass}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-emerald-400">
                      +{item.totalBuyShares.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-amber-400">
                      -{item.totalSellShares.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold">
                      <span className={isNetBuy ? 'text-emerald-400' : 'text-amber-400'}>
                        {isNetBuy ? `NET BUY +${item.netShares.toLocaleString()}` : `NET SELL ${item.netShares.toLocaleString()}`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-200">
                      {formatINR(item.totalGrossUsd)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-400">
                      {formatINR(item.totalEstimatedFee)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Portfolio Queue & Lifecycle Status */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              Portfolio Rebalance Queue
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Target alignment status and generated proposals by account.
            </p>
          </div>

          {/* Interactive Filters (Buttons allowed per frontend-design) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
              <button
                onClick={() => setDriftFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  driftFilter === 'ALL'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Accounts ({portfolios.length})
              </button>
              <button
                onClick={() => setDriftFilter('CRITICAL')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  driftFilter === 'CRITICAL'
                    ? 'bg-rose-900/60 text-rose-200 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Critical Drift ({portfolios.filter(p => p.drift_status === 'CRITICAL_DRIFT').length})
              </button>
              <button
                onClick={() => setDriftFilter('MILD')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  driftFilter === 'MILD'
                    ? 'bg-amber-900/60 text-amber-200 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mild Drift ({portfolios.filter(p => p.drift_status === 'MILD_DRIFT').length})
              </button>
            </div>

            <input
              type="text"
              placeholder="Search portfolio ID / name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-48"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Portfolio ID</th>
                <th className="py-2.5 px-3">Account Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Cash Balance</th>
                <th className="py-2.5 px-3 text-right">Max Drift</th>
                <th className="py-2.5 px-3">Drift State</th>
                <th className="py-2.5 px-3">Proposal Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredPortfolios.slice(0, 15).map(p => {
                const prop = proposals.find(pr => pr.portfolio_id === p.portfolio_id);
                return (
                  <tr key={p.portfolio_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-cyan-400 font-bold">
                      {p.portfolio_id}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-200">
                      {p.portfolio_name}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-400">
                      {p.portfolio_type}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-200">
                      {formatINR(p.cash_balance, { showDecimals: false })}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold text-white">
                      {p.max_drift_pct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span
                        className={`text-[11px] font-semibold ${
                          p.drift_status === 'CRITICAL_DRIFT'
                            ? 'text-rose-400'
                            : p.drift_status === 'MILD_DRIFT'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {p.drift_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span
                        className={`text-[11px] font-semibold ${
                          prop?.policy_check_status === 'FAIL'
                            ? 'text-rose-400'
                            : prop?.policy_check_status === 'WARNING'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {prop?.status || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
