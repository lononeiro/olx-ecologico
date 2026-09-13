import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react-native";
import {
  AppButton,
  AppScreen,
  LoadingCard,
  MessageBanner,
} from "@/components/AppUI";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatThread } from "@/components/ChatThread";
import {
  getEmpresaConversaSolicitacao,
  getMensagensConversaSolicitacao,
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
      <AppScreen
        footer={
          <AppButton
            label="Voltar"
            tone="secondary"
            icon={ArrowLeft}
            onPress={() => router.push("/empresa/solicitacoes" as any)}
          />
        }
      >
        <MessageBanner
          message={getReadableErrorMessage(query.error, "Não foi possível abrir a conversa.")}
          tone="error"
        />
      </AppScreen>
    );
  }

  if (!accessToken) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando conversa..." />
      </AppScreen>
    );
  }

  const conversa = query.data;
  const solicitacao = conversa.solicitacao;

  return (
    <AppScreen scroll={false}>
      <ChatHeader
        name={solicitacao?.titulo ?? "Solicitação"}
        subtitle={
          solicitacao
            ? `${solicitacao.material.nome} · ${solicitacao.quantidade}`
            : "Conversa pré-aceite"
        }
        onBack={() => router.push("/empresa/solicitacoes" as any)}
      />
      <ChatThread
        variant="screen"
        threadId={conversa.id}
        accessToken={accessToken}
        currentUserId={user.id}
        messages={conversa.mensagens}
        queryKey={["empresa", "solicitacoes", solicitacaoId, "conversa"]}
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
        emptyText="Nenhuma pergunta enviada ainda."
        placeholder="Pergunte sobre volume, acesso ou estado do material"
      />
    </AppScreen>
  );
}
