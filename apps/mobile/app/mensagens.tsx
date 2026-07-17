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
import { getReadableErrorMessage, getSolicitacoes } from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";
import { USUARIO_TABS } from "@/lib/tabs";

export default function MensagensScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession } =
    useProtectedRoute(["usuario"]);
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["solicitacoes", "usuario"],
    enabled: hasAccess && !isLoading,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) => getSolicitacoes(token)),
  });

  const conversations = useMemo(() => {
    const items = query.data ?? [];
    return items.filter(
      (item) => !!item.coleta || item.status === "aprovada"
    );
  }, [query.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter(
      (item) =>
        item.titulo.toLowerCase().includes(term) ||
        item.material.nome.toLowerCase().includes(term) ||
        item.coleta?.company.user.nome.toLowerCase().includes(term)
    );
  }, [conversations, search]);

  return (
    <AppScreen
      footer={<BottomNavigation items={USUARIO_TABS} activeKey="mensagens" />}
    >
      <SectionHeader eyebrow="CONVERSAS" title="Mensagens" />

      <Field
        label="Buscar"
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por título, material ou empresa"
      />

      {query.isLoading && <LoadingCard text="Carregando conversas..." />}
      {query.error && (
        <MessageBanner
          message={getReadableErrorMessage(
            query.error,
            "Não foi possível carregar as conversas."
          )}
          tone="error"
        />
      )}

      {!query.isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Nenhuma conversa ainda"
          description="Quando uma empresa demonstrar interesse ou aceitar sua solicitação, a conversa aparece aqui."
        />
      ) : (
        <AppCard>
          {filtered.map((item) => (
            <MobileListItem
              key={item.id}
              icon={item.coleta ? MessageCircle : Clock}
              tone="primary"
              title={item.titulo}
              subtitle={
                item.coleta
                  ? item.coleta.company.user.nome
                  : "Aguardando conversa com empresas interessadas"
              }
              meta={item.coleta ? item.coleta.status : item.status}
              onPress={() => router.push(`/solicitacoes/${item.id}` as any)}
            />
          ))}
        </AppCard>
      )}
    </AppScreen>
  );
}
