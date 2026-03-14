import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listarColetasDaEmpresa } from "@/services/coleta.service";
import { ColetaBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

export default async function EmpresaDashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);

  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) return <p>Empresa não configurada.</p>;

  const coletas = await listarColetasDaEmpresa(company.id);
  const disponíveis = await prisma.solicitacaoColeta.count({
    where: { aprovado: true, status: "aprovada", coleta: null },
  });

  const stats = {
    total: coletas.length,
    ativas: coletas.filter((c) => !["concluida", "cancelada"].includes(c.status)).length,
    concluidas: coletas.filter((c) => c.status === "concluida").length,
    disponiveis: disponíveis,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {session!.user!.name}! 🏭
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          CNPJ: {company.cnpj}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Disponíveis", value: stats.disponiveis, color: "text-blue-600" },
          { label: "Em Andamento", value: stats.ativas, color: "text-yellow-600" },
          { label: "Concluídas", value: stats.concluidas, color: "text-green-600" },
          { label: "Total", value: stats.total, color: "text-gray-800" },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Coletas Recentes</h2>
        <Link href="/empresa/solicitacoes" className="btn-primary text-sm">
          Ver Disponíveis ({stats.disponiveis})
        </Link>
      </div>

      {coletas.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">Nenhuma coleta realizada ainda.</p>
          <Link href="/empresa/solicitacoes" className="btn-primary">
            Ver solicitações disponíveis
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {coletas.slice(0, 5).map((c) => (
            <div key={c.id} className="card flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ColetaBadge status={c.status} />
                  <span className="text-xs text-gray-400">Coleta #{c.id}</span>
                </div>
                <p className="font-medium text-gray-800 truncate">
                  {c.solicitacao.titulo}
                </p>
                <p className="text-sm text-gray-500">
                  👤 {c.solicitacao.user.nome} · 📦 {c.solicitacao.material.nome}
                </p>
              </div>
              <Link
                href={`/empresa/coletas/${c.id}`}
                className="btn-secondary text-sm flex-shrink-0"
              >
                Detalhes
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
