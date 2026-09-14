import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { Icon, type LucideIcon } from "@/components/ui/Icon";

/**
 * Item da lista de conversas (mensagens). Diferente do MobileListItem, a prévia
 * da mensagem ganha uma linha própria (até 2 linhas), então o status — mesmo
 * longo, como "Aguardando empresa" — não rouba o espaço da mensagem.
 */
export function ConversaListItem({
  icon,
  title,
  preview,
  statusLabel,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  preview: string;
  statusLabel?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Icon icon={icon} size={20} color={colors.primary} />
      </View>

      <View style={styles.textWrap}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {!!statusLabel && (
            <View style={styles.statusChip}>
              <Text style={styles.statusText} numberOfLines={1}>
                {statusLabel}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.preview} numberOfLines={2}>
          {preview}
        </Text>
      </View>

      <Icon icon={ChevronRight} size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
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
  title: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },
  statusChip: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  statusText: {
    ...typography.meta,
    fontSize: 11,
    color: colors.textSoft,
  },
  preview: {
    ...typography.meta,
    fontWeight: "500",
    color: colors.textSoft,
  },
});
