import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadows, spacing, typography } from "@/theme/tokens";
import { Icon, type LucideIcon } from "@/components/ui/Icon";

export type TabItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  route: string;
};

export function BottomNavigation({
  items,
  activeKey,
}: {
  items: TabItem[];
  activeKey: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {items.map((item) => {
        const focused = item.key === activeKey;

        return (
          <Pressable
            key={item.key}
            onPress={() => {
              if (!focused) router.replace(item.route as any);
            }}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
          >
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Icon
                icon={item.icon}
                size={22}
                strokeWidth={focused ? 2.2 : 1.75}
                color={focused ? colors.primary : colors.textFaint}
              />
            </View>
            <Text style={[styles.label, focused && styles.labelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: colors.surfaceStrong,
    borderTopWidth: 1,
    borderTopColor: colors.stroke,
    paddingTop: 8,
    paddingHorizontal: spacing.sm,
    ...shadows.nav,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 44,
    borderRadius: radius.sm,
  },
  tabPressed: {
    opacity: 0.6,
  },
  iconPill: {
    minWidth: 56,
    height: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconPillActive: {
    backgroundColor: colors.primarySoft,
  },
  label: {
    ...typography.meta,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textFaint,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
});
