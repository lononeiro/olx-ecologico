import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius, shadows, spacing } from "@/theme/tokens";

export function SectionCard({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "subtle" | "success" | "danger" | "info";
}) {
  return (
    <View
      style={[
        styles.base,
        tone === "subtle" && styles.subtle,
        tone === "success" && styles.success,
        tone === "danger" && styles.danger,
        tone === "info" && styles.info,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.stroke,
    ...shadows.card,
  },
  subtle: {
    backgroundColor: colors.surfaceTint,
  },
  success: {
    backgroundColor: colors.successBg,
    borderColor: "#cae0d0",
  },
  danger: {
    backgroundColor: colors.dangerBg,
    borderColor: "#f0cccc",
  },
  info: {
    backgroundColor: colors.infoBg,
    borderColor: "#d2dcf4",
  },
});
