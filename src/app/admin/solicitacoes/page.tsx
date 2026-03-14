import { listarSolicitacoesPendentes } from "@/services/solicitacao.service";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminSolicitacoesPage() {
  const solicitacoes = await listarSolicitacoesPendentes();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Aprovar Solicitações</h1>
        <p className="text-gray-500 text-sm mt-1">
          Analise e aprove (ou rejeite) as solicitações pendentes.
        </p>
      </div>

      {solicitacoes.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-green-700 font-medium">Nenhuma solicitação pendente!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitacoes.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge bg-yellow-100 text-yellow-800">Pendente</span>
                    <span className="text-xs text-gray-400">
                      #{s.id} · {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800">{s.titulo}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                    <span>👤 {s.user.nome}</span>
                    <span>📦 {s.material.nome}</span>
                    <span>⚖️ {s.quantidade}</span>
                    <span>📍 {s.endereco}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{s.descricao}</p>
                </div>
                {s.imagens[0] && (
                  <img
                    src={s.imagens[0].url}
                    alt="imagem"
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <Link
                  href={`/admin/solicitacoes/${s.id}`}
                  className="btn-secondary text-sm"
                >
                  Ver detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
