import { UserAccount, UserRole } from '../types';

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  token?: string;
  user?: UserAccount;
}

const TOKEN_KEY = 'equibalance_auth_token';
const USER_KEY = 'equibalance_auth_user';

export const authService = {
  // Get stored session token
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  // Save session token
  setToken(token: string, rememberMe: boolean = false) {
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  // Clear session
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  // Register new user on backend
  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
    panNumber?: string;
    adminCode?: string;
  }): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: json.error || 'Registration failed. Please check your details.'
        };
      }

      return json;
    } catch (err: any) {
      return {
        success: false,
        error: 'Network error or server unreachable. Please try again.'
      };
    }
  },

  // Login existing user on backend
  async login(
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, rememberMe })
      });

      const json = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: json.error || 'Invalid email or password.'
        };
      }

      if (json.token) {
        this.setToken(json.token, rememberMe);
      }

      return json;
    } catch (err: any) {
      return {
        success: false,
        error: 'Unable to connect to authentication server. Please check your connection.'
      };
    }
  },

  // Verify current session
  async getCurrentUser(): Promise<UserAccount | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        this.clearSession();
        return null;
      }

      const json = await res.json();
      return json.user || null;
    } catch (err) {
      return null;
    }
  },

  // Logout
  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (err) {
        // Silently clear local session even if offline
      }
    }
    this.clearSession();
  },

  // Forgot password
  async forgotPassword(email: string, newPassword?: string): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, newPassword })
      });

      const json = await res.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: 'Network error processing password reset.'
      };
    }
  }
};
