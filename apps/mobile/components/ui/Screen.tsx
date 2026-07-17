import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, layout } from "@/theme/tokens";

export function Screen({
  children,
  scroll = true,
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        footer ? styles.scrollContentWithFooter : null,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.background}>
        {body}
        {!!footer && <View style={styles.footer}>{footer}</View>}
      </View>
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
  footer: {
    padding: layout.screenPadding,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.stroke,
    backgroundColor: colors.canvas,
    gap: 10,
  },
});
