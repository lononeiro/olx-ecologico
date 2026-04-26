"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type NavbarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

const NAV_LINKS: Record<string, { href: string; label: string; icon: ReactNode }[]> = {
  usuario: [
    { href: "/dashboard", label: "Dashboard", icon: <IconDashboard /> },
    { href: "/dashboard/solicitacoes", label: "Solicitacoes", icon: <IconClipboard /> },
    { href: "/dashboard/solicitacoes/nova", label: "Nova solicitacao", icon: <IconPlus /> },
    { href: "/me", label: "Usuarios", icon: <IconUser /> },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: <IconDashboard /> },
    { href: "/admin/solicitacoes", label: "Solicitacoes", icon: <IconClipboard /> },
    { href: "/me", label: "Usuarios", icon: <IconUser /> },
  ],
  empresa: [
    { href: "/empresa", label: "Dashboard", icon: <IconDashboard /> },
    { href: "/empresa/solicitacoes", label: "Solicitacoes", icon: <IconClipboard /> },
    { href: "/empresa/rotas", label: "Rotas", icon: <IconMapPin /> },
    { href: "/empresa/mensagens", label: "Mensagens", icon: <IconMessage /> },
    { href: "/empresa/relatorios", label: "Relatorios", icon: <IconChart /> },
    { href: "/empresa/avaliacoes", label: "Avaliacoes", icon: <IconStar /> },
    { href: "/empresa/configuracoes", label: "Configuracoes", icon: <IconSettings /> },
  ],
};

export function Navbar({ mobileOpen = false, onClose }: NavbarProps) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    onClose?.();
  }, [pathname]);

  const links = role ? NAV_LINKS[role] ?? [] : [];

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <>
      <aside className={`app-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="app-sidebar-logo">
          <EcoLogoIcon />
          <span>ECOnecta</span>
        </div>

        <nav className="app-sidebar-nav" aria-label="Navegacao principal">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/dashboard" &&
                link.href !== "/admin" &&
                link.href !== "/empresa" &&
                pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`app-sidebar-link ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="app-sidebar-link app-sidebar-logout"
          aria-label="Sair da conta"
        >
          <IconLogout />
          <span>{signingOut ? "Saindo" : "Sair"}</span>
        </button>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="app-sidebar-backdrop"
          onClick={onClose}
          aria-label="Fechar menu lateral"
        />
      ) : null}
    </>
  );
}

export function EcoLogoIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M15.6 7.2C10.1 6.9 6 10.7 5.4 15.9c4.7.8 9.5-1.8 11.1-6.2.4-1.1.1-2-.9-2.5Z"
        fill="#40916C"
      />
      <path
        d="M16.8 24.8c5.5.3 9.6-3.5 10.2-8.7-4.7-.8-9.5 1.8-11.1 6.2-.4 1.1-.1 2 .9 2.5Z"
        fill="#40916C"
      />
      <path
        d="M9.4 18.7c4.8-.6 8.9-3.4 12.9-8.7M22.8 13.3c-4.8.6-8.9 3.4-12.9 8.7"
        stroke="#2D6A4F"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5h6" />
      <path d="M9 3h6a2 2 0 0 1 2 2v1H7V5a2 2 0 0 1 2-2Z" />
      <path d="M7 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <path d="M8 12h8M8 16h5" />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M13 16V8" />
      <path d="M18 16v-3" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9 6.6 19.8l1-6.1-4.4-4.3 6.1-.9Z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
