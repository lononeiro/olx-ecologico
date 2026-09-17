import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarClock } from "lucide-react-native";
import { appColors } from "@/components/AppUI";
import { getReadableErrorMessage } from "@/lib/api";
import { radius, shadows, spacing, typography } from "@/theme/tokens";

function formatDataHora(data: Date) {
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AceitarSolicitacaoModal({
  visible,
  titulo,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  titulo?: string;
  onClose: () => void;
  onSubmit: (dataPrevisaoColeta: string) => Promise<unknown>;
}) {
  const minDate = new Date();
  const [data, setData] = useState<Date | null>(null);
  const [pickerAberto, setPickerAberto] = useState<"date" | "time" | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // Reinicia o formulário sempre que o popup abre.
  useEffect(() => {
    if (visible) {
      setData(null);
      setErro("");
      setLoading(false);
      setPickerAberto(null);
    }
  }, [visible]);

  async function handleConfirmar() {
    if (!data) {
      setErro("Informe a data prevista para a coleta.");
      return;
    }
    setLoading(true);
    setErro("");
    try {
      await onSubmit(data.toISOString());
    } catch (e) {
      setErro(getReadableErrorMessage(e, "Não foi possível aceitar a solicitação."));
      setLoading(false);
    }
  }

  function handlePickerChange(evento: { type: string }, valor?: Date) {
    if (Platform.OS === "android") setPickerAberto(null);
    if (evento.type === "dismissed" || !valor) return;

    setErro("");
    setData((atual) => {
      const base = atual ?? new Date();
      const proxima = new Date(base);
      if (pickerAberto === "date") {
        proxima.setFullYear(valor.getFullYear(), valor.getMonth(), valor.getDate());
      } else {
        proxima.setHours(valor.getHours(), valor.getMinutes());
      }
      return proxima;
    });

    if (Platform.OS === "ios" && pickerAberto === "date") {
      setPickerAberto("time");
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
          <View style={styles.iconWrap}>
            <CalendarClock size={26} color={appColors.primary} strokeWidth={2} />
          </View>

          <Text style={styles.title}>Confirmar aceitação</Text>
          <Text style={styles.subtitle}>
            {titulo
              ? `Escolha a data prevista para coletar "${titulo}".`
              : "Escolha a data prevista para a coleta."}
          </Text>

          <Pressable
            onPress={() => setPickerAberto("date")}
            style={({ pressed }) => [styles.dateField, pressed && styles.btnPressed]}
          >
            <Text style={data ? styles.dateFieldValue : styles.dateFieldPlaceholder}>
              {data ? formatDataHora(data) : "Selecionar data e horário"}
            </Text>
          </Pressable>

          {pickerAberto && (
            <DateTimePicker
              value={data ?? minDate}
              mode={pickerAberto}
              minimumDate={minDate}
              is24Hour
              onChange={handlePickerChange}
              {...(Platform.OS === "ios" ? { display: "spinner" } : {})}
            />
          )}

          {Platform.OS === "ios" && pickerAberto && (
            <Pressable
              onPress={() => setPickerAberto(null)}
              style={({ pressed }) => [styles.iosDoneBtn, pressed && styles.btnPressed]}
            >
              <Text style={styles.iosDoneBtnText}>Pronto</Text>
            </Pressable>
          )}

          {!!erro && <Text style={styles.erro}>{erro}</Text>}

          <Text style={styles.aviso}>
            Ao aceitar, a empresa receberá o endereço completo da coleta e poderá trocar
            mensagens com o solicitante.
          </Text>

          <Pressable
            onPress={handleConfirmar}
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
              <Text style={styles.primaryBtnText}>Confirmar aceitação</Text>
            )}
          </Pressable>

          <Pressable
            onPress={onClose}
            disabled={loading}
            style={({ pressed }) => [styles.ghostBtn, pressed && !loading && styles.btnPressed]}
          >
            <Text style={styles.ghostBtnText}>Cancelar</Text>
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
  iconWrap: {
    alignSelf: "center",
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: appColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
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
  dateField: {
    marginTop: spacing.xs,
    height: 50,
    borderWidth: 1,
    borderColor: appColors.stroke,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  dateFieldValue: {
    ...typography.bodyStrong,
    color: appColors.text,
  },
  dateFieldPlaceholder: {
    ...typography.body,
    color: appColors.textFaint,
  },
  iosDoneBtn: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iosDoneBtnText: {
    ...typography.button,
    color: appColors.primary,
  },
  erro: {
    ...typography.meta,
    fontSize: 13,
    color: appColors.dangerText,
    textAlign: "center",
  },
  aviso: {
    ...typography.body,
    fontSize: 12,
    lineHeight: 17,
    color: appColors.textSoft,
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
