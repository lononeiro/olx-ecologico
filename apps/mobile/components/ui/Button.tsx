import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, layout, radius, shadows, spacing, typography } from "@/theme/tokens";
import { Icon, type LucideIcon } from "@/components/ui/Icon";

type ButtonTone = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  label,
  onPress,
  tone = "primary",
  disabled,
  align = "center",
  icon,
}: {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
  align?: "center" | "left";
  icon?: LucideIcon;
}) {
  const iconColor =
    tone === "primary" || tone === "danger" ? colors.white : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        tone === "primary" && styles.primary,
        tone === "secondary" && styles.secondary,
        tone === "danger" && styles.danger,
        tone === "ghost" && styles.ghost,
        align === "left" && styles.leftAlign,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {!!icon && <Icon icon={icon} size={18} color={iconColor} strokeWidth={2} />}
        <Text
          style={[
            styles.label,
            tone === "primary" && styles.primaryLabel,
            tone === "danger" && styles.primaryLabel,
            tone === "ghost" && styles.ghostLabel,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minTouchHeight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    borderWidth: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  leftAlign: {
    alignItems: "flex-start",
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.button,
  },
  secondary: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.strokeStrong,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  danger: {
    backgroundColor: colors.dangerText,
    borderColor: colors.dangerText,
  },
  label: {
    ...typography.button,
    color: colors.text,
  },
  primaryLabel: {
    color: colors.white,
  },
  ghostLabel: {
    color: colors.primary,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.56,
  },
});
