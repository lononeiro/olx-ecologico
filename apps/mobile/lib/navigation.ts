import { useEffect } from "react";
import { router } from "expo-router";
import type { MobileAuthResponse } from "@shared";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = MobileAuthResponse["user"]["role"];

export function getHomeRouteForRole(role: AppRole) {
  if (role === "empresa") return "/empresa" as any;
  return "/home" as any;
}

export function useProtectedRoute(roles?: AppRole[]) {
  const auth = useAuth();
  // `roles` costuma ser passado como array literal (ex.: ["usuario"]), que é
  // recriado a cada render do componente chamador. Usar esse array direto
  // como dependência do efeito faz o React tratá-lo como "mudou" sempre,
  // reexecutando o redirecionamento em TODA renderização — inclusive nas
  // causadas por refetchInterval de outras queries da tela. Isso podia
  // disparar um router.replace() para a Home no meio de uma navegação para
  // outra tela (ex.: ao abrir o Perfil). Uma chave estável evita isso.
  const rolesKey = roles?.join(",") ?? "";

  useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.user) {
      router.replace("/login");
      return;
    }

    if (roles && !roles.includes(auth.user.role)) {
      router.replace(getHomeRouteForRole(auth.user.role));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isLoading, auth.user, rolesKey]);

  const hasAccess =
    !!auth.user && (!roles || roles.includes(auth.user.role));

  return {
    ...auth,
    hasAccess,
  };
}
