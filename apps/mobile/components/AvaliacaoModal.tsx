import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Star } from "lucide-react-native";
import { appColors } from "@/components/AppUI";
import { getReadableErrorMessage } from "@/lib/api";
import { radius, shadows, spacing, typography } from "@/theme/tokens";

const STAR_COLOR = "#F5B301";
const NOTA_LABEL: Record<number, string> = {
  1: "Péssimo",
  2: "Ruim",
  3: "Regular",
  4: "Bom",
  5: "Excelente",
};

export function AvaliacaoModal({
  visible,
  nomeContraparte,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  /** Nome de quem está sendo avaliado (empresa, se for o usuário avaliando; ou o solicitante, se for a empresa). */
  nomeContraparte?: string;
  onClose: () => void;
  onSubmit: (nota: number, comentario?: string) => Promise<unknown>;
}) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // Reinicia o formulário sempre que o popup abre.
  useEffect(() => {
    if (visible) {
      setNota(0);
      setComentario("");
      setErro("");
      setLoading(false);
    }
  }, [visible]);

  async function handleEnviar() {
    if (nota === 0) {
      setErro("Escolha de 1 a 5 estrelas.");
      return;
    }
    setLoading(true);
    setErro("");
    try {
      await onSubmit(nota, comentario.trim() || undefined);
    } catch (e) {
      setErro(getReadableErrorMessage(e, "Não foi possível enviar a avaliação."));
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Como foi a coleta?</Text>
          <Text style={styles.subtitle}>
            {nomeContraparte
              ? `Sua coleta com ${nomeContraparte} foi concluída. Conte como foi a experiência.`
              : "Sua coleta foi concluída. Conte como foi a experiência."}
          </Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((valor) => {
              const ativo = valor <= nota;
              return (
                <Pressable
                  key={valor}
                  onPress={() => {
                    setErro("");
                    setNota(valor);
                  }}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`${valor} ${valor === 1 ? "estrela" : "estrelas"}`}
                  style={({ pressed }) => pressed && styles.starPressed}
                >
                  <Star
                    size={38}
                    color={ativo ? STAR_COLOR : appColors.strokeStrong}
                    fill={ativo ? STAR_COLOR : "transparent"}
                    strokeWidth={1.8}
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.notaLabel}>{nota > 0 ? NOTA_LABEL[nota] : " "}</Text>

          <TextInput
            style={styles.input}
            value={comentario}
            onChangeText={setComentario}
            placeholder="Deixe um comentário (opcional)"
            placeholderTextColor={appColors.textFaint}
            multiline
            maxLength={500}
          />

          {!!erro && <Text style={styles.erro}>{erro}</Text>}

          <Pressable
            onPress={handleEnviar}
            disabled={loading}
            style={({ pressed }) => [
              styles.primaryBtn,
              loading && styles.btnDisabled,
              pressed && !loading && styles.btnPressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={appColors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Enviar avaliação</Text>
            )}
          </Pressable>

          <Pressable
            onPress={onClose}
            disabled={loading}
            style={({ pressed }) => [styles.ghostBtn, pressed && !loading && styles.btnPressed]}
          >
            <Text style={styles.ghostBtnText}>Agora não</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: appColors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.float,
  },
  title: {
    ...typography.title,
    fontSize: 22,
    color: appColors.text,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: appColors.textSoft,
    textAlign: "center",
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  starPressed: {
    opacity: 0.6,
  },
  notaLabel: {
    ...typography.bodyStrong,
    color: appColors.primary,
    textAlign: "center",
    minHeight: 22,
  },
  input: {
    minHeight: 74,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: appColors.stroke,
    borderRadius: radius.sm,
    padding: spacing.md,
    textAlignVertical: "top",
    ...typography.body,
    color: appColors.text,
    marginTop: spacing.xs,
  },
  erro: {
    ...typography.meta,
    fontSize: 13,
    color: appColors.dangerText,
    textAlign: "center",
  },
  primaryBtn: {
    height: 50,
    borderRadius: radius.sm,
    backgroundColor: appColors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  primaryBtnText: {
    ...typography.button,
    color: appColors.white,
  },
  ghostBtn: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: {
    ...typography.button,
    color: appColors.textSoft,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPressed: {
    opacity: 0.85,
  },
});
