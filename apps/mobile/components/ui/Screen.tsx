import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, layout, radius } from "@/theme/tokens";
import { RefreshBanner } from "@/components/ui/RefreshBanner";

export function Screen({
  children,
  scroll = true,
  center = false,
  footer,
  refreshing,
  onRefresh,
}: {
  children: ReactNode;
  scroll?: boolean;
  center?: boolean;
  footer?: ReactNode;
  /** Estado do pull-to-refresh (controlado pela tela, ex.: query.isRefetching). */
  refreshing?: boolean;
  /** Informe para habilitar o "arraste para atualizar" nesta tela. */
  onRefresh?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const canRefresh = scroll && !!onRefresh;
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        footer ? styles.scrollContentWithFooter : null,
        center ? styles.centerContent : null,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        canRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary, colors.primaryMid]}
            progressBackgroundColor={colors.primaryTint}
          />
        ) : undefined
      }
    >
      {canRefresh && <RefreshBanner visible={!!refreshing} />}
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
