import { buscarSolicitacaoPorId } from "@/services/solicitacao.service";
import { notFound } from "next/navigation";
import { AdminActionButtons } from "./AdminActionButtons";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminSolicitacaoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  const s = await buscarSolicitacaoPorId(id);
  if (!s) notFound();

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/solicitacoes" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">
          Analisar Solicitação #{s.id}
        </h1>
        <span className="badge bg-yellow-100 text-yellow-800">Pendente</span>
      </div>

      {/* Dados do usuário */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Dados do Solicitante
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Nome</span>
            <p className="font-medium text-gray-800">{s.user.nome}</p>
          </div>
          <div>
            <span className="text-gray-500">Email</span>
            <p className="font-medium text-gray-800">{s.user.email}</p>
          </div>
          {(s.user as any).telefone && (
            <div>
              <span className="text-gray-500">Telefone</span>
              <p className="font-medium text-gray-800">{(s.user as any).telefone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dados da solicitação */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Detalhes da Solicitação
        </h2>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-gray-500">Título</span>
            <p className="font-semibold text-gray-800 text-base">{s.titulo}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-gray-500">Tipo de Material</span>
              <p className="font-medium text-gray-800">{s.material.nome}</p>
            </div>
            <div>
              <span className="text-gray-500">Quantidade</span>
              <p className="font-medium text-gray-800">{s.quantidade}</p>
            </div>
          </div>
          <div>
            <span className="text-gray-500">Endereço de Coleta</span>
            <p className="font-medium text-gray-800">{s.endereco}</p>
          </div>
          <div>
            <span className="text-gray-500">Descrição</span>
            <p className="text-gray-700 whitespace-pre-line mt-1">{s.descricao}</p>
          </div>
          <div>
            <span className="text-gray-500">Data da Solicitação</span>
            <p className="font-medium text-gray-800">
              {new Date(s.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      {/* Imagens */}
      {s.imagens.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Imagens Enviadas
          </h2>
          <div className="flex flex-wrap gap-3">
            {s.imagens.map((img) => (
              <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={img.url}
                  alt="imagem"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200 hover:opacity-80"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="card bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Decisão do Administrador
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Ao aprovar, a solicitação ficará visível para as empresas parceiras. Ao rejeitar,
          o usuário será notificado.
        </p>
        <AdminActionButtons solicitacaoId={s.id} />
      </div>
    </div>
  );
}
