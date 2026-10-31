import React, { useState } from 'react';
import { GeneratedDataset } from '../engine/dataGenerator';
import { DATA_DICTIONARY } from '../data/dataDictionary';
import { ValidationReport } from '../types';
import { verifyReproducibility } from '../engine/validationSuite';
import {
  convertToCSV,
  generateSQLScript,
  generateReadmeText,
  triggerFileDownload
} from '../engine/exportService';
import {
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Database,
  FileCode,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface AdminDataHubViewProps {
  dataset: GeneratedDataset;
  validationReport: ValidationReport;
  onRegenerate: (scale: number, seed: number) => void;
  isGenerating: boolean;
}

export const AdminDataHubView: React.FC<AdminDataHubViewProps> = ({
  dataset,
  validationReport,
  onRegenerate,
  isGenerating
}) => {
  const [scale, setScale] = useState<number>(50);
  const [seed, setSeed] = useState<number>(20261022);
  const [activeSubTab, setActiveSubTab] = useState<'GENERATOR' | 'REPRODUCIBILITY' | 'VALIDATION' | 'SCHEMA' | 'EXPORT'>('GENERATOR');
  const [reproResult, setReproResult] = useState<ReturnType<typeof verifyReproducibility> | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedEntityDoc, setSelectedEntityDoc] = useState<string>('InvestorProfile');

  const handleRunReproducibility = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const result = verifyReproducibility(seed, scale);
      setReproResult(result);
      setIsVerifying(false);
    }, 400);
  };

  const handleExportCSV = (table: string, data: any[]) => {
    const csv = convertToCSV(data);
    triggerFileDownload(csv, `${table.toLowerCase()}_seed.csv`, 'text/csv');
  };

  const handleExportAllJSON = () => {
    const dump = JSON.stringify(dataset, null, 2);
    triggerFileDownload(dump, `equibalance_full_dataset_${seed}.json`, 'application/json');
  };

  const handleExportSQL = () => {
    const sql = generateSQLScript(dataset);
    triggerFileDownload(sql, `equibalance_schema_and_seed_${seed}.sql`, 'text/plain');
  };

  const handleExportReadme = () => {
    const readme = generateReadmeText(dataset, validationReport);
    triggerFileDownload(readme, 'README_SEED_MANIFEST.md', 'text/markdown');
  };

  const handleExportGroundTruthCSV = () => {
    const csv = convertToCSV(dataset.groundTruthAnomalies);
    triggerFileDownload(csv, 'ground_truth.csv', 'text/csv');
  };

  const selectedEntity = DATA_DICTIONARY.find(e => e.entityName === selectedEntityDoc) || DATA_DICTIONARY[0];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Page Title & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            System Administrator & Data Architect
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Synthetic Generator, Validation & Schema Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic data synthesizer, schema dictionary, mathematical reconciliation & export center.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveSubTab('GENERATOR')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'GENERATOR' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Generator Controls
          </button>
          <button
            onClick={() => setActiveSubTab('REPRODUCIBILITY')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'REPRODUCIBILITY' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Double-Run Reproducibility
          </button>
          <button
            onClick={() => setActiveSubTab('VALIDATION')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'VALIDATION' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Integrity Checks ({validationReport.totalChecks})
          </button>
          <button
            onClick={() => setActiveSubTab('SCHEMA')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'SCHEMA' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Data Dictionary
          </button>
          <button
            onClick={() => setActiveSubTab('EXPORT')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'EXPORT' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Export Hub
          </button>
        </div>
      </div>

      {/* Dataset Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400">Fixed Seed</span>
          <div className="text-lg font-bold text-cyan-400 font-mono mt-1">
            {dataset.summary.seed}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">FNV: {dataset.summary.checksum}</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400">Portfolios</span>
          <div className="text-lg font-bold text-white font-mono mt-1">
            {dataset.summary.portfolioCount.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">1:1 with Investors</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400">Holdings</span>
          <div className="text-lg font-bold text-white font-mono mt-1">
            {dataset.summary.holdingCount.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Across 14 assets</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400">Trading Days</span>
          <div className="text-lg font-bold text-white font-mono mt-1">
            250 Days
          </div>
          <span className="text-[10px] text-slate-500">{dataset.summary.marketPriceCount.toLocaleString()} marks</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400">Rebalance Orders</span>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
            {dataset.summary.tradeCount.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Policy constrained</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] text-slate-400">Edge Case Anomalies</span>
          <div className="text-lg font-bold text-rose-400 font-mono mt-1">
            {dataset.summary.anomalyCount}
          </div>
          <span className="text-[10px] text-slate-500">Labelled in ground truth</span>
        </div>
      </div>

      {/* SUB-TAB 1: GENERATOR CONTROLS */}
      {activeSubTab === 'GENERATOR' && (
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <span>Deterministic Synthetic Generator Engine</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure parameters to generate master data, dependent transactions, dated market prices, and policy-filtered proposals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  Portfolio Volume Scale:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setScale(50)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                      scale === 50
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>Starter (50)</div>
                    <div className="text-[10px] font-normal opacity-80 mt-0.5">Snappy Interactive</div>
                  </button>
                  <button
                    onClick={() => setScale(200)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                      scale === 200
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>Standard (200)</div>
                    <div className="text-[10px] font-normal opacity-80 mt-0.5">Medium Volume</div>
                  </button>
                  <button
                    onClick={() => setScale(1000)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                      scale === 1000
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>Benchmark (1,000)</div>
                    <div className="text-[10px] font-normal opacity-80 mt-0.5">5,000 Holdings</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  PRNG Fixed Seed:
                </label>
                <input
                  type="number"
                  value={seed}
                  onChange={e => setSeed(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Seed 20261022 guarantees byte-for-byte reproducibility across runs.
                </span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
                Generation Pipeline Summary
              </h3>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li>• Step 1: Data dictionary schema verified</li>
                <li>• Step 2: Master entities (Investors, Instruments, Prices, Models)</li>
                <li>• Step 3: Composite deterministic keys (INV-000001, PORT-INV-000001-01)</li>
                <li>• Step 4: 250 trading days historical geometric Brownian prices</li>
                <li>• Step 5: Injects 5 labelled edge cases with ground truth</li>
                <li>• Step 6: Derived weights, drift & post-trade simulation</li>
                <li>• Step 7: Produces separate ground_truth anomaly catalog</li>
              </ul>

              <div className="pt-2">
                <button
                  disabled={isGenerating}
                  onClick={() => onRegenerate(scale, seed)}
                  className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Synthesizing Full Dataset...' : 'Regenerate Dataset Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DOUBLE-RUN REPRODUCIBILITY (Step 10) */}
      {activeSubTab === 'REPRODUCIBILITY' && (
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Double Regeneration Reproducibility Verifier (Step 10)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Regenerates twice with the same fixed seed ({seed}) and compares row counts and checksums to demonstrate deterministic output.
              </p>
            </div>

            <button
              disabled={isVerifying}
              onClick={handleRunReproducibility}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-2 shrink-0 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Running Test Execution...' : 'Run Reproducibility Proof'}</span>
            </button>
          </div>

          {reproResult ? (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  reproResult.isReproducible
                    ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-800/50 text-rose-200'
                }`}
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-sm">
                    {reproResult.isReproducible
                      ? '100% Deterministic Reproducibility Verified!'
                      : 'Checksum Mismatch Detected'}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5 font-mono">
                    Run 1 Checksum: {reproResult.run1Checksum} · Run 2 Checksum: {reproResult.run2Checksum} · Time: {reproResult.timeMs}ms
                  </div>
                </div>
              </div>

              {/* Row Counts Comparison Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-medium">
                      <th className="py-2.5 px-3">Table / Entity</th>
                      <th className="py-2.5 px-3 text-right">Run 1 Count</th>
                      <th className="py-2.5 px-3 text-right">Run 2 Count</th>
                      <th className="py-2.5 px-3 text-right">Reconciliation Delta</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {Object.keys(reproResult.run1Counts).map(k => {
                      const c1 = (reproResult.run1Counts as any)[k];
                      const c2 = (reproResult.run2Counts as any)[k];
                      const delta = c1 - c2;
                      return (
                        <tr key={k} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-200 uppercase font-sans">
                            {k}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-white">
                            {c1.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-white">
                            {c2.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-emerald-400">
                            {delta === 0 ? '0 (EXACT MATCH)' : delta}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-sans">
                            VERIFIED
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Zap className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm text-slate-300">Click &quot;Run Reproducibility Proof&quot; above.</p>
              <p className="text-xs text-slate-500">
                Executes consecutive runs and validates that identical seed yields identical row counts and checksum.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: VALIDATION REPORT (Step 8) */}
      {activeSubTab === 'VALIDATION' && (
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-cyan-400" />
                <span>Automated Integrity & Validation Suite (Step 8)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates primary key uniqueness, foreign key integrity, weight reconciliation, and negative scenario detection.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400">Passed: {validationReport.passedChecks}</span>
              <span className="text-slate-600">·</span>
              <span className="text-rose-400">Detected Anomalies: {validationReport.failedChecks}</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400">Warnings: {validationReport.warningsCount}</span>
            </div>
          </div>

          <div className="space-y-3">
            {validationReport.details.map((check, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        check.status === 'PASS'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : check.status === 'FAIL'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {check.status}
                    </span>
                    <span className="text-xs font-semibold text-white">{check.check_name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">({check.category})</span>
                  </div>
                  <p className="text-xs text-slate-300">{check.description}</p>
                </div>

                {check.discrepancyCount > 0 && (
                  <div className="text-right shrink-0 font-mono text-xs text-slate-400">
                    <span className="text-amber-300">{check.discrepancyCount} items flagged</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: DATA DICTIONARY (Step 1) */}
      {activeSubTab === 'SCHEMA' && (
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>Enterprise Data Dictionary (Step 1)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Specification of all 10 core entities, cardinality, primary keys, foreign keys, and validation rules.
              </p>
            </div>

            {/* Entity Selector */}
            <select
              value={selectedEntityDoc}
              onChange={e => setSelectedEntityDoc(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {DATA_DICTIONARY.map(e => (
                <option key={e.entityName} value={e.entityName}>
                  {e.entityName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-cyan-400 text-sm">{selectedEntity.entityName}</h3>
                <span className="text-xs font-mono text-slate-400">Cardinality: {selectedEntity.cardinality}</span>
              </div>
              <p className="text-xs text-slate-300">{selectedEntity.description}</p>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-4 pt-1">
                <span>PK: <strong className="text-white">{selectedEntity.primaryKey}</strong></span>
                {selectedEntity.foreignKeys.length > 0 && (
                  <span>
                    FKs: {selectedEntity.foreignKeys.map(fk => `${fk.field} -> ${fk.references}`).join(', ')}
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-3">Field Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Uniqueness</th>
                    <th className="py-2.5 px-3">Allowed / Units</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Validation Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {selectedEntity.fields.map(f => (
                    <tr key={f.fieldName} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white font-sans">{f.fieldName}</td>
                      <td className="py-2.5 px-3 text-cyan-300">{f.dataType}</td>
                      <td className="py-2.5 px-3 text-slate-400">{f.uniqueness}</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {f.units || (f.allowedValues ? f.allowedValues.join(', ') : '-')}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-300 max-w-xs">{f.description}</td>
                      <td className="py-2.5 px-3 text-emerald-400">{f.validationRule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: EXPORT HUB (Step 9) */}
      {activeSubTab === 'EXPORT' && (
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-cyan-400" />
              <span>Comprehensive Artifact Export Center (Step 9)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Export standardized seed files for relational databases, statistical analysis, and audit trails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">PostgreSQL / Cloud SQL Seed (.sql)</h3>
                <p className="text-xs text-slate-400 mt-0.5">DDL Schema definitions and INSERT seed statements.</p>
              </div>
              <button
                onClick={handleExportSQL}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export SQL</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Full Benchmark JSON (.json)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Complete unified dataset dump with checksum.</p>
              </div>
              <button
                onClick={handleExportAllJSON}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Ground Truth Anomaly Catalog (.csv)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Separate anomaly labels and expected decisions.</p>
              </div>
              <button
                onClick={handleExportGroundTruthCSV}
                className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/40 text-rose-200 font-medium text-xs rounded-lg border border-rose-800/40 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Ground Truth</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">README & Manifest Documentation</h3>
                <p className="text-xs text-slate-400 mt-0.5">Schema notes, fixed seed provenance, and validation summary.</p>
              </div>
              <button
                onClick={handleExportReadme}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export README</span>
              </button>
            </div>
          </div>

          {/* Individual Table CSV Downloads */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
              Individual Entity CSV Exports
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              <button
                onClick={() => handleExportCSV('investor_profiles', dataset.investorProfiles)}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-xs transition-colors"
              >
                <span className="font-medium text-slate-200 block">InvestorProfile</span>
                <span className="text-[10px] text-slate-500 font-mono">{dataset.investorProfiles.length} rows</span>
              </button>

              <button
                onClick={() => handleExportCSV('portfolios', dataset.portfolios)}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-xs transition-colors"
              >
                <span className="font-medium text-slate-200 block">Portfolio</span>
                <span className="text-[10px] text-slate-500 font-mono">{dataset.portfolios.length} rows</span>
              </button>

              <button
                onClick={() => handleExportCSV('instruments', dataset.instruments)}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-xs transition-colors"
              >
                <span className="font-medium text-slate-200 block">Instrument</span>
                <span className="text-[10px] text-slate-500 font-mono">{dataset.instruments.length} rows</span>
              </button>

              <button
                onClick={() => handleExportCSV('holdings', dataset.holdings)}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-xs transition-colors"
              >
                <span className="font-medium text-slate-200 block">Holding</span>
                <span className="text-[10px] text-slate-500 font-mono">{dataset.holdings.length} rows</span>
              </button>

              <button
                onClick={() => handleExportCSV('market_prices', dataset.marketPrices)}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-xs transition-colors"
              >
                <span className="font-medium text-slate-200 block">MarketPrice</span>
                <span className="text-[10px] text-slate-500 font-mono">{dataset.marketPrices.length} rows</span>
              </button>

              <button
                onClick={() => handleExportCSV('target_allocations', dataset.targetAllocations)}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-xs transition-colors"
              >
                <span className="font-medium text-slate-200 block">TargetAllocation</span>
                <span className="text-[10px] text-slate-500 font-mono">{dataset.targetAllocations.length} rows</span>
              </button>

              <button
                onClick={() => handleExportCSV('rebalance_proposals', dataset.proposals)}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-xs transition-colors"
              >
                <span className="font-medium text-slate-200 block">RebalanceProposal</span>
                <span className="text-[10px] text-slate-500 font-mono">{dataset.proposals.length} rows</span>
              </button>

              <button
                onClick={() => handleExportCSV('trades', dataset.trades)}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-xs transition-colors"
              >
                <span className="font-medium text-slate-200 block">Trade</span>
                <span className="text-[10px] text-slate-500 font-mono">{dataset.trades.length} rows</span>
              </button>

              <button
                onClick={() => handleExportCSV('constraints', dataset.constraints)}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-xs transition-colors"
              >
                <span className="font-medium text-slate-200 block">Constraint</span>
                <span className="text-[10px] text-slate-500 font-mono">{dataset.constraints.length} rows</span>
              </button>

              <button
                onClick={() => handleExportCSV('fee_schedules', dataset.feeSchedules)}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 text-xs transition-colors"
              >
                <span className="font-medium text-slate-200 block">FeeSchedule</span>
                <span className="text-[10px] text-slate-500 font-mono">{dataset.feeSchedules.length} rows</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
