import { useLocalSearchParams, router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Text } from "react-native";
import {
  AppButton,
  AppCard,
  AppField,
  AppScreen,
  InfoRow,
  LoadingCard,
  MessageBanner,
  SectionHeader,
  StatusBadge,
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
        getReadableErrorMessage(error, "Nao foi possivel atualizar o status.")
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
            message={getReadableErrorMessage(query.error, "Nao foi possivel carregar a coleta.")}
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
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow={`COLETA #${coleta.id}`}
          title={coleta.solicitacao.titulo}
          description="Painel operacional da empresa com dados do solicitante, status e conversa."
        />
        <StatusBadge kind="coleta" value={coleta.status} />
      </AppCard>

      {!!feedback && <MessageBanner message={feedback} tone={feedbackTone} />}

      <InfoRow label="Material" value={coleta.solicitacao.material.nome} />
      <InfoRow label="Quantidade" value={coleta.solicitacao.quantidade} />
      <InfoRow label="Endereco da coleta" value={coleta.solicitacao.endereco} />
      <InfoRow label="Solicitante" value={coleta.solicitacao.user?.nome ?? "-"} />
      <InfoRow label="Email" value={coleta.solicitacao.user?.email ?? "-"} />
      {coleta.solicitacao.user?.telefone ? (
        <InfoRow label="Telefone" value={coleta.solicitacao.user.telefone} />
      ) : null}
      {coleta.solicitacao.user?.endereco ? (
        <InfoRow label="Endereco do perfil" value={coleta.solicitacao.user.endereco} />
      ) : null}
      {!!coleta.codigoConfirmacao && (
        <InfoRow label="Codigo de confirmacao" value={coleta.codigoConfirmacao} />
      )}

      {opcoes.length > 0 && (
        <AppCard>
          <SectionHeader
            eyebrow="STATUS"
            title="Atualizar andamento"
            description="O fluxo segue a mesma ordem do web."
          />
          <AppField
            label="Novo status"
            value={novoStatus}
            onChangeText={setNovoStatus}
            placeholder={opcoes.join(" | ")}
          />
          {novoStatus === "concluida" && (
            <AppField
              label="Codigo de confirmacao"
              value={codigoConfirmacao}
              onChangeText={setCodigoConfirmacao}
              placeholder="Informe o codigo do solicitante"
              autoCapitalize="characters"
            />
          )}
          <Text style={{ color: "#537156", lineHeight: 22 }}>
            Status permitidos agora: {opcoes.join(", ")}.
          </Text>
          <AppButton
            label={statusMutation.isPending ? "Atualizando..." : "Atualizar status"}
            onPress={() => statusMutation.mutate()}
            disabled={statusMutation.isPending || !novoStatus}
          />
        </AppCard>
      )}

      {accessToken ? (
        <ChatThread
          coletaId={coleta.id}
          accessToken={accessToken}
          currentUserId={user.id}
          messages={coleta.mensagens}
        />
      ) : null}

      <AppButton
        label="Voltar para coletas"
        tone="secondary"
        onPress={() => router.push("/empresa/coletas" as any)}
      />
    </AppScreen>
  );
}
