"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/ui/Navbar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Acompanhe suas solicitacoes, coletas e proximos passos.",
  },
  "/dashboard/solicitacoes": {
    title: "Solicitacoes",
    description: "Historico completo das solicitacoes abertas pelo usuario.",
  },
  "/dashboard/solicitacoes/nova": {
    title: "Nova Solicitacao",
    description: "Preencha o formulario e envie um novo pedido de coleta.",
  },
  "/admin": {
    title: "Painel Administrativo",
    description: "Visao central da operacao, analises e pendencias.",
  },
  "/admin/solicitacoes": {
    title: "Fila Operacional",
    description: "Solicitacoes que exigem acompanhamento administrativo.",
  },
  "/empresa": {
    title: "Painel da Empresa",
    description: "Resumo das coletas, demandas disponiveis e performance.",
  },
  "/empresa/solicitacoes": {
    title: "Solicitacoes Disponiveis",
    description: "Pedidos aprovados aguardando aceite da empresa.",
  },
  "/empresa/coletas": {
    title: "Coletas",
    description: "Lista operacional das coletas aceitas pela empresa.",
  },
  "/me": {
    title: "Meu Perfil",
    description: "Gerencie seus dados de conta e informacoes vinculadas.",
  },
};

function getPageCopy(pathname: string) {
  const exact = PAGE_TITLES[pathname];
  if (exact) return exact;

  const matched = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([key]) => pathname.startsWith(key));

  return (
    matched?.[1] ?? {
      title: "ECOnecta",
      description: "Plataforma de gestao para o ecossistema de coleta sustentavel.",
    }
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const page = getPageCopy(pathname);
  const userName = session?.user?.name?.split(" ")[0] ?? "Usuario";
  const role = ((session?.user as any)?.role ?? "") as string;

  return (
    <div className="app-shell">
      <Navbar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="app-main">
        <header className="app-topbar">
          <div>
            <h1 className="app-topbar-title">{page.title}</h1>
            <p className="app-topbar-description">{page.description}</p>
          </div>

          <div className="app-topbar-actions">
            <button
              type="button"
              className="app-mobile-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu lateral"
            >
              <MenuIcon />
            </button>

            <button type="button" className="app-notification-button" aria-label="Notificacoes">
              <BellIcon />
            </button>

            <ThemeToggle compact />

            <div className="app-user-chip">
              <div className="app-user-avatar">{userName[0]?.toUpperCase() ?? "U"}</div>
              <div>
                <p className="app-user-name">{userName}</p>
                <p className="app-user-role">{getRoleLabel(role)}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}

function getRoleLabel(role: string) {
  if (role === "admin") return "Administrador";
  if (role === "empresa") return "Empresa parceira";
  if (role === "usuario") return "Cidadao";
  return "Conta ativa";
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <line x1="4" x2="20" y1="7" y2="7" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="17" y2="17" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}
