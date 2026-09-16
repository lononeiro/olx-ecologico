import { useLocalSearchParams, router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  Phone,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react-native";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
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
import { STATUS_COLETA_LABEL } from "@shared";
import {
  getColetaById,
  getReadableErrorMessage,
  updateColetaStatus,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";
import { radius, shadows, spacing, typography } from "@/theme/tokens";

const NEXT_STATUS: Record<string, string[]> = {
  aceita: ["a_caminho", "cancelada"],
  a_caminho: ["em_coleta", "cancelada"],
  em_coleta: ["concluida", "cancelada"],
};

// Etapas do fluxo normal de uma coleta, em ordem.
const ETAPAS = [
  { key: "aceita", label: "Aceita" },
  { key: "a_caminho", label: "A caminho" },
  { key: "em_coleta", label: "Em coleta" },
  { key: "concluida", label: "Concluída" },
] as const;

// Abre o Google Maps com a rota até o endereço da coleta.
function abrirRotaNoMapa(endereco: string) {
  const destino = encodeURIComponent(endereco.trim());
  const url = `https://www.google.com/maps/dir/?api=1&destination=${destino}`;
  Linking.openURL(url).catch(() =>
    Alert.alert("Erro", "Não foi possível abrir o Google Maps.")
  );
}

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
    refetchInterval: 15000,
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
    onSuccess: async (data) => {
      setNovoStatus("");
      setCodigoConfirmacao("");

      // Cancelar remove a coleta e devolve a solicitação para a pool; esta tela
      // de detalhe deixa de existir, então voltamos para a lista de coletas.
      if (data?.status === "cancelada") {
        await queryClient.invalidateQueries({ queryKey: ["empresa"] });
        await queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
        router.replace("/empresa/coletas" as any);
        return;
      }

      setFeedbackTone("success");
      setFeedback("Status atualizado com sucesso.");
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
  const proximaFase = opcoes.find((status) => status !== "cancelada");
  const podeAtualizar = opcoes.length > 0;

  return (
    <AppScreen
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
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
          eyebrow="COLETA"
          title={coleta.solicitacao.titulo}
          description="Painel operacional com dados do solicitante, status e conversa."
        />
        <StatusBadge kind="coleta" value={coleta.status} />
      </AppCard>

      {/* Andamento da coleta — no topo, com indicativo da etapa atual */}
      <AppCard>
        <SectionHeader
          eyebrow="ANDAMENTO"
          title="Etapa da coleta"
          description={
            opcoes.length > 0
              ? "Veja a etapa atual e avance para o próximo passo."
              : "Acompanhe a etapa atual desta coleta."
          }
        />
        <EtapaIndicator status={coleta.status} />

        {podeAtualizar && !novoStatus && (
          <View style={{ gap: 10 }}>
            {proximaFase && (
              <AppButton
                label="Mover para próxima fase"
                onPress={() => {
                  setFeedback("");
                  setNovoStatus(proximaFase);
                }}
              />
            )}
            <AppButton
              label="Cancelar coleta"
              tone="danger"
              onPress={() => {
                setFeedback("");
                setNovoStatus("cancelada");
              }}
            />
          </View>
        )}

        {podeAtualizar && !!novoStatus && (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>
              {novoStatus === "cancelada"
                ? "Cancelar esta coleta?"
                : `Avançar para "${STATUS_COLETA_LABEL[novoStatus] ?? novoStatus}"?`}
            </Text>
            <Text style={styles.confirmText}>
              {novoStatus === "cancelada"
                ? "A solicitação volta a ficar disponível para outras empresas aceitarem."
                : "Confirme para atualizar o andamento da coleta."}
            </Text>
            {novoStatus === "concluida" && (
              <AppField
                label="Código de confirmação"
                value={codigoConfirmacao}
                onChangeText={setCodigoConfirmacao}
                placeholder="Informe o código do solicitante"
                autoCapitalize="characters"
              />
            )}
            <View style={{ gap: 10 }}>
              <AppButton
                label={
                  statusMutation.isPending
                    ? "Atualizando..."
                    : novoStatus === "cancelada"
                      ? "Confirmar cancelamento"
                      : "Confirmar"
                }
                tone={novoStatus === "cancelada" ? "danger" : "primary"}
                onPress={() => statusMutation.mutate()}
                disabled={
                  statusMutation.isPending ||
                  (novoStatus === "concluida" && !codigoConfirmacao.trim())
                }
              />
              <AppButton
                label="Voltar"
                tone="secondary"
                onPress={() => {
                  setNovoStatus("");
                  setCodigoConfirmacao("");
                  setFeedback("");
                }}
                disabled={statusMutation.isPending}
              />
            </View>
          </View>
        )}
      </AppCard>

      {!!feedback && <MessageBanner message={feedback} tone={feedbackTone} />}

      {/* Conversa com o solicitante — em destaque */}
      <ChatHighlightCard
        subtitle={coleta.solicitacao.user?.nome ?? "Abrir conversa"}
        onPress={() => router.push(`/empresa/coletas/${coleta.id}/conversa` as any)}
      />

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
        {!!coleta.solicitacao.endereco?.trim() && (
          <AppButton
            label="Ver rota no Google Maps"
            tone="secondary"
            icon={Navigation}
            onPress={() => abrirRotaNoMapa(coleta.solicitacao.endereco)}
          />
        )}
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
      </AppCard>

    </AppScreen>
  );
}

function ChatHighlightCard({
  subtitle,
  onPress,
}: {
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chatCard, pressed && styles.chatCardPressed]}
      accessibilityRole="button"
      accessibilityLabel="Abrir conversa com o solicitante"
    >
      <View style={styles.chatIcon}>
        <Icon icon={MessageCircle} size={26} color={appColors.white} strokeWidth={2} />
      </View>
      <View style={styles.chatTextCol}>
        <Text style={styles.chatEyebrow}>CONVERSA</Text>
        <Text style={styles.chatTitle}>Conversar com o solicitante</Text>
        <Text style={styles.chatSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Icon icon={ChevronRight} size={22} color={appColors.white} strokeWidth={2.2} />
    </Pressable>
  );
}

function EtapaIndicator({ status }: { status: string }) {
  if (status === "cancelada") {
    return (
      <View style={styles.canceladaBox}>
        <Text style={styles.canceladaText}>Coleta cancelada</Text>
      </View>
    );
  }

  const currentIndex = ETAPAS.findIndex((etapa) => etapa.key === status);

  return (
    <View style={styles.etapaRow}>
      {ETAPAS.map((etapa, index) => {
        const done = currentIndex >= 0 && index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <View key={etapa.key} style={styles.etapaItem}>
            <View style={[styles.etapaBar, done && styles.etapaBarDone]} />
            <Text
              style={[styles.etapaLabel, isCurrent && styles.etapaLabelCurrent]}
              numberOfLines={1}
            >
              {etapa.label}
            </Text>
          </View>
        );
      })}
    </View>
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

const styles = StyleSheet.create({
  // Indicador horizontal das etapas da coleta.
  etapaRow: {
    flexDirection: "row",
    gap: 8,
  },
  etapaItem: {
    flex: 1,
    gap: 6,
  },
  etapaBar: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: appColors.stroke,
  },
  etapaBarDone: {
    backgroundColor: appColors.primary,
  },
  etapaLabel: {
    ...typography.meta,
    fontSize: 12,
    color: appColors.textFaint,
    textAlign: "center",
  },
  etapaLabelCurrent: {
    color: appColors.primary,
    fontWeight: "700",
  },
  canceladaBox: {
    backgroundColor: appColors.dangerBg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  canceladaText: {
    ...typography.bodyStrong,
    color: appColors.dangerText,
    textAlign: "center",
  },
  // Bloco de confirmação inline (confirmar/voltar) ao avançar ou cancelar.
  confirmBox: {
    gap: spacing.sm,
    backgroundColor: appColors.surfaceTint,
    borderRadius: radius.sm,
    padding: spacing.lg,
  },
  confirmTitle: {
    ...typography.sectionTitle,
    color: appColors.text,
  },
  confirmText: {
    ...typography.body,
    color: appColors.textSoft,
  },
  // Card de acesso ao chat, em destaque (verde da marca, igual à bolha enviada).
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: appColors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadows.button,
  },
  chatCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  chatIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatTextCol: {
    flex: 1,
    gap: 2,
  },
  chatEyebrow: {
    ...typography.eyebrow,
    color: "rgba(255,255,255,0.75)",
  },
  chatTitle: {
    ...typography.sectionTitle,
    color: appColors.white,
  },
  chatSubtitle: {
    ...typography.body,
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
});
