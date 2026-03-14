"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const links: Record<string, { href: string; label: string }[]> = {
    usuario: [
      { href: "/dashboard", label: "Painel" },
      { href: "/dashboard/solicitacoes", label: "Minhas Solicitações" },
      { href: "/dashboard/solicitacoes/nova", label: "Nova Solicitação" },
    ],
    admin: [
      { href: "/admin", label: "Painel" },
      { href: "/admin/solicitacoes", label: "Aprovar Solicitações" },
    ],
    empresa: [
      { href: "/empresa", label: "Painel" },
      { href: "/empresa/solicitacoes", label: "Solicitações Disponíveis" },
      { href: "/empresa/coletas", label: "Minhas Coletas" },
    ],
  };

  const navLinks = role ? links[role] ?? [] : [];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-green-700 text-lg flex items-center gap-1">
              ♻️ ReciclaFácil
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm text-gray-600 hover:text-green-700 px-3 py-1.5 rounded-md hover:bg-green-50 transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <span className="text-sm text-gray-500 hidden sm:block">
                  {session.user?.name}
                </span>
                <span className="badge bg-green-100 text-green-800 capitalize">{role}</span>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="btn-secondary text-sm py-1.5"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-primary text-sm py-1.5">
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
