import React, { useState } from 'react';
import {
  GroundTruthAnomaly,
  Constraint,
  Trade,
  TargetAllocation
} from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  CheckCircle,
  FileCheck2,
  Lock,
  History,
  Info
} from 'lucide-react';

interface ComplianceViewProps {
  anomalies: GroundTruthAnomaly[];
  constraints: Constraint[];
  onRemediateAnomaly: (anomalyId: string) => void;
  onWaiveAnomaly: (anomalyId: string, reason: string) => void;
  auditEvents: Array<{
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    entityId: string;
    details: string;
  }>;
}

export const ComplianceView: React.FC<ComplianceViewProps> = ({
  anomalies,
  constraints,
  onRemediateAnomaly,
  onWaiveAnomaly,
  auditEvents
}) => {
  const [selectedAnomaly, setSelectedAnomaly] = useState<GroundTruthAnomaly | null>(null);
  const [waiverReason, setWaiverReason] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'TRIAGE' | 'RULES' | 'AUDIT'>('TRIAGE');

  const openAnomalies = anomalies.filter(a => a.status === 'OPEN');
  const resolvedAnomalies = anomalies.filter(a => a.status !== 'OPEN');

  const handleApplyWaiver = (anomalyId: string) => {
    if (!waiverReason.trim()) return;
    onWaiveAnomaly(anomalyId, waiverReason);
    setSelectedAnomaly(null);
    setWaiverReason('');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Risk & Compliance Reviewer
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Policy Engine & Exception Triage Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enforce trading restrictions, audit edge cases, and preserve regulatory decision traceability.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('TRIAGE')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'TRIAGE'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Exception Triage ({openAnomalies.length} Open)
          </button>
          <button
            onClick={() => setActiveTab('RULES')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'RULES'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Policy Constraints ({constraints.length})
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'AUDIT'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Traceability Audit Log ({auditEvents.length})
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 font-medium">Critical Blockers</span>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums mt-2">
            {openAnomalies.filter(a => a.severity === 'CRITICAL').length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Requires resolution before execution
          </span>
        </div>

        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 font-medium">High / Medium Exceptions</span>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums mt-2">
            {openAnomalies.filter(a => a.severity !== 'CRITICAL').length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Pricing & fee calculation warnings
          </span>
        </div>

        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 font-medium">Remediated / Waived</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-2">
            {resolvedAnomalies.length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Auditor signed off
          </span>
        </div>

        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 font-medium">Pre-Trade Policy Gate</span>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {openAnomalies.length === 0 ? 'GATE OPEN' : 'RESTRICTED'}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {openAnomalies.length === 0 ? 'All orders compliant' : 'Rebalance orders locked'}
          </span>
        </div>
      </div>

      {/* TAB 1: EXCEPTION TRIAGE (Required Edge Cases) */}
      {activeTab === 'TRIAGE' && (
        <div className="space-y-6">
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-rose-400" />
                  <span>Injected Benchmark Anomalies & Edge Cases</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  5 specific negative test scenarios injected to evaluate pre-trade detection & compliance guardrails.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Ground Truth Sync: {anomalies.length} Registered Exceptions
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {anomalies.map(anom => {
                const isOpen = anom.status === 'OPEN';
                return (
                  <div
                    key={anom.anomaly_id}
                    className={`p-5 rounded-xl border transition-all ${
                      isOpen
                        ? 'bg-slate-900/80 border-slate-700/80'
                        : 'bg-slate-900/40 border-slate-800/50 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="font-mono font-bold text-cyan-400">
                            {anom.anomaly_id}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="font-mono font-semibold text-white">
                            {anom.issue_type}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="font-mono text-slate-400">
                            Target Entity: {anom.entity_type} ({anom.entity_id})
                          </span>
                          <span className="text-slate-600">·</span>
                          <span
                            className={`font-semibold font-mono ${
                              anom.severity === 'CRITICAL'
                                ? 'text-rose-400'
                                : anom.severity === 'HIGH'
                                ? 'text-amber-400'
                                : 'text-blue-400'
                            }`}
                          >
                            Severity: {anom.severity}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span
                            className={`font-semibold ${
                              isOpen ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            Status: {anom.status}
                          </span>
                        </div>

                        <p className="text-sm text-slate-200">
                          {anom.description}
                        </p>

                        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                          <span className="text-slate-500">Detection Rule:</span>
                          <code className="text-cyan-300 bg-slate-950 px-2 py-0.5 rounded">
                            {anom.expected_detection_rule}
                          </code>
                        </div>

                        <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Remedy Guidance: {anom.resolution_guidance}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 shrink-0">
                        {isOpen ? (
                          <>
                            <button
                              onClick={() => onRemediateAnomaly(anom.anomaly_id)}
                              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Remediate & Fix</span>
                            </button>

                            <button
                              onClick={() => setSelectedAnomaly(anom)}
                              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg border border-slate-700 transition-colors"
                            >
                              <span>Grant Waiver</span>
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 py-1.5 px-3 bg-emerald-950/40 border border-emerald-800/40 rounded-lg">
                            <FileCheck2 className="w-4 h-4" />
                            <span>Remediated & Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: POLICY CONSTRAINTS */}
      {activeTab === 'RULES' && (
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              <span>Active Compliance Policies & Bounds</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hard and soft policy constraints checked automatically before trade generation.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {constraints.map(c => (
              <div key={c.constraint_id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-cyan-400">{c.constraint_id}</span>
                  <span className="font-mono text-slate-400">
                    {c.is_hard_constraint ? 'HARD CONSTRAINT (NO BYPASS)' : 'ADVISOR WARNING'}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-200 text-sm">{c.constraint_type}</h3>
                <p className="text-xs text-slate-400">{c.description}</p>
                <div className="pt-2 text-xs font-mono text-slate-500">
                  Parameters: {JSON.stringify(c.parameters)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TRACEABILITY AUDIT LOG */}
      {activeTab === 'AUDIT' && (
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                <span>Immutable Decision & Exception Audit Trail</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full chronological ledger of compliance decisions, overrides, and rebalance actions.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {auditEvents.length} Recorded Events
            </span>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity Ref</th>
                  <th className="py-2.5 px-3">Decision Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditEvents.map(evt => (
                  <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-slate-400">{evt.timestamp}</td>
                    <td className="py-3 px-3 text-cyan-300 font-semibold">{evt.actor}</td>
                    <td className="py-3 px-3 text-white font-bold">{evt.action}</td>
                    <td className="py-3 px-3 text-slate-300">{evt.entityId}</td>
                    <td className="py-3 px-3 font-sans text-slate-300 max-w-md">{evt.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compliance Waiver Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">
                Grant Compliance Waiver: {selectedAnomaly.anomaly_id}
              </h3>
            </div>

            <p className="text-xs text-slate-300">
              You are authorizing a formal compliance exception for <strong>{selectedAnomaly.issue_type}</strong> on entity {selectedAnomaly.entity_id}. This event will be recorded in the audit ledger.
            </p>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">
                Auditor Sign-off Justification:
              </label>
              <textarea
                value={waiverReason}
                onChange={e => setWaiverReason(e.target.value)}
                placeholder="Enter regulatory rationale for exception..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={!waiverReason.trim()}
                onClick={() => handleApplyWaiver(selectedAnomaly.anomaly_id)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                Sign & Record Waiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
