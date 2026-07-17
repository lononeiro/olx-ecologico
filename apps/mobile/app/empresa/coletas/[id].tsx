import { useLocalSearchParams, router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Package,
  Phone,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react-native";
import { Text, View } from "react-native";
import {
  AppButton,
  AppCard,
  AppField,
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
  getColetaById,
  getReadableErrorMessage,
  updateColetaStatus,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";

const NEXT_STATUS: Record<string, string[]> = {
  aceita: ["a_caminho", "cancelada"],
  a_caminho: ["em_coleta", "cancelada"],
  em_coleta: ["concluida", "cancelada"],
};

const STATUS_ACTION_LABELS: Record<string, string> = {
  a_caminho: "Marcar como a caminho",
  em_coleta: "Marcar em coleta",
  concluida: "Concluir coleta",
  cancelada: "Cancelar coleta",
};

export default function EmpresaColetaDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { accessToken, hasAccess, isLoading, refreshSession, user } =
    useProtectedRoute(["empresa"]);
  const id = Number(params.id);
  const [novoStatus, setNovoStatus] = useState("");
  const [codigoConfirmacao, setCodigoConfirmacao] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");

  const query = useQuery({
    queryKey: ["detail", id],
    enabled: hasAccess && !isLoading && Number.isFinite(id),
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) => getColetaById(token, id)),
  });

  const statusMutation = useMutation({
    mutationFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        updateColetaStatus(token, id, {
          status: novoStatus,
          codigoConfirmacao: codigoConfirmacao.trim().toUpperCase() || undefined,
        })
      ),
    onSuccess: async () => {
      setFeedbackTone("success");
      setFeedback("Status atualizado com sucesso.");
      setNovoStatus("");
      setCodigoConfirmacao("");
      await queryClient.invalidateQueries({ queryKey: ["detail", id] });
      await queryClient.invalidateQueries({ queryKey: ["empresa", "coletas"] });
    },
    onError: (error) => {
      setFeedbackTone("error");
      setFeedback(
        getReadableErrorMessage(error, "Não foi possível atualizar o status.")
      );
    },
  });

  if (isLoading || !hasAccess || !user) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando coleta..." />
      </AppScreen>
    );
  }

  if (query.isLoading || !query.data) {
    return (
      <AppScreen>
        {query.error ? (
          <MessageBanner
            message={getReadableErrorMessage(query.error, "Não foi possível carregar a coleta.")}
            tone="error"
          />
        ) : (
          <LoadingCard text="Carregando coleta..." />
        )}
      </AppScreen>
    );
  }

  const coleta = query.data;
  const opcoes = NEXT_STATUS[coleta.status] ?? [];

  return (
    <AppScreen
      footer={
        <AppButton
          label="Voltar para coletas"
          tone="secondary"
          icon={ArrowLeft}
          onPress={() => router.push("/empresa/coletas" as any)}
        />
      }
    >
      <AppCard>
        <SectionHeader
          eyebrow={`COLETA #${coleta.id}`}
          title={coleta.solicitacao.titulo}
          description="Painel operacional com dados do solicitante, status e conversa."
        />
        <StatusBadge kind="coleta" value={coleta.status} />
      </AppCard>

      {!!feedback && <MessageBanner message={feedback} tone={feedbackTone} />}

      <AppCard>
        <SectionHeader eyebrow="MATERIAIS" title="Informações da coleta" />
        <InfoRow
          label="Material"
          value={
            <IconText icon={Package} text={coleta.solicitacao.material.nome} />
          }
        />
        <InfoRow label="Quantidade" value={coleta.solicitacao.quantidade} />
      </AppCard>

      <AppCard>
        <SectionHeader eyebrow="ENDEREÇO" title="Local da coleta" />
        <InfoRow
          label="Endereço"
          value={<IconText icon={MapPin} text={coleta.solicitacao.endereco} />}
        />
      </AppCard>

      <AppCard>
        <SectionHeader eyebrow="SOLICITANTE" title="Dados de contato" />
        <InfoRow
          label="Solicitante"
          value={
            <IconText icon={UserIcon} text={coleta.solicitacao.user?.nome ?? "-"} />
          }
        />
        <InfoRow
          label="Email"
          value={<IconText icon={Mail} text={coleta.solicitacao.user?.email ?? "-"} />}
        />
        {coleta.solicitacao.user?.telefone ? (
          <InfoRow
            label="Telefone"
            value={<IconText icon={Phone} text={coleta.solicitacao.user.telefone} />}
          />
        ) : null}
        {!!coleta.codigoConfirmacao && (
          <InfoRow label="Código de confirmação" value={coleta.codigoConfirmacao} />
        )}
      </AppCard>

      {opcoes.length > 0 && (
        <AppCard>
          <SectionHeader
            eyebrow="TIMELINE"
            title="Atualizar andamento"
            description="Escolha o próximo passo da coleta aprovada."
          />
          <View style={{ gap: 10 }}>
            {opcoes.map((status) => (
              <AppButton
                key={status}
                label={STATUS_ACTION_LABELS[status] ?? status}
                tone={
                  novoStatus === status
                    ? "primary"
                    : status === "cancelada"
                      ? "danger"
                      : "secondary"
                }
                onPress={() => {
                  setFeedback("");
                  setNovoStatus(status);
                }}
              />
            ))}
          </View>
          {novoStatus === "concluida" && (
            <AppField
              label="Código de confirmação"
              value={codigoConfirmacao}
              onChangeText={setCodigoConfirmacao}
              placeholder="Informe o código do solicitante"
              autoCapitalize="characters"
            />
          )}
          <Text style={{ color: appColors.textSoft, fontSize: 15, lineHeight: 22 }}>
            {novoStatus
              ? `Próximo passo selecionado: ${STATUS_ACTION_LABELS[novoStatus] ?? novoStatus}.`
              : "Selecione o próximo passo para habilitar a atualização."}
          </Text>
          <AppButton
            label={statusMutation.isPending ? "Atualizando..." : "Atualizar status"}
            onPress={() => statusMutation.mutate()}
            disabled={
              statusMutation.isPending ||
              !novoStatus ||
              (novoStatus === "concluida" && !codigoConfirmacao.trim())
            }
          />
        </AppCard>
      )}

      {accessToken ? (
        <ChatThread
          coletaId={coleta.id}
          accessToken={accessToken}
          currentUserId={user.id}
          messages={coleta.mensagens ?? []}
          title="Conversa com o solicitante"
          emptyText="Nenhuma mensagem ainda. Converse com o solicitante por aqui."
          placeholder="Escreva para o solicitante"
        />
      ) : null}
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
