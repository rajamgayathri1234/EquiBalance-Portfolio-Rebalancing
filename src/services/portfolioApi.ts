import { UserPortfolio, UserHolding, UserTargetAllocation, UserPortfolioInfo, UserInvestorInfo } from '../types/userPortfolio';
import { authApi } from './api';

export interface SavePortfolioPayload {
  investorInfo: UserInvestorInfo;
  portfolioInfo: UserPortfolioInfo;
  holdings: UserHolding[];
  targetAllocation: UserTargetAllocation;
}

export const portfolioApi = {
  getStorageKey(userId: string): string {
    return `equibalance_portfolio_${userId}`;
  },

  async getPortfolio(userId?: string): Promise<{ success: boolean; portfolio: UserPortfolio | null; error?: string }> {
    const token = authApi.getToken();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (userId) headers['x-user-id'] = userId;

      const res = await fetch('/api/portfolio', {
        method: 'GET',
        headers
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.portfolio) {
          if (userId) {
            localStorage.setItem(this.getStorageKey(userId), JSON.stringify(data.portfolio));
          }
          return { success: true, portfolio: data.portfolio };
        } else if (data.success && !data.portfolio) {
          // Check local cache
          if (userId) {
            const cached = localStorage.getItem(this.getStorageKey(userId));
            if (cached) {
              return { success: true, portfolio: JSON.parse(cached) };
            }
          }
          return { success: true, portfolio: null };
        }
      }
    } catch (err) {
      console.warn('Network fetch error for portfolio, checking local backup:', err);
    }

    // Local storage fallback for resilience
    if (userId) {
      try {
        const cached = localStorage.getItem(this.getStorageKey(userId));
        if (cached) {
          return { success: true, portfolio: JSON.parse(cached) };
        }
      } catch (e) {
        // ignore
      }
    }

    return { success: true, portfolio: null };
  },

  async savePortfolio(payload: SavePortfolioPayload, userId?: string): Promise<{ success: boolean; portfolio?: UserPortfolio; error?: string }> {
    const token = authApi.getToken();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (userId) headers['x-user-id'] = userId;

      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success && data.portfolio) {
        if (userId) {
          localStorage.setItem(this.getStorageKey(userId), JSON.stringify(data.portfolio));
        }
        return { success: true, portfolio: data.portfolio };
      }

      return {
        success: false,
        error: data.error || 'Failed to save portfolio.'
      };
    } catch (err: any) {
      // If server unreachable, save locally as fallback
      if (userId) {
        const localPortfolio: UserPortfolio = {
          id: `UP-${userId}`,
          userId,
          investorInfo: payload.investorInfo,
          portfolioInfo: payload.portfolioInfo,
          holdings: payload.holdings,
          targetAllocation: payload.targetAllocation,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          history: [
            {
              id: `HIST-${Date.now()}`,
              timestamp: new Date().toISOString(),
              action: 'INITIAL_CREATION',
              totalValue: payload.holdings.reduce((s, h) => s + h.quantity * h.currentMarketPrice, 0) + payload.portfolioInfo.availableCashAmount,
              holdingsCount: payload.holdings.length,
              driftMaxPct: 0,
              description: 'Initial portfolio saved locally.',
              snapshot: {
                portfolioInfo: payload.portfolioInfo,
                holdings: payload.holdings,
                targetAllocation: payload.targetAllocation
              }
            }
          ]
        };
        localStorage.setItem(this.getStorageKey(userId), JSON.stringify(localPortfolio));
        return { success: true, portfolio: localPortfolio };
      }
      return { success: false, error: 'Could not connect to portfolio server.' };
    }
  },

  async executeRebalance(trades: any[], userId?: string): Promise<{ success: boolean; portfolio?: UserPortfolio; error?: string }> {
    const token = authApi.getToken();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (userId) headers['x-user-id'] = userId;

      const res = await fetch('/api/portfolio/execute-rebalance', {
        method: 'POST',
        headers,
        body: JSON.stringify({ trades })
      });

      const data = await res.json();
      if (res.ok && data.success && data.portfolio) {
        if (userId) {
          localStorage.setItem(this.getStorageKey(userId), JSON.stringify(data.portfolio));
        }
        return { success: true, portfolio: data.portfolio };
      }

      return { success: false, error: data.error || 'Failed to execute rebalance.' };
    } catch (err: any) {
      return { success: false, error: 'Network error communicating with portfolio engine.' };
    }
  },

  async getHistory(userId?: string): Promise<{ success: boolean; history: any[] }> {
    const token = authApi.getToken();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (userId) headers['x-user-id'] = userId;

      const res = await fetch('/api/portfolio/history', {
        method: 'GET',
        headers
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, history: data.history || [] };
      }
    } catch (err) {
      console.warn('Failed to fetch history from server:', err);
    }
    return { success: true, history: [] };
  }
};
