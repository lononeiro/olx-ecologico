"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  const links: Record<string, { href: string; label: string }[]> = {
    usuario: [
      { href: "/dashboard",               label: "Painel" },
      { href: "/dashboard/solicitacoes",  label: "Solicitações" },
    ],
    admin: [
      { href: "/admin",                   label: "Painel" },
      { href: "/admin/solicitacoes",      label: "Aprovações" },
    ],
    empresa: [
      { href: "/empresa",                 label: "Painel" },
      { href: "/empresa/solicitacoes",    label: "Disponíveis" },
      { href: "/empresa/coletas",         label: "Coletas" },
    ],
  };

  const navLinks = role ? (links[role] ?? []) : [];

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <header style={{
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      position: "sticky", top: 0, zIndex: 100,
      boxShadow: "0 1px 0 rgba(30,80,40,.06)",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "0 1.5rem",
        height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "1.5rem",
      }}>
        {/* Logo */}
        <Link href="/" style={{
          textDecoration: "none", display: "flex", alignItems: "center", gap: ".5rem",
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, var(--green), var(--green-light))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/><path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/><path d="m13.378 9.633 4.096 1.098 1.097-4.096"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "var(--font)", fontWeight: 700, fontSize: "1rem",
            color: "var(--text)", letterSpacing: "-.3px",
          }}>
            ReciclaFácil
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: ".25rem", flex: 1 }}>
          {navLinks.map((l) => {
            const active = pathname === l.href || (l.href !== "/dashboard" && l.href !== "/admin" && l.href !== "/empresa" && pathname.startsWith(l.href));
            return (
              <Link key={l.href} href={l.href} style={{
                fontFamily: "var(--font)", fontSize: ".875rem", fontWeight: active ? 600 : 400,
                color: active ? "var(--green)" : "var(--text-muted)",
                textDecoration: "none", padding: ".4rem .85rem",
                borderRadius: "var(--radius-sm)",
                background: active ? "var(--surface-2)" : "transparent",
                transition: "var(--transition)",
              }}
                onMouseOver={e => { if (!active) e.currentTarget.style.background = "var(--surface-2)"; }}
                onMouseOut={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* User area */}
        {session ? (
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexShrink: 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: ".5rem",
              padding: ".35rem .75rem .35rem .5rem",
              background: "var(--surface-2)", borderRadius: 999,
              border: "1px solid var(--border)",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--green), var(--green-light))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: ".72rem", fontWeight: 700, color: "#fff",
              }}>
                {session.user?.name?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: ".82rem", fontWeight: 500, color: "var(--text)", maxWidth: 120,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.user?.name?.split(" ")[0]}
              </span>
              <span style={{
                fontSize: ".7rem", fontWeight: 600, color: "var(--green)",
                background: "rgba(45,138,62,.1)", borderRadius: 999,
                padding: ".15rem .5rem", textTransform: "capitalize",
              }}>
                {role}
              </span>
            </div>
            <button onClick={handleSignOut} disabled={signingOut}
              className="btn btn-secondary"
              style={{ padding: ".4rem .9rem", fontSize: ".82rem" }}>
              {signingOut ? "..." : "Sair"}
            </button>
          </div>
        ) : (
          <Link href="/login" className="btn btn-primary" style={{ fontSize: ".85rem" }}>
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}