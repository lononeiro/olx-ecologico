import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Clock, Plus, Truck } from "lucide-react-native";
import {
  AppScreen,
  BottomNavigation,
  EmptyState,
  Icon,
  LoadingCard,
  MessageBanner,
  StatusBadge,
} from "@/components/AppUI";
import { useProtectedRoute } from "@/lib/navigation";
import { ApiError, getMyProfile, getReadableErrorMessage, getSolicitacoes } from "@/lib/api";
import { resolveAccessToken } from "@/lib/session";
import { USUARIO_TABS } from "@/lib/tabs";
import { colors, radius, shadows, spacing, typography } from "@/theme/tokens";

export default function HomeScreen() {
  const { accessToken, hasAccess, isLoading, refreshSession, user } =
    useProtectedRoute(["usuario"]);

  const solicitacoesQuery = useQuery({
    queryKey: ["solicitacoes", "usuario"],
    enabled: hasAccess && !isLoading,
    queryFn: async () => {
      const token = await resolveAccessToken(accessToken, refreshSession);
      if (!token) throw new Error("Sua sessão expirou. Entre novamente.");

      try {
        return await getSolicitacoes(token);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
        const refreshed = await refreshSession();
        if (!refreshed) throw new Error("Sua sessão expirou. Entre novamente.");
        return getSolicitacoes(refreshed);
      }
    },
  });

  const profileQuery = useQuery({
    queryKey: ["me", user?.id],
    enabled: hasAccess && !isLoading && !!user,
    queryFn: async () => {
      const token = await resolveAccessToken(accessToken, refreshSession);
      if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
      return getMyProfile(token);
    },
  });

  if (isLoading || !hasAccess || !user) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando seu painel..." />
      </AppScreen>
    );
  }

  const avatarUrl = profileQuery.data?.avatarUrl ?? null;

  const solicitacoes = solicitacoesQuery.data ?? [];
  const emAndamento = solicitacoes
    .filter(
      (item) =>
        item.coleta &&
        item.coleta.status !== "concluida" &&
        item.coleta.status !== "cancelada"
    )
    // Coletas com alteração mais recente (mudança de status, etc.) primeiro.
    .sort(
      (a, b) =>
        new Date(b.coleta!.updatedAt).getTime() -
        new Date(a.coleta!.updatedAt).getTime()
    );
  // Solicitações publicadas que ainda não foram aceitas por nenhuma empresa.
  const aguardandoEmpresa = solicitacoes.filter(
    (item) => item.status === "aprovada" && !item.coleta
  );
  const semNada = emAndamento.length === 0 && aguardandoEmpresa.length === 0;

  return (
    <AppScreen
      footer={<BottomNavigation items={USUARIO_TABS} activeKey="home" />}
      refreshing={solicitacoesQuery.isRefetching || profileQuery.isRefetching}
      onRefresh={() => {
        solicitacoesQuery.refetch();
        profileQuery.refetch();
      }}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push("/me")}
          style={styles.avatar}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Ver meu perfil"
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
          )}
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Olá, {user.name.split(" ")[0]}</Text>
          <Text style={styles.subtitle}>Suas solicitações e coletas</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.plus, pressed && styles.plusPressed]}
          onPress={() => router.push("/solicitacoes/new")}
          accessibilityRole="button"
          accessibilityLabel="Nova solicitação"
          hitSlop={8}
        >
          <Icon icon={Plus} size={24} color={colors.white} strokeWidth={2.4} />
        </Pressable>
      </View>

      {solicitacoesQuery.isLoading && <LoadingCard text="Carregando coletas..." />}
      {solicitacoesQuery.error && (
        <MessageBanner
          message={getReadableErrorMessage(
            solicitacoesQuery.error,
            "Não foi possível carregar suas coletas."
          )}
          tone="error"
        />
      )}

      {!solicitacoesQuery.isLoading && semNada && (
        <EmptyState
          icon={Truck}
          title="Nenhuma solicitação por aqui"
          description="Toque no botão + para criar uma nova solicitação de coleta."
        />
      )}

      {emAndamento.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Em andamento</Text>
          {emAndamento.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(`/solicitacoes/${item.id}` as any)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.titulo}
                </Text>
                {!!item.coleta && (
                  <StatusBadge kind="coleta" value={item.coleta.status} />
                )}
              </View>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {item.material.nome} · {item.quantidade}
              </Text>
            </Pressable>
          ))}
        </>
      )}

      {aguardandoEmpresa.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Aguardando empresa</Text>
          {aguardandoEmpresa.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.card, styles.cardWaiting, pressed && styles.cardPressed]}
              onPress={() => router.push(`/solicitacoes/${item.id}` as any)}
            >
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.titulo}
              </Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {item.material.nome} · {item.quantidade}
              </Text>
              <View style={styles.waitingRow}>
                <Icon icon={Clock} size={14} color={colors.textFaint} strokeWidth={2} />
                <Text style={styles.waitingText}>Aguardando alguma empresa aceitar</Text>
              </View>
            </Pressable>
          ))}
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
  },
  avatarInitial: {
    ...typography.sectionTitle,
    color: colors.primary,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  greeting: {
    ...typography.title,
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSoft,
  },
  plus: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.button,
  },
  plusPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.92,
  },
  sectionTitle: {
    ...typography.meta,
    color: colors.textFaint,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  cardPressed: {
    borderColor: colors.primary,
    opacity: 0.95,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },
  cardMeta: {
    ...typography.meta,
    fontWeight: "500",
    color: colors.textSoft,
  },
  cardWaiting: {
    borderStyle: "dashed",
    borderColor: colors.strokeStrong,
  },
  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  waitingText: {
    ...typography.meta,
    fontWeight: "500",
    color: colors.textFaint,
  },
});
