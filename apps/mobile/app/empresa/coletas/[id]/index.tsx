import { useLocalSearchParams, router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
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

      {/* Conversa com o solicitante — em destaque */}
      <ChatHighlightCard
        subtitle={coleta.solicitacao.user?.nome ?? "Abrir conversa"}
        onPress={() => router.push(`/empresa/coletas/${coleta.id}/conversa` as any)}
      />

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
