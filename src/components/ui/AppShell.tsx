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
    description: "Acompanhe suas solicitações, coletas e próximos passos.",
  },
  "/dashboard/solicitacoes": {
    title: "Solicitações",
    description: "Histórico completo das solicitações abertas pelo usuário.",
  },
  "/dashboard/mensagens": {
    title: "Mensagens",
    description: "Conversas com empresas antes e depois do aceite da coleta.",
  },
  "/dashboard/solicitacoes/nova": {
    title: "Nova Solicitação",
    description: "Preencha o formulário e envie um novo pedido de coleta.",
  },
  "/admin": {
    title: "Painel Administrativo",
    description: "Visão central da operação, análises e pendências.",
  },
  "/admin/solicitacoes": {
    title: "Gestão de Solicitações",
    description: "Todas as solicitações de coleta da plataforma.",
  },
  "/admin/usuarios": {
    title: "Gestão de Usuários",
    description: "Visualize, ative, desative e gerencie os usuários da plataforma.",
  },
  "/admin/empresas": {
    title: "Gestão de Empresas",
    description: "Gerencie as empresas parceiras e acompanhe suas coletas.",
  },
  "/admin/materiais": {
    title: "Tipos de Material",
    description: "Adicione, renomeie e remova os tipos de material aceitos na plataforma.",
  },
  "/empresa": {
    title: "Painel da Empresa",
    description: "Resumo das coletas, demandas disponíveis e performance.",
  },
  "/empresa/solicitacoes": {
    title: "Solicitações Disponíveis",
    description: "Pedidos aprovados aguardando aceite da empresa.",
  },
  "/empresa/mensagens": {
    title: "Mensagens",
    description: "Central de conversas com clientes antes e depois do aceite.",
  },
  "/empresa/coletas": {
    title: "Coletas",
    description: "Lista operacional das coletas aceitas pela empresa.",
  },
  "/empresa/avaliacoes": {
    title: "Avaliações",
    description: "Notas, comentários e reputação das coletas finalizadas.",
  },
  "/me": {
    title: "Meu Perfil",
    description: "Gerencie seus dados de conta e informações vinculadas.",
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
  if (role === "usuario") return "Cidadão";
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
