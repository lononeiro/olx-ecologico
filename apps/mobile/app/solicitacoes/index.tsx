import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Text } from "react-native";
import {
  AppButton,
  AppCard,
  AppScreen,
  EmptyState,
  LoadingCard,
  MessageBanner,
  SectionHeader,
  StatusBadge,
} from "@/components/AppUI";
import { getReadableErrorMessage, getSolicitacoes } from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";

export default function SolicitacoesListScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession } =
    useProtectedRoute(["usuario"]);

  const query = useQuery({
    queryKey: ["solicitacoes", "list"],
    enabled: hasAccess && !isLoading,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) => getSolicitacoes(token)),
  });

  return (
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow="MINHAS SOLICITACOES"
          title="Historico completo"
          description="Acompanhe aprovacoes, aceite de empresa, andamento da coleta e conversa vinculada."
        />
        <AppButton label="Nova solicitacao" onPress={() => router.push("/solicitacoes/new")} />
      </AppCard>

      {query.isLoading && <LoadingCard text="Carregando solicitacoes..." />}
      {query.error && (
        <MessageBanner
          message={getReadableErrorMessage(query.error, "Nao foi possivel carregar as solicitacoes.")}
          tone="error"
        />
      )}

      {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="Nenhuma solicitacao criada"
          description="Crie sua primeira solicitacao e acompanhe tudo por aqui."
        />
      ) : null}

      {query.data?.map((item) => (
        <AppCard key={item.id}>
          <SectionHeader title={item.titulo} description={item.material.nome} />
          <StatusBadge kind="solicitacao" value={item.status} />
          <Text style={{ color: "#537156", lineHeight: 22 }}>
            {item.quantidade} - {new Date(item.createdAt).toLocaleDateString("pt-BR")}
          </Text>
          <Text style={{ color: "#537156", lineHeight: 22 }}>{item.endereco}</Text>
          <AppButton
            label="Ver detalhes"
            tone="secondary"
            onPress={() => router.push(`/solicitacoes/${item.id}` as any)}
          />
        </AppCard>
      ))}
    </AppScreen>
  );
}
