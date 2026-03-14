import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarSolicitacoesDoUsuario } from "@/services/solicitacao.service";
import { SolicitacaoCard } from "@/components/cards/SolicitacaoCard";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);

  const solicitacoes = await listarSolicitacoesDoUsuario(userId);

  const stats = {
    total: solicitacoes.length,
    pendentes: solicitacoes.filter((s) => s.status === "pendente").length,
    emColeta: solicitacoes.filter((s) => s.coleta).length,
    concluidas: solicitacoes.filter((s) => s.coleta?.status === "concluida").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Olá, {session!.user!.name}! 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Acompanhe suas solicitações de coleta.</p>
        </div>
        <Link href="/dashboard/solicitacoes/nova" className="btn-primary">
          + Nova Solicitação
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: stats.total, color: "text-gray-800" },
          { label: "Aguardando", value: stats.pendentes, color: "text-yellow-600" },
          { label: "Em Coleta", value: stats.emColeta, color: "text-blue-600" },
          { label: "Concluídas", value: stats.concluidas, color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent solicitacoes */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Solicitações Recentes</h2>
      {solicitacoes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg mb-4">Nenhuma solicitação encontrada.</p>
          <Link href="/dashboard/solicitacoes/nova" className="btn-primary">
            Criar primeira solicitação
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitacoes.slice(0, 5).map((s) => (
            <SolicitacaoCard
              key={s.id}
              solicitacao={s as any}
              href={`/dashboard/solicitacoes/${s.id}`}
            />
          ))}
          {solicitacoes.length > 5 && (
            <div className="text-center">
              <Link href="/dashboard/solicitacoes" className="btn-secondary">
                Ver todas ({solicitacoes.length})
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
