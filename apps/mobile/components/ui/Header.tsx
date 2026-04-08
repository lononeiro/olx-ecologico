import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme/tokens";

export function PageHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <View style={[styles.wrap, align === "center" && styles.center]}>
      {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text style={[styles.title, align === "center" && styles.centerText]}>{title}</Text>
      {!!description && (
        <Text style={[styles.description, align === "center" && styles.centerText]}>
          {description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
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
    letterSpacing: -0.8,
  },
  description: {
    ...typography.body,
    color: colors.textSoft,
    maxWidth: 520,
  },
});
