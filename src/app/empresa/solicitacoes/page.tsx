import { listarSolicitacoesAprovadas } from "@/services/solicitacao.service";
import { AceitarSolicitacaoButton } from "./AceitarSolicitacaoButton";
import { SolicitacaoCardVisual } from "@/components/cards/SolicitacaoCardVisual";

export const dynamic = "force-dynamic";

export default async function EmpresaSolicitacoesPage() {
  const solicitacoes = await listarSolicitacoesAprovadas();

  return (
    <div className="page-enter">
      <div style={{ marginBottom: "2rem" }}>
        <p className="section-label">Empresa</p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.65rem)", fontWeight: 800, color: "var(--text)", letterSpacing: "-.4px" }}>
          Solicitacoes Disponiveis
        </h1>
        <p style={{ fontSize: ".84rem", color: "var(--text-muted)", marginTop: ".3rem" }}>
          {solicitacoes.length === 0
            ? "Nenhuma solicitacao disponivel no momento."
            : `${solicitacoes.length} solicitac${solicitacoes.length === 1 ? "ao" : "oes"} aguardando aceitacao.`}
        </p>
      </div>

      {solicitacoes.length === 0 ? (
        <div className="card empty-state" style={{ background: "linear-gradient(135deg, var(--surface), var(--surface-3))" }}>
          <div className="empty-state-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--blue-mid)" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)", marginBottom: ".3rem" }}>
              Nenhuma solicitacao disponivel
            </p>
            <p style={{ fontSize: ".86rem", color: "var(--text-muted)", maxWidth: 340, margin: "0 auto" }}>
              Novas solicitacoes aprovadas apareceram aqui assim que estiverem disponiveis.
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
                endereco={s.endereco}
                status={s.status}
                createdAt={s.createdAt}
                material={s.material}
                imagens={s.imagens}
                solicitanteNome={s.user.nome}
                actions={
                  <AceitarSolicitacaoButton
                    solicitacaoId={s.id}
                    titulo={s.titulo}
                    descricao={s.descricao}
                    quantidade={s.quantidade}
                    endereco={s.endereco}
                    materialNome={s.material.nome}
                    solicitanteNome={s.user.nome}
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