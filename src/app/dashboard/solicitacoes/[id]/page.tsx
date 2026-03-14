import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buscarSolicitacaoPorId } from "@/services/solicitacao.service";
import { notFound } from "next/navigation";
import { SolicitacaoBadge, ColetaBadge } from "@/components/ui/StatusBadge";
import { ChatBox } from "@/components/forms/ChatBox";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SolicitacaoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);
  const id = Number(params.id);

  const s = await buscarSolicitacaoPorId(id, userId);
  if (!s) notFound();

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/solicitacoes" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{s.titulo}</h1>
        <SolicitacaoBadge status={s.status} />
      </div>

      {/* Solicitação details */}
      <div className="card mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Material</span>
            <p className="font-medium text-gray-800">{s.material.nome}</p>
          </div>
          <div>
            <span className="text-gray-500">Quantidade</span>
            <p className="font-medium text-gray-800">{s.quantidade}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Endereço</span>
            <p className="font-medium text-gray-800">{s.endereco}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Descrição</span>
            <p className="text-gray-700 mt-1 whitespace-pre-line">{s.descricao}</p>
          </div>
          <div>
            <span className="text-gray-500">Criada em</span>
            <p className="font-medium text-gray-800">
              {new Date(s.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        {/* Imagens */}
        {s.imagens.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">Imagens</p>
            <div className="flex flex-wrap gap-2">
              {s.imagens.map((img) => (
                <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={img.url}
                    alt="imagem"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Coleta info */}
      {s.coleta ? (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Coleta em Andamento</h2>
            <ColetaBadge status={s.coleta.status} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="text-gray-500">Empresa</span>
              <p className="font-medium text-gray-800">{s.coleta.company.user.nome}</p>
            </div>
            <div>
              <span className="text-gray-500">Código de Confirmação</span>
              <p className="font-mono font-bold text-green-700 text-base">
                {s.coleta.codigoConfirmacao}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Data de Aceite</span>
              <p className="font-medium text-gray-800">
                {new Date(s.coleta.dataAceite).toLocaleDateString("pt-BR")}
              </p>
            </div>
            {s.coleta.dataConclusao && (
              <div>
                <span className="text-gray-500">Data de Conclusão</span>
                <p className="font-medium text-gray-800">
                  {new Date(s.coleta.dataConclusao).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              💬 Mensagens com a empresa
            </h3>
            <ChatBox
              coletaId={s.coleta.id}
              currentUserId={userId}
              initialMessages={s.coleta.mensagens as any}
            />
          </div>
        </div>
      ) : (
        <div className="card bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-800">
            {s.status === "pendente" &&
              "⏳ Sua solicitação está aguardando aprovação do administrador."}
            {s.status === "aprovada" &&
              "✅ Solicitação aprovada! Aguardando uma empresa aceitar a coleta."}
            {s.status === "rejeitada" &&
              "❌ Solicitação rejeitada. Entre em contato com o suporte para mais informações."}
          </p>
        </div>
      )}
    </div>
  );
}
