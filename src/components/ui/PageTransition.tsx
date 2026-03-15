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
            background: "#0f1a0f",
            zIndex: 9999,
            opacity: overlayOpacity,
            transition:
              phase === "leaving"
                ? "opacity 300ms ease"
                : "opacity 400ms ease",
            pointerEvents: "none",
          }}
        />
      )}
      {children}
    </Ctx.Provider>
  );
}