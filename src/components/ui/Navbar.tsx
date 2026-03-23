"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const links: Record<string, { href: string; label: string; icon: React.ReactNode }[]> = {
    usuario: [
      { href: "/dashboard", label: "Painel", icon: <IconGrid /> },
      { href: "/dashboard/solicitacoes", label: "Solicitações", icon: <IconList /> },
    ],
    admin: [
      { href: "/admin", label: "Painel", icon: <IconGrid /> },
      { href: "/admin/solicitacoes", label: "Aprovações", icon: <IconCheck /> },
    ],
    empresa: [
      { href: "/empresa", label: "Painel", icon: <IconGrid /> },
      { href: "/empresa/solicitacoes", label: "Disponíveis", icon: <IconList /> },
      { href: "/empresa/coletas", label: "Coletas", icon: <IconTruck /> },
    ],
  };

  const navLinks = role ? (links[role] ?? []) : [];

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <>
      <header style={{
        background: scrolled ? "rgba(255,255,255,.95)" : "var(--surface)",
        borderBottom: "1.5px solid var(--border)",
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: scrolled ? "blur(12px)" : "none",
        transition: "background .25s ease, box-shadow .25s ease",
        boxShadow: scrolled ? "0 1px 12px rgba(15,50,20,.08)" : "none",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "0 1.5rem",
          height: 62,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "1rem",
        }}>
          {/* Logo */}
          <Link href="/dashboard" style={{
            textDecoration: "none", display: "flex", alignItems: "center", gap: ".55rem",
            flexShrink: 0,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, var(--green), var(--green-light))",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(30,122,50,.3)",
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/><path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/><path d="m13.378 9.633 4.096 1.098 1.097-4.096"/>
              </svg>
            </div>
            <span style={{
              fontFamily: "var(--font)", fontWeight: 800, fontSize: "1rem",
              color: "var(--text)", letterSpacing: "-.4px",
            }}>
              <span style={{ color: "var(--green)" }}>ECO</span>necta
            </span>
          </Link>

          {/* Desktop Nav links */}
          <nav className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: ".2rem", flex: 1 }}>
            {navLinks.map((l) => {
              const active = pathname === l.href || (l.href !== "/dashboard" && l.href !== "/admin" && l.href !== "/empresa" && pathname.startsWith(l.href));
              return (
                <Link key={l.href} href={l.href} style={{
                  display: "flex", alignItems: "center", gap: ".4rem",
                  fontFamily: "var(--font)", fontSize: ".86rem", fontWeight: active ? 600 : 500,
                  color: active ? "var(--green)" : "var(--text-muted)",
                  textDecoration: "none", padding: ".45rem .9rem",
                  borderRadius: "var(--radius-sm)",
                  background: active ? "var(--surface-2)" : "transparent",
                  transition: "var(--transition)",
                  position: "relative",
                }}
                  onMouseOver={e => { if (!active) e.currentTarget.style.background = "var(--surface-2)"; }}
                  onMouseOut={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ opacity: active ? 1 : .6 }}>{l.icon}</span>
                  {l.label}
                  {active && (
                    <span style={{
                      position: "absolute", bottom: -1, left: "50%", transform: "translateX(-50%)",
                      width: 24, height: 2.5, background: "var(--green)",
                      borderRadius: 99,
                    }} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop User area */}
          {session ? (
            <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: ".65rem", flexShrink: 0 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: ".5rem",
                padding: ".3rem .7rem .3rem .4rem",
                background: "var(--surface-2)", borderRadius: 999,
                border: "1.5px solid var(--border)",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--green), var(--green-light))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: ".75rem", fontWeight: 800, color: "#fff",
                  flexShrink: 0,
                }}>
                  {session.user?.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <span style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--text)", display: "block" }}>
                    {session.user?.name?.split(" ")[0]}
                  </span>
                  <RolePill role={role} />
                </div>
              </div>
              <button onClick={handleSignOut} disabled={signingOut}
                className="btn btn-secondary"
                style={{ padding: ".42rem .9rem", fontSize: ".8rem", gap: ".35rem" }}>
                {signingOut ? <><span className="spinner spinner-green" style={{ width: 14, height: 14 }} /> Saindo</> : <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                  Sair
                </>}
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary hide-mobile" style={{ fontSize: ".85rem" }}>
              Entrar
            </Link>
          )}

          {/* Hamburger (mobile) */}
          <button
            className="show-mobile btn-icon"
            onClick={() => setMenuOpen(v => !v)}
            style={{ flexShrink: 0 }}
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="anim-slide-d" style={{
            background: "var(--surface)",
            borderTop: "1.5px solid var(--border)",
            padding: "1rem 1.25rem 1.5rem",
            display: "flex", flexDirection: "column", gap: ".3rem",
          }}>
            {session && (
              <div style={{
                display: "flex", alignItems: "center", gap: ".6rem",
                padding: ".75rem", marginBottom: ".5rem",
                background: "var(--surface-2)", borderRadius: "var(--radius-sm)",
                border: "1.5px solid var(--border)",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, var(--green), var(--green-light))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: ".85rem", fontWeight: 800, color: "#fff",
                }}>
                  {session.user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: ".9rem", color: "var(--text)" }}>{session.user?.name}</div>
                  <RolePill role={role} />
                </div>
              </div>
            )}

            {navLinks.map((l) => {
              const active = pathname === l.href || (l.href !== "/dashboard" && l.href !== "/admin" && l.href !== "/empresa" && pathname.startsWith(l.href));
              return (
                <Link key={l.href} href={l.href} style={{
                  display: "flex", alignItems: "center", gap: ".7rem",
                  padding: ".75rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  background: active ? "var(--surface-2)" : "transparent",
                  color: active ? "var(--green)" : "var(--text-muted)",
                  fontWeight: active ? 600 : 500,
                  fontSize: ".92rem", textDecoration: "none",
                  border: active ? "1.5px solid var(--border)" : "1.5px solid transparent",
                  transition: "var(--transition)",
                }}>
                  {l.icon}
                  {l.label}
                  {active && <svg style={{ marginLeft: "auto" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>}
                </Link>
              );
            })}

            {session && (
              <button onClick={handleSignOut} disabled={signingOut}
                style={{
                  marginTop: ".5rem",
                  display: "flex", alignItems: "center", gap: ".5rem",
                  padding: ".75rem 1rem", width: "100%",
                  background: "transparent", border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--red)", fontWeight: 600, fontSize: ".88rem",
                  cursor: "pointer", transition: "var(--transition)", fontFamily: "var(--font)",
                }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                {signingOut ? "Saindo..." : "Sair da conta"}
              </button>
            )}
          </div>
        )}
      </header>

      {/* Overlay behind mobile menu */}
      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />
      )}
    </>
  );
}

/* ── Role pill ── */
function RolePill({ role }: { role: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    usuario:  { label: "Cidadão",  color: "var(--green)",  bg: "rgba(30,122,50,.1)" },
    admin:    { label: "Admin",    color: "var(--blue)",   bg: "rgba(29,111,168,.1)" },
    empresa:  { label: "Empresa",  color: "var(--purple)", bg: "var(--purple-light)" },
  };
  const config = map[role] ?? { label: role, color: "var(--text-muted)", bg: "var(--surface-2)" };
  return (
    <span style={{
      display: "inline-block",
      fontSize: ".68rem", fontWeight: 700, letterSpacing: ".4px",
      textTransform: "uppercase",
      color: config.color, background: config.bg,
      borderRadius: 999, padding: ".1rem .45rem",
    }}>
      {config.label}
    </span>
  );
}

/* ── Mini icons ── */
function IconGrid() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function IconList() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>;
}
function IconCheck() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>;
}
function IconTruck() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>;
}
