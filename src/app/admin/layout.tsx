import { Navbar } from "@/components/ui/Navbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {children}
      </main>
    </div>
  );
}