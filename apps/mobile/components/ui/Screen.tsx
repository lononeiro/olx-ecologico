import type { ReactNode } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { colors, layout } from "@/theme/tokens";

export function Screen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.background}>
        <View style={styles.orbPrimary} />
        <View style={styles.orbSecondary} />
        <View style={styles.orbTertiary} />
        {body}
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
  orbPrimary: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "#d8e8d9",
    opacity: 0.8,
    top: -40,
    right: -30,
  },
  orbSecondary: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: "#f5e8d7",
    opacity: 0.45,
    top: 150,
    left: -70,
  },
  orbTertiary: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "#dbe6ee",
    opacity: 0.32,
    bottom: -60,
    right: -80,
  },
});
