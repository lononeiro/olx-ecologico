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
  getColetaById,
  getMensagensColeta,
  getReadableErrorMessage,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";

export default function EmpresaColetaConversaScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { accessToken, hasAccess, isLoading, refreshSession, user } =
    useProtectedRoute(["empresa"]);
  const id = Number(params.id);

  const query = useQuery({
    queryKey: ["detail", id],
    enabled: hasAccess && !isLoading && Number.isFinite(id),
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        getColetaById(token, id)
      ),
  });

  if (isLoading || !hasAccess || !user || query.isLoading) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando conversa..." />
      </AppScreen>
    );
  }

  if (query.error || !query.data || !accessToken) {
    return (
      <AppScreen
        footer={
          <AppButton
            label="Voltar para a coleta"
            tone="secondary"
            icon={ArrowLeft}
            onPress={() => router.push(`/empresa/coletas/${id}` as any)}
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

  const coleta = query.data;

  return (
    <AppScreen scroll={false}>
      <ChatHeader
        name={coleta.solicitacao.user?.nome ?? "Solicitante"}
        subtitle={coleta.solicitacao.titulo}
        onBack={() => router.push(`/empresa/coletas/${id}` as any)}
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
