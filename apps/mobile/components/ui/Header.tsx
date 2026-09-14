import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme/tokens";

export function PageHeader({
  eyebrow,
  title,
  description,
  align = "left",
  right,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /** Ação opcional no canto direito (ex.: sino de notificações). */
  right?: ReactNode;
}) {
  const texts = (
    <View style={[styles.wrap, align === "center" && styles.center, styles.flex]}>
      {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text style={[styles.title, align === "center" && styles.centerText]}>{title}</Text>
      {!!description && (
        <Text style={[styles.description, align === "center" && styles.centerText]}>
          {description}
        </Text>
      )}
    </View>
  );

  if (!right) return texts;

  return (
    <View style={styles.row}>
      {texts}
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  right: {
    paddingTop: 2,
  },
  center: {
    alignItems: "center",
  },
  centerText: {
    textAlign: "center",
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
    textTransform: "uppercase",
  },
  title: {
    ...typography.title,
    color: colors.text,
    letterSpacing: -0.4,
  },
  description: {
    ...typography.body,
    color: colors.textSoft,
    maxWidth: 520,
  },
});
