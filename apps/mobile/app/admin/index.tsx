import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";
import {
  AppButton,
  AppCard,
  AppScreen,
  EmptyState,
  LoadingCard,
  MessageBanner,
  SectionHeader,
  StatRow,
} from "@/components/AppUI";
import { ApiError, getReadableErrorMessage, getSolicitacoes } from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { resolveAccessToken } from "@/lib/session";

export default function AdminHomeScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession, signOut } =
    useProtectedRoute(["admin"]);

  const solicitacoesQuery = useQuery({
    queryKey: ["admin", "solicitacoes"],
    enabled: hasAccess && !isLoading,
    queryFn: async () => {
      const token = await resolveAccessToken(accessToken, refreshSession);
      if (!token) throw new Error("Sua sessao expirou. Entre novamente.");

      try {
        return await getSolicitacoes(token);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
        const refreshed = await refreshSession();
        if (!refreshed) throw new Error("Sua sessao expirou. Entre novamente.");
        return getSolicitacoes(refreshed);
      }
    },
  });

  if (isLoading || !hasAccess) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando painel administrativo..." />
      </AppScreen>
    );
  }

  const queue = solicitacoesQuery.data ?? [];
  const pendentes = queue.filter((item) => item.status === "pendente").length;
  const rejeitadas = queue.filter((item) => item.status === "rejeitada").length;
  const naoAceitas = queue.filter(
    (item) => item.status === "aprovada" && !item.coleta
  ).length;

  return (
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow="ADMIN"
          title="Fila operacional"
          description="Acompanhe solicitacoes pendentes, fora do prazo, rejeitadas ou aprovadas sem aceite."
        />
      </AppCard>

      {solicitacoesQuery.error && (
        <MessageBanner
          message={getReadableErrorMessage(
            solicitacoesQuery.error,
            "Nao foi possivel carregar a fila administrativa."
          )}
          tone="error"
        />
      )}

      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        <StatRow label="Fila" value={queue.length} />
        <StatRow label="Pendentes" value={pendentes} />
        <StatRow label="Nao aceitas" value={naoAceitas} />
        <StatRow label="Rejeitadas" value={rejeitadas} />
      </View>

      <AppCard>
        <AppButton
          label="Ver fila administrativa"
          onPress={() => router.push("/admin/solicitacoes")}
        />
        <AppButton
          label="Meu perfil"
          tone="secondary"
          onPress={() => router.push("/me")}
        />
        <AppButton
          label="Sair"
          tone="danger"
          onPress={async () => {
            await signOut();
            router.replace("/login");
          }}
        />
      </AppCard>

      {!solicitacoesQuery.isLoading && queue.length === 0 ? (
        <EmptyState
          title="Tudo em dia"
          description="Nao ha solicitacoes em acompanhamento agora."
        />
      ) : null}
    </AppScreen>
  );
}
