import { AppShell } from "@/components/ui/AppShell";

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
