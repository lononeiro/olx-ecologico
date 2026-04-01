"use client";

import { useTheme } from "@/components/ui/ThemeProvider";

export function ThemeToggle({
  compact,
}: {
  compact?: boolean;
}) {
  const { mounted, theme, toggleTheme } = useTheme();

  const iconSize = compact ? 17 : 18;
  const label = theme === "dark" ? "Modo claro" : "Modo escuro";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={compact ? "btn-icon" : undefined}
      aria-label={label}
      title={label}
      style={
        compact
          ? {
              width: 42,
              height: 42,
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 0,
              flexShrink: 0,
              background: "var(--surface-overlay)",
              borderColor: "var(--border)",
              color: "var(--text)",
              boxShadow: "var(--shadow-sm)",
            }
          : undefined
      }
    >
      {mounted && theme === "dark" ? (
        <SunIcon size={iconSize} />
      ) : (
        <MoonIcon size={iconSize} />
      )}
      {!compact && <span>{mounted ? label : "Tema"}</span>}
    </button>
  );
}

function SunIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      style={{ display: "block" }}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      style={{ display: "block" }}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
