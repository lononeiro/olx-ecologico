"use client";
import { SessionProvider } from "next-auth/react";
import { PageTransitionProvider } from "@/components/ui/PageTransition";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PageTransitionProvider>
        {children}
      </PageTransitionProvider>
    </SessionProvider>
  );
}