import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiUser, setToken, getToken } from "@/lib/api";

type AuthState = {
  user: ApiUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await api.me();
        setUser({ id: me.user.sub, username: me.user.username, role: me.user.role });
      } catch {
        setToken(null);
        setTokenState(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      loading,
      login: async (username: string, password: string) => {
        const res = await api.login(username, password);
        setToken(res.token);
        setTokenState(res.token);
        setUser(res.user);
      },
      logout: () => {
        setToken(null);
        setTokenState(null);
        setUser(null);
      },
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
