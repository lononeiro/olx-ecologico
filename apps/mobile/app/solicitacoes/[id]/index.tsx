import { useEffect, useState, type ReactNode } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  KeyRound,
  MapPin,
  MessageCircle,
  Package,
  Star,
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
import { AvaliacaoModal } from "@/components/AvaliacaoModal";
import {
  criarAvaliacao,
  getAvaliacaoColeta,
  getConversasSolicitacao,
  getReadableErrorMessage,
  getSolicitacaoById,
} from "@/lib/api";
import { useProtectedRoute } from "@/lib/navigation";
import { withAutoRefresh } from "@/lib/session";
import { radius, shadows, spacing, typography } from "@/theme/tokens";

const STATUS_COPY: Record<string, string> = {
  aprovada: "Disponível para empresas. Você será avisado quando uma aceitar a coleta.",
  cancelada: "Você cancelou esta solicitação.",
  removida: "Solicitação removida pela administração.",
  rejeitada: "Solicitação rejeitada na análise.",
};

// Coletas cujo popup de avaliação já abriu sozinho nesta sessão — evita que ele
// reapareça a cada re-render/refetch ou ao voltar para a tela.
const coletasAutoAvaliadas = new Set<number>();

export default function SolicitacaoDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { accessToken, hasAccess, isLoading, refreshSession, user } =
    useProtectedRoute(["usuario"]);
  const id = Number(params.id);

  const query = useQuery({
    queryKey: ["detail", id],
    enabled: hasAccess && !isLoading && Number.isFinite(id),
    refetchInterval: 15000,
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

  // Avaliação: só faz sentido quando a coleta foi concluída.
  const coletaConcluidaId =
    item?.coleta?.status === "concluida" ? item.coleta.id : undefined;

  const avaliacaoQuery = useQuery({
    queryKey: ["avaliacao", coletaConcluidaId],
    enabled: hasAccess && !isLoading && !!accessToken && !!coletaConcluidaId,
    queryFn: async () =>
      withAutoRefresh(accessToken, refreshSession, (token) =>
        getAvaliacaoColeta(token, coletaConcluidaId!)
      ),
  });

  const jaAvaliou = !!avaliacaoQuery.data;
  const [avaliacaoModalAberta, setAvaliacaoModalAberta] = useState(false);
  const [avaliacaoDispensada, setAvaliacaoDispensada] = useState(false);

  // Abre o popup automaticamente assim que a coleta é concluída e ainda não foi
  // avaliada — mas apenas UMA vez por coleta (evita reabrir por re-render/refetch
  // ou ao voltar para a tela).
  useEffect(() => {
    if (
      coletaConcluidaId &&
      avaliacaoQuery.isSuccess &&
      !jaAvaliou &&
      !avaliacaoDispensada &&
      !coletasAutoAvaliadas.has(coletaConcluidaId)
    ) {
      coletasAutoAvaliadas.add(coletaConcluidaId);
      setAvaliacaoModalAberta(true);
    }
  }, [coletaConcluidaId, avaliacaoQuery.isSuccess, jaAvaliou, avaliacaoDispensada]);

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
      {/* Código de confirmação em destaque, no topo, enquanto a coleta está ativa */}
      {coleta?.codigoConfirmacao &&
      coleta.status !== "concluida" &&
      coleta.status !== "cancelada" ? (
        <CodigoConfirmacaoCard codigo={coleta.codigoConfirmacao} />
      ) : null}

      {/* Galeria de fotos em destaque */}
      <ImageGallery images={item.imagens} />

      {/* Resumo enxuto */}
      <AppCard>
        <SectionHeader eyebrow="SOLICITAÇÃO" title={item.titulo} />
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

      {/* Conversa com a empresa — em destaque */}
      {podeConversar ? (
        <ChatHighlightCard
          subtitle={chatSubtitle}
          badge={!coleta && conversasCount > 0 ? conversasCount : undefined}
          onPress={() => router.push(`/solicitacoes/${id}/conversa` as any)}
        />
      ) : null}

      {/* Avaliação da coleta concluída */}
      {coletaConcluidaId ? (
        jaAvaliou ? (
          <AppCard>
            <Text style={styles.avaliacaoDoneLabel}>SUA AVALIAÇÃO</Text>
            <View style={styles.avaliacaoStarsRow}>
              {[1, 2, 3, 4, 5].map((valor) => (
                <Star
                  key={valor}
                  size={22}
                  color="#F5B301"
                  fill={valor <= (avaliacaoQuery.data?.nota ?? 0) ? "#F5B301" : "transparent"}
                  strokeWidth={1.8}
                />
              ))}
            </View>
            {!!avaliacaoQuery.data?.comentario && (
              <Text style={styles.avaliacaoComentario}>“{avaliacaoQuery.data.comentario}”</Text>
            )}
          </AppCard>
        ) : (
          <AppCard>
            <MobileListItem
              icon={Star}
              tone="primary"
              title="Avaliar coleta"
              subtitle={`Conte como foi o atendimento de ${coleta?.company.user.nome ?? "a empresa"}`}
              onPress={() => setAvaliacaoModalAberta(true)}
            />
          </AppCard>
        )
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
            last
          />
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

      {coletaConcluidaId ? (
        <AvaliacaoModal
          visible={avaliacaoModalAberta}
          empresaNome={coleta?.company.user.nome}
          onClose={() => {
            setAvaliacaoModalAberta(false);
            setAvaliacaoDispensada(true);
          }}
          onSubmit={async (nota, comentario) => {
            await withAutoRefresh(accessToken, refreshSession, (token) =>
              criarAvaliacao(token, { coletaId: coletaConcluidaId, nota, comentario })
            );
            setAvaliacaoModalAberta(false);
            await avaliacaoQuery.refetch();
          }}
        />
      ) : null}
    </AppScreen>
  );
}

function ChatHighlightCard({
  subtitle,
  badge,
  onPress,
}: {
  subtitle: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chatCard, pressed && styles.chatCardPressed]}
      accessibilityRole="button"
      accessibilityLabel="Abrir conversa com a empresa"
    >
      <View style={styles.chatIcon}>
        <Icon icon={MessageCircle} size={26} color={appColors.white} strokeWidth={2} />
        {badge ? (
          <View style={styles.chatBadge}>
            <Text style={styles.chatBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.chatTextCol}>
        <Text style={styles.chatEyebrow}>CONVERSA</Text>
        <Text style={styles.chatTitle}>Conversar com a empresa</Text>
        <Text style={styles.chatSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Icon icon={ChevronRight} size={22} color={appColors.white} strokeWidth={2.2} />
    </Pressable>
  );
}

function CodigoConfirmacaoCard({ codigo }: { codigo: string }) {
  return (
    <View style={styles.codeCard}>
      <View style={styles.codeHeader}>
        <View style={styles.codeIcon}>
          <Icon icon={KeyRound} size={18} color={appColors.primary} />
        </View>
        <Text style={styles.codeEyebrow}>CÓDIGO DE CONFIRMAÇÃO</Text>
      </View>

      <Text style={styles.codeValue} selectable>
        {codigo}
      </Text>

      <Text style={styles.codeHint}>
        Quando o coletor chegar, informe este código para ele. É assim que a
        empresa confirma que a coleta foi feita com você — não compartilhe antes.
      </Text>
    </View>
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
  chatBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: radius.pill,
    paddingHorizontal: 5,
    backgroundColor: appColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  chatBadgeText: {
    ...typography.meta,
    fontSize: 11,
    color: appColors.primaryStrong,
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
  codeCard: {
    backgroundColor: appColors.primaryTint,
    borderWidth: 1,
    borderColor: appColors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  codeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  codeIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: appColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  codeEyebrow: {
    ...typography.eyebrow,
    color: appColors.primary,
  },
  codeValue: {
    fontSize: 40,
    lineHeight: 48,
    fontFamily: typography.title.fontFamily,
    fontWeight: "800",
    color: appColors.primaryStrong,
    textAlign: "center",
    letterSpacing: 6,
    paddingVertical: spacing.xs,
  },
  codeHint: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: appColors.textSoft,
    textAlign: "center",
  },
  avaliacaoDoneLabel: {
    ...typography.eyebrow,
    color: appColors.textFaint,
    marginBottom: spacing.xs,
  },
  avaliacaoStarsRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  avaliacaoComentario: {
    ...typography.body,
    fontStyle: "italic",
    color: appColors.textSoft,
    marginTop: spacing.sm,
  },
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
