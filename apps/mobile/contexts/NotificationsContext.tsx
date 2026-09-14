import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { withAutoRefresh } from "@/lib/session";
import {
  getNotificacoes,
  marcarNotificacoesLidas,
  registerPushToken,
  unregisterPushToken,
  type NotificacaoItem,
} from "@/lib/api";
import {
  mapearHrefParaRota,
  registrarListenersNotificacao,
  registrarParaPush,
} from "@/lib/push";

type NotificationsValue = {
  naoLidas: number;
  notificacoes: NotificacaoItem[];
  carregando: boolean;
  recarregar: () => void;
  marcarTodasLidas: () => Promise<void>;
  /** Remove o token deste device no servidor (chamar antes do logout). */
  desregistrarPush: () => Promise<void>;
};

const NotificationsCtx = createContext<NotificationsValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, refreshSession } = useAuth();
  const queryClient = useQueryClient();
  const pushTokenRef = useRef<string | null>(null);
  const autenticado = !!user;

  // Contador de não lidas + lista, com polling para o "tempo quase real".
  const query = useQuery({
    queryKey: ["notificacoes"],
    enabled: autenticado,
    refetchInterval: 15000,
    queryFn: () =>
      withAutoRefresh(accessToken, refreshSession, (t) => getNotificacoes(t)),
  });

  // Invalida os dados afetados por um evento para as telas recarregarem.
  const invalidarDados = useCallback(() => {
    // Prefix-match do react-query: ["empresa"] cobre ["empresa","coletas"], etc.
    queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    queryClient.invalidateQueries({ queryKey: ["empresa"] });
    queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
    queryClient.invalidateQueries({ queryKey: ["detail"] });
    queryClient.invalidateQueries({ queryKey: ["mensagens"] });
    queryClient.invalidateQueries({ queryKey: ["avaliacao"] });
  }, [queryClient]);

  // Registra o device para push ao autenticar e envia o token ao servidor.
  useEffect(() => {
    if (!autenticado) return;
    let ativo = true;

    (async () => {
      const token = await registrarParaPush();
      if (!ativo || !token) return;
      pushTokenRef.current = token;
      try {
        await withAutoRefresh(accessToken, refreshSession, (t) =>
          registerPushToken(t, token, Platform.OS)
        );
      } catch {
        // best-effort: sem token registrado o app ainda funciona (só sem push)
      }
    })();

    return () => {
      ativo = false;
    };
  }, [autenticado, accessToken, refreshSession]);

  // Listeners: chegada (atualiza dados) e toque (navega para o alvo).
  // No Expo Go a função é no-op (push remoto foi removido do SDK 53).
  useEffect(() => {
    return registrarListenersNotificacao({
      onRecebida: () => invalidarDados(),
      onToque: (href) => {
        const rota = mapearHrefParaRota(href);
        if (rota) router.push(rota as never);
      },
    });
  }, [invalidarDados]);

  const marcarTodasLidas = useCallback(async () => {
    try {
      await withAutoRefresh(accessToken, refreshSession, (t) =>
        marcarNotificacoesLidas(t)
      );
    } finally {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    }
  }, [accessToken, refreshSession, queryClient]);

  const desregistrarPush = useCallback(async () => {
    const token = pushTokenRef.current;
    if (!token) return;
    try {
      await withAutoRefresh(accessToken, refreshSession, (t) =>
        unregisterPushToken(t, token)
      );
    } catch {
      // ignore
    }
    pushTokenRef.current = null;
  }, [accessToken, refreshSession]);

  const value: NotificationsValue = {
    naoLidas: query.data?.naoLidas ?? 0,
    notificacoes: query.data?.notificacoes ?? [],
    carregando: query.isLoading,
    recarregar: () => {
      void query.refetch();
    },
    marcarTodasLidas,
    desregistrarPush,
  };

  return <NotificationsCtx.Provider value={value}>{children}</NotificationsCtx.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsCtx);
  if (!ctx) {
    throw new Error("useNotifications precisa estar dentro de NotificationsProvider");
  }
  return ctx;
}
