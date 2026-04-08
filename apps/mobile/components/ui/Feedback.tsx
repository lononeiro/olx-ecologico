import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme/tokens";

export function Banner({
  message,
  tone,
}: {
  message: string;
  tone: "success" | "error" | "info";
}) {
  return (
    <View
      style={[
        styles.banner,
        tone === "success" && styles.success,
        tone === "error" && styles.error,
        tone === "info" && styles.info,
      ]}
    >
      <Text
        style={[
          styles.bannerText,
          tone === "success" && styles.successText,
          tone === "error" && styles.errorText,
          tone === "info" && styles.infoText,
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

export function LoadingState({ text }: { text: string }) {
  return (
    <View style={styles.stateCard}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={styles.stateText}>{text}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.stateCard}>
      <View style={styles.emptyGlyph} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
  },
  success: {
    backgroundColor: colors.successBg,
    borderColor: "#cadecf",
  },
  error: {
    backgroundColor: colors.dangerBg,
    borderColor: "#ebc1c1",
  },
  info: {
    backgroundColor: colors.infoBg,
    borderColor: "#cfdbf5",
  },
  bannerText: {
    ...typography.bodyStrong,
  },
  successText: {
    color: colors.successText,
  },
  errorText: {
    color: colors.dangerText,
  },
  infoText: {
    color: colors.infoText,
  },
  stateCard: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stroke,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    alignItems: "center",
    gap: spacing.sm,
  },
  stateText: {
    ...typography.body,
    color: colors.textSoft,
  },
  emptyGlyph: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  emptyTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  emptyDescription: {
    ...typography.body,
    color: colors.textSoft,
    textAlign: "center",
  },
});
