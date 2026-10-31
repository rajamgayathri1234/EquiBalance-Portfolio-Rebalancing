import { UserAccount, UserRole, PortfolioType } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  panNumber?: string;
  portfolioType?: PortfolioType;
  privilegedKey?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: UserAccount;
  error?: string;
}

const TOKEN_KEY = 'equibalance_auth_token';
const CURRENT_USER_KEY = 'equibalance_current_user';

export const authApi = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },

  clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch {
      // ignore
    }
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      console.warn('Network API registration fallback:', err);
      return {
        success: false,
        error: 'Unable to reach authentication server. Please check your network connection.'
      };
    }
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success && data.token) {
        this.setToken(data.token);
        if (data.user) {
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
        }
      }
      return data;
    } catch (err: any) {
      console.warn('Network API login fallback:', err);
      return {
        success: false,
        error: 'Unable to reach authentication server. Please verify dev server is running.'
      };
    }
  },

  async getCurrentUser(): Promise<UserAccount | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        this.clearToken();
        return null;
      }
      const data = await response.json();
      return data.user || null;
    } catch (err) {
      // Return cached user if offline
      try {
        const cached = localStorage.getItem(CURRENT_USER_KEY);
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.warn('Logout request failed:', err);
      }
    }
    this.clearToken();
  },

  async forgotPassword(email: string, newPassword?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Failed to dispatch password reset request.' };
    }
  }
};
