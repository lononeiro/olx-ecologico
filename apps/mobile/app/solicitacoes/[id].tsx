import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Text } from "react-native";
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
import { getReadableErrorMessage, getSolicitacaoById } from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";

const STATUS_COPY: Record<string, string> = {
  pendente: "Sua solicitacao esta em analise pela administracao.",
  aprovada: "A solicitacao foi aprovada e aguarda uma empresa aceitar a coleta.",
  rejeitada: "A solicitacao foi rejeitada e saiu do fluxo ativo.",
};

export default function SolicitacaoDetailScreen() {
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

  if (isLoading || !hasAccess || !user) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando solicitacao..." />
      </AppScreen>
    );
  }

  if (query.isLoading) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando solicitacao..." />
      </AppScreen>
    );
  }

  if (query.error || !query.data) {
    return (
      <AppScreen>
        <MessageBanner
          message={getReadableErrorMessage(
            query.error,
            "Nao foi possivel carregar a solicitacao."
          )}
          tone="error"
        />
      </AppScreen>
    );
  }

  const item = query.data;

  return (
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow={`SOLICITACAO #${item.id}`}
          title={item.titulo}
          description={STATUS_COPY[item.status] ?? "Acompanhe os dados atualizados desta solicitacao."}
        />
        <StatusBadge kind="solicitacao" value={item.status} />
      </AppCard>

      <InfoRow label="Material" value={item.material.nome} />
      <InfoRow label="Quantidade" value={item.quantidade} />
      <InfoRow label="Endereco" value={item.endereco} />
      <InfoRow label="Descricao" value={item.descricao} />
      <InfoRow
        label="Criada em"
        value={new Date(item.createdAt).toLocaleString("pt-BR")}
      />

      {item.imagens.length > 0 &&
        item.imagens.map((imagem, index) => (
          <InfoRow key={imagem.id} label={`Imagem ${index + 1}`} value={imagem.url} />
        ))}

      {item.coleta ? (
        <>
          <AppCard>
            <SectionHeader
              eyebrow="COLETA"
              title="Acompanhamento"
              description="A coleta foi aceita e agora segue o fluxo operacional da empresa."
            />
            <StatusBadge kind="coleta" value={item.coleta.status} />
            <InfoRow label="Empresa responsavel" value={item.coleta.company.user.nome} />
            <InfoRow
              label="Data do aceite"
              value={new Date(item.coleta.dataAceite).toLocaleDateString("pt-BR")}
            />
            {!!item.coleta.codigoConfirmacao && (
              <InfoRow
                label="Codigo de confirmacao"
                value={item.coleta.codigoConfirmacao}
              />
            )}
          </AppCard>

          {item.coleta.mensagens && item.coleta.mensagens.length >= 0 && accessToken ? (
            <ChatThread
              coletaId={item.coleta.id}
              accessToken={accessToken}
              currentUserId={user.id}
              messages={item.coleta.mensagens}
            />
          ) : null}
        </>
      ) : (
        <MessageBanner
          message={STATUS_COPY[item.status] ?? "A solicitacao ainda nao possui coleta."}
          tone={item.status === "rejeitada" ? "error" : "success"}
        />
      )}

      <AppButton
        label="Voltar para solicitacoes"
        tone="secondary"
        onPress={() => router.push("/solicitacoes" as any)}
      />
    </AppScreen>
  );
}
