import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Bell } from "lucide-react-native";
import { colors, radius, typography } from "@/theme/tokens";
import { Icon } from "@/components/ui/Icon";
import { useNotifications } from "@/contexts/NotificationsContext";

/** Sino com badge de não lidas; navega para a central de notificações. */
export function NotificationBell() {
  const { naoLidas } = useNotifications();

  return (
    <Pressable
      onPress={() => router.push("/notificacoes" as never)}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={
        naoLidas > 0 ? `Notificações, ${naoLidas} não lidas` : "Notificações"
      }
    >
      <Icon icon={Bell} size={22} color={colors.text} strokeWidth={1.9} />
      {naoLidas > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{naoLidas > 9 ? "9+" : naoLidas}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTint,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  pressed: {
    opacity: 0.6,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    backgroundColor: colors.dangerText,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.canvas,
  },
  badgeText: {
    ...typography.meta,
    fontSize: 10,
    lineHeight: 12,
    color: colors.white,
  },
});
