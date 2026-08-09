import { useState, type ReactNode } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  FileText,
  MapPin,
  MessageCircleQuestion,
  Package,
  PackageCheck,
  Truck,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  AppButton,
  AppCard,
  AppScreen,
  Icon,
  LoadingCard,
  MessageBanner,
  MobileListItem,
  SectionHeader,
  StatusBadge,
  appColors,
} from "@/components/AppUI";
import { ImageGallery } from "@/components/ImageGallery";
import {
  acceptSolicitacao,
  getReadableErrorMessage,
  getSolicitacaoById,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";
import { radius, spacing, typography } from "@/theme/tokens";

const STATUS_COPY: Record<string, string> = {
  aprovada:
    "Disponível para aceite. Ao aceitar a coleta você recebe os dados de contato do solicitante.",
};

export default function EmpresaSolicitacaoDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { accessToken, hasAccess, isLoading, refreshSession, user } =
    useProtectedRoute(["empresa"]);
  const id = Number(params.id);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error">("success");

  const query = useQuery({
    queryKey: ["empresa", "solicitacao", id],
    enabled: hasAccess && !isLoading && Number.isFinite(id),
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        getSolicitacaoById(token, id)
      ),
  });

  const acceptMutation = useMutation({
    mutationFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        acceptSolicitacao(token, id)
      ),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: ["empresa", "solicitacoes", "disponiveis"],
      });
      void queryClient.invalidateQueries({ queryKey: ["empresa", "coletas"] });
      router.push(`/empresa/coletas/${data.id}` as any);
    },
    onError: (error) => {
      setTone("error");
      setMessage(
        getReadableErrorMessage(error, "Não foi possível aceitar a solicitação.")
      );
    },
  });

  if (isLoading || !hasAccess || !user || query.isLoading) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando solicitação..." />
      </AppScreen>
    );
  }

  if (query.error || !query.data) {
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
  const coleta = item.coleta;
  const disponivel = !coleta && item.status === "aprovada";

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
      {/* Galeria de fotos em destaque */}
      <ImageGallery images={item.imagens} />

      {/* Resumo enxuto */}
      <AppCard>
        <SectionHeader eyebrow={`SOLICITAÇÃO #${item.id}`} title={item.titulo} />
        <View style={styles.badgeRow}>
          <StatusBadge kind="solicitacao" value={item.status} />
          {!!coleta && <StatusBadge kind="coleta" value={coleta.status} />}
        </View>
        <Text style={styles.summaryLine}>
          {item.material.nome} · {item.quantidade}
        </Text>
        <Text style={styles.statusCopy}>
          {STATUS_COPY[item.status] ?? "Acompanhe os dados desta solicitação."}
        </Text>
      </AppCard>

      {/* Tirar dúvida com o solicitante (pré-aceite) */}
      {disponivel ? (
        <AppCard>
          <MobileListItem
            icon={MessageCircleQuestion}
            tone="primary"
            title="Tirar dúvida"
            subtitle="Pergunte sobre volume, acesso ou estado do material antes de aceitar."
            onPress={() =>
              router.push(`/empresa/solicitacoes/${id}/conversa` as any)
            }
          />
        </AppCard>
      ) : null}

      {/* Coleta já aceita por esta empresa */}
      {coleta ? (
        <AppCard>
          <MobileListItem
            icon={Truck}
            tone="primary"
            title="Acompanhar coleta"
            subtitle="Abra o painel operacional para atualizar o andamento e conversar."
            onPress={() => router.push(`/empresa/coletas/${coleta.id}` as any)}
          />
        </AppCard>
      ) : null}

      {/* Detalhes completos (colapsável) */}
      <Collapsible
        icon={FileText}
        eyebrow="MAIS INFORMAÇÕES"
        title="Detalhes da solicitação"
        defaultOpen
      >
        <DetailRow icon={Package} label="Material" value={item.material.nome} />
        <DetailRow label="Quantidade" value={item.quantidade} />
        <DetailRow icon={MapPin} label="Região" value={item.endereco} />
        <DetailRow icon={FileText} label="Descrição" value={item.descricao} />
        <DetailRow
          icon={Calendar}
          label="Criada em"
          value={new Date(item.createdAt).toLocaleString("pt-BR")}
          last
        />
      </Collapsible>

      {!!message && <MessageBanner message={message} tone={tone} />}

      {disponivel ? (
        <AppButton
          label={
            acceptMutation.isPending
              ? "Aceitando solicitação..."
              : "Aceitar solicitação"
          }
          icon={PackageCheck}
          onPress={() => acceptMutation.mutate()}
          disabled={acceptMutation.isPending}
        />
      ) : null}
    </AppScreen>
  );
}

function Collapsible({
  icon,
  eyebrow,
  title,
  defaultOpen = false,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <AppCard>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        style={({ pressed }) => [styles.collapseHeader, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <View style={styles.collapseIcon}>
          <Icon icon={icon} size={18} color={appColors.primary} />
        </View>
        <View style={styles.collapseHeaderText}>
          <Text style={styles.detailLabel}>{eyebrow}</Text>
          <Text style={styles.collapseTitle}>{title}</Text>
        </View>
        <View style={open ? styles.chevronOpen : undefined}>
          <Icon icon={ChevronDown} size={20} color={appColors.textSoft} />
        </View>
      </Pressable>
      {open ? <View style={styles.collapseBody}>{children}</View> : null}
    </AppCard>
  );
}

function DetailRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowDivider]}>
      <Text style={styles.detailLabel}>{label.toUpperCase()}</Text>
      <View style={styles.detailValueRow}>
        {!!icon && <Icon icon={icon} size={16} color={appColors.textFaint} />}
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryLine: {
    ...typography.bodyStrong,
    color: appColors.text,
  },
  statusCopy: {
    ...typography.body,
    color: appColors.textSoft,
  },
  collapseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  collapseIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: appColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  collapseHeaderText: {
    flex: 1,
    gap: 2,
  },
  collapseTitle: {
    ...typography.sectionTitle,
    color: appColors.text,
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  collapseBody: {
    marginTop: spacing.xs,
  },
  detailRow: {
    gap: 4,
    paddingVertical: spacing.md,
  },
  detailRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: appColors.stroke,
  },
  detailLabel: {
    ...typography.eyebrow,
    color: appColors.textFaint,
  },
  detailValueRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  detailValue: {
    ...typography.body,
    fontWeight: "600",
    color: appColors.text,
    flex: 1,
  },
});
