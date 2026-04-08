import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarSolicitacaoPorId } from "@/services/solicitacao.service";
import { AdminActionButtons } from "./AdminActionButtons";

export const dynamic = "force-dynamic";

function getAdminStatusLabel(s: {
  status: string;
  aprovado: boolean;
  createdAt: Date;
  coleta: { id: number } | null;
}) {
  if (s.status === "rejeitada") return "Rejeitada";
  if (s.status === "aprovada" && !s.coleta) return "Não aceita";

  const expired = Date.now() - new Date(s.createdAt).getTime() > 24 * 60 * 60 * 1000;
  if (s.status === "pendente" && !s.aprovado && expired) return "Fora do prazo";
  if (s.status === "pendente") return "Pendente";
  return "Em acompanhamento";
}

export default async function AdminSolicitacaoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  const s = await buscarSolicitacaoPorId(id);
  if (!s) notFound();

  const canModerate = s.status === "pendente" && !s.aprovado;
  const statusLabel = getAdminStatusLabel(s);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/solicitacoes" className="text-sm text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300">
          Voltar
        </Link>
        <h1 className="flex-1 text-2xl font-bold text-gray-900 dark:text-zinc-100">
          Solicitação #{s.id}
        </h1>
        <span className="badge bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200">
          {statusLabel}
        </span>
      </div>

      <div className="card mb-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
          Dados do solicitante
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
          {(s.user as any).telefone ? (
            <div>
              <span className="text-gray-500 dark:text-zinc-400">Telefone</span>
              <p className="font-medium text-gray-800 dark:text-zinc-100">{(s.user as any).telefone}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="card mb-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
          Detalhes da solicitação
        </h2>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-gray-500 dark:text-zinc-400">Título</span>
            <p className="text-base font-semibold text-gray-800 dark:text-zinc-100">{s.titulo}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-gray-500 dark:text-zinc-400">Tipo de material</span>
              <p className="font-medium text-gray-800 dark:text-zinc-100">{s.material.nome}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-zinc-400">Quantidade</span>
              <p className="font-medium text-gray-800 dark:text-zinc-100">{s.quantidade}</p>
            </div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-zinc-400">Endereço de coleta</span>
            <p className="font-medium text-gray-800 dark:text-zinc-100">{s.endereco}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-zinc-400">Descrição</span>
            <p className="mt-1 whitespace-pre-line text-gray-700 dark:text-zinc-300">{s.descricao}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-zinc-400">Data da solicitação</span>
            <p className="font-medium text-gray-800 dark:text-zinc-100">{new Date(s.createdAt).toLocaleString("pt-BR")}</p>
          </div>
        </div>
      </div>

      {s.imagens.length > 0 ? (
        <div className="card mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
            Imagens enviadas
          </h2>
          <div className="flex flex-wrap gap-3">
            {s.imagens.map((img) => (
              <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                <img src={img.url} alt="Imagem da solicitação" className="h-32 w-32 rounded-lg border border-gray-200 object-cover hover:opacity-80 dark:border-zinc-700" />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="card bg-gray-50 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-zinc-200">
          Decisão administrativa
        </h2>
        {canModerate ? (
          <>
            <p className="mb-4 text-sm text-gray-500 dark:text-zinc-400">
              Ao aprovar, a solicitação fica visível para empresas parceiras. Ao rejeitar, ela sai do fluxo ativo.
            </p>
            <AdminActionButtons solicitacaoId={s.id} />
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Esta solicitação está em acompanhamento e não possui mais ação de aprovação pendente.
          </p>
        )}
      </div>
    </div>
  );
}
