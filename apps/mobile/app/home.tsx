import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
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
import { useProtectedRoute } from "@/lib/navigation";
import { ApiError, getReadableErrorMessage, getSolicitacoes } from "@/lib/api";
import { resolveAccessToken } from "@/lib/session";

export default function HomeScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession, signOut, user } =
    useProtectedRoute(["usuario"]);

  const solicitacoesQuery = useQuery({
    queryKey: ["solicitacoes", "usuario"],
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

  if (isLoading || !hasAccess || !user) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando seu painel..." />
      </AppScreen>
    );
  }

  const solicitacoes = solicitacoesQuery.data ?? [];
  const stats = {
    total: solicitacoes.length,
    pendentes: solicitacoes.filter((item) => item.status === "pendente").length,
    ativas: solicitacoes.filter(
      (item) =>
        item.coleta &&
        item.coleta.status !== "concluida" &&
        item.coleta.status !== "cancelada"
    ).length,
    concluidas: solicitacoes.filter(
      (item) => item.coleta?.status === "concluida"
    ).length,
  };

  return (
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow="PAINEL DO CIDADAO"
          title={`Ola, ${user.name.split(" ")[0]}`}
          description="Use este painel para criar solicitacoes, acompanhar aprovacoes e conversar com a empresa quando houver coleta."
        />
      </AppCard>

      {solicitacoesQuery.isLoading && <LoadingCard text="Carregando solicitacoes..." />}
      {solicitacoesQuery.error && (
        <MessageBanner
          message={getReadableErrorMessage(
            solicitacoesQuery.error,
            "Nao foi possivel carregar o painel."
          )}
          tone="error"
        />
      )}

      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        <StatRow label="Total" value={stats.total} />
        <StatRow label="Pendentes" value={stats.pendentes} />
        <StatRow label="Em andamento" value={stats.ativas} />
        <StatRow label="Concluidas" value={stats.concluidas} />
      </View>

      <AppCard>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#122114" }}>
          Acoes rapidas
        </Text>
        <AppButton
          label="Nova solicitacao"
          onPress={() => router.push("/solicitacoes/new")}
        />
        <AppButton
          label="Minhas solicitacoes"
          tone="secondary"
          onPress={() => router.push("/solicitacoes" as any)}
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

      {!solicitacoesQuery.isLoading && solicitacoes.length === 0 ? (
        <EmptyState
          title="Nenhuma solicitacao ainda"
          description="Crie sua primeira solicitacao de coleta para iniciar o fluxo."
        />
      ) : (
        solicitacoes.slice(0, 3).map((item) => (
          <AppCard key={item.id}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#122114" }}>
              {item.titulo}
            </Text>
            <Text style={{ color: "#537156" }}>{item.material.nome}</Text>
            <Text style={{ color: "#537156", lineHeight: 22 }}>
            {item.quantidade} - {new Date(item.createdAt).toLocaleDateString("pt-BR")}
            </Text>
            <AppButton
              label="Ver detalhes"
              tone="secondary"
              onPress={() => router.push(`/solicitacoes/${item.id}` as any)}
            />
          </AppCard>
        ))
      )}
    </AppScreen>
  );
}
