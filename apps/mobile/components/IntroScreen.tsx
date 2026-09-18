import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme/tokens";

/**
 * Tela de intro exibida por um instante ao abrir o app, antes do login/home.
 * Puramente decorativa (sem lógica de navegação) — quem chama decide por
 * quanto tempo mantê-la montada.
 */
export function IntroScreen() {
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(8)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.back(1.15)),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslate, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 620,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 620,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [logoOpacity, logoScale, textOpacity, textTranslate, dotsOpacity, pulse]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <View style={styles.logoWrap}>
          <Image
            source={require("../assets/images/splash-icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      <Animated.View
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textTranslate }],
        }}
      >
        <Text style={styles.brand}>ECOnecta</Text>
        <Text style={styles.tagline}>Reciclagem que conecta</Text>
      </Animated.View>

      <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                opacity: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: i === 1 ? [0.35, 1] : [1, 0.35],
                }),
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryTint,
    gap: spacing.xl,
  },
  logoWrap: {
    width: 160,
    height: 160,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    shadowColor: colors.primaryStrong,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  logo: {
    width: 108,
    height: 108,
  },
  brand: {
    ...typography.title,
    fontSize: 30,
    textAlign: "center",
    color: colors.primaryStrong,
    letterSpacing: -0.6,
  },
  tagline: {
    ...typography.body,
    textAlign: "center",
    color: colors.primaryMid,
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    position: "absolute",
    bottom: 64,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
