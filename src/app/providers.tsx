"use client";
import { SessionProvider } from "next-auth/react";
import { PageTransitionProvider } from "@/components/ui/PageTransition";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <PageTransitionProvider>
          {children}
        </PageTransitionProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
