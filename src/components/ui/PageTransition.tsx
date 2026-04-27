"use client";
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// ── Context ──────────────────────────────────────────────────────────────────

interface TransitionCtx {
  startTransition: (navigate: () => void) => void;
}

const Ctx = createContext<TransitionCtx>({ startTransition: (fn) => fn() });

export function useTransition() {
  return useContext(Ctx);
}

// ── Provider + Overlay ───────────────────────────────────────────────────────

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  // "idle" | "leaving" | "entering"
  const [phase, setPhase] = useState<"idle" | "leaving" | "entering">("idle");
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  // Quando a rota muda, inicia o fade-in
  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      setPhase("entering");
      const t = setTimeout(() => setPhase("idle"), 400);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  const startTransition = useCallback((navigate: () => void) => {
    setPhase("leaving");
    // Aguarda o fade-out (300ms) antes de mudar de rota
    setTimeout(() => {
      navigate();
    }, 300);
  }, []);

  const overlayOpacity =
    phase === "leaving" ? 1 : phase === "entering" ? 0 : 0;

  const overlayVisible = phase !== "idle";

  return (
    <Ctx.Provider value={{ startTransition }}>
      {/* Overlay de transição */}
      {overlayVisible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,26,15,.94)",
            zIndex: 9999,
            opacity: overlayOpacity,
            transition:
              phase === "leaving"
                ? "opacity 300ms ease"
                : "opacity 400ms ease",
            pointerEvents: "none",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            role="status"
            aria-live="polite"
            style={{
              display: "grid",
              justifyItems: "center",
              gap: ".85rem",
              color: "#fff",
              transform: phase === "leaving" ? "translateY(0)" : "translateY(8px)",
              transition: "transform 300ms ease",
            }}
          >
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                border: "3px solid rgba(255,255,255,.22)",
                borderTopColor: "#86d25a",
                animation: "spin .75s linear infinite",
              }}
            />
            <span style={{ fontSize: ".9rem", fontWeight: 700 }}>Carregando pagina...</span>
          </div>
        </div>
      )}
      {children}
    </Ctx.Provider>
  );
}
