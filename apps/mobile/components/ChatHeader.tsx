import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { appColors } from "@/components/AppUI";
import { Icon } from "@/components/ui/Icon";
import { radius, spacing, typography } from "@/theme/tokens";

/**
 * Cabeçalho compacto de conversa: voltar + avatar + nome/status,
 * usando a paleta verde do ECOnecta.
 */
export function ChatHeader({
  name,
  subtitle,
  avatarUrl,
  onBack,
}: {
  name: string;
  subtitle?: string;
  avatarUrl?: string | null;
  onBack: () => void;
}) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onBack}
        hitSlop={10}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <Icon icon={ArrowLeft} size={22} color={appColors.text} strokeWidth={2} />
      </Pressable>

      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: appColors.stroke,
  },
  back: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: appColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: appColors.primarySoft,
  },
  avatarText: {
    ...typography.sectionTitle,
    color: appColors.primary,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: appColors.text,
  },
  subtitle: {
    ...typography.meta,
    fontSize: 12,
    color: appColors.textSoft,
  },
});
