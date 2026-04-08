import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, radius, spacing, typography } from "@/theme/tokens";

export function Field({
  label,
  helper,
  error,
  multiline,
  secureToggle,
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
  secureToggle?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: any;
  textContentType?: any;
}) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const isSecure = !!props.secureTextEntry;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <View
        style={[
          styles.inputShell,
          focused && styles.inputShellFocused,
          !!error && styles.inputShellError,
          multiline && styles.inputShellMultiline,
        ]}
      >
        <TextInput
          {...props}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          secureTextEntry={isSecure ? !visible : false}
          placeholderTextColor={colors.textFaint}
          style={[styles.input, multiline && styles.inputMultiline]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureToggle && isSecure && (
          <Pressable
            onPress={() => setVisible((current) => !current)}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>{visible ? "Ocultar" : "Mostrar"}</Text>
          </Pressable>
        )}
      </View>
      {!!error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !!helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    ...typography.eyebrow,
    color: colors.textSoft,
  },
  inputShell: {
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: colors.surface,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  inputShellFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.white,
  },
  inputShellError: {
    borderColor: "#d59595",
  },
  inputShellMultiline: {
    alignItems: "flex-start",
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  input: {
    flex: 1,
    color: colors.text,
    ...typography.bodyStrong,
  },
  inputMultiline: {
    minHeight: 108,
  },
  toggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  toggleText: {
    ...typography.meta,
    color: colors.primary,
  },
  helper: {
    ...typography.meta,
    color: colors.textFaint,
  },
  error: {
    ...typography.meta,
    color: colors.dangerText,
  },
});
