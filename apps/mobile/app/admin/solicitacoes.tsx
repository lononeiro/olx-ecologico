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

export default function AdminSolicitacoesScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession } =
    useProtectedRoute(["admin"]);

  const query = useQuery({
    queryKey: ["admin", "queue"],
    enabled: hasAccess && !isLoading,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) => getSolicitacoes(token)),
  });

  return (
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow="ADMIN"
          title="Fila administrativa"
          description="Solicitacoes pendentes, rejeitadas, fora do prazo ou aprovadas sem aceite ficam aqui."
        />
      </AppCard>

      {query.isLoading && <LoadingCard text="Carregando fila administrativa..." />}
      {query.error && (
        <MessageBanner
          message={getReadableErrorMessage(query.error, "Nao foi possivel carregar a fila administrativa.")}
          tone="error"
        />
      )}

      {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="Tudo em dia"
          description="Nao ha solicitacoes exigindo acompanhamento agora."
        />
      ) : null}

      {query.data?.map((item) => (
        <AppCard key={item.id}>
          <SectionHeader title={item.titulo} description={item.user?.nome ?? item.material.nome} />
          <StatusBadge kind="solicitacao" value={item.status} />
          <Text style={{ color: "#537156", lineHeight: 22 }}>{item.endereco}</Text>
          <Text style={{ color: "#537156", lineHeight: 22 }}>{item.descricao}</Text>
          <AppButton
            label="Ver detalhes"
            tone="secondary"
            onPress={() => router.push(`/admin/solicitacoes/${item.id}` as any)}
          />
        </AppCard>
      ))}
    </AppScreen>
  );
}
