import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  STATUS_COLETA_LABEL,
  STATUS_SOLICITACAO_LABEL,
} from "@shared";

type Tone = "primary" | "secondary" | "danger";

const COLORS = {
  bg: "#f4f8f2",
  card: "#ffffff",
  border: "#d6ead6",
  text: "#122114",
  muted: "#537156",
  primary: "#1e7a32",
  danger: "#9f3029",
  dangerBg: "#fff1f1",
  successBg: "#eef7ec",
  successText: "#1e7a32",
};

export function AppScreen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  if (!scroll) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ flex: 1, padding: 24 }}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function AppCard({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "danger";
}) {
  const backgroundColor =
    tone === "success"
      ? COLORS.successBg
      : tone === "danger"
        ? COLORS.dangerBg
        : COLORS.card;
  const borderColor =
    tone === "danger" ? "#f2b8b5" : COLORS.border;

  return (
    <View
      style={{
        backgroundColor,
        borderRadius: 24,
        padding: 20,
        gap: 12,
        borderWidth: 1,
        borderColor,
      }}
    >
      {children}
    </View>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      {!!eyebrow && (
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#2f8d47", letterSpacing: 2 }}>
          {eyebrow}
        </Text>
      )}
      <Text style={{ fontSize: 28, fontWeight: "700", color: COLORS.text }}>
        {title}
      </Text>
      {!!description && (
        <Text style={{ color: COLORS.muted, lineHeight: 22 }}>{description}</Text>
      )}
    </View>
  );
}

export function AppButton({
  label,
  onPress,
  tone = "primary",
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
}) {
  const backgroundColor =
    tone === "primary"
      ? COLORS.primary
      : tone === "danger"
        ? COLORS.danger
        : COLORS.card;
  const textColor = tone === "secondary" ? COLORS.text : "#ffffff";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: tone === "secondary" ? 1 : 0,
        borderColor: COLORS.border,
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <Text style={{ color: textColor, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

export function AppField({
  label,
  multiline,
  helper,
  error,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  helper?: string;
  error?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: any;
  textContentType?: any;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        {...props}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          backgroundColor: COLORS.card,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          minHeight: multiline ? 120 : undefined,
          borderWidth: 1,
          borderColor: error ? "#f2b8b5" : COLORS.border,
          color: COLORS.text,
        }}
      />
      {!!helper && !error && (
        <Text style={{ color: COLORS.muted, fontSize: 12 }}>{helper}</Text>
      )}
      {!!error && (
        <Text style={{ color: COLORS.danger, fontSize: 12 }}>{error}</Text>
      )}
    </View>
  );
}

export function MessageBanner({
  message,
  tone,
}: {
  message: string;
  tone: "success" | "error";
}) {
  return (
    <AppCard tone={tone === "success" ? "success" : "danger"}>
      <Text
        style={{
          color: tone === "success" ? COLORS.successText : COLORS.danger,
          fontWeight: "700",
        }}
      >
        {message}
      </Text>
    </AppCard>
  );
}

export function LoadingCard({ text }: { text: string }) {
  return (
    <AppCard>
      <View style={{ alignItems: "center", gap: 12 }}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={{ color: COLORS.muted }}>{text}</Text>
      </View>
    </AppCard>
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
    <AppCard>
      <View style={{ gap: 8, alignItems: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.text }}>
          {title}
        </Text>
        <Text style={{ color: COLORS.muted, textAlign: "center", lineHeight: 22 }}>
          {description}
        </Text>
      </View>
    </AppCard>
  );
}

export function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 18,
        gap: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>
        {label.toUpperCase()}
      </Text>
      {typeof value === "string" ? (
        <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "600" }}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

export function StatusBadge({
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
      ? { bg: "#fff7db", color: "#8a6200" }
      : value === "rejeitada" || value === "cancelada"
        ? { bg: "#fff1f1", color: "#9f3029" }
        : value === "em_coleta"
          ? { bg: "#eef3ff", color: "#3155b6" }
          : { bg: "#eef7ec", color: "#1e7a32" };

  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: palette.bg,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <Text style={{ color: palette.color, fontWeight: "700", fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}

export function StatRow({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <View
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 18,
        gap: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
        minWidth: 140,
      }}
    >
      <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: "700" }}>
        {value}
      </Text>
    </View>
  );
}

export const appColors = COLORS;
