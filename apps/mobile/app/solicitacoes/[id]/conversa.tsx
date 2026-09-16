import { useMemo, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  AppButton,
  AppScreen,
  EmptyState,
  LoadingCard,
  MessageBanner,
  appColors,
} from "@/components/AppUI";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatThread } from "@/components/ChatThread";
import {
  getConversasSolicitacao,
  getMensagensColeta,
  getMensagensConversaSolicitacao,
  getReadableErrorMessage,
  getSolicitacaoById,
  sendMensagemConversaSolicitacao,
  type PreAcceptConversation,
  type SolicitacaoItem,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";
import { radius, spacing, typography } from "@/theme/tokens";

export default function SolicitacaoConversaScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { accessToken, hasAccess, isLoading, refreshSession, user } =
    useProtectedRoute(["usuario"]);
  const id = Number(params.id);

  const query = useQuery({
    queryKey: ["detail", id],
    enabled: hasAccess && !isLoading && Number.isFinite(id),
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        getSolicitacaoById(token, id)
      ),
  });

  const item = query.data;
  const semColeta = !item?.coleta && item?.status === "aprovada";

  const conversasQuery = useQuery({
    queryKey: ["solicitacoes", id, "conversas"],
    enabled: hasAccess && !isLoading && Number.isFinite(id) && semColeta,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        getConversasSolicitacao(token, id)
      ),
  });

  const backButton = (
    <AppButton
      label="Voltar para a solicitação"
      tone="secondary"
      icon={ArrowLeft}
      onPress={() => router.push(`/solicitacoes/${id}` as any)}
    />
  );

  if (isLoading || !hasAccess || !user || query.isLoading) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando conversa..." />
      </AppScreen>
    );
  }

  if (query.error || !item || !accessToken) {
    return (
      <AppScreen footer={backButton}>
        <MessageBanner
          message={getReadableErrorMessage(query.error, "Não foi possível abrir a conversa.")}
          tone="error"
        />
      </AppScreen>
    );
  }

  const coleta = item.coleta;

  // Conversa 1:1 com a empresa responsável — experiência de tela cheia (estilo WhatsApp).
  if (coleta) {
    return (
      <AppScreen scroll={false}>
        <ChatHeader
          name={coleta.company.user.nome}
          subtitle={item.titulo}
          avatarUrl={coleta.company.user.avatarUrl}
          onBack={() => router.push(`/solicitacoes/${id}` as any)}
        />
        <ChatThread
          variant="screen"
          coletaId={coleta.id}
          accessToken={accessToken}
          currentUserId={user.id}
          messages={coleta.mensagens ?? []}
          placeholder="Mensagem"
          queryKey={["detail", id]}
          onFetch={(sinceId) =>
            withAutoRefresh(accessToken, refreshSession, (token) =>
              getMensagensColeta(token, coleta.id, sinceId)
            )
          }
        />
      </AppScreen>
    );
  }

  // Sem coleta ainda: conversa de pré-aceite com as empresas interessadas —
  // mesma experiência de tela cheia da coleta (cabeçalho com empresa + solicitação).
  if (semColeta) {
    if (conversasQuery.isLoading) {
      return (
        <AppScreen footer={backButton}>
          <LoadingCard text="Carregando conversas..." />
        </AppScreen>
      );
    }

    if (conversasQuery.error) {
      return (
        <AppScreen footer={backButton}>
          <MessageBanner
            message={getReadableErrorMessage(
              conversasQuery.error,
              "Não foi possível carregar as conversas."
            )}
            tone="error"
          />
        </AppScreen>
      );
    }

    const conversas = conversasQuery.data ?? [];
    if (conversas.length === 0) {
      return (
        <AppScreen footer={backButton}>
          <EmptyState
            icon={MessageCircle}
            title="Nenhuma empresa ainda"
            description="Quando uma empresa demonstrar interesse na sua solicitação, a conversa aparece aqui."
          />
        </AppScreen>
      );
    }

    return (
      <PreAceiteConversa
        conversas={conversas}
        solicitacao={item}
        accessToken={accessToken}
        currentUserId={user.id}
        refreshSession={refreshSession}
        queryKey={["solicitacoes", id, "conversas"]}
        onBack={() => router.push(`/solicitacoes/${id}` as any)}
      />
    );
  }

  // Sem coleta e ainda não aprovada: conversa indisponível.
  return (
    <AppScreen footer={backButton}>
      <MessageBanner
        message="A conversa fica disponível quando a solicitação estiver aprovada ou com uma coleta em andamento."
        tone="info"
      />
    </AppScreen>
  );
}

/**
 * Conversa de pré-aceite em tela cheia. O cabeçalho mostra a empresa e a
 * solicitação. Quando há mais de uma empresa interessada, chips permitem
 * alternar entre elas mantendo o chat ocupando a tela toda.
 */
function PreAceiteConversa({
  conversas,
  solicitacao,
  accessToken,
  currentUserId,
  refreshSession,
  queryKey,
  onBack,
}: {
  conversas: PreAcceptConversation[];
  solicitacao: SolicitacaoItem;
  accessToken: string;
  currentUserId: number;
  refreshSession: () => Promise<string | null>;
  queryKey: unknown[];
  onBack: () => void;
}) {
  // Empresa com a conversa mais recente primeiro.
  const ordenadas = useMemo(
    () => [...conversas].sort((a, b) => ultimaMensagemAt(b) - ultimaMensagemAt(a)),
    [conversas]
  );
  const [selectedId, setSelectedId] = useState(ordenadas[0]?.id);
  const selected = ordenadas.find((c) => c.id === selectedId) ?? ordenadas[0];

  if (!selected) return null;

  return (
    <AppScreen scroll={false}>
      <ChatHeader
        name={selected.company.user.nome}
        subtitle={`${solicitacao.titulo} · ${solicitacao.material.nome}`}
        avatarUrl={selected.company.user.avatarUrl}
        onBack={onBack}
      />

      {ordenadas.length > 1 ? (
        <View style={styles.chipsRow}>
          {ordenadas.map((conversa) => {
            const ativa = conversa.id === selected.id;
            return (
              <Pressable
                key={conversa.id}
                onPress={() => setSelectedId(conversa.id)}
                style={[styles.chip, ativa && styles.chipActive]}
                accessibilityRole="button"
              >
                <Text
                  style={[styles.chipText, ativa && styles.chipTextActive]}
                  numberOfLines={1}
                >
                  {conversa.company.user.nome}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <ChatThread
        key={selected.id}
        variant="screen"
        threadId={selected.id}
        accessToken={accessToken}
        currentUserId={currentUserId}
        messages={selected.mensagens}
        queryKey={queryKey}
        onFetch={(sinceId) =>
          withAutoRefresh(accessToken, refreshSession, (token) =>
            getMensagensConversaSolicitacao(token, selected.id, sinceId)
          )
        }
        onSend={(mensagem) =>
          withAutoRefresh(accessToken, refreshSession, (token) =>
            sendMensagemConversaSolicitacao(token, selected.id, mensagem)
          )
        }
        emptyText="Nenhuma mensagem nessa conversa."
        placeholder="Responda a empresa"
      />
    </AppScreen>
  );
}

function ultimaMensagemAt(conversa: PreAcceptConversation) {
  const ultima = conversa.mensagens[conversa.mensagens.length - 1];
  return ultima ? new Date(ultima.createdAt).getTime() : 0;
}

const styles = StyleSheet.create({
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: appColors.stroke,
    backgroundColor: appColors.surface,
  },
  chipActive: {
    backgroundColor: appColors.primarySoft,
    borderColor: appColors.primary,
  },
  chipText: {
    ...typography.meta,
    fontSize: 12,
    color: appColors.textSoft,
  },
  chipTextActive: {
    color: appColors.primaryStrong,
  },
});
