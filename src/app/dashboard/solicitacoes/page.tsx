import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarSolicitacoesDoUsuario } from "@/services/solicitacao.service";
import { SolicitacaoCard } from "@/components/cards/SolicitacaoCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SolicitacoesPage() {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);
  const solicitacoes = await listarSolicitacoesDoUsuario(userId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Solicitações</h1>
        <Link href="/dashboard/solicitacoes/nova" className="btn-primary">
          + Nova
        </Link>
      </div>

      {solicitacoes.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 mb-4">Nenhuma solicitação criada ainda.</p>
          <Link href="/dashboard/solicitacoes/nova" className="btn-primary">
            Criar solicitação
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitacoes.map((s) => (
            <SolicitacaoCard
              key={s.id}
              solicitacao={s as any}
              href={`/dashboard/solicitacoes/${s.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
