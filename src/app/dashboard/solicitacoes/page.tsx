import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarSolicitacoesDoUsuario } from "@/services/solicitacao.service";
import { SolicitacaoCard } from "@/components/cards/SolicitacaoCard";
import { FiltrosSolicitacoes } from "@/components/filters/FiltrosSolicitacoes";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams: { status?: string; materialId?: string; dataInicio?: string; dataFim?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);

  const dataFimDate = searchParams.dataFim
    ? new Date(searchParams.dataFim + "T23:59:59")
    : undefined;

  const [solicitacoes, materiais] = await Promise.all([
    listarSolicitacoesDoUsuario(userId, {
      status:     searchParams.status,
      materialId: searchParams.materialId ? Number(searchParams.materialId) : undefined,
      dataInicio: searchParams.dataInicio ? new Date(searchParams.dataInicio) : undefined,
      dataFim:    dataFimDate,
    }),
    prisma.materialTipo.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        flexWrap: "wrap", gap: "1rem", marginBottom: "2rem",
      }}>
        <div>
          <p className="section-label">Minhas Solicitações</p>
          <h1 style={{
            fontSize: "clamp(1.3rem, 3vw, 1.65rem)",
            fontWeight: 800, color: "var(--text)", letterSpacing: "-.4px",
          }}>
            Histórico completo
          </h1>
          <p style={{ fontSize: ".84rem", color: "var(--text-muted)", marginTop: ".3rem" }}>
            {solicitacoes.length} solicitaç{solicitacoes.length === 1 ? "ão" : "ões"} no total
          </p>
        </div>
        <Link href="/dashboard/solicitacoes/nova" className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova Solicitação
        </Link>
      </div>

      <FiltrosSolicitacoes
        statusAtual={searchParams.status}
        materialIdAtual={searchParams.materialId}
        dataInicioAtual={searchParams.dataInicio}
        dataFimAtual={searchParams.dataFim}
        materiais={materiais}
        mostrarStatus
        mostrarBusca={false}
      />

      {solicitacoes.length === 0 ? (
        <div className="card empty-state" style={{
          background: "linear-gradient(135deg, var(--surface), var(--surface-3))",
        }}>
          <div className="empty-state-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--green-mid)" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)", marginBottom: ".3rem" }}>
              Nenhuma solicitação criada ainda
            </p>
            <p style={{ fontSize: ".86rem", color: "var(--text-muted)", maxWidth: 340, margin: "0 auto" }}>
              Solicite uma coleta de recicláveis e acompanhe tudo por aqui.
            </p>
          </div>
          <Link href="/dashboard/solicitacoes/nova" className="btn btn-primary">
            Criar primeira solicitação
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {solicitacoes.map((s, i) => (
            <div key={s.id} className="anim-fade-up h-full" style={{ animationDelay: `${i * 0.06}s` }}>
              <SolicitacaoCard
                solicitacao={s as any}
                href={`/dashboard/solicitacoes/${s.id}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
