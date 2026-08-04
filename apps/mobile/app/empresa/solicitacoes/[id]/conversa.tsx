import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Package, type LucideIcon } from "lucide-react-native";
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
    <AppScreen
      footer={
        <AppButton
          label="Voltar para solicitações"
          tone="secondary"
          icon={ArrowLeft}
          onPress={() => router.push("/empresa/solicitacoes" as any)}
        />
      }
    >
      <AppCard>
        <SectionHeader
          eyebrow="CONVERSA PRÉ-ACEITE"
          title={solicitacao?.titulo ?? `Solicitação #${conversa.solicitacaoId}`}
          description="Tire dúvidas com o solicitante antes de aceitar a coleta."
        />
        {solicitacao?.status && <StatusBadge kind="solicitacao" value={solicitacao.status} />}
      </AppCard>

      {solicitacao ? (
        <AppCard>
          <SectionHeader eyebrow="MATERIAIS" title="Detalhes da solicitação" />
          <InfoRow
            label="Material"
            value={<IconText icon={Package} text={solicitacao.material.nome} />}
          />
          <InfoRow label="Quantidade" value={solicitacao.quantidade} />
          <InfoRow
            label="Região aproximada"
            value={<IconText icon={MapPin} text={solicitacao.endereco} />}
          />
          <InfoRow label="Descrição" value={solicitacao.descricao} />
        </AppCard>
      ) : null}

      <ChatThread
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
        placeholder="Pergunte sobre volume, acesso ao local ou estado do material"
      />
    </AppScreen>
  );
}

function IconText({ icon, text }: { icon: LucideIcon; text: string }) {
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
