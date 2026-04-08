import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, typography } from "@/theme/tokens";

type ButtonTone = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  label,
  onPress,
  tone = "primary",
  disabled,
  align = "center",
}: {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
  align?: "center" | "left";
}) {
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
    minHeight: 56,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    borderWidth: 1,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  leftAlign: {
    alignItems: "flex-start",
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryStrong,
    ...shadows.float,
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
  },
  disabled: {
    opacity: 0.56,
  },
});
