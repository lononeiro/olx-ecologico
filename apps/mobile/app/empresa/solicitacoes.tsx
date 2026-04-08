import { useState } from "react";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text } from "react-native";
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
import {
  acceptSolicitacao,
  getReadableErrorMessage,
  getSolicitacoes,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";

export default function EmpresaSolicitacoesScreen() {
  const queryClient = useQueryClient();
  const { accessToken, hasAccess, isLoading, refreshSession } =
    useProtectedRoute(["empresa"]);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error">("success");

  const query = useQuery({
    queryKey: ["empresa", "solicitacoes", "disponiveis"],
    enabled: hasAccess && !isLoading,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) => getSolicitacoes(token)),
  });

  const acceptMutation = useMutation({
    mutationFn: async (solicitacaoId: number) =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        acceptSolicitacao(token, solicitacaoId)
      ),
    onSuccess: (data) => {
      setTone("success");
      setMessage("Solicitacao aceita com sucesso.");
      void queryClient.invalidateQueries({
        queryKey: ["empresa", "solicitacoes", "disponiveis"],
      });
      void queryClient.invalidateQueries({ queryKey: ["empresa", "coletas"] });
      router.push(`/empresa/coletas/${data.id}` as any);
    },
    onError: (error) => {
      setTone("error");
      setMessage(
        getReadableErrorMessage(error, "Nao foi possivel aceitar a solicitacao.")
      );
    },
  });

  return (
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow="EMPRESA"
          title="Solicitacoes disponiveis"
          description="Estas solicitacoes ja foram aprovadas pela administracao e aguardam aceite."
        />
      </AppCard>

      {query.isLoading && <LoadingCard text="Carregando solicitacoes..." />}
      {!!message && <MessageBanner message={message} tone={tone} />}
      {query.error && (
        <MessageBanner
          message={getReadableErrorMessage(
            query.error,
            "Nao foi possivel carregar as solicitacoes disponiveis."
          )}
          tone="error"
        />
      )}

      {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="Nenhuma solicitacao disponivel"
          description="Novas solicitacoes aprovadas aparecerao aqui assim que estiverem prontas para aceite."
        />
      ) : null}

      {query.data?.map((item) => (
        <AppCard key={item.id}>
          <SectionHeader title={item.titulo} description={item.user?.nome ?? item.material.nome} />
          <StatusBadge kind="solicitacao" value={item.status} />
          <Text style={{ color: "#537156", lineHeight: 22 }}>{item.endereco}</Text>
          <Text style={{ color: "#537156", lineHeight: 22 }}>{item.descricao}</Text>
          <Text style={{ color: "#537156", lineHeight: 22 }}>
            {item.quantidade} - {item.material.nome}
          </Text>
          <AppButton
            label={
              acceptMutation.isPending ? "Aceitando solicitacao..." : "Aceitar solicitacao"
            }
            onPress={() => acceptMutation.mutate(item.id)}
            disabled={acceptMutation.isPending}
          />
        </AppCard>
      ))}
    </AppScreen>
  );
}
