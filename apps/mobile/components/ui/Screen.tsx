import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, layout, radius } from "@/theme/tokens";

export function Screen({
  children,
  scroll = true,
  center = false,
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  center?: boolean;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        footer ? styles.scrollContentWithFooter : null,
        center ? styles.centerContent : null,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, center ? styles.centerContent : null]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.background}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -insets.bottom}
      >
        {body}
        {!!footer && <View style={styles.footer}>{footer}</View>}
        {!footer && (
          <View
            style={[styles.systemBar, { height: Math.max(insets.bottom, 16) }]}
            pointerEvents="none"
          >
            <View style={styles.systemBarHandle} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  background: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flex: 1,
    padding: layout.screenPadding,
    gap: layout.sectionGap,
  },
  scrollContent: {
    padding: layout.screenPadding,
    gap: layout.sectionGap,
    paddingBottom: 28,
  },
  scrollContentWithFooter: {
    paddingBottom: 12,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  footer: {
    padding: layout.screenPadding,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.stroke,
    backgroundColor: colors.canvas,
    gap: 10,
  },
  // Footer que cobre a área dos botões do sistema, presente em todas as telas.
  systemBar: {
    borderTopWidth: 1,
    borderTopColor: colors.stroke,
    backgroundColor: colors.surfaceStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  systemBarHandle: {
    width: 120,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.stroke,
  },
});
