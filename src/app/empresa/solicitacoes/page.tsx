import { listarSolicitacoesAprovadas } from "@/services/solicitacao.service";
import { AceitarSolicitacaoButton } from "./AceitarSolicitacaoButton";

export default async function EmpresaSolicitacoesPage() {
  const solicitacoes = await listarSolicitacoesAprovadas();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Solicitações Disponíveis</h1>
        <p className="text-gray-500 text-sm mt-1">
          Aceite uma solicitação para iniciar a coleta.
        </p>
      </div>

      {solicitacoes.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-gray-500 font-medium">Nenhuma solicitação disponível no momento.</p>
          <p className="text-gray-400 text-sm mt-1">
            Verifique novamente mais tarde.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitacoes.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge bg-green-100 text-green-800">Aprovada</span>
                    <span className="text-xs text-gray-400">
                      #{s.id} · {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-lg">{s.titulo}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                    <span>📦 {s.material.nome}</span>
                    <span>⚖️ {s.quantidade}</span>
                    <span>📍 {s.endereco}</span>
                    <span>👤 {s.user.nome}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{s.descricao}</p>
                </div>
                {s.imagens[0] && (
                  <img
                    src={s.imagens[0].url}
                    alt="imagem"
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                  />
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <AceitarSolicitacaoButton solicitacaoId={s.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
