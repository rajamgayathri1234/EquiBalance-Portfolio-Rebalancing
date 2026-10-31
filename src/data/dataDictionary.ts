/**
 * Comprehensive Data Dictionary for Policy-Constrained Rebalancing System
 * Defines schema, types, allowed values, units, uniqueness, cardinality, and validation rules
 * for all 10 core entities.
 */

export interface FieldDefinition {
  fieldName: string;
  dataType: string;
  required: boolean;
  uniqueness: 'PRIMARY_KEY' | 'FOREIGN_KEY' | 'UNIQUE' | 'NON_UNIQUE';
  allowedValues?: string[];
  units?: string;
  description: string;
  validationRule: string;
}

export interface EntityDictionary {
  entityName: string;
  description: string;
  cardinality: string;
  primaryKey: string;
  foreignKeys: { field: string; references: string }[];
  fields: FieldDefinition[];
}

export const DATA_DICTIONARY: EntityDictionary[] = [
  {
    entityName: 'InvestorProfile',
    description: 'Master record for retail and institutional account holders storing risk tolerance and horizon.',
    cardinality: '1:N with Portfolio',
    primaryKey: 'investor_id',
    foreignKeys: [],
    fields: [
      {
        fieldName: 'investor_id',
        dataType: 'string',
        required: true,
        uniqueness: 'PRIMARY_KEY',
        description: 'Immutable unique identifier formatted as INV-000001',
        validationRule: '^INV-[0-9]{6}$'
      },
      {
        fieldName: 'full_name',
        dataType: 'string',
        required: true,
        uniqueness: 'NON_UNIQUE',
        description: 'Legal full name of account holder',
        validationRule: 'Length between 2 and 100 characters'
      },
      {
        fieldName: 'email',
        dataType: 'string',
        required: true,
        uniqueness: 'UNIQUE',
        description: 'Verified notification and notification address',
        validationRule: 'RFC 5322 compliant email'
      },
      {
        fieldName: 'risk_tolerance',
        dataType: 'enum',
        required: true,
        uniqueness: 'NON_UNIQUE',
        allowedValues: ['CONSERVATIVE', 'MODERATE_CONSERVATIVE', 'BALANCED', 'GROWTH', 'AGGRESSIVE_GROWTH'],
        description: 'Assessed psychological willingness and financial capacity to endure drawdowns',
        validationRule: 'Must match standard risk categories'
      },
      {
        fieldName: 'investment_horizon_years',
        dataType: 'integer',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'years',
        description: 'Expected time until primary capital withdrawal',
        validationRule: '1 <= horizon <= 50'
      },
      {
        fieldName: 'tax_bracket_pct',
        dataType: 'numeric',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'percent',
        description: 'Marginal income tax rate for tax-loss harvesting prioritization',
        validationRule: '0 <= tax_bracket <= 50'
      },
      {
        fieldName: 'kyc_status',
        dataType: 'enum',
        required: true,
        uniqueness: 'NON_UNIQUE',
        allowedValues: ['VERIFIED', 'PENDING_REVIEW', 'RESTRICTED'],
        description: 'Know-Your-Customer regulatory onboarding status',
        validationRule: 'Trading allowed only when VERIFIED'
      },
      {
        fieldName: 'created_at',
        dataType: 'timestamp',
        required: true,
        uniqueness: 'NON_UNIQUE',
        description: 'ISO 8601 registration timestamp',
        validationRule: 'Valid ISO 8601 UTC date'
      }
    ]
  },
  {
    entityName: 'Portfolio',
    description: 'Investment vehicle holding assets against a mandate model allocation.',
    cardinality: 'N:1 with InvestorProfile; 1:N with Holding; 1:N with RebalanceProposal',
    primaryKey: 'portfolio_id',
    foreignKeys: [
      { field: 'investor_id', references: 'InvestorProfile.investor_id' },
      { field: 'target_model_id', references: 'TargetAllocation.target_id' }
    ],
    fields: [
      {
        fieldName: 'portfolio_id',
        dataType: 'string',
        required: true,
        uniqueness: 'PRIMARY_KEY',
        description: 'Composite ID format: PORT-<investor-id>-01',
        validationRule: '^PORT-INV-[0-9]{6}-[0-9]{2}$'
      },
      {
        fieldName: 'investor_id',
        dataType: 'string',
        required: true,
        uniqueness: 'FOREIGN_KEY',
        description: 'Foreign key referencing InvestorProfile',
        validationRule: 'Must exist in InvestorProfile table'
      },
      {
        fieldName: 'portfolio_name',
        dataType: 'string',
        required: true,
        uniqueness: 'NON_UNIQUE',
        description: 'Friendly name of account mandate',
        validationRule: 'Non-empty string max 80 chars'
      },
      {
        fieldName: 'portfolio_type',
        dataType: 'enum',
        required: true,
        uniqueness: 'NON_UNIQUE',
        allowedValues: ['DEMAT_INDIVIDUAL', 'HUF_ACCOUNT', 'CORPORATE', 'TRUST', 'TAXABLE_INDIVIDUAL'],
        description: 'Demat tax wrapper and account designation',
        validationRule: 'Allowed Indian Demat account wrapper enum'
      },
      {
        fieldName: 'cash_balance',
        dataType: 'numeric',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'INR (₹)',
        description: 'Unsettled and settled fiat INR cash balance',
        validationRule: 'cash_balance >= 0 (no unapproved negative cash)'
      },
      {
        fieldName: 'target_model_id',
        dataType: 'string',
        required: true,
        uniqueness: 'FOREIGN_KEY',
        description: 'Target allocation model ID',
        validationRule: 'Must exist in TargetAllocation table'
      },
      {
        fieldName: 'drift_status',
        dataType: 'enum',
        required: true,
        uniqueness: 'NON_UNIQUE',
        allowedValues: ['IN_TOLERANCE', 'MILD_DRIFT', 'CRITICAL_DRIFT'],
        description: 'Derived state based on max asset class drift vs threshold',
        validationRule: 'Drift > threshold triggers MILD_DRIFT or CRITICAL_DRIFT'
      },
      {
        fieldName: 'max_drift_pct',
        dataType: 'numeric',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'percent',
        description: 'Maximum absolute deviation across any asset class',
        validationRule: 'Derived: max(|actual_weight - target_weight|)'
      },
      {
        fieldName: 'status',
        dataType: 'enum',
        required: true,
        uniqueness: 'NON_UNIQUE',
        allowedValues: ['ACTIVE', 'PENDING_REBALANCE', 'FROZEN', 'REBALANCED'],
        description: 'Account operational status',
        validationRule: 'State transition lifecycle valid'
      }
    ]
  },
  {
    entityName: 'Instrument',
    description: 'Financial security eligible or restricted for portfolio inclusion.',
    cardinality: '1:N with Holding; 1:N with MarketPrice; 1:N with Trade',
    primaryKey: 'instrument_id',
    foreignKeys: [],
    fields: [
      {
        fieldName: 'instrument_id',
        dataType: 'string',
        required: true,
        uniqueness: 'PRIMARY_KEY',
        description: 'Instrument identifier: INS-000001',
        validationRule: '^INS-[0-9]{6}$'
      },
      {
        fieldName: 'ticker',
        dataType: 'string',
        required: true,
        uniqueness: 'UNIQUE',
        description: 'Market ticker symbol (e.g. VTI, BND, VXUS)',
        validationRule: '1-6 uppercase letters'
      },
      {
        fieldName: 'asset_name',
        dataType: 'string',
        required: true,
        uniqueness: 'NON_UNIQUE',
        description: 'Full descriptive security title',
        validationRule: 'Non-empty string'
      },
      {
        fieldName: 'asset_class',
        dataType: 'enum',
        required: true,
        uniqueness: 'NON_UNIQUE',
        allowedValues: ['US_EQUITY', 'INTL_EQUITY', 'EM_EQUITY', 'FIXED_INCOME', 'REAL_ESTATE', 'COMMODITIES', 'CASH_EQUIVALENT'],
        description: 'Super asset allocation category',
        validationRule: 'Valid super asset class'
      },
      {
        fieldName: 'is_excluded',
        dataType: 'boolean',
        required: true,
        uniqueness: 'NON_UNIQUE',
        description: 'Compliance flag: true if on Sanctions, ESG exclusion or restricted buy list',
        validationRule: 'Boolean flag. Rebalance engine must reject BUY if true'
      },
      {
        fieldName: 'liquidity_tier',
        dataType: 'enum',
        required: true,
        uniqueness: 'NON_UNIQUE',
        allowedValues: ['TIER_1_HIGH', 'TIER_2_MEDIUM', 'TIER_3_LOW'],
        description: 'Market volume and liquidity depth indicator',
        validationRule: 'Controls maximum allowable portfolio weight'
      }
    ]
  },
  {
    entityName: 'MarketPrice',
    description: 'Historical and current mark-to-market valuations for instruments.',
    cardinality: 'N:1 with Instrument',
    primaryKey: 'price_id',
    foreignKeys: [{ field: 'instrument_id', references: 'Instrument.instrument_id' }],
    fields: [
      {
        fieldName: 'price_id',
        dataType: 'string',
        required: true,
        uniqueness: 'PRIMARY_KEY',
        description: 'PRC-<instrument-id>-<date>',
        validationRule: '^PRC-INS-[0-9]{6}-[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      },
      {
        fieldName: 'instrument_id',
        dataType: 'string',
        required: true,
        uniqueness: 'FOREIGN_KEY',
        description: 'Referenced instrument',
        validationRule: 'Must exist in Instrument table'
      },
      {
        fieldName: 'as_of_date',
        dataType: 'date',
        required: true,
        uniqueness: 'NON_UNIQUE',
        description: 'Pricing trade date YYYY-MM-DD',
        validationRule: 'Valid trading calendar day'
      },
      {
        fieldName: 'price_usd',
        dataType: 'numeric',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'INR (₹)',
        description: 'Official end-of-day NSE/BSE closing price',
        validationRule: 'price_usd > 0.00'
      },
      {
        fieldName: 'is_stale',
        dataType: 'boolean',
        required: true,
        uniqueness: 'NON_UNIQUE',
        description: 'Flag if price quote is > 3 trading days without fresh mark',
        validationRule: 'Calculated: (current_date - as_of_date) > 3 days'
      }
    ]
  },
  {
    entityName: 'Holding',
    description: 'Current quantity and valuation of an instrument held in a portfolio.',
    cardinality: 'N:1 with Portfolio; N:1 with Instrument',
    primaryKey: 'holding_id',
    foreignKeys: [
      { field: 'portfolio_id', references: 'Portfolio.portfolio_id' },
      { field: 'instrument_id', references: 'Instrument.instrument_id' }
    ],
    fields: [
      {
        fieldName: 'holding_id',
        dataType: 'string',
        required: true,
        uniqueness: 'PRIMARY_KEY',
        description: 'Composite: HOLD-<portfolio-id>-<instrument-id>',
        validationRule: '^HOLD-PORT-.*-INS-[0-9]{6}$'
      },
      {
        fieldName: 'shares_held',
        dataType: 'numeric',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'shares',
        description: 'Settled plus unsettled long shares',
        validationRule: 'shares_held >= 0 (no short positions)'
      },
      {
        fieldName: 'cost_basis_per_share',
        dataType: 'numeric',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'INR (₹)',
        description: 'Weighted average purchase price per share',
        validationRule: 'cost_basis >= 0'
      },
      {
        fieldName: 'unrealized_gain_loss',
        dataType: 'numeric',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'INR (₹)',
        description: 'Calculated: (current_price - cost_basis) * shares_held',
        validationRule: 'Must reconcile with market price and cost basis'
      }
    ]
  },
  {
    entityName: 'TargetAllocation',
    description: 'Model mandate prescribing asset class target percentage weights.',
    cardinality: '1:N with Portfolio',
    primaryKey: 'target_id',
    foreignKeys: [],
    fields: [
      {
        fieldName: 'target_id',
        dataType: 'string',
        required: true,
        uniqueness: 'PRIMARY_KEY',
        description: 'Target model ID: TGT-000001',
        validationRule: '^TGT-[0-9]{6}$'
      },
      {
        fieldName: 'model_name',
        dataType: 'string',
        required: true,
        uniqueness: 'NON_UNIQUE',
        description: 'Mandate name (e.g. Balanced 60/40, Aggressive Growth 80/20)',
        validationRule: 'Non-empty string'
      },
      {
        fieldName: 'target_weights',
        dataType: 'json_map',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'percent',
        description: 'Asset class percentage distribution',
        validationRule: 'Sum of all asset weights must equal exactly 100.00% (except injected anomaly)'
      },
      {
        fieldName: 'rebalance_threshold_pct',
        dataType: 'numeric',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'percent',
        description: 'Tolerance band before rebalancing is recommended',
        validationRule: '1.0% <= threshold <= 10.0%'
      },
      {
        fieldName: 'min_cash_buffer_pct',
        dataType: 'numeric',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'percent',
        description: 'Required liquidity reserve preserved post-rebalance',
        validationRule: '1.0% <= min_cash <= 10.0%'
      }
    ]
  },
  {
    entityName: 'Constraint',
    description: 'Firm-wide or account-specific compliance policies limiting trade generation.',
    cardinality: 'N:1 with Portfolio or firm-wide (GLOBAL)',
    primaryKey: 'constraint_id',
    foreignKeys: [{ field: 'portfolio_id', references: 'Portfolio.portfolio_id (or GLOBAL)' }],
    fields: [
      {
        fieldName: 'constraint_id',
        dataType: 'string',
        required: true,
        uniqueness: 'PRIMARY_KEY',
        description: 'Constraint ID: CST-000001',
        validationRule: '^CST-[0-9]{6}$'
      },
      {
        fieldName: 'constraint_type',
        dataType: 'enum',
        required: true,
        uniqueness: 'NON_UNIQUE',
        allowedValues: ['EXCLUDE_INSTRUMENT', 'MAX_SINGLE_WEIGHT', 'MIN_TRADE_SIZE', 'MIN_CASH_BUFFER', 'WASH_SALE_LOCK'],
        description: 'Type of rule enforced by optimizer',
        validationRule: 'Must match recognized rule codes'
      },
      {
        fieldName: 'is_hard_constraint',
        dataType: 'boolean',
        required: true,
        uniqueness: 'NON_UNIQUE',
        description: 'True = execution blocker; False = advisor warning',
        validationRule: 'Hard constraints trigger proposal failure if breached'
      }
    ]
  },
  {
    entityName: 'FeeSchedule',
    description: 'Tiered transaction fee and regulatory fee calculation tables.',
    cardinality: '1:N with Trade proposals',
    primaryKey: 'fee_schedule_id',
    foreignKeys: [],
    fields: [
      {
        fieldName: 'fee_schedule_id',
        dataType: 'string',
        required: true,
        uniqueness: 'PRIMARY_KEY',
        description: 'Fee schedule identifier FEE-SCH-01',
        validationRule: '^FEE-SCH-[0-9]{2}$'
      },
      {
        fieldName: 'tier_rates',
        dataType: 'numeric_bps',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'basis points',
        description: 'Tier 1 (15 bps), Tier 2 (10 bps), Tier 3 (5 bps)',
        validationRule: 'Monotonically decreasing bps with trade size'
      },
      {
        fieldName: 'sec_transaction_fee_rate',
        dataType: 'numeric',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'rate',
        description: 'SEC section 31 rate applied to gross sell volume (0.0000278)',
        validationRule: 'Applied strictly to SELL orders'
      }
    ]
  },
  {
    entityName: 'RebalanceProposal',
    description: 'Immutable batch proposal package containing calculated trades and policy audit.',
    cardinality: 'N:1 with Portfolio; 1:N with Trade',
    primaryKey: 'proposal_id',
    foreignKeys: [{ field: 'portfolio_id', references: 'Portfolio.portfolio_id' }],
    fields: [
      {
        fieldName: 'proposal_id',
        dataType: 'string',
        required: true,
        uniqueness: 'PRIMARY_KEY',
        description: 'Proposal ID: RB-2026-000001',
        validationRule: '^RB-2026-[0-9]{6}$'
      },
      {
        fieldName: 'status',
        dataType: 'enum',
        required: true,
        uniqueness: 'NON_UNIQUE',
        allowedValues: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTED'],
        description: 'Workflow lifecycle state',
        validationRule: 'State transition DAG valid'
      },
      {
        fieldName: 'policy_check_status',
        dataType: 'enum',
        required: true,
        uniqueness: 'NON_UNIQUE',
        allowedValues: ['PASS', 'WARNING', 'FAIL'],
        description: 'Pre-trade compliance evaluation result',
        validationRule: 'FAIL prevents approval unless exception is resolved'
      },
      {
        fieldName: 'pre_trade_drift_score',
        dataType: 'numeric',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'percent',
        description: 'Aggregate portfolio drift before rebalance',
        validationRule: 'Derived sum of absolute asset class drifts'
      },
      {
        fieldName: 'post_trade_drift_score',
        dataType: 'numeric',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'percent',
        description: 'Simulated residual drift after trade execution',
        validationRule: 'post_drift <= pre_drift'
      }
    ]
  },
  {
    entityName: 'Trade',
    description: 'Specific buy or sell order generated by the rebalance engine.',
    cardinality: 'N:1 with RebalanceProposal; N:1 with Instrument; N:1 with Portfolio',
    primaryKey: 'trade_id',
    foreignKeys: [
      { field: 'proposal_id', references: 'RebalanceProposal.proposal_id' },
      { field: 'portfolio_id', references: 'Portfolio.portfolio_id' },
      { field: 'instrument_id', references: 'Instrument.instrument_id' }
    ],
    fields: [
      {
        fieldName: 'trade_id',
        dataType: 'string',
        required: true,
        uniqueness: 'PRIMARY_KEY',
        description: 'Trade ID: TRD-2026-000001',
        validationRule: '^TRD-2026-[0-9]{6}$'
      },
      {
        fieldName: 'action',
        dataType: 'enum',
        required: true,
        uniqueness: 'NON_UNIQUE',
        allowedValues: ['BUY', 'SELL'],
        description: 'Direction of transaction',
        validationRule: 'SELL must not exceed shares_held in Holding'
      },
      {
        fieldName: 'shares',
        dataType: 'numeric',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'shares',
        description: 'Quantity of units to execute',
        validationRule: 'shares > 0'
      },
      {
        fieldName: 'gross_amount_usd',
        dataType: 'numeric',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'INR (₹)',
        description: 'shares * limit_or_market_price',
        validationRule: 'gross_amount >= min_trade_size (₹1,000)'
      },
      {
        fieldName: 'estimated_fee_usd',
        dataType: 'numeric',
        required: true,
        uniqueness: 'NON_UNIQUE',
        units: 'INR (₹)',
        description: 'Brokerage and Indian STT / SEBI regulatory levies',
        validationRule: 'Calculated via FeeSchedule (except injected anomaly)'
      }
    ]
  }
];
