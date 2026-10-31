/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { UserRole, UserAccount, GroundTruthAnomaly } from './types';
import { generateSyntheticDataset, GeneratedDataset } from './engine/dataGenerator';
import { validateDataset } from './engine/validationSuite';
import { calculateTradeFee } from './engine/rebalancer';
import { Header } from './components/Header';
import { CustomerView } from './components/CustomerView';
import { OperationsView } from './components/OperationsView';
import { ComplianceView } from './components/ComplianceView';
import { AdminDataHubView } from './components/AdminDataHubView';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { authApi } from './services/api';

interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entityId: string;
  details: string;
}

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'USR-IN-001',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@investor.in',
    phone: '+91 98112 34567',
    role: 'CUSTOMER',
    panNumber: 'ABCPS1234F',
    kycStatus: 'VERIFIED',
    createdAt: '2024-01-15T09:00:00Z'
  },
  {
    id: 'USR-IN-002',
    name: 'Priya Patel',
    email: 'priya.patel@wealthops.in',
    phone: '+91 98223 45678',
    role: 'OPERATIONS',
    panNumber: 'BKPPA5678K',
    kycStatus: 'VERIFIED',
    createdAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 'USR-IN-003',
    name: 'Arun Verma',
    email: 'arun.verma@compliance.in',
    phone: '+91 98334 56789',
    role: 'COMPLIANCE',
    panNumber: 'CKPVE9012M',
    kycStatus: 'VERIFIED',
    createdAt: '2024-02-01T11:00:00Z'
  },
  {
    id: 'USR-IN-004',
    name: 'Suresh Gupta (Admin)',
    email: 'admin@equibalance.in',
    phone: '+91 98445 67890',
    role: 'ADMIN',
    panNumber: 'DKPGU3456N',
    kycStatus: 'VERIFIED',
    createdAt: '2024-01-01T08:00:00Z'
  }
];

type ScreenMode = 'LOGIN' | 'REGISTER' | 'DASHBOARD';

export default function App() {
  const [screenMode, setScreenMode] = useState<ScreenMode>('LOGIN');
  const [activeRole, setActiveRole] = useState<UserRole>('CUSTOMER');
  const [dataset, setDataset] = useState<GeneratedDataset>(() => generateSyntheticDataset(50, 20261022));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);

  // Login page helper state
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [justRegistered, setJustRegistered] = useState(false);

  // Active logged-in user (null = unauthenticated)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Registered users list from localStorage or defaults for fallback
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => {
    try {
      const stored = localStorage.getItem('equibalance_users');
      return stored ? JSON.parse(stored) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([
    {
      id: 'EVT-001',
      timestamp: '2026-10-30 08:00:15 UTC',
      actor: 'System Admin',
      action: 'DATASET_SYNTHESIZED',
      entityId: 'SYSTEM',
      details: 'Deterministic Indian Market dataset generated with seed 20261022 (INR ₹, 50 portfolios, 250 trading days).'
    },
    {
      id: 'EVT-002',
      timestamp: '2026-10-30 08:05:00 UTC',
      actor: 'Policy Engine',
      action: 'PRE_TRADE_SCAN',
      entityId: 'ALL_PROPOSALS',
      details: 'Identified 5 policy exceptions (Target weight mismatch, oversell trade, SEBI debarred security).'
    }
  ]);

  // On mount: Check for existing secure authentication session
  useEffect(() => {
    let mounted = true;
    async function verifyExistingSession() {
      try {
        const user = await authApi.getCurrentUser();
        if (!mounted) return;
        if (user) {
          setCurrentUser(user);
          // Role-based redirection:
          setActiveRole(user.role);
          setScreenMode('DASHBOARD');
        } else {
          setCurrentUser(null);
          setScreenMode('LOGIN');
        }
      } catch (err) {
        if (mounted) {
          setCurrentUser(null);
          setScreenMode('LOGIN');
        }
      } finally {
        if (mounted) {
          setIsVerifyingSession(false);
        }
      }
    }
    verifyExistingSession();
    return () => {
      mounted = false;
    };
  }, []);

  // Sync users with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('equibalance_users', JSON.stringify(registeredUsers));
    } catch {
      // Ignore storage errors in sandboxes
    }
  }, [registeredUsers]);

  // Handle successful login from LoginPage
  const handleLoginSuccess = useCallback((user: UserAccount) => {
    setCurrentUser(user);
    // Role-based dashboard redirection:
    // Customer -> Customer Portal ('CUSTOMER')
    // Operations -> Operations Cockpit ('OPERATIONS')
    // Risk & Compliance -> Risk & Compliance Dashboard ('COMPLIANCE')
    // Admin -> Admin & Data Hub ('ADMIN')
    setActiveRole(user.role);
    setScreenMode('DASHBOARD');

    setAuditEvents(prev => [
      {
        id: `EVT-${String(prev.length + 1).padStart(3, '0')}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        actor: user.name,
        action: 'USER_AUTHENTICATED',
        entityId: user.id,
        details: `Credentials verified. Session authorized for ${user.role} workspace (${user.email}).`
      },
      ...prev
    ]);
  }, []);

  // Handle registration navigation
  const handleNavigateToRegister = useCallback(() => {
    setJustRegistered(false);
    setScreenMode('REGISTER');
  }, []);

  // Handle navigation to login from registration page
  const handleNavigateToLogin = useCallback((registeredEmail?: string) => {
    if (registeredEmail) {
      setPrefilledEmail(registeredEmail);
      setJustRegistered(true);
    } else {
      setJustRegistered(false);
    }
    setScreenMode('LOGIN');
  }, []);

  // Handle Logout
  const handleLogout = useCallback(async () => {
    const user = currentUser;
    await authApi.logout();
    setCurrentUser(null);
    setJustRegistered(false);
    setScreenMode('LOGIN');

    if (user) {
      setAuditEvents(prev => [
        {
          id: `EVT-${String(prev.length + 1).padStart(3, '0')}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          actor: user.name,
          action: 'USER_LOGGED_OUT',
          entityId: user.id,
          details: `User session terminated for ${user.email}. Dashboard access revoked.`
        },
        ...prev
      ]);
    }
  }, [currentUser]);

  // Handle Registration fallback (for modal)
  const handleRegister = useCallback((newUser: UserAccount) => {
    setRegisteredUsers(prev => {
      const exists = prev.some(u => u.email.toLowerCase() === newUser.email.toLowerCase());
      if (exists) {
        return prev.map(u => u.email.toLowerCase() === newUser.email.toLowerCase() ? newUser : u);
      }
      return [newUser, ...prev];
    });

    setAuditEvents(prev => [
      {
        id: `EVT-${String(prev.length + 1).padStart(3, '0')}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        actor: newUser.name,
        action: 'USER_REGISTERED',
        entityId: newUser.id,
        details: `New account registered: ${newUser.name} (${newUser.email}), PAN: ${newUser.panNumber || 'N/A'}.`
      },
      ...prev
    ]);
  }, []);

  // Run validation on dataset
  const validationReport = useMemo(() => {
    return validateDataset(dataset);
  }, [dataset]);

  const instrumentMap = useMemo(() => {
    const map = new Map();
    dataset.instruments.forEach(i => map.set(i.instrument_id, i));
    return map;
  }, [dataset.instruments]);

  const targetAllocationsMap = useMemo(() => {
    const map = new Map();
    dataset.targetAllocations.forEach(t => map.set(t.target_id, t));
    return map;
  }, [dataset.targetAllocations]);

  // Handle single proposal execution
  const handleExecuteProposal = useCallback((portfolioId: string, tradeCount: number) => {
    setDataset(prev => {
      const updatedPortfolios = prev.portfolios.map(p => {
        if (p.portfolio_id === portfolioId) {
          return {
            ...p,
            drift_status: 'IN_TOLERANCE' as const,
            max_drift_pct: Number((p.max_drift_pct * 0.15).toFixed(2)),
            status: 'REBALANCED' as const,
            last_rebalanced_at: new Date().toISOString()
          };
        }
        return p;
      });

      const updatedProposals = prev.proposals.map(pr => {
        if (pr.portfolio_id === portfolioId) {
          return {
            ...pr,
            status: 'EXECUTED' as const,
            approved_by: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Client Signoff',
            approved_at: new Date().toISOString()
          };
        }
        return pr;
      });

      return {
        ...prev,
        portfolios: updatedPortfolios,
        proposals: updatedProposals
      };
    });

    setAuditEvents(prev => [
      {
        id: `EVT-${String(prev.length + 1).padStart(3, '0')}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        actor: currentUser?.name || 'Account Holder',
        action: 'PROPOSAL_EXECUTED',
        entityId: portfolioId,
        details: `Approved and executed rebalance order set (${tradeCount} trades). Portfolio drift reduced to target tolerance.`
      },
      ...prev
    ]);
  }, [currentUser]);

  // Handle batch rebalance execution across all active accounts
  const handleBatchExecute = useCallback(() => {
    setDataset(prev => {
      const updatedPortfolios = prev.portfolios.map(p => ({
        ...p,
        drift_status: 'IN_TOLERANCE' as const,
        max_drift_pct: Number((p.max_drift_pct * 0.2).toFixed(2)),
        status: 'REBALANCED' as const,
        last_rebalanced_at: new Date().toISOString()
      }));

      const updatedProposals = prev.proposals.map(pr => ({
        ...pr,
        status: 'EXECUTED' as const,
        approved_by: currentUser ? `${currentUser.name} (Ops Batch Runner)` : 'Operations Batch Runner',
        approved_at: new Date().toISOString()
      }));

      return {
        ...prev,
        portfolios: updatedPortfolios,
        proposals: updatedProposals
      };
    });

    setAuditEvents(prev => [
      {
        id: `EVT-${String(prev.length + 1).padStart(3, '0')}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        actor: currentUser?.name || 'Operations Analyst',
        action: 'BATCH_REBALANCE_EXECUTED',
        entityId: 'GLOBAL_BATCH',
        details: `Executed policy-constrained rebalancing batch across ${dataset.portfolios.length} Demat accounts.`
      },
      ...prev
    ]);
  }, [currentUser, dataset.portfolios.length]);

  // Handle Remediating Anomaly (Edge Cases)
  const handleRemediateAnomaly = useCallback((anomalyId: string) => {
    setDataset(prev => {
      let updatedTargetAllocations = [...prev.targetAllocations];
      let updatedTrades = [...prev.trades];
      let updatedPrices = [...prev.marketPrices];
      let updatedAnomalies = [...prev.groundTruthAnomalies];

      if (anomalyId === 'ANOM-001') {
        // Fix target model weights to sum to exact 100%
        updatedTargetAllocations = updatedTargetAllocations.map(t => {
          if (t.target_id === 'TGT-000005') {
            return {
              ...t,
              target_weights: {
                US_EQUITY: 40.0,
                INTL_EQUITY: 20.0,
                EM_EQUITY: 10.0,
                FIXED_INCOME: 20.0,
                REAL_ESTATE: 5.0,
                COMMODITIES: 3.0,
                CASH_EQUIVALENT: 2.0 // Sum = 100.0%
              },
              is_anomalous: false
            };
          }
          return t;
        });
      } else if (anomalyId === 'ANOM-002') {
        // Fix trade exceeding holding: cap sell to held shares
        if (updatedTrades.length > 0) {
          const victim = updatedTrades[0];
          const held = prev.holdings.find(h => h.portfolio_id === victim.portfolio_id && h.instrument_id === victim.instrument_id);
          const safeShares = held ? Math.min(held.shares_held, 50) : 50;
          victim.shares = safeShares;
          victim.gross_amount_usd = Number((safeShares * victim.limit_or_market_price).toFixed(2));
          victim.anomaly_label = undefined;
        }
      } else if (anomalyId === 'ANOM-003') {
        // Fix excluded asset buy: switch INS-000014 to NIFTYBEES (INS-000001)
        if (updatedTrades.length > 2) {
          const victim = updatedTrades[2];
          victim.instrument_id = 'INS-000001';
          victim.compliance_notes = 'Remediated: Switched from SEBI debarred security to permitted NIFTYBEES benchmark.';
          victim.anomaly_label = undefined;
        }
      } else if (anomalyId === 'ANOM-004') {
        // Fix omitted fees: apply standard tiered fee in INR
        if (updatedTrades.length > 3) {
          const victim = updatedTrades[3];
          const fee = calculateTradeFee(prev.feeSchedules[0], victim.gross_amount_usd, victim.action === 'SELL');
          victim.estimated_fee_usd = fee;
          victim.net_amount_usd = Number((victim.gross_amount_usd - fee).toFixed(2));
          victim.anomaly_label = undefined;
        }
      } else if (anomalyId === 'ANOM-005') {
        // Fix stale price: set is_stale to true so warning is properly flagged
        updatedPrices = updatedPrices.map(p => {
          if (p.instrument_id === 'INS-000006' && p.as_of_date === '2026-10-20') {
            return { ...p, is_stale: true };
          }
          return p;
        });
      }

      updatedAnomalies = updatedAnomalies.map(a => {
        if (a.anomaly_id === anomalyId) {
          return { ...a, status: 'RESOLVED' as const };
        }
        return a;
      });

      return {
        ...prev,
        targetAllocations: updatedTargetAllocations,
        trades: updatedTrades,
        marketPrices: updatedPrices,
        groundTruthAnomalies: updatedAnomalies
      };
    });

    setAuditEvents(prev => [
      {
        id: `EVT-${String(prev.length + 1).padStart(3, '0')}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        actor: currentUser?.name || 'Risk & Compliance Auditor',
        action: 'ANOMALY_REMEDIATED',
        entityId: anomalyId,
        details: `Remediated exception ${anomalyId} and updated source entity state to restore policy invariants.`
      },
      ...prev
    ]);
  }, [currentUser]);

  // Handle Waiving Anomaly
  const handleWaiveAnomaly = useCallback((anomalyId: string, reason: string) => {
    setDataset(prev => {
      const updatedAnomalies = prev.groundTruthAnomalies.map(a => {
        if (a.anomaly_id === anomalyId) {
          return { ...a, status: 'WAIVED_BY_COMPLIANCE' as const };
        }
        return a;
      });
      return {
        ...prev,
        groundTruthAnomalies: updatedAnomalies
      };
    });

    setAuditEvents(prev => [
      {
        id: `EVT-${String(prev.length + 1).padStart(3, '0')}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        actor: currentUser?.name || 'Risk Officer',
        action: 'COMPLIANCE_WAIVER_GRANTED',
        entityId: anomalyId,
        details: `Compliance exception granted for ${anomalyId}. Regulatory justification: "${reason}"`
      },
      ...prev
    ]);
  }, [currentUser]);

  // Handle Regenerate Dataset
  const handleRegenerate = useCallback((scale: number, seed: number) => {
    setIsGenerating(true);
    setTimeout(() => {
      const newDataset = generateSyntheticDataset(scale, seed);
      setDataset(newDataset);
      setIsGenerating(false);

      setAuditEvents(prev => [
        {
          id: `EVT-${String(prev.length + 1).padStart(3, '0')}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          actor: currentUser?.name || 'System Admin',
          action: 'DATASET_REGENERATED',
          entityId: `SEED-${seed}`,
          details: `Regenerated dataset at scale ${scale} with seed ${seed}. Checksum: ${newDataset.summary.checksum}.`
        },
        ...prev
      ]);
    }, 400);
  }, [currentUser]);

  const criticalDriftCount = dataset.portfolios.filter(p => p.drift_status === 'CRITICAL_DRIFT').length;

  // 1. Session verification splash screen
  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-400 font-mono text-xl animate-pulse mb-4">
          ₹
        </div>
        <p className="text-sm font-medium text-slate-300">Verifying secure Demat session...</p>
        <span className="text-xs text-slate-500 font-mono mt-1">EquiBalance Policy Rebalancing Engine</span>
      </div>
    );
  }

  // 2. Unauthenticated: Registration Page
  if (screenMode === 'REGISTER') {
    return (
      <RegisterPage
        onNavigateToLogin={handleNavigateToLogin}
      />
    );
  }

  // 3. Unauthenticated: Login Page (Guards all dashboard access)
  if (screenMode === 'LOGIN' || !currentUser) {
    return (
      <LoginPage
        initialEmail={prefilledEmail}
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={handleNavigateToRegister}
        justRegistered={justRegistered}
      />
    );
  }

  // 4. Authenticated: Role-Based Dashboard Viewport
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract (3 zones) with Role Permissions */}
      <Header
        activeRole={activeRole}
        onSelectRole={setActiveRole}
        onQuickAction={() => {
          setActiveRole('OPERATIONS');
          handleBatchExecute();
        }}
        totalPortfolios={dataset.portfolios.length}
        criticalDriftCount={criticalDriftCount}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Viewport Content - Role Protected */}
      <main className="flex-1 pb-16">
        {activeRole === 'CUSTOMER' && (
          <CustomerView
            currentUser={currentUser}
            onAuditLog={(action, details) => {
              setAuditEvents(prev => [
                {
                  id: `EVT-${String(prev.length + 1).padStart(3, '0')}`,
                  timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
                  actor: currentUser.name,
                  action,
                  entityId: currentUser.id,
                  details
                },
                ...prev
              ]);
            }}
          />
        )}

        {activeRole === 'OPERATIONS' && (
          <OperationsView
            portfolios={dataset.portfolios}
            proposals={dataset.proposals}
            trades={dataset.trades}
            instruments={instrumentMap}
            feeSchedule={dataset.feeSchedules[0]}
            onBatchExecute={handleBatchExecute}
          />
        )}

        {activeRole === 'COMPLIANCE' && (
          <ComplianceView
            anomalies={dataset.groundTruthAnomalies}
            constraints={dataset.constraints}
            onRemediateAnomaly={handleRemediateAnomaly}
            onWaiveAnomaly={handleWaiveAnomaly}
            auditEvents={auditEvents}
          />
        )}

        {activeRole === 'ADMIN' && (
          <AdminDataHubView
            dataset={dataset}
            validationReport={validationReport}
            onRegenerate={handleRegenerate}
            isGenerating={isGenerating}
          />
        )}
      </main>

      {/* Switch User / Account Details Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => {
          handleLoginSuccess(user);
          setIsAuthModalOpen(false);
        }}
        onRegister={handleRegister}
        registeredUsers={registeredUsers}
      />

      {/* Quiet Clean Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-4 text-xs text-slate-400 bg-slate-950/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">EquiBalance India Demat Engine</span>
            <span>·</span>
            <span>Currency: INR (₹)</span>
            <span>·</span>
            <span>Logged in as: <span className="text-cyan-400 font-mono">{currentUser.name} ({currentUser.role})</span></span>
            <span>·</span>
            <span className="font-mono text-cyan-400">Seed: {dataset.summary.seed}</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-slate-400">
            <span>Checksum: {dataset.summary.checksum}</span>
            <span>·</span>
            <span>{dataset.portfolios.length} Portfolios Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
