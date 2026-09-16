import { StyleSheet, Text, View } from "react-native";
import { Star } from "lucide-react-native";
import { colors, typography } from "@/theme/tokens";

/**
 * Exibe a reputação (média + nº de avaliações) que um cidadão recebeu das
 * empresas. Espelha o componente da versão web, usado nas telas de aceite.
 */
export function ReputacaoUsuario({
  media,
  total,
  size = 15,
  vazioLabel = "Sem avaliações ainda",
}: {
  media: number;
  total: number;
  size?: number;
  vazioLabel?: string;
}) {
  if (total <= 0) {
    return <Text style={styles.vazio}>{vazioLabel}</Text>;
  }

  const cheias = Math.round(media);

  return (
    <View style={styles.row}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            color={colors.warningText}
            fill={n <= cheias ? colors.warningText : "transparent"}
            strokeWidth={1.75}
          />
        ))}
      </View>
      <Text style={styles.media}>{media.toFixed(1)}</Text>
      <Text style={styles.total}>
        ({total} {total === 1 ? "avaliação" : "avaliações"})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  media: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  total: {
    ...typography.meta,
    fontWeight: "500",
    color: colors.textFaint,
  },
  vazio: {
    ...typography.meta,
    fontWeight: "500",
    color: colors.textFaint,
  },
});
