import { listarSolicitacoesPendentes } from "@/services/solicitacao.service";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [pendentes, totalUsers, totalEmpresas] = await Promise.all([
    listarSolicitacoesPendentes(),
    prisma.user.count({ where: { role: { nome: "usuario" } } }),
    prisma.company.count(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie solicitações e usuários da plataforma.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Solicitações Pendentes", value: pendentes.length, color: "text-yellow-600", icon: "⏳" },
          { label: "Usuários Cadastrados", value: totalUsers, color: "text-blue-600", icon: "👤" },
          { label: "Empresas Parceiras", value: totalEmpresas, color: "text-green-600", icon: "🏭" },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-4">
            <span className="text-3xl">{s.icon}</span>
            <div>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick action */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Solicitações Aguardando Aprovação
        </h2>
        <Link href="/admin/solicitacoes" className="text-sm text-green-600 hover:underline">
          Ver todas →
        </Link>
      </div>

      {pendentes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-green-600 font-medium">✅ Nenhuma solicitação pendente!</p>
          <p className="text-gray-400 text-sm mt-1">Todas as solicitações foram processadas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendentes.slice(0, 5).map((s) => (
            <div key={s.id} className="card flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{s.titulo}</p>
                <p className="text-sm text-gray-500">
                  {s.user.nome} · {s.material.nome} · {s.quantidade}
                </p>
              </div>
              <Link
                href={`/admin/solicitacoes/${s.id}`}
                className="btn-secondary text-sm flex-shrink-0"
              >
                Analisar
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
