import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle } from "lucide-react-native";
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
import { ChatHeader } from "@/components/ChatHeader";
import { ChatThread } from "@/components/ChatThread";
import {
  getConversasSolicitacao,
  getMensagensColeta,
  getMensagensConversaSolicitacao,
  getReadableErrorMessage,
  getSolicitacaoById,
  sendMensagemConversaSolicitacao,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";

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

  return (
    <AppScreen footer={backButton}>
      <AppCard>
        <SectionHeader
          eyebrow="CONVERSA"
          title={item.titulo}
          description="Converse com as empresas interessadas na sua solicitação."
        />
        <StatusBadge kind="solicitacao" value={item.status} />
      </AppCard>

      {semColeta ? (
        conversasQuery.isLoading ? (
          <LoadingCard text="Carregando conversas..." />
        ) : conversasQuery.error ? (
          <MessageBanner
            message={getReadableErrorMessage(
              conversasQuery.error,
              "Não foi possível carregar as conversas."
            )}
            tone="error"
          />
        ) : (conversasQuery.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Nenhuma empresa ainda"
            description="Quando uma empresa demonstrar interesse na sua solicitação, a conversa aparece aqui."
          />
        ) : (
          conversasQuery.data?.map((conversa) => (
            <ChatThread
              key={conversa.id}
              threadId={conversa.id}
              accessToken={accessToken}
              currentUserId={user.id}
              messages={conversa.mensagens}
              title={conversa.company.user.nome}
              description={`Status da conversa: ${conversa.status}`}
              queryKey={["solicitacoes", id, "conversas"]}
              onFetch={(sinceId) =>
                withAutoRefresh(accessToken, refreshSession, (token) =>
                  getMensagensConversaSolicitacao(token, conversa.id, sinceId)
                )
              }
              onSend={(mensagem) =>
                withAutoRefresh(accessToken, refreshSession, (token) =>
                  sendMensagemConversaSolicitacao(token, conversa.id, mensagem)
                )
              }
              emptyText="Nenhuma mensagem nessa conversa."
              placeholder="Responda a empresa"
            />
          ))
        )
      ) : (
        <MessageBanner
          message="A conversa fica disponível quando a solicitação estiver aprovada ou com uma coleta em andamento."
          tone="info"
        />
      )}
    </AppScreen>
  );
}
