import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, MessageCircle } from "lucide-react-native";
import {
  AppCard,
  AppScreen,
  BottomNavigation,
  EmptyState,
  LoadingCard,
  MessageBanner,
  MobileListItem,
  SectionHeader,
} from "@/components/AppUI";
import { Field } from "@/components/ui/Field";
import {
  getEmpresaColetas,
  getEmpresaSolicitacoesDisponiveis,
  getReadableErrorMessage,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";
import { EMPRESA_TABS } from "@/lib/tabs";

export default function EmpresaMensagensScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession } =
    useProtectedRoute(["empresa"]);
  const [search, setSearch] = useState("");

  const coletasQuery = useQuery({
    queryKey: ["empresa", "coletas"],
    enabled: hasAccess && !isLoading,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) => getEmpresaColetas(token)),
  });

  const disponiveisQuery = useQuery({
    queryKey: ["empresa", "disponiveis"],
    enabled: hasAccess && !isLoading,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        getEmpresaSolicitacoesDisponiveis(token)
      ),
  });

  const conversations = useMemo(() => {
    const coletas = (coletasQuery.data ?? []).map((item) => ({
      key: `coleta-${item.id}`,
      title: item.solicitacao.titulo,
      subtitle: item.solicitacao.user?.nome ?? item.solicitacao.material.nome,
      meta: item.status,
      active: true,
      onPress: () => router.push(`/empresa/coletas/${item.id}` as any),
    }));

    const disponiveis = (disponiveisQuery.data ?? []).map((item) => ({
      key: `solicitacao-${item.id}`,
      title: item.titulo,
      subtitle: item.user?.nome ?? item.material.nome,
      meta: item.status,
      active: false,
      onPress: () =>
        router.push(`/empresa/solicitacoes/${item.id}/conversa` as any),
    }));

    return [...coletas, ...disponiveis];
  }, [coletasQuery.data, disponiveisQuery.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.subtitle.toLowerCase().includes(term)
    );
  }, [conversations, search]);

  const error = coletasQuery.error ?? disponiveisQuery.error;
  const isLoadingConversations = coletasQuery.isLoading || disponiveisQuery.isLoading;

  return (
    <AppScreen
      footer={<BottomNavigation items={EMPRESA_TABS} activeKey="mensagens" />}
    >
      <SectionHeader eyebrow="CONVERSAS" title="Mensagens" />

      <Field
        label="Buscar"
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por título ou solicitante"
      />

      {isLoadingConversations && <LoadingCard text="Carregando conversas..." />}
      {error && (
        <MessageBanner
          message={getReadableErrorMessage(
            error,
            "Não foi possível carregar as conversas."
          )}
          tone="error"
        />
      )}

      {!isLoadingConversations && filtered.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Nenhuma conversa ainda"
          description="Conversas com solicitantes e coletas ativas aparecem aqui."
        />
      ) : (
        <AppCard>
          {filtered.map((item) => (
            <MobileListItem
              key={item.key}
              icon={item.active ? MessageCircle : Clock}
              tone="primary"
              title={item.title}
              subtitle={item.subtitle}
              meta={item.meta}
              onPress={item.onPress}
            />
          ))}
        </AppCard>
      )}
    </AppScreen>
  );
}
