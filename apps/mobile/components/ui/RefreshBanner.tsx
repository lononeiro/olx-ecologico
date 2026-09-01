import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";
import { Recycle } from "lucide-react-native";
import { colors, radius, typography } from "@/theme/tokens";

/**
 * Selo animado exibido durante o pull-to-refresh, sobreposto ao espaço
 * revelado pelo RefreshControl nativo. Não ocupa espaço no layout quando
 * oculto (position: absolute), então não desloca o conteúdo da tela.
 */
export function RefreshBanner({ visible }: { visible: boolean }) {
  const spin = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(enter, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 60,
      }).start();

      spin.setValue(0);
      const loop = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 850,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    }

    Animated.timing(enter, {
      toValue: 0,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [visible, enter, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          opacity: enter,
          transform: [
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) },
          ],
        },
      ]}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Recycle size={15} color={colors.primary} strokeWidth={2.3} />
      </Animated.View>
      <Text style={styles.text}>Atualizando...</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 6,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.primarySoft,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    // Sombra bem sutil para descolar do fundo sem pesar visualmente.
    shadowColor: "rgba(27, 67, 50, 0.18)",
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  text: {
    ...typography.meta,
    color: colors.primary,
  },
});
