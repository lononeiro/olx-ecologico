import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MobileAuthResponse } from "@shared";
import { loginMobile, refreshMobileSession } from "@/lib/api";
import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  saveAuthSession,
  saveStoredUser,
} from "@/lib/auth-storage";

type SessionUser = MobileAuthResponse["user"];

type AuthContextValue = {
  isLoading: boolean;
  user: SessionUser | null;
  accessToken: string | null;
  signIn: (email: string, senha: string) => Promise<SessionUser>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  updateUser: (nextUser: SessionUser) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const applySession = useCallback(async (session: MobileAuthResponse) => {
    await saveAuthSession(session);
    setUser(session.user);
    setAccessToken(session.accessToken);
  }, []);

  const signOut = useCallback(async () => {
    await clearAuthSession();
    setUser(null);
    setAccessToken(null);
  }, []);

  const updateUser = useCallback(async (nextUser: SessionUser) => {
    await saveStoredUser(nextUser);
    setUser(nextUser);
  }, []);

  const refreshSession = useCallback(async () => {
    const refreshToken = await getStoredRefreshToken();
    if (!refreshToken) {
      await signOut();
      return null;
    }

    try {
      const session = await refreshMobileSession(refreshToken);
      await applySession(session);
      return session.accessToken;
    } catch {
      await signOut();
      return null;
    }
  }, [applySession, signOut]);

  const signIn = useCallback(
    async (email: string, senha: string) => {
      const session = await loginMobile(email, senha);
      await applySession(session);
      return session.user;
    },
    [applySession]
  );

  useEffect(() => {
    let active = true;

    const restore = async () => {
      try {
        const [storedUser, storedAccessToken] = await Promise.all([
          getStoredUser(),
          getStoredAccessToken(),
        ]);

        if (!active) return;

        if (storedUser && storedAccessToken) {
          setUser(storedUser);
          setAccessToken(storedAccessToken);
        } else {
          await refreshSession();
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void restore();

    return () => {
      active = false;
    };
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      user,
      accessToken,
      signIn,
      signOut,
      refreshSession,
      updateUser,
    }),
    [accessToken, isLoading, refreshSession, signIn, signOut, updateUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa estar dentro de AuthProvider");
  }

  return context;
}
