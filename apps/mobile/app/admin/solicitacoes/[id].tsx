import { useLocalSearchParams, router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  getReadableErrorMessage,
  getSolicitacaoById,
  moderateSolicitacao,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";

export default function AdminSolicitacaoDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { accessToken, hasAccess, isLoading, refreshSession } =
    useProtectedRoute(["admin"]);
  const id = Number(params.id);

  const query = useQuery({
    queryKey: ["detail", id],
    enabled: hasAccess && !isLoading && Number.isFinite(id),
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) => getSolicitacaoById(token, id)),
  });

  const moderateMutation = useMutation({
    mutationFn: async (aprovado: boolean) =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        moderateSolicitacao(token, id, aprovado)
      ),
    onSuccess: async (_, aprovado) => {
      await queryClient.invalidateQueries({ queryKey: ["detail", id] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "queue"] });
      router.replace("/admin/solicitacoes");
    },
  });

  if (isLoading || !hasAccess) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando solicitacao..." />
      </AppScreen>
    );
  }

  if (query.isLoading || !query.data) {
    return (
      <AppScreen>
        {query.error ? (
          <MessageBanner
            message={getReadableErrorMessage(query.error, "Nao foi possivel carregar a solicitacao.")}
            tone="error"
          />
        ) : (
          <LoadingCard text="Carregando solicitacao..." />
        )}
      </AppScreen>
    );
  }

  const item = query.data;
  const canModerate = item.status === "pendente" && !item.aprovado;

  return (
    <AppScreen>
      <AppCard>
        <SectionHeader
          eyebrow={`SOLICITACAO #${item.id}`}
          title={item.titulo}
          description="Detalhe administrativo para aprovacao ou rejeicao."
        />
        <StatusBadge kind="solicitacao" value={item.status} />
      </AppCard>

      <InfoRow label="Solicitante" value={item.user?.nome ?? "-"} />
      <InfoRow label="Email" value={item.user?.email ?? "-"} />
      {item.user?.telefone ? <InfoRow label="Telefone" value={item.user.telefone} /> : null}
      <InfoRow label="Material" value={item.material.nome} />
      <InfoRow label="Quantidade" value={item.quantidade} />
      <InfoRow label="Endereco" value={item.endereco} />
      <InfoRow label="Descricao" value={item.descricao} />
      <InfoRow
        label="Criada em"
        value={new Date(item.createdAt).toLocaleString("pt-BR")}
      />

      {item.imagens.map((imagem, index) => (
        <InfoRow key={imagem.id} label={`Imagem ${index + 1}`} value={imagem.url} />
      ))}

      {canModerate ? (
        <AppCard>
          <SectionHeader
            eyebrow="DECISAO"
            title="Moderacao"
            description="Ao aprovar, a solicitacao fica visivel para empresas. Ao rejeitar, sai do fluxo ativo."
          />
          <AppButton
            label={moderateMutation.isPending ? "Aprovando..." : "Aprovar solicitacao"}
            onPress={() => moderateMutation.mutate(true)}
            disabled={moderateMutation.isPending}
          />
          <AppButton
            label={moderateMutation.isPending ? "Rejeitando..." : "Rejeitar solicitacao"}
            tone="danger"
            onPress={() => moderateMutation.mutate(false)}
            disabled={moderateMutation.isPending}
          />
        </AppCard>
      ) : (
        <MessageBanner
          message="Esta solicitacao ja foi processada e segue apenas em acompanhamento."
          tone="success"
        />
      )}
    </AppScreen>
  );
}
