import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  STATUS_COLETA_LABEL,
  STATUS_SOLICITACAO_LABEL,
} from "@shared";
import { colors, radius, spacing, typography } from "@/theme/tokens";

export function DataRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      {typeof value === "string" ? (
        <Text style={styles.value}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

export function StatusPill({
  kind,
  value,
}: {
  kind: "solicitacao" | "coleta";
  value: string;
}) {
  const label =
    kind === "solicitacao"
      ? STATUS_SOLICITACAO_LABEL[value] ?? value
      : STATUS_COLETA_LABEL[value] ?? value;

  const palette =
    value === "pendente" || value === "a_caminho"
      ? { bg: colors.warningBg, text: colors.warningText }
      : value === "rejeitada" || value === "cancelada"
        ? { bg: colors.dangerBg, text: colors.dangerText }
        : value === "em_coleta"
          ? { bg: colors.infoBg, text: colors.infoText }
          : { bg: colors.successBg, text: colors.successText };

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.pillText, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

export function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.stroke,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  label: {
    ...typography.eyebrow,
    color: colors.textFaint,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillText: {
    ...typography.meta,
    fontWeight: "700",
  },
  stat: {
    minWidth: 148,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.stroke,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  statValue: {
    ...typography.stat,
    color: colors.text,
  },
});
