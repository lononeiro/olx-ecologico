import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Package, FileText, Calendar, Building2, type LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";
import {
  AppButton,
  AppCard,
  AppScreen,
  Icon,
  InfoRow,
  LoadingCard,
  MessageBanner,
  SectionHeader,
  StatusBadge,
  appColors,
} from "@/components/AppUI";
import { ChatThread } from "@/components/ChatThread";
import {
  getConversasSolicitacao,
  getReadableErrorMessage,
  getSolicitacaoById,
  sendMensagemConversaSolicitacao,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";

const STATUS_COPY: Record<string, string> = {
  aprovada: "Sua solicitacao esta disponivel e aguarda uma empresa aceitar a coleta.",
  cancelada: "Voce cancelou esta solicitacao.",
  removida: "Sua solicitacao foi removida pela administracao.",
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
  const conversasQuery = useQuery({
    queryKey: ["solicitacoes", id, "conversas"],
    enabled: hasAccess && !isLoading && Number.isFinite(id),
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        getConversasSolicitacao(token, id)
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
            "Não foi possível carregar a solicitação."
          )}
          tone="error"
        />
      </AppScreen>
    );
  }

  const item = query.data;

  return (
    <AppScreen
      footer={
        <AppButton
          label="Voltar para solicitações"
          tone="secondary"
          icon={ArrowLeft}
          onPress={() => router.push("/solicitacoes" as any)}
        />
      }
    >
      <AppCard>
        <SectionHeader
          eyebrow={`SOLICITAÇÃO #${item.id}`}
          title={item.titulo}
          description={STATUS_COPY[item.status] ?? "Acompanhe os dados atualizados desta solicitação."}
        />
        <StatusBadge kind="solicitacao" value={item.status} />
      </AppCard>

      <AppCard>
        <SectionHeader eyebrow="INFORMAÇÕES GERAIS" title="Detalhes da solicitação" />
        <InfoRow
          label="Material"
          value={
            <RowWithIcon icon={Package} text={item.material.nome} />
          }
        />
        <InfoRow label="Quantidade" value={item.quantidade} />
        <InfoRow
          label="Endereço"
          value={<RowWithIcon icon={MapPin} text={item.endereco} />}
        />
        <InfoRow
          label="Descrição"
          value={<RowWithIcon icon={FileText} text={item.descricao} />}
        />
        <InfoRow
          label="Criada em"
          value={
            <RowWithIcon
              icon={Calendar}
              text={new Date(item.createdAt).toLocaleString("pt-BR")}
            />
          }
        />
      </AppCard>

      {item.imagens.length > 0 && (
        <AppCard>
          <SectionHeader eyebrow="FOTOS" title="Imagens enviadas" />
          {item.imagens.map((imagem, index) => (
            <InfoRow key={imagem.id} label={`Imagem ${index + 1}`} value={imagem.url} />
          ))}
        </AppCard>
      )}

      {item.coleta ? (
        <>
          <AppCard>
            <SectionHeader
              eyebrow="COLETA"
              title="Timeline de acompanhamento"
              description="A coleta foi aceita e agora segue o fluxo operacional da empresa."
            />
            <StatusBadge kind="coleta" value={item.coleta.status} />
            <InfoRow
              label="Empresa responsável"
              value={
                <RowWithIcon icon={Building2} text={item.coleta.company.user.nome} />
              }
            />
            <InfoRow
              label="Data do aceite"
              value={new Date(item.coleta.dataAceite).toLocaleDateString("pt-BR")}
            />
            {!!item.coleta.codigoConfirmacao && (
              <InfoRow
                label="Código de confirmação"
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
              title="Conversa com a empresa"
              placeholder="Escreva para a empresa"
            />
          ) : null}
        </>
      ) : (
        <>
          <MessageBanner
            message={STATUS_COPY[item.status] ?? "A solicitação ainda não possui coleta."}
            tone={item.status === "rejeitada" ? "error" : "success"}
          />

          {item.status === "aprovada" ? (
            <>
              <AppCard>
                <SectionHeader
                  eyebrow="EMPRESAS INTERESSADAS"
                  title="Conversas antes do aceite"
                  description="Responda dúvidas das empresas enquanto a coleta ainda não foi assumida."
                />
              </AppCard>
              {conversasQuery.isLoading ? (
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
                <Text style={{ color: appColors.textSoft, fontSize: 15, lineHeight: 22 }}>
                  Nenhuma empresa iniciou conversa ainda.
                </Text>
              ) : accessToken ? (
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
                    onSend={(mensagem) =>
                      withAutoRefresh(accessToken, refreshSession, (token) =>
                        sendMensagemConversaSolicitacao(token, conversa.id, mensagem)
                      )
                    }
                    emptyText="Nenhuma mensagem nessa conversa."
                    placeholder="Responda a empresa"
                  />
                ))
              ) : null}
            </>
          ) : null}
        </>
      )}
    </AppScreen>
  );
}

function RowWithIcon({ icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
      <Icon icon={icon} size={16} color={appColors.textFaint} />
      <Text
        style={{ color: appColors.text, fontSize: 15, lineHeight: 22, fontWeight: "600", flex: 1 }}
      >
        {text}
      </Text>
    </View>
  );
}
