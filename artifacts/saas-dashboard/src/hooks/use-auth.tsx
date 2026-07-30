/**
 * AuthContext — minimal auth state for the dashboard.
 *
 * Stores access + refresh tokens in localStorage.
 * Login calls POST /api/v1/auth/login; logout calls POST /api/v1/auth/logout,
 * then clears tokens and redirects to /login.
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface AuthUser {
  name: string;
  email: string;
  role: string;
  initials: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'dashboard_auth';

function loadFromStorage(): { accessToken: string; refreshToken: string; user: AuthUser } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(data: { accessToken: string; refreshToken: string; user: AuthUser }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

function buildUser(data: {
  accessToken: string;
  user?: { name?: string; email?: string; role?: string };
  email?: string;
}): AuthUser {
  const name = data.user?.name ?? data.email ?? 'Usuário';
  const email = data.user?.email ?? data.email ?? '';
  const role = data.user?.role ?? 'member';
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return { name, email, role, initials };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = loadFromStorage();
  const [state, setState] = useState<AuthState>({
    user: stored?.user ?? null,
    accessToken: stored?.accessToken ?? null,
    isAuthenticated: !!stored?.accessToken,
  });

  // Expose access token for API calls that need auth
  useEffect(() => {
    if (state.accessToken) {
      // Nothing to do — dashboard compat routes are @Public()
    }
  }, [state.accessToken]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message ?? 'Credenciais inválidas');
    }

    const data = await res.json();
    const user = buildUser({ ...data, email });
    saveToStorage({ accessToken: data.accessToken, refreshToken: data.refreshToken, user });
    setState({ user, accessToken: data.accessToken, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    if (state.accessToken) {
      // Best-effort server-side logout
      fetch(`${BASE}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.accessToken}` },
      }).catch(() => {});
    }
    clearStorage();
    setState({ user: null, accessToken: null, isAuthenticated: false });
  }, [state.accessToken]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
