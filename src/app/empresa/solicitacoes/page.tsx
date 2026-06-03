import { listarSolicitacoesAprovadas } from "@/services/solicitacao.service";
import { AceitarSolicitacaoButton } from "./AceitarSolicitacaoButton";
import { SolicitacaoCardVisual } from "@/components/cards/SolicitacaoCardVisual";
import { FiltrosSolicitacoes } from "@/components/filters/FiltrosSolicitacoes";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EmpresaSolicitacoesPage({
  searchParams,
}: {
  searchParams: { materialId?: string; dataInicio?: string; dataFim?: string; q?: string };
}) {
  const dataFimDate = searchParams.dataFim
    ? new Date(searchParams.dataFim + "T23:59:59")
    : undefined;

  const [solicitacoes, materiais] = await Promise.all([
    listarSolicitacoesAprovadas({
      materialId: searchParams.materialId ? Number(searchParams.materialId) : undefined,
      dataInicio: searchParams.dataInicio ? new Date(searchParams.dataInicio) : undefined,
      dataFim:    dataFimDate,
      q:          searchParams.q,
    }),
    prisma.materialTipo.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="page-enter">
      <div style={{ marginBottom: "2rem" }}>
        <p className="section-label">Empresa</p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.65rem)", fontWeight: 800, color: "var(--text)", letterSpacing: "-.4px" }}>
          Solicitações Disponíveis
        </h1>
        <p style={{ fontSize: ".84rem", color: "var(--text-muted)", marginTop: ".3rem" }}>
          {solicitacoes.length === 0
            ? "Nenhuma solicitação disponível no momento."
            : `${solicitacoes.length} solicitac${solicitacoes.length === 1 ? "ao" : "oes"} aguardando aceitação.`}
        </p>
      </div>

      <FiltrosSolicitacoes
        buscaAtual={searchParams.q}
        materialIdAtual={searchParams.materialId}
        dataInicioAtual={searchParams.dataInicio}
        dataFimAtual={searchParams.dataFim}
        materiais={materiais}
        mostrarStatus={false}
        mostrarBusca
      />

      {solicitacoes.length === 0 ? (
        <div className="card empty-state" style={{ background: "linear-gradient(135deg, var(--surface), var(--surface-3))" }}>
          <div className="empty-state-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--blue-mid)" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)", marginBottom: ".3rem" }}>
              Nenhuma solicitação disponivel
            </p>
            <p style={{ fontSize: ".86rem", color: "var(--text-muted)", maxWidth: 340, margin: "0 auto" }}>
              Novas solicitações aprovadas apareceram aqui assim que estiverem disponíveis.
            </p>
          </div>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1.25rem",
        }}>
          {solicitacoes.map((s, i) => (
            <div key={s.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <SolicitacaoCardVisual
                id={s.id}
                titulo={s.titulo}
                descricao={s.descricao}
                quantidade={s.quantidade}
                endereco={s.endereco ?? "Regiao nao informada"}
                status={s.status}
                createdAt={s.createdAt}
                material={s.material}
                imagens={s.imagens}
                actions={
                  <AceitarSolicitacaoButton
                    solicitacaoId={s.id}
                    titulo={s.titulo}
                    descricao={s.descricao}
                    quantidade={s.quantidade}
                    endereco={s.endereco ?? "Regiao nao informada"}
                    materialNome={s.material.nome}
                    imagens={s.imagens}
                  />
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
