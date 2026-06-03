import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  AppButton,
  AppCard,
  AppScreen,
  InfoRow,
  LoadingCard,
  MessageBanner,
  SectionHeader,
  StatusBadge,
} from "@/components/AppUI";
import { ChatThread } from "@/components/ChatThread";
import {
  getEmpresaConversaSolicitacao,
  getReadableErrorMessage,
  sendMensagemConversaSolicitacao,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";

export default function EmpresaSolicitacaoConversaScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { accessToken, hasAccess, isLoading, refreshSession, user } =
    useProtectedRoute(["empresa"]);
  const solicitacaoId = Number(params.id);

  const query = useQuery({
    queryKey: ["empresa", "solicitacoes", solicitacaoId, "conversa"],
    enabled: hasAccess && !isLoading && Number.isFinite(solicitacaoId),
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        getEmpresaConversaSolicitacao(token, solicitacaoId)
      ),
  });

  if (isLoading || !hasAccess || !user) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando conversa..." />
      </AppScreen>
    );
  }

  if (query.isLoading) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando conversa..." />
      </AppScreen>
    );
  }

  if (query.error || !query.data) {
    return (
      <AppScreen>
        <MessageBanner
          message={getReadableErrorMessage(query.error, "Nao foi possivel abrir a conversa.")}
          tone="error"
        />
        <AppButton
          label="Voltar"
          tone="secondary"
          onPress={() => router.push("/empresa/solicitacoes" as any)}
        />
      </AppScreen>
    );
  }

  const conversa = query.data;
  const solicitacao = conversa.solicitacao;

  return (
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow="CONVERSA PRE-ACEITE"
          title={solicitacao?.titulo ?? `Solicitacao #${conversa.solicitacaoId}`}
          description="Tire duvidas com o solicitante antes de aceitar a coleta."
        />
        {solicitacao?.status && <StatusBadge kind="solicitacao" value={solicitacao.status} />}
      </AppCard>

      {solicitacao ? (
        <>
          <InfoRow label="Material" value={solicitacao.material.nome} />
          <InfoRow label="Quantidade" value={solicitacao.quantidade} />
          <InfoRow label="Regiao aproximada" value={solicitacao.endereco} />
          <InfoRow label="Descricao" value={solicitacao.descricao} />
        </>
      ) : null}

      <ChatThread
        threadId={conversa.id}
        accessToken={accessToken}
        currentUserId={user.id}
        messages={conversa.mensagens}
        queryKey={["empresa", "solicitacoes", solicitacaoId, "conversa"]}
        onSend={(mensagem) =>
          withAutoRefresh(accessToken, refreshSession, (token) =>
            sendMensagemConversaSolicitacao(token, conversa.id, mensagem)
          )
        }
        emptyText="Nenhuma pergunta enviada ainda."
        placeholder="Pergunte sobre volume, acesso ao local ou estado do material"
      />

      <AppButton
        label="Voltar para solicitacoes"
        tone="secondary"
        onPress={() => router.push("/empresa/solicitacoes" as any)}
      />
    </AppScreen>
  );
}
