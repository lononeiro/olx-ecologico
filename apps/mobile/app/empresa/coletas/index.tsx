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
import { getEmpresaColetas, getReadableErrorMessage } from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";

export default function EmpresaColetasListScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession } =
    useProtectedRoute(["empresa"]);

  const query = useQuery({
    queryKey: ["empresa", "coletas", "list"],
    enabled: hasAccess && !isLoading,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) => getEmpresaColetas(token)),
  });

  return (
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow="EMPRESA"
          title="Minhas coletas"
          description="Gerencie o andamento das coletas aceitas e acompanhe a comunicacao com o solicitante."
        />
      </AppCard>

      {query.isLoading && <LoadingCard text="Carregando coletas..." />}
      {query.error && (
        <MessageBanner
          message={getReadableErrorMessage(query.error, "Nao foi possivel carregar as coletas.")}
          tone="error"
        />
      )}

      {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="Nenhuma coleta ainda"
          description="Aceite uma solicitacao para iniciar o fluxo operacional."
        />
      ) : null}

      {query.data?.map((item) => (
        <AppCard key={item.id}>
          <SectionHeader title={item.solicitacao.titulo} description={item.solicitacao.user?.nome} />
          <StatusBadge kind="coleta" value={item.status} />
          <Text style={{ color: "#537156", lineHeight: 22 }}>
            {item.solicitacao.material.nome} - {item.solicitacao.quantidade}
          </Text>
          <Text style={{ color: "#537156", lineHeight: 22 }}>{item.solicitacao.endereco}</Text>
          <AppButton
            label="Gerenciar coleta"
            tone="secondary"
            onPress={() => router.push(`/empresa/coletas/${item.id}` as any)}
          />
        </AppCard>
      ))}
    </AppScreen>
  );
}
