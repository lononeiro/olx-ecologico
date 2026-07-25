import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Plus, Truck } from "lucide-react-native";
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
import { ApiError, getReadableErrorMessage, getSolicitacoes } from "@/lib/api";
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

  if (isLoading || !hasAccess || !user) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando seu painel..." />
      </AppScreen>
    );
  }

  const solicitacoes = solicitacoesQuery.data ?? [];
  const emAndamento = solicitacoes.filter(
    (item) =>
      item.coleta &&
      item.coleta.status !== "concluida" &&
      item.coleta.status !== "cancelada"
  );

  return (
    <AppScreen
      footer={<BottomNavigation items={USUARIO_TABS} activeKey="home" />}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Olá, {user.name.split(" ")[0]}</Text>
          <Text style={styles.subtitle}>Suas coletas em andamento</Text>
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

      {!solicitacoesQuery.isLoading && emAndamento.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Nenhuma coleta em andamento"
          description="Toque no botão + para criar uma nova solicitação de coleta."
        />
      ) : (
        emAndamento.map((item) => (
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
        ))
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
});
