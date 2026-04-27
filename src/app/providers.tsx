"use client";
import { SessionProvider } from "next-auth/react";
import { PageTransitionProvider } from "@/components/ui/PageTransition";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <ThemeProvider>
          <PageTransitionProvider>
            {children}
          </PageTransitionProvider>
        </ThemeProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}