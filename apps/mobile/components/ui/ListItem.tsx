import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { Icon, type LucideIcon } from "@/components/ui/Icon";

export function MobileListItem({
  icon,
  title,
  subtitle,
  meta,
  onPress,
  tone = "default",
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  tone?: "default" | "primary";
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {!!icon && (
        <View
          style={[
            styles.iconWrap,
            tone === "primary" && styles.iconWrapPrimary,
          ]}
        >
          <Icon
            icon={icon}
            size={20}
            color={tone === "primary" ? colors.primary : colors.textSoft}
          />
        </View>
      )}
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.trailing}>
        {!!meta && <Text style={styles.meta}>{meta}</Text>}
        <Icon icon={ChevronRight} size={18} color={colors.textFaint} />
      </View>
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
    backgroundColor: colors.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapPrimary: {
    backgroundColor: colors.primarySoft,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  subtitle: {
    ...typography.meta,
    fontWeight: "500",
    color: colors.textSoft,
  },
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  meta: {
    ...typography.meta,
    color: colors.textFaint,
  },
});
