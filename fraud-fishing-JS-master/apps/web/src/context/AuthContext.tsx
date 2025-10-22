import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";

type Tokens = { accessToken: string; refreshToken: string; };
type AuthContextType = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  tryRefreshToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehidratar
  useEffect(() => {
    const a = localStorage.getItem("accessToken");
    const r = localStorage.getItem("refreshToken");
    if (a && r) {
      setAccessToken(a);
      setRefreshToken(r);
    }
    setLoading(false);
  }, []);

  const setTokens = useCallback((t: Tokens) => {
    setAccessToken(t.accessToken);
    setRefreshToken(t.refreshToken);
    localStorage.setItem("accessToken", t.accessToken);
    localStorage.setItem("refreshToken", t.refreshToken);
  }, []);

  const clearTokens = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    if (res.status < 200 || res.status >= 300) throw new Error("Login failed");

    // Tu endpoint devuelve { accessToken, refreshToken, user } :contentReference[oaicite:6]{index=6}
    setTokens({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken });
  }, [setTokens]);

  const tryRefreshToken = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) return false;
    try {
      const { data, status } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
      if (status === 200 && data?.accessToken) {
        setTokens({ accessToken: data.accessToken, refreshToken: refreshToken });
        return true;
      }
      clearTokens();
      return false;
    } catch {
      clearTokens();
      return false;
    }
  }, [refreshToken, setTokens, clearTokens]);

  const logout = useCallback(() => {
    clearTokens();
  }, [clearTokens]);

  const value = useMemo(() => ({
    accessToken,
    refreshToken,
    isAuthenticated: Boolean(accessToken),
    loading,
    login,
    logout,
    tryRefreshToken
  }), [accessToken, refreshToken, loading, login, logout, tryRefreshToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
