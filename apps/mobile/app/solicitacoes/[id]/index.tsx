import { useState, type ReactNode } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronDown,
  FileText,
  MapPin,
  MessageCircle,
  Package,
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
  getConversasSolicitacao,
  getReadableErrorMessage,
  getSolicitacaoById,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";
import { radius, spacing, typography } from "@/theme/tokens";

const STATUS_COPY: Record<string, string> = {
  aprovada: "Disponível para empresas. Você será avisado quando uma aceitar a coleta.",
  cancelada: "Você cancelou esta solicitação.",
  removida: "Solicitação removida pela administração.",
  rejeitada: "Solicitação rejeitada na análise.",
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

  const item = query.data;
  const semColeta = !item?.coleta && item?.status === "aprovada";

  const conversasQuery = useQuery({
    queryKey: ["solicitacoes", id, "conversas"],
    enabled: hasAccess && !isLoading && Number.isFinite(id) && semColeta,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        getConversasSolicitacao(token, id)
      ),
  });

  if (isLoading || !hasAccess || !user || query.isLoading) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando solicitação..." />
      </AppScreen>
    );
  }

  if (query.error || !item) {
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

  const coleta = item.coleta;
  const conversasCount = conversasQuery.data?.length ?? 0;

  const chatSubtitle = coleta
    ? coleta.company.user.nome
    : conversasCount > 0
      ? `${conversasCount} empresa${conversasCount === 1 ? "" : "s"} interessada${conversasCount === 1 ? "" : "s"}`
      : "Aguardando empresas interessadas";

  const podeConversar = !!coleta || semColeta;

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

      {/* Conversa com a empresa */}
      {podeConversar ? (
        <AppCard>
          <MobileListItem
            icon={MessageCircle}
            tone="primary"
            title="Conversa com a empresa"
            subtitle={chatSubtitle}
            onPress={() => router.push(`/solicitacoes/${id}/conversa` as any)}
          />
        </AppCard>
      ) : null}

      {/* Acompanhamento da coleta */}
      {coleta ? (
        <Collapsible icon={Truck} eyebrow="COLETA" title="Acompanhamento">
          <DetailRow
            icon={Building2}
            label="Empresa responsável"
            value={coleta.company.user.nome}
          />
          <DetailRow
            icon={Calendar}
            label="Data do aceite"
            value={new Date(coleta.dataAceite).toLocaleDateString("pt-BR")}
          />
          {!!coleta.codigoConfirmacao && (
            <DetailRow label="Código de confirmação" value={coleta.codigoConfirmacao} last />
          )}
        </Collapsible>
      ) : null}

      {/* Detalhes completos (colapsável) */}
      <Collapsible icon={FileText} eyebrow="MAIS INFORMAÇÕES" title="Detalhes da solicitação">
        <DetailRow icon={Package} label="Material" value={item.material.nome} />
        <DetailRow label="Quantidade" value={item.quantidade} />
        <DetailRow icon={MapPin} label="Endereço" value={item.endereco} />
        <DetailRow icon={FileText} label="Descrição" value={item.descricao} />
        <DetailRow
          icon={Calendar}
          label="Criada em"
          value={new Date(item.createdAt).toLocaleString("pt-BR")}
          last
        />
      </Collapsible>

      {item.status !== "aprovada" && !coleta ? (
        <MessageBanner
          message={STATUS_COPY[item.status] ?? "A solicitação ainda não possui coleta."}
          tone={item.status === "rejeitada" ? "error" : "info"}
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
