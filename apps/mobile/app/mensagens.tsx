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
  SectionHeader,
} from "@/components/AppUI";
import { STATUS_COLETA_LABEL, STATUS_SOLICITACAO_LABEL } from "@shared";
import { ConversaListItem } from "@/components/ConversaListItem";
import { Field } from "@/components/ui/Field";
import {
  getMensagensInbox,
  getReadableErrorMessage,
  getSolicitacoes,
} from "@/lib/api";
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

  const inboxQuery = useQuery({
    queryKey: ["mensagens", "inbox"],
    enabled: hasAccess && !isLoading,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        getMensagensInbox(token)
      ),
  });

  // Última mensagem por solicitação (texto + data), para a prévia sob o título
  // e para ordenar a lista pelas conversas mais recentes.
  const lastBySolicitacao = useMemo(() => {
    const mapa = new Map<number, { message: string; at: number }>();
    for (const conversa of inboxQuery.data ?? []) {
      if (!conversa.lastMessage) continue;
      const sid = solicitacaoIdFromHref(conversa.detailHref);
      if (sid == null) continue;
      const at = conversa.lastMessageAt
        ? new Date(conversa.lastMessageAt).getTime()
        : 0;
      const atual = mapa.get(sid);
      if (!atual || at > atual.at) mapa.set(sid, { message: conversa.lastMessage, at });
    }
    return mapa;
  }, [inboxQuery.data]);

  // Só aparecem solicitações que realmente tiveram alguma mensagem, ordenadas
  // pela última mensagem recebida/enviada (mais recente primeiro).
  const conversations = useMemo(() => {
    const items = query.data ?? [];
    return items
      .filter((item) => lastBySolicitacao.has(item.id))
      .sort(
        (a, b) =>
          (lastBySolicitacao.get(b.id)?.at ?? 0) -
          (lastBySolicitacao.get(a.id)?.at ?? 0)
      );
  }, [query.data, lastBySolicitacao]);

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
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
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
            <ConversaListItem
              key={item.id}
              icon={item.coleta ? MessageCircle : Clock}
              title={item.titulo}
              preview={lastBySolicitacao.get(item.id)?.message ?? ""}
              statusLabel={
                item.coleta
                  ? STATUS_COLETA_LABEL[item.coleta.status] ?? item.coleta.status
                  : STATUS_SOLICITACAO_LABEL[item.status] ?? item.status
              }
              onPress={() =>
                router.push(`/solicitacoes/${item.id}/conversa` as any)
              }
            />
          ))}
        </AppCard>
      )}
    </AppScreen>
  );
}

/** Extrai o id da solicitação de um detailHref do inbox (ex: .../solicitacoes/42/...). */
function solicitacaoIdFromHref(href: string): number | null {
  const match = href.match(/solicitacoes\/(\d+)/);
  return match ? Number(match[1]) : null;
}
