import { StyleSheet, Text, View } from "react-native";
import { appColors } from "@/components/AppUI";
import { radius, spacing, typography } from "@/theme/tokens";

// Etapas do fluxo normal de uma coleta, em ordem.
export const ETAPAS = [
  { key: "aceita", label: "Aceita" },
  { key: "a_caminho", label: "A caminho" },
  { key: "em_coleta", label: "Em coleta" },
  { key: "concluida", label: "Concluída" },
] as const;

export function EtapaIndicator({ status }: { status: string }) {
  if (status === "cancelada") {
    return (
      <View style={styles.canceladaBox}>
        <Text style={styles.canceladaText}>Coleta cancelada</Text>
      </View>
    );
  }

  const currentIndex = ETAPAS.findIndex((etapa) => etapa.key === status);

  return (
    <View style={styles.etapaRow}>
      {ETAPAS.map((etapa, index) => {
        const done = currentIndex >= 0 && index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <View key={etapa.key} style={styles.etapaItem}>
            <View style={[styles.etapaBar, done && styles.etapaBarDone]} />
            <Text
              style={[styles.etapaLabel, isCurrent && styles.etapaLabelCurrent]}
              numberOfLines={1}
            >
              {etapa.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  etapaRow: {
    flexDirection: "row",
    gap: 8,
  },
  etapaItem: {
    flex: 1,
    gap: 6,
  },
  etapaBar: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: appColors.stroke,
  },
  etapaBarDone: {
    backgroundColor: appColors.primary,
  },
  etapaLabel: {
    ...typography.meta,
    fontSize: 12,
    color: appColors.textFaint,
    textAlign: "center",
  },
  etapaLabelCurrent: {
    color: appColors.primary,
    fontWeight: "700",
  },
  canceladaBox: {
    backgroundColor: appColors.dangerBg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  canceladaText: {
    ...typography.bodyStrong,
    color: appColors.dangerText,
    textAlign: "center",
  },
});
