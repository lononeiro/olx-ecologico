import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listarColetasDaEmpresa } from "@/services/coleta.service";
import { ColetaBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

export default async function EmpresaColetasPage() {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);

  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) return <p>Empresa não configurada.</p>;

  const coletas = await listarColetasDaEmpresa(company.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Coletas</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie todas as coletas aceitas pela sua empresa.
        </p>
      </div>

      {coletas.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 mb-4">Nenhuma coleta realizada ainda.</p>
          <Link href="/empresa/solicitacoes" className="btn-primary">
            Ver solicitações disponíveis
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {coletas.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ColetaBadge status={c.status} />
                    <span className="text-xs text-gray-400">
                      Coleta #{c.id} · Aceita em{" "}
                      {new Date(c.dataAceite).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800">{c.solicitacao.titulo}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                    <span>📦 {c.solicitacao.material.nome}</span>
                    <span>⚖️ {c.solicitacao.quantidade}</span>
                    <span>👤 {c.solicitacao.user.nome}</span>
                    <span>📍 {c.solicitacao.endereco}</span>
                  </div>
                  {c.dataConclusao && (
                    <p className="text-xs text-green-600 mt-1">
                      Concluída em {new Date(c.dataConclusao).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href={`/empresa/coletas/${c.id}`} className="btn-secondary text-sm">
                  Gerenciar coleta →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
