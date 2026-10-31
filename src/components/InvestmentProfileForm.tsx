import React, { useState, useId } from 'react';
import {
  UserPortfolio,
  UserHolding,
  UserTargetAllocation,
  UserAssetClass,
  UserRiskAppetite
} from '../types/userPortfolio';
import { UserAccount } from '../types';
import { formatINR } from '../utils/formatters';
import {
  ShieldCheck,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  PieChart,
  User,
  Briefcase,
  HelpCircle,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react';

interface InvestmentProfileFormProps {
  currentUser: UserAccount;
  existingPortfolio?: UserPortfolio | null;
  onSaveSuccess: (portfolio: UserPortfolio) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const COMMON_INSTRUMENT_TEMPLATES: Array<{
  name: string;
  symbol: string;
  assetClass: UserAssetClass;
  defaultPrice: number;
}> = [
  { name: 'Nippon India ETF Nifty 50 BeES', symbol: 'NIFTYBEES', assetClass: 'Equity', defaultPrice: 285.50 },
  { name: 'Reliance Industries Ltd.', symbol: 'RELIANCE', assetClass: 'Equity', defaultPrice: 2980.00 },
  { name: 'HDFC Bank Ltd.', symbol: 'HDFCBANK', assetClass: 'Equity', defaultPrice: 1640.00 },
  { name: 'Tata Consultancy Services', symbol: 'TCS', assetClass: 'Equity', defaultPrice: 3890.00 },
  { name: 'Edelweiss Bharat Bond ETF 2031', symbol: 'BHARATBOND', assetClass: 'Debt', defaultPrice: 1240.00 },
  { name: 'Nippon India ETF Nifty 10Y G-Sec', symbol: 'GSEC10Y', assetClass: 'Debt', defaultPrice: 108.40 },
  { name: 'Nippon India ETF Gold BeES', symbol: 'GOLDBEES', assetClass: 'Gold', defaultPrice: 74.80 },
  { name: 'Nippon India ETF Liquid BeES', symbol: 'LIQUIDBEES', assetClass: 'Cash', defaultPrice: 1000.00 }
];

export const InvestmentProfileForm: React.FC<InvestmentProfileFormProps> = ({
  currentUser,
  existingPortfolio,
  onSaveSuccess,
  onCancel,
  isEditing = false
}) => {
  // Form unique IDs
  const formGoalId = useId();
  const formExpId = useId();
  const formInitAmtId = useId();
  const formCashAmtId = useId();
  const formDurationId = useId();
  const formMonthlyAmtId = useId();

  // 1. Personal & Investor Info
  const [fullName] = useState(currentUser.name);
  const [email] = useState(currentUser.email);
  const [investmentGoal, setInvestmentGoal] = useState<string>(
    existingPortfolio?.investorInfo.investmentGoal || 'Wealth Creation & Long-Term Compounding'
  );
  const [riskAppetite, setRiskAppetite] = useState<UserRiskAppetite>(
    existingPortfolio?.investorInfo.riskAppetite || 'Medium'
  );
  const [investmentExperience, setInvestmentExperience] = useState<string>(
    existingPortfolio?.investorInfo.investmentExperience || '3-5 years (Active investor)'
  );

  // 2. Portfolio Information
  const [initialInvestmentAmount, setInitialInvestmentAmount] = useState<string>(
    existingPortfolio ? String(existingPortfolio.portfolioInfo.initialInvestmentAmount) : '500000'
  );
  const [availableCashAmount, setAvailableCashAmount] = useState<string>(
    existingPortfolio ? String(existingPortfolio.portfolioInfo.availableCashAmount) : '100000'
  );
  const [investmentDuration, setInvestmentDuration] = useState<string>(
    existingPortfolio?.portfolioInfo.investmentDuration || '5 to 10 Years'
  );
  const [monthlyInvestmentAmount, setMonthlyInvestmentAmount] = useState<string>(
    existingPortfolio?.portfolioInfo.monthlyInvestmentAmount
      ? String(existingPortfolio.portfolioInfo.monthlyInvestmentAmount)
      : '25000'
  );
  const [preferredAssetClasses, setPreferredAssetClasses] = useState<UserAssetClass[]>(
    existingPortfolio?.portfolioInfo.preferredAssetClasses || ['Equity', 'Debt', 'Gold', 'Cash']
  );

  // 3. Existing Holdings
  const [holdings, setHoldings] = useState<UserHolding[]>(() => {
    if (existingPortfolio && existingPortfolio.holdings.length > 0) {
      return existingPortfolio.holdings;
    }
    // Default initial holding row
    return [
      {
        id: `h-init-1`,
        instrumentName: 'Nippon India ETF Nifty 50 BeES',
        instrumentSymbol: 'NIFTYBEES',
        assetClass: 'Equity',
        quantity: 800,
        purchasePrice: 270.00,
        currentMarketPrice: 285.50
      },
      {
        id: `h-init-2`,
        instrumentName: 'Edelweiss Bharat Bond ETF 2031',
        instrumentSymbol: 'BHARATBOND',
        assetClass: 'Debt',
        quantity: 100,
        purchasePrice: 1200.00,
        currentMarketPrice: 1240.00
      },
      {
        id: `h-init-3`,
        instrumentName: 'Nippon India ETF Gold BeES',
        instrumentSymbol: 'GOLDBEES',
        assetClass: 'Gold',
        quantity: 500,
        purchasePrice: 70.00,
        currentMarketPrice: 74.80
      }
    ];
  });

  // 4. Target Allocation
  const [equityPct, setEquityPct] = useState<number>(
    existingPortfolio ? existingPortfolio.targetAllocation.equityPct : 60
  );
  const [debtPct, setDebtPct] = useState<number>(
    existingPortfolio ? existingPortfolio.targetAllocation.debtPct : 25
  );
  const [goldPct, setGoldPct] = useState<number>(
    existingPortfolio ? existingPortfolio.targetAllocation.goldPct : 10
  );
  const [cashPct, setCashPct] = useState<number>(
    existingPortfolio ? existingPortfolio.targetAllocation.cashPct : 5
  );

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Target allocation sum
  const targetSum = Math.round((equityPct + debtPct + goldPct + cashPct) * 100) / 100;
  const isAllocationValid = Math.abs(targetSum - 100.0) < 0.01;

  // Toggle Preferred Asset Class
  const toggleAssetClass = (ac: UserAssetClass) => {
    if (preferredAssetClasses.includes(ac)) {
      if (preferredAssetClasses.length === 1) return; // Keep at least one
      setPreferredAssetClasses(preferredAssetClasses.filter(c => c !== ac));
    } else {
      setPreferredAssetClasses([...preferredAssetClasses, ac]);
    }
  };

  // Holding dynamic row operations
  const handleAddHoldingRow = () => {
    const newId = `HOLD-USR-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setHoldings(prev => [
      ...prev,
      {
        id: newId,
        instrumentName: '',
        instrumentSymbol: '',
        assetClass: 'Equity',
        quantity: 1,
        purchasePrice: 0,
        currentMarketPrice: 0
      }
    ]);
  };

  const handleQuickAdd = (template: typeof COMMON_INSTRUMENT_TEMPLATES[0]) => {
    const newId = `HOLD-USR-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setHoldings(prev => [
      ...prev,
      {
        id: newId,
        instrumentName: template.name,
        instrumentSymbol: template.symbol,
        assetClass: template.assetClass,
        quantity: template.assetClass === 'Debt' ? 50 : 100,
        purchasePrice: template.defaultPrice,
        currentMarketPrice: template.defaultPrice
      }
    ]);
  };

  const handleUpdateHolding = (id: string, field: keyof UserHolding, value: any) => {
    setHoldings(prev =>
      prev.map(h => {
        if (h.id === id) {
          return { ...h, [field]: value };
        }
        return h;
      })
    );
  };

  const handleRemoveHolding = (id: string) => {
    setHoldings(prev => prev.filter(h => h.id !== id));
  };

  // Preset allocation handlers based on Risk Appetite
  const applyPresetAllocation = (preset: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE') => {
    if (preset === 'CONSERVATIVE') {
      setEquityPct(25);
      setDebtPct(55);
      setGoldPct(10);
      setCashPct(10);
      setRiskAppetite('Low');
    } else if (preset === 'BALANCED') {
      setEquityPct(60);
      setDebtPct(25);
      setGoldPct(10);
      setCashPct(5);
      setRiskAppetite('Medium');
    } else if (preset === 'AGGRESSIVE') {
      setEquityPct(75);
      setDebtPct(15);
      setGoldPct(5);
      setCashPct(5);
      setRiskAppetite('High');
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // 1. Validate Target Allocation = 100%
    if (!isAllocationValid) {
      setErrorMessage(
        `Target allocation percentages must total exactly 100.0%. Current sum: ${targetSum.toFixed(1)}%. Please adjust before saving.`
      );
      return;
    }

    // 2. Validate Numbers
    const initAmt = parseFloat(initialInvestmentAmount);
    if (isNaN(initAmt) || initAmt < 0) {
      setErrorMessage('Please enter a valid Initial Investment Amount (INR ₹).');
      return;
    }

    const cashAmt = parseFloat(availableCashAmount);
    if (isNaN(cashAmt) || cashAmt < 0) {
      setErrorMessage('Please enter a valid Available Cash Amount (INR ₹).');
      return;
    }

    // 3. Validate Holdings
    for (let i = 0; i < holdings.length; i++) {
      const h = holdings[i];
      if (!h.instrumentSymbol.trim()) {
        setErrorMessage(`Holding row #${i + 1} is missing an Instrument Symbol/Ticker.`);
        return;
      }
      if (!h.instrumentName.trim()) {
        setErrorMessage(`Holding row #${i + 1} is missing an Instrument Name.`);
        return;
      }
      if (h.quantity <= 0) {
        setErrorMessage(`Quantity for '${h.instrumentSymbol}' must be greater than 0.`);
        return;
      }
      if (h.currentMarketPrice <= 0) {
        setErrorMessage(`Market Price for '${h.instrumentSymbol}' must be greater than ₹0.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        investorInfo: {
          fullName,
          email,
          investmentGoal,
          riskAppetite,
          investmentExperience
        },
        portfolioInfo: {
          initialInvestmentAmount: initAmt,
          availableCashAmount: cashAmt,
          investmentDuration,
          monthlyInvestmentAmount: monthlyInvestmentAmount ? parseFloat(monthlyInvestmentAmount) : undefined,
          preferredAssetClasses
        },
        holdings: holdings.map(h => ({
          ...h,
          instrumentSymbol: h.instrumentSymbol.toUpperCase().trim(),
          quantity: Number(h.quantity),
          purchasePrice: Number(h.purchasePrice),
          currentMarketPrice: Number(h.currentMarketPrice)
        })),
        targetAllocation: {
          equityPct,
          debtPct,
          goldPct,
          cashPct
        }
      };

      // Import client API dynamically or directly
      const { portfolioApi } = await import('../services/portfolioApi');
      const response = await portfolioApi.savePortfolio(payload, currentUser.id);

      if (response.success && response.portfolio) {
        setSuccessMessage('Investment profile and portfolio details saved successfully!');
        setTimeout(() => {
          onSaveSuccess(response.portfolio!);
        }, 800);
      } else {
        setErrorMessage(response.error || 'Failed to save portfolio. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Error saving portfolio:', err);
      setErrorMessage('An unexpected error occurred while saving your portfolio.');
      setIsSubmitting(false);
    }
  };

  // Total current market value of holdings
  const totalHoldingsVal = holdings.reduce(
    (sum, h) => sum + (Number(h.quantity) || 0) * (Number(h.currentMarketPrice) || 0),
    0
  );
  const currentTotalVal = totalHoldingsVal + (parseFloat(availableCashAmount) || 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Form Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-xs font-mono text-cyan-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>SEBI-Aligned Demat Portfolio Setup</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {isEditing ? 'Update Your Investment Profile' : 'Complete Your Investment Profile'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-2xl">
              Provide your genuine financial goals, risk appetite, existing holdings, and target asset allocation.
              Your portfolio will be dynamically rebalanced using policy-constrained mathematical rules.
            </p>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="self-start sm:self-center px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {/* Live Total Value Header Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <span className="text-[11px] text-slate-400 font-medium">Estimated Total Portfolio Value</span>
            <div className="text-xl font-bold text-cyan-400 font-mono tabular-nums mt-1">
              {formatINR(currentTotalVal)}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Holdings + Available Cash</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <span className="text-[11px] text-slate-400 font-medium">Holdings Inventory Count</span>
            <div className="text-xl font-bold text-white font-mono tabular-nums mt-1">
              {holdings.length} Securities
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Market Value: {formatINR(totalHoldingsVal)}
            </span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <span className="text-[11px] text-slate-400 font-medium">Target Allocation Sum</span>
            <div className={`text-xl font-bold font-mono tabular-nums mt-1 flex items-center gap-1.5 ${
              isAllocationValid ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              <span>{targetSum.toFixed(1)}%</span>
              {isAllocationValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
              {isAllocationValid ? 'Valid: Exact 100.0% constraint satisfied' : 'Must sum to exactly 100.0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Form Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800/80 flex items-start gap-3 text-xs text-rose-200 shadow-md">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800/80 flex items-center gap-3 text-xs text-emerald-200 shadow-md">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="font-medium leading-relaxed">{successMessage}</div>
          </div>
        )}

        {/* SECTION 1: PERSONAL AND INVESTOR INFORMATION */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                1. Personal and Investor Information
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified registration details, financial goals, and risk profile.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name (Retrieved from registration - Read-only badge) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name <span className="text-[10px] text-cyan-400 font-mono font-normal">(From Registration)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={fullName}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 cursor-not-allowed font-medium"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Verified
                </span>
              </div>
            </div>

            {/* Email Address (Retrieved from registration - Read-only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address <span className="text-[10px] text-cyan-400 font-mono font-normal">(From Registration)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  readOnly
                  value={email}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 cursor-not-allowed font-medium"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Primary
                </span>
              </div>
            </div>

            {/* Investment Goal */}
            <div>
              <label htmlFor={formGoalId} className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Investment Goal <span className="text-rose-400">*</span>
              </label>
              <select
                id={formGoalId}
                value={investmentGoal}
                onChange={e => setInvestmentGoal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="Wealth Creation & Long-Term Compounding">Wealth Creation & Long-Term Compounding</option>
                <option value="Retirement Corpus Planning (Superannuation)">Retirement Corpus Planning (Superannuation)</option>
                <option value="Children Higher Education & Future Funding">Children Higher Education & Future Funding</option>
                <option value="Capital Preservation & Regular Cash Flow">Capital Preservation & Regular Cash Flow</option>
                <option value="First Real Estate / Home Down Payment">First Real Estate / Home Down Payment</option>
                <option value="Tax Optimization & Section 80C Harvesting">Tax Optimization & Section 80C Harvesting</option>
              </select>
            </div>

            {/* Investment Experience */}
            <div>
              <label htmlFor={formExpId} className="block text-xs font-semibold text-slate-300 mb-1.5">
                Investment Experience <span className="text-rose-400">*</span>
              </label>
              <select
                id={formExpId}
                value={investmentExperience}
                onChange={e => setInvestmentExperience(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="Beginner (< 1 Year)">Beginner (&lt; 1 Year experience)</option>
                <option value="Intermediate (1-3 years)">Intermediate (1-3 years in Indian markets)</option>
                <option value="3-5 years (Active investor)">3-5 years (Active equity & ETF investor)</option>
                <option value="Advanced / Professional (5+ years)">Advanced / Professional (5+ years experience)</option>
              </select>
            </div>
          </div>

          {/* Risk Appetite (Low, Medium, High) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Risk Appetite <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'Low' as UserRiskAppetite,
                  title: 'Low Risk',
                  subtitle: 'Conservative & Capital Preservation',
                  desc: 'Focus on sovereign bonds, fixed income, gold and low volatility.'
                },
                {
                  id: 'Medium' as UserRiskAppetite,
                  title: 'Medium Risk',
                  subtitle: 'Balanced Core Growth',
                  desc: 'Equally balanced equity index ETFs, sovereign debt, and commodities.'
                },
                {
                  id: 'High' as UserRiskAppetite,
                  title: 'High Risk',
                  subtitle: 'Aggressive Capital Appreciation',
                  desc: 'High allocation to large-cap and midcap equities with strategic hedge.'
                }
              ].map(opt => {
                const isSelected = riskAppetite === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setRiskAppetite(opt.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400/80 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {opt.title}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <span className="text-[11px] text-cyan-300 block font-medium mt-0.5">
                      {opt.subtitle}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 2: PORTFOLIO INFORMATION */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                2. Portfolio Information
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Initial capital commitment, settled cash reserves, and asset preference scope.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Initial Investment Amount */}
            <div>
              <label htmlFor={formInitAmtId} className="block text-xs font-semibold text-slate-300 mb-1.5">
                Initial Investment Amount (INR ₹) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500 font-mono">₹</span>
                <input
                  id={formInitAmtId}
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={initialInvestmentAmount}
                  onChange={e => setInitialInvestmentAmount(e.target.value)}
                  placeholder="500000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-8 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                Formatted: {formatINR(parseFloat(initialInvestmentAmount) || 0)}
              </span>
            </div>

            {/* Available Cash Amount */}
            <div>
              <label htmlFor={formCashAmtId} className="block text-xs font-semibold text-slate-300 mb-1.5">
                Available Cash Amount (INR ₹) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500 font-mono">₹</span>
                <input
                  id={formCashAmtId}
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={availableCashAmount}
                  onChange={e => setAvailableCashAmount(e.target.value)}
                  placeholder="100000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-8 text-xs text-cyan-300 font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                Uninvested cash reserve in Demat account
              </span>
            </div>

            {/* Investment Duration */}
            <div>
              <label htmlFor={formDurationId} className="block text-xs font-semibold text-slate-300 mb-1.5">
                Investment Duration <span className="text-rose-400">*</span>
              </label>
              <select
                id={formDurationId}
                value={investmentDuration}
                onChange={e => setInvestmentDuration(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="1 to 3 Years">1 to 3 Years (Short-to-Medium Horizon)</option>
                <option value="3 to 5 Years">3 to 5 Years (Medium Term Horizon)</option>
                <option value="5 to 10 Years">5 to 10 Years (Strategic Wealth Creation)</option>
                <option value="10+ Years">10+ Years (Long-Term Compounding)</option>
              </select>
            </div>

            {/* Monthly Investment Amount (Optional) */}
            <div>
              <label htmlFor={formMonthlyAmtId} className="block text-xs font-semibold text-slate-300 mb-1.5">
                Monthly Investment Amount (Optional SIP, INR ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500 font-mono">₹</span>
                <input
                  id={formMonthlyAmtId}
                  type="number"
                  min="0"
                  step="1000"
                  value={monthlyInvestmentAmount}
                  onChange={e => setMonthlyInvestmentAmount(e.target.value)}
                  placeholder="25000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-8 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                Recurring monthly capital injection if applicable
              </span>
            </div>
          </div>

          {/* Preferred Asset Classes (Equity, Debt, Gold, Cash) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Preferred Asset Classes <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['Equity', 'Debt', 'Gold', 'Cash'] as UserAssetClass[]).map(ac => {
                const isSelected = preferredAssetClasses.includes(ac);
                return (
                  <button
                    type="button"
                    key={ac}
                    onClick={() => toggleAssetClass(ac)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-400 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{ac}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {ac === 'Equity' && 'Shares & Index ETFs'}
                      {ac === 'Debt' && 'G-Sec & PSU Bonds'}
                      {ac === 'Gold' && 'Sovereign / ETF Gold'}
                      {ac === 'Cash' && 'Liquid BeES & Fiat'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 3: EXISTING HOLDINGS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  3. Existing Holdings
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter each instrument currently in your Demat account with quantity and prices.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddHoldingRow}
              className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm self-start sm:self-center"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Instrument Row</span>
            </button>
          </div>

          {/* Quick Add Common Indian ETF Presets */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quick Add Popular Indian Instruments:
            </span>
            <div className="flex flex-wrap gap-2">
              {COMMON_INSTRUMENT_TEMPLATES.map(t => (
                <button
                  type="button"
                  key={t.symbol}
                  onClick={() => handleQuickAdd(t)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 font-mono"
                >
                  <Plus className="w-3 h-3 text-cyan-400" />
                  <span>{t.symbol}</span>
                  <span className="text-[10px] text-slate-500 font-sans">({t.assetClass})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Holdings Dynamic Table */}
          {holdings.length === 0 ? (
            <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-2">
              <p className="text-sm">No existing holdings entered yet.</p>
              <p className="text-xs text-slate-600">
                If you have an all-cash portfolio, you can proceed, or click &quot;Add Instrument Row&quot; above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
                    <th className="py-3 px-3">Symbol / Ticker</th>
                    <th className="py-3 px-3">Instrument Legal Name</th>
                    <th className="py-3 px-3">Asset Class</th>
                    <th className="py-3 px-3 text-right">Quantity</th>
                    <th className="py-3 px-3 text-right">Buy Price (₹)</th>
                    <th className="py-3 px-3 text-right">Current Price (₹)</th>
                    <th className="py-3 px-3 text-right">Market Val (₹)</th>
                    <th className="py-3 px-2 text-center w-10">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
                  {holdings.map((h, idx) => {
                    const rowVal = (Number(h.quantity) || 0) * (Number(h.currentMarketPrice) || 0);
                    return (
                      <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Symbol */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            required
                            value={h.instrumentSymbol}
                            onChange={e => handleUpdateHolding(h.id, 'instrumentSymbol', e.target.value.toUpperCase())}
                            placeholder="e.g. NIFTYBEES"
                            className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </td>
                        {/* Name */}
                        <td className="py-2.5 px-3 font-sans">
                          <input
                            type="text"
                            required
                            value={h.instrumentName}
                            onChange={e => handleUpdateHolding(h.id, 'instrumentName', e.target.value)}
                            placeholder="e.g. Nippon India Nifty 50 ETF"
                            className="w-44 sm:w-56 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </td>
                        {/* Asset Class */}
                        <td className="py-2.5 px-3 font-sans">
                          <select
                            value={h.assetClass}
                            onChange={e => handleUpdateHolding(h.id, 'assetClass', e.target.value as UserAssetClass)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="Equity">Equity</option>
                            <option value="Debt">Debt</option>
                            <option value="Gold">Gold</option>
                            <option value="Cash">Cash</option>
                          </select>
                        </td>
                        {/* Quantity */}
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required
                            value={h.quantity || ''}
                            onChange={e => handleUpdateHolding(h.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-right text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </td>
                        {/* Purchase Price */}
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.05"
                            required
                            value={h.purchasePrice || ''}
                            onChange={e => handleUpdateHolding(h.id, 'purchasePrice', parseFloat(e.target.value) || 0)}
                            className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-right text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </td>
                        {/* Current Market Price */}
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0.05"
                            step="0.05"
                            required
                            value={h.currentMarketPrice || ''}
                            onChange={e => handleUpdateHolding(h.id, 'currentMarketPrice', parseFloat(e.target.value) || 0)}
                            className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-right text-emerald-400 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </td>
                        {/* Row Total */}
                        <td className="py-2.5 px-3 text-right text-white font-bold">
                          ₹{rowVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        {/* Delete Action */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveHolding(h.id)}
                            title="Remove holding row"
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 4: TARGET ALLOCATION */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  4. Target Asset Allocation
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Prescribe desired target percentages across asset classes. Must sum to exactly 100.0%.
                </p>
              </div>
            </div>

            {/* Quick Presets based on Risk */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">Presets:</span>
              <button
                type="button"
                onClick={() => applyPresetAllocation('CONSERVATIVE')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                Conservative (25/55/10/10)
              </button>
              <button
                type="button"
                onClick={() => applyPresetAllocation('BALANCED')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                Balanced (60/25/10/5)
              </button>
              <button
                type="button"
                onClick={() => applyPresetAllocation('AGGRESSIVE')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                Aggressive (75/15/5/5)
              </button>
            </div>
          </div>

          {/* Allocation Inputs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Equity */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-blue-400">Equity (%)</span>
                <span className="font-mono text-slate-400">{equityPct}%</span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                required
                value={equityPct}
                onChange={e => setEquityPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-bold text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Indian Large/Midcap & Global ETFs
              </span>
            </div>

            {/* Debt */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-400">Debt (%)</span>
                <span className="font-mono text-slate-400">{debtPct}%</span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                required
                value={debtPct}
                onChange={e => setDebtPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-bold text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block">
                G-Sec 10Y & Bharat Bond PSUs
              </span>
            </div>

            {/* Gold */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-amber-400">Gold (%)</span>
                <span className="font-mono text-slate-400">{goldPct}%</span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                required
                value={goldPct}
                onChange={e => setGoldPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-bold text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Gold BeES & Sovereign Gold
              </span>
            </div>

            {/* Cash */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Cash (%)</span>
                <span className="font-mono text-slate-400">{cashPct}%</span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                required
                value={cashPct}
                onChange={e => setCashPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-bold text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Liquid BeES & Fiat reserve
              </span>
            </div>
          </div>

          {/* Target Allocation Visual Bar & 100% Validation Status */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Allocation Composition Visualizer:</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-400">Total Sum:</span>
                <span className={`font-bold ${isAllocationValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {targetSum.toFixed(1)}%
                </span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-300">100.0%</span>
              </div>
            </div>

            {/* Visual stacked percentage bar */}
            <div className="h-4 rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
              <div
                style={{ width: `${Math.max(0, Math.min(100, (equityPct / (targetSum || 1)) * 100))}%` }}
                className="bg-blue-500 h-full transition-all duration-300"
                title={`Equity: ${equityPct}%`}
              />
              <div
                style={{ width: `${Math.max(0, Math.min(100, (debtPct / (targetSum || 1)) * 100))}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
                title={`Debt: ${debtPct}%`}
              />
              <div
                style={{ width: `${Math.max(0, Math.min(100, (goldPct / (targetSum || 1)) * 100))}%` }}
                className="bg-amber-500 h-full transition-all duration-300"
                title={`Gold: ${goldPct}%`}
              />
              <div
                style={{ width: `${Math.max(0, Math.min(100, (cashPct / (targetSum || 1)) * 100))}%` }}
                className="bg-slate-400 h-full transition-all duration-300"
                title={`Cash: ${cashPct}%`}
              />
            </div>

            {/* Validation Notice */}
            {!isAllocationValid && (
              <div className="flex items-center gap-2 text-xs text-rose-300 pt-1">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  Validation constraint failed: Target allocation must total exactly 100.0%. (Current total: {targetSum.toFixed(1)}%).
                  {targetSum > 100 ? ` Please reduce by ${(targetSum - 100).toFixed(1)}%.` : ` Please increase by ${(100 - targetSum).toFixed(1)}%.`}
                </span>
              </div>
            )}
            {isAllocationValid && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Target allocation model satisfies 100.0% policy constraint. Ready for rebalance simulation.</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions Button */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-6 py-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors"
            >
              Cancel & Return to Dashboard
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isAllocationValid}
            className="w-full sm:w-auto px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Portfolio & Running Rebalancing Engine...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes & Recalculate Portfolio' : 'Save Portfolio & Launch Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
