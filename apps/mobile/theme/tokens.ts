export const colors = {
  canvas: "#F8FAF7",
  canvasMuted: "#F1F5F0",
  surface: "#FFFFFF",
  surfaceStrong: "#FFFFFF",
  surfaceTint: "#F3F7F2",
  stroke: "#E8ECE9",
  strokeStrong: "#D7DED9",
  text: "#202124",
  textSoft: "#6B7280",
  textFaint: "#8A9088",
  primary: "#2E7D5B",
  primaryStrong: "#25684B",
  primarySoft: "#E3EFE8",
  accent: "#2E7D5B",
  successBg: "#E5F3EA",
  successText: "#227A4C",
  warningBg: "#FDF3DC",
  warningText: "#92670B",
  dangerBg: "#FBE9E9",
  dangerText: "#B23A3A",
  infoBg: "#E8EEFB",
  infoText: "#3B5FB8",
  white: "#FFFFFF",
  black: "#000000",
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 14,
  md: 20,
  lg: 22,
  pill: 999,
};

type FontWeight = "400" | "500" | "600" | "700" | "800";

const fontFamilies: Record<FontWeight, string> = {
  "400": "Inter_400Regular",
  "500": "Inter_500Medium",
  "600": "Inter_600SemiBold",
  "700": "Inter_700Bold",
  "800": "Inter_800ExtraBold",
};

function fontFamily(weight: FontWeight) {
  return fontFamilies[weight];
}

export const typography = {
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700" as const,
    fontFamily: fontFamily("700"),
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800" as const,
    fontFamily: fontFamily("800"),
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700" as const,
    fontFamily: fontFamily("700"),
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400" as const,
    fontFamily: fontFamily("400"),
  },
  bodyStrong: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600" as const,
    fontFamily: fontFamily("600"),
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600" as const,
    fontFamily: fontFamily("600"),
  },
  button: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "700" as const,
    fontFamily: fontFamily("700"),
  },
  stat: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800" as const,
    fontFamily: fontFamily("800"),
  },
};

export const shadows = {
  card: {
    shadowColor: "rgba(32, 33, 36, 0.08)",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  float: {
    shadowColor: "rgba(32, 33, 36, 0.12)",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
};

export const layout = {
  screenPadding: 20,
  sectionGap: 16,
  minTouchHeight: 48,
};
