import { GeneratedDataset } from './dataGenerator';
import { DATA_DICTIONARY } from '../data/dataDictionary';
import { ValidationReport } from '../types';

/**
 * Converts array of flat objects to CSV string format
 */
export function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(item => {
    return headers
      .map(header => {
        let val = item[header];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') {
          val = JSON.stringify(val).replace(/"/g, '""');
        } else if (typeof val === 'string') {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      })
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generates standard SQL DDL schema and INSERT statements
 */
export function generateSQLScript(dataset: GeneratedDataset): string {
  let sql = `-- ==================================================================\n`;
  sql += `-- EquiBalance: Synthetic Portfolio Rebalancing Seed Data\n`;
  sql += `-- Generated with Fixed Seed: ${dataset.summary.seed}\n`;
  sql += `-- Checksum: ${dataset.summary.checksum}\n`;
  sql += `-- ==================================================================\n\n`;

  // Create tables
  sql += `CREATE TABLE IF NOT EXISTS investor_profiles (\n`;
  sql += `  investor_id VARCHAR(20) PRIMARY KEY,\n`;
  sql += `  full_name VARCHAR(100) NOT NULL,\n`;
  sql += `  email VARCHAR(150) NOT NULL UNIQUE,\n`;
  sql += `  risk_tolerance VARCHAR(30) NOT NULL,\n`;
  sql += `  investment_horizon_years INT NOT NULL,\n`;
  sql += `  tax_bracket_pct NUMERIC(5,2) NOT NULL,\n`;
  sql += `  kyc_status VARCHAR(20) NOT NULL,\n`;
  sql += `  created_at TIMESTAMPTZ NOT NULL\n`;
  sql += `);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS instruments (\n`;
  sql += `  instrument_id VARCHAR(20) PRIMARY KEY,\n`;
  sql += `  ticker VARCHAR(10) NOT NULL UNIQUE,\n`;
  sql += `  asset_name VARCHAR(150) NOT NULL,\n`;
  sql += `  asset_class VARCHAR(30) NOT NULL,\n`;
  sql += `  sub_asset_class VARCHAR(80) NOT NULL,\n`;
  sql += `  is_excluded BOOLEAN NOT NULL DEFAULT FALSE,\n`;
  sql += `  exclusion_reason TEXT,\n`;
  sql += `  liquidity_tier VARCHAR(20) NOT NULL,\n`;
  sql += `  lot_size_min INT NOT NULL DEFAULT 1,\n`;
  sql += `  expense_ratio_pct NUMERIC(5,3) NOT NULL\n`;
  sql += `);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS portfolios (\n`;
  sql += `  portfolio_id VARCHAR(30) PRIMARY KEY,\n`;
  sql += `  investor_id VARCHAR(20) REFERENCES investor_profiles(investor_id),\n`;
  sql += `  portfolio_name VARCHAR(100) NOT NULL,\n`;
  sql += `  portfolio_type VARCHAR(30) NOT NULL,\n`;
  sql += `  currency VARCHAR(3) NOT NULL DEFAULT 'INR',\n`;
  sql += `  cash_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,\n`;
  sql += `  target_model_id VARCHAR(20) NOT NULL,\n`;
  sql += `  drift_status VARCHAR(20) NOT NULL,\n`;
  sql += `  max_drift_pct NUMERIC(5,2) NOT NULL,\n`;
  sql += `  last_rebalanced_at TIMESTAMPTZ NOT NULL,\n`;
  sql += `  created_at TIMESTAMPTZ NOT NULL,\n`;
  sql += `  status VARCHAR(20) NOT NULL\n`;
  sql += `);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS holdings (\n`;
  sql += `  holding_id VARCHAR(50) PRIMARY KEY,\n`;
  sql += `  portfolio_id VARCHAR(30) REFERENCES portfolios(portfolio_id),\n`;
  sql += `  instrument_id VARCHAR(20) REFERENCES instruments(instrument_id),\n`;
  sql += `  shares_held NUMERIC(15,4) NOT NULL,\n`;
  sql += `  cost_basis_per_share NUMERIC(15,2) NOT NULL,\n`;
  sql += `  unrealized_gain_loss NUMERIC(15,2) NOT NULL,\n`;
  sql += `  last_updated_at TIMESTAMPTZ NOT NULL\n`;
  sql += `);\n\n`;

  // Sample Inserts
  sql += `-- Sample Investor Profiles\n`;
  for (const inv of dataset.investorProfiles.slice(0, 10)) {
    sql += `INSERT INTO investor_profiles VALUES ('${inv.investor_id}', '${inv.full_name}', '${inv.email}', '${inv.risk_tolerance}', ${inv.investment_horizon_years}, ${inv.tax_bracket_pct}, '${inv.kyc_status}', '${inv.created_at}');\n`;
  }
  sql += `\n-- Sample Instruments\n`;
  for (const inst of dataset.instruments) {
    sql += `INSERT INTO instruments VALUES ('${inst.instrument_id}', '${inst.ticker}', '${inst.asset_name.replace(/'/g, "''")}', '${inst.asset_class}', '${inst.sub_asset_class}', ${inst.is_excluded}, ${inst.exclusion_reason ? `'${inst.exclusion_reason.replace(/'/g, "''")}'` : 'NULL'}, '${inst.liquidity_tier}', ${inst.lot_size_min}, ${inst.expense_ratio_pct});\n`;
  }

  return sql;
}

/**
 * Triggers a file download in the browser
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates complete README and Source Manifest documentation for export
 */
export function generateReadmeText(dataset: GeneratedDataset, validation: ValidationReport): string {
  return `# EquiBalance — Policy-Constrained Portfolio Rebalancing System
## Synthetic Data Engine & Reproducible Benchmark Manifest

### 1. Overview & Provenance
This dataset represents a production-grade synthetic simulation of multi-asset wealth management portfolios, holdings, target allocation models, constraints, and policy-constrained rebalancing orders.

- **Deterministic Generator Seed**: ${dataset.summary.seed}
- **Run Checksum (FNV-32)**: ${dataset.summary.checksum}
- **Generated Timestamp**: ${dataset.summary.generatedAt}
- **Entity Volume**:
  - Investor Profiles: ${dataset.summary.investorCount.toLocaleString()}
  - Portfolios: ${dataset.summary.portfolioCount.toLocaleString()}
  - Instruments: ${dataset.summary.instrumentCount.toLocaleString()}
  - Holdings: ${dataset.summary.holdingCount.toLocaleString()}
  - Market Price Observations (250 Trading Days): ${dataset.summary.marketPriceCount.toLocaleString()}
  - Target Allocation Models: ${dataset.summary.targetAllocationCount.toLocaleString()}
  - Policy Constraints: ${dataset.summary.constraintCount.toLocaleString()}
  - Rebalance Proposals: ${dataset.summary.proposalCount.toLocaleString()}
  - Trade Recommendations: ${dataset.summary.tradeCount.toLocaleString()}
  - Labelled Ground-Truth Anomalies: ${dataset.summary.anomalyCount.toLocaleString()}

### 2. Required Edge Cases Injected & Labelled in ground_truth.csv
1. **ANOM-001 (WEIGHTS_NOT_100_PCT)**: Model TGT-000005 sums to 108.0% (target weights fail 100% reconciliation).
2. **ANOM-002 (TRADE_EXCEEDS_HOLDING)**: Trade ${dataset.trades[0]?.trade_id || 'TRD-2026-000001'} attempts to sell more shares than held in inventory.
3. **ANOM-003 (EXCLUDED_INSTRUMENT_RECOMMENDED)**: Rebalance order recommends buying INS-000014 (XDEF), a restricted defense/sanctioned security.
4. **ANOM-004 (FEES_OMITTED)**: Institutional trade generated with $0.00 fee, bypassing FeeSchedule calculation.
5. **ANOM-005 (STALE_PRICE_USED)**: Historical market mark > 5 days old lacking the mandatory is_stale warning flag.

### 3. Validation Summary
- Total Integrity Checks: ${validation.totalChecks}
- Passed Checks: ${validation.passedChecks}
- Exceptions / Injected Anomalies Detected: ${validation.failedChecks}
- Warnings: ${validation.warningsCount}

Educational simulation only. Not financial or investment advice.
`;
}
