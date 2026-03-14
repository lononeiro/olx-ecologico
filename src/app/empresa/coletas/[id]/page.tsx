import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buscarColetaPorId } from "@/services/coleta.service";
import { notFound } from "next/navigation";
import { ColetaBadge } from "@/components/ui/StatusBadge";
import { AtualizarStatusColetaForm } from "./AtualizarStatusColetaForm";
import { ChatBox } from "@/components/forms/ChatBox";
import Link from "next/link";

export default async function EmpresaColetaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);

  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) notFound();

  const coleta = await buscarColetaPorId(Number(params.id), undefined, company.id);
  if (!coleta) notFound();

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/empresa/coletas" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">
          Coleta #{coleta.id}
        </h1>
        <ColetaBadge status={coleta.status} />
      </div>

      {/* Dados da solicitação */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Solicitação
        </h2>
        <h3 className="font-semibold text-gray-800 text-lg mb-2">
          {coleta.solicitacao.titulo}
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Material</span>
            <p className="font-medium text-gray-800">{coleta.solicitacao.material.nome}</p>
          </div>
          <div>
            <span className="text-gray-500">Quantidade</span>
            <p className="font-medium text-gray-800">{coleta.solicitacao.quantidade}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Endereço de Coleta</span>
            <p className="font-medium text-gray-800">{coleta.solicitacao.endereco}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Descrição</span>
            <p className="text-gray-700 mt-1">{coleta.solicitacao.descricao}</p>
          </div>
        </div>
      </div>

      {/* Dados do usuário solicitante */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Solicitante
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Nome</span>
            <p className="font-medium text-gray-800">{coleta.solicitacao.user.nome}</p>
          </div>
          <div>
            <span className="text-gray-500">Email</span>
            <p className="font-medium text-gray-800">{coleta.solicitacao.user.email}</p>
          </div>
          {(coleta.solicitacao.user as any).telefone && (
            <div>
              <span className="text-gray-500">Telefone</span>
              <p className="font-medium text-gray-800">
                {(coleta.solicitacao.user as any).telefone}
              </p>
            </div>
          )}
          {(coleta.solicitacao.user as any).endereco && (
            <div className="col-span-2">
              <span className="text-gray-500">Endereço cadastrado</span>
              <p className="font-medium text-gray-800">
                {(coleta.solicitacao.user as any).endereco}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dados da coleta */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Informações da Coleta
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <span className="text-gray-500">Código de Confirmação</span>
            <p className="font-mono font-bold text-green-700 text-base">
              {coleta.codigoConfirmacao}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Data de Aceite</span>
            <p className="font-medium text-gray-800">
              {new Date(coleta.dataAceite).toLocaleDateString("pt-BR")}
            </p>
          </div>
          {coleta.dataConclusao && (
            <div>
              <span className="text-gray-500">Data de Conclusão</span>
              <p className="font-medium text-gray-800">
                {new Date(coleta.dataConclusao).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}
        </div>

        {/* Atualizar status */}
        {!["concluida", "cancelada"].includes(coleta.status) && (
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Atualizar Status da Coleta
            </h3>
            <AtualizarStatusColetaForm
              coletaId={coleta.id}
              statusAtual={coleta.status}
            />
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          💬 Mensagens com o solicitante
        </h2>
        <ChatBox
          coletaId={coleta.id}
          currentUserId={userId}
          initialMessages={coleta.mensagens as any}
        />
      </div>
    </div>
  );
}
