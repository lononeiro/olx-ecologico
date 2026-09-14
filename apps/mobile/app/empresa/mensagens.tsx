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
  getEmpresaColetas,
  getEmpresaSolicitacoesDisponiveis,
  getMensagensInbox,
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

  const inboxQuery = useQuery({
    queryKey: ["mensagens", "inbox"],
    enabled: hasAccess && !isLoading,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        getMensagensInbox(token)
      ),
  });

  const conversations = useMemo(() => {
    // Última mensagem por coleta / solicitação, para prévia sob o título.
    const lastByColeta = new Map<number, string>();
    const lastBySolicitacao = new Map<number, string>();
    for (const conversa of inboxQuery.data ?? []) {
      if (!conversa.lastMessage) continue;
      if (conversa.type === "coleta") {
        if (!lastByColeta.has(conversa.dbId))
          lastByColeta.set(conversa.dbId, conversa.lastMessage);
      } else {
        const sid = solicitacaoIdFromHref(conversa.detailHref);
        if (sid != null && !lastBySolicitacao.has(sid))
          lastBySolicitacao.set(sid, conversa.lastMessage);
      }
    }

    // Só aparecem coletas/solicitações que realmente tiveram alguma mensagem.
    const coletas = (coletasQuery.data ?? [])
      .filter((item) => lastByColeta.has(item.id))
      .map((item) => ({
        key: `coleta-${item.id}`,
        title: item.solicitacao.titulo,
        preview: lastByColeta.get(item.id) ?? "",
        statusLabel: STATUS_COLETA_LABEL[item.status] ?? item.status,
        active: true,
        onPress: () => router.push(`/empresa/coletas/${item.id}` as any),
      }));

    const disponiveis = (disponiveisQuery.data ?? [])
      .filter((item) => lastBySolicitacao.has(item.id))
      .map((item) => ({
        key: `solicitacao-${item.id}`,
        title: item.titulo,
        preview: lastBySolicitacao.get(item.id) ?? "",
        statusLabel: STATUS_SOLICITACAO_LABEL[item.status] ?? item.status,
        active: false,
        onPress: () =>
          router.push(`/empresa/solicitacoes/${item.id}/conversa` as any),
      }));

    return [...coletas, ...disponiveis];
  }, [coletasQuery.data, disponiveisQuery.data, inboxQuery.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.preview.toLowerCase().includes(term)
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
            <ConversaListItem
              key={item.key}
              icon={item.active ? MessageCircle : Clock}
              title={item.title}
              preview={item.preview}
              statusLabel={item.statusLabel}
              onPress={item.onPress}
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
