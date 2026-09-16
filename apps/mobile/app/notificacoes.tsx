import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Bell, CheckCheck } from "lucide-react-native";
import {
  AppButton,
  AppScreen,
  BottomNavigation,
  EmptyState,
  Icon,
  LoadingCard,
  SectionHeader,
} from "@/components/AppUI";
import { useProtectedRoute } from "@/lib/navigation";
import { EMPRESA_TABS, USUARIO_TABS } from "@/lib/tabs";
import { mapearHrefParaRota } from "@/lib/push";
import { useNotifications } from "@/contexts/NotificationsContext";
import { colors, radius, shadows, spacing, typography } from "@/theme/tokens";
import type { NotificacaoItem } from "@/lib/api";

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `há ${dias} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function NotificacoesScreen() {
  const { hasAccess, isLoading, user } = useProtectedRoute();
  const { notificacoes, naoLidas, carregando, marcarTodasLidas } = useNotifications();

  if (isLoading || !hasAccess || !user) {
    return (
      <AppScreen>
        <LoadingCard text="Carregando notificações..." />
      </AppScreen>
    );
  }

  const tabs = user.role === "empresa" ? EMPRESA_TABS : USUARIO_TABS;

  const abrir = (item: NotificacaoItem) => {
    void marcarTodasLidas();
    const rota = mapearHrefParaRota(item.href);
    if (rota) router.push(rota as never);
  };

  return (
    <AppScreen footer={<BottomNavigation items={tabs} activeKey="" />}>
      <SectionHeader
        eyebrow="ATUALIZAÇÕES"
        title="Notificações"
        description="Acompanhe o andamento das coletas, mensagens e avaliações."
      />

      {naoLidas > 0 && (
        <AppButton
          label="Marcar todas como lidas"
          tone="secondary"
          icon={CheckCheck}
          onPress={() => void marcarTodasLidas()}
        />
      )}

      {carregando && notificacoes.length === 0 ? (
        <LoadingCard text="Carregando notificações..." />
      ) : notificacoes.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nenhuma notificação"
          description="Quando houver novidades nas suas coletas, elas aparecerão aqui."
        />
      ) : (
        <View style={styles.lista}>
          {notificacoes.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => abrir(item)}
              style={({ pressed }) => [
                styles.card,
                !item.lida && styles.cardUnread,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={[styles.iconWrap, !item.lida && styles.iconWrapUnread]}>
                <Icon
                  icon={Bell}
                  size={20}
                  color={item.lida ? colors.textSoft : colors.primary}
                />
              </View>
              <View style={styles.textWrap}>
                <View style={styles.topRow}>
                  <Text style={styles.titulo} numberOfLines={1}>
                    {item.titulo}
                  </Text>
                  {!item.lida && <View style={styles.dot} />}
                </View>
                <Text style={styles.descricao} numberOfLines={3}>
                  {item.descricao}
                </Text>
                <Text style={styles.tempo}>{tempoRelativo(item.createdAt)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  lista: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stroke,
    ...shadows.card,
  },
  cardUnread: {
    borderColor: colors.primarySoft,
    backgroundColor: colors.primaryTint,
  },
  cardPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapUnread: {
    backgroundColor: colors.primarySoft,
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  titulo: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  descricao: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSoft,
  },
  tempo: {
    ...typography.meta,
    color: colors.textFaint,
    marginTop: 2,
  },
});
