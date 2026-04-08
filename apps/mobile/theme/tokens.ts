export const colors = {
  canvas: "#edf3eb",
  canvasMuted: "#e4ece2",
  surface: "#fbfdf9",
  surfaceStrong: "#ffffff",
  surfaceTint: "#f2f7ef",
  stroke: "#d7e2d2",
  strokeStrong: "#bccdb6",
  text: "#162018",
  textSoft: "#526454",
  textFaint: "#718473",
  primary: "#204f34",
  primaryStrong: "#173a26",
  primarySoft: "#d9e9dc",
  accent: "#2f7a53",
  successBg: "#e3f2e6",
  successText: "#1f6a3b",
  warningBg: "#fff4d8",
  warningText: "#8b6400",
  dangerBg: "#fde8e8",
  dangerText: "#a03232",
  infoBg: "#e7eefc",
  infoText: "#3258b7",
  white: "#ffffff",
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
  lg: 28,
  pill: 999,
};

export const typography = {
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700" as const,
    letterSpacing: 1.8,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800" as const,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800" as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400" as const,
  },
  bodyStrong: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600" as const,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600" as const,
  },
  button: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "700" as const,
  },
  stat: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800" as const,
  },
};

export const shadows = {
  card: {
    shadowColor: "rgba(14, 30, 18, 0.18)",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  float: {
    shadowColor: "rgba(13, 28, 17, 0.22)",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
};

export const layout = {
  screenPadding: 20,
  sectionGap: 18,
};
