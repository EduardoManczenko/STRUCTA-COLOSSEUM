"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiGet, auth, ApiError } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refetch: () => Promise<void>;
  signOut: () => void;
  setUser: (u: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const token = auth.getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      // apiGet already retries network failures + cold starts (timeout 25s).
      const me = await apiGet<{ user: AuthUser }>("/auth/me");
      setUser(me.user);
    } catch (err) {
      // ONLY clear the session for explicit auth failures (401/403). Network
      // failures, cold starts and 5xx must NOT log the user out — that was
      // the cause of "server is starting up" leading to a forced logout.
      if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        auth.setToken(null);
        setUser(null);
      } else {
        // Keep the token, but mark user as unknown so guarded routes can
        // still wait. Subsequent navigations will retry naturally.
        if (process.env.NODE_ENV !== "production") {
          console.info("[auth] session refetch deferred:", err);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const signOut = useCallback(() => {
    auth.setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refetch, signOut, setUser }),
    [user, loading, refetch, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
