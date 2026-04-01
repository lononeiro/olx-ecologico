import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarSolicitacaoPorId } from "@/services/solicitacao.service";
import { AdminActionButtons } from "./AdminActionButtons";

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
        <Link
          href="/admin/solicitacoes"
          className="text-sm text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          Voltar
        </Link>
        <h1 className="flex-1 text-2xl font-bold text-gray-900 dark:text-zinc-100">
          Analisar Solicitacao #{s.id}
        </h1>
        <span className="badge bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200">
          Pendente
        </span>
      </div>

      <div className="card mb-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
          Dados do Solicitante
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500 dark:text-zinc-400">Nome</span>
            <p className="font-medium text-gray-800 dark:text-zinc-100">{s.user.nome}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-zinc-400">Email</span>
            <p className="font-medium text-gray-800 dark:text-zinc-100">{s.user.email}</p>
          </div>
          {(s.user as any).telefone && (
            <div>
              <span className="text-gray-500 dark:text-zinc-400">Telefone</span>
              <p className="font-medium text-gray-800 dark:text-zinc-100">
                {(s.user as any).telefone}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
          Detalhes da Solicitacao
        </h2>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-gray-500 dark:text-zinc-400">Titulo</span>
            <p className="text-base font-semibold text-gray-800 dark:text-zinc-100">{s.titulo}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-gray-500 dark:text-zinc-400">Tipo de Material</span>
              <p className="font-medium text-gray-800 dark:text-zinc-100">{s.material.nome}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-zinc-400">Quantidade</span>
              <p className="font-medium text-gray-800 dark:text-zinc-100">{s.quantidade}</p>
            </div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-zinc-400">Endereco de Coleta</span>
            <p className="font-medium text-gray-800 dark:text-zinc-100">{s.endereco}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-zinc-400">Descricao</span>
            <p className="mt-1 whitespace-pre-line text-gray-700 dark:text-zinc-300">{s.descricao}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-zinc-400">Data da Solicitacao</span>
            <p className="font-medium text-gray-800 dark:text-zinc-100">
              {new Date(s.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      {s.imagens.length > 0 && (
        <div className="card mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
            Imagens Enviadas
          </h2>
          <div className="flex flex-wrap gap-3">
            {s.imagens.map((img) => (
              <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={img.url}
                  alt="imagem"
                  className="h-32 w-32 rounded-lg border border-gray-200 object-cover hover:opacity-80 dark:border-zinc-700"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="card bg-gray-50 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-zinc-200">
          Decisao do Administrador
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-zinc-400">
          Ao aprovar, a solicitacao ficara visivel para as empresas parceiras. Ao rejeitar,
          o usuario sera notificado.
        </p>
        <AdminActionButtons solicitacaoId={s.id} />
      </div>
    </div>
  );
}
