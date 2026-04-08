import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { View } from "react-native";
import {
  AppButton,
  AppCard,
  AppScreen,
  LoadingCard,
  MessageBanner,
  SectionHeader,
  StatRow,
} from "@/components/AppUI";
import { ApiError, getReadableErrorMessage, getEmpresaColetas, getSolicitacoes } from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { resolveAccessToken } from "@/lib/session";

export default function EmpresaHomeScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession, signOut, user } =
    useProtectedRoute(["empresa"]);

  const disponiveisQuery = useQuery({
    queryKey: ["empresa", "disponiveis"],
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

  const coletasQuery = useQuery({
    queryKey: ["empresa", "coletas"],
    enabled: hasAccess && !isLoading,
    queryFn: async () => {
      const token = await resolveAccessToken(accessToken, refreshSession);
      if (!token) throw new Error("Sua sessao expirou. Entre novamente.");

      try {
        return await getEmpresaColetas(token);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
        const refreshed = await refreshSession();
        if (!refreshed) throw new Error("Sua sessao expirou. Entre novamente.");
        return getEmpresaColetas(refreshed);
      }
    },
  });

  if (isLoading || !hasAccess || !user) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando painel da empresa..." />
      </AppScreen>
    );
  }

  const disponiveis = disponiveisQuery.data ?? [];
  const coletas = coletasQuery.data ?? [];
  const ativas = coletas.filter(
    (item) => item.status !== "concluida" && item.status !== "cancelada"
  ).length;
  const concluidas = coletas.filter((item) => item.status === "concluida").length;

  return (
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow="PAINEL DA EMPRESA"
          title={user.name}
          description="Aceite solicitacoes aprovadas, acompanhe o status operacional e converse com o solicitante."
        />
      </AppCard>

      {(disponiveisQuery.error || coletasQuery.error) && (
        <MessageBanner
          message={getReadableErrorMessage(
            disponiveisQuery.error ?? coletasQuery.error,
            "Nao foi possivel carregar o painel da empresa."
          )}
          tone="error"
        />
      )}

      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        <StatRow label="Disponiveis" value={disponiveis.length} />
        <StatRow label="Em andamento" value={ativas} />
        <StatRow label="Concluidas" value={concluidas} />
        <StatRow label="Total" value={coletas.length} />
      </View>

      <AppCard>
        <AppButton
          label="Solicitacoes disponiveis"
          onPress={() => router.push("/empresa/solicitacoes")}
        />
        <AppButton
          label="Minhas coletas"
          tone="secondary"
          onPress={() => router.push("/empresa/coletas" as any)}
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
    </AppScreen>
  );
}
