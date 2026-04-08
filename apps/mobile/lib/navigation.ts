import { useEffect } from "react";
import { router } from "expo-router";
import type { MobileAuthResponse } from "@shared";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = MobileAuthResponse["user"]["role"];

export function getHomeRouteForRole(role: AppRole) {
  if (role === "empresa") return "/empresa" as any;
  if (role === "admin") return "/admin" as any;
  return "/home" as any;
}

export function useProtectedRoute(roles?: AppRole[]) {
  const auth = useAuth();

  useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.user) {
      router.replace("/login");
      return;
    }

    if (roles && !roles.includes(auth.user.role)) {
      router.replace(getHomeRouteForRole(auth.user.role));
    }
  }, [auth.isLoading, auth.user, roles]);

  const hasAccess =
    !!auth.user && (!roles || roles.includes(auth.user.role));

  return {
    ...auth,
    hasAccess,
  };
}
