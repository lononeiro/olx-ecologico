import { listarSolicitacoesPendentes } from "@/services/solicitacao.service";
import { SolicitacaoCardVisual } from "@/components/cards/SolicitacaoCardVisual";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminSolicitacoesPage() {
  const solicitacoes = await listarSolicitacoesPendentes();

  return (
    <div className="page-enter">
      <div style={{ marginBottom: "2rem" }}>
        <p className="section-label">Admin</p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.65rem)", fontWeight: 800, color: "var(--text)", letterSpacing: "-.4px" }}>
          Aprovar Solicitacoes
        </h1>
        <p style={{ fontSize: ".84rem", color: "var(--text-muted)", marginTop: ".3rem" }}>
          {solicitacoes.length === 0
            ? "Nenhuma solicitacao pendente."
            : `${solicitacoes.length} solicitac${solicitacoes.length === 1 ? "ao" : "oes"} aguardando analise.`}
        </p>
      </div>

      {solicitacoes.length === 0 ? (
        <div className="card empty-state" style={{ background: "linear-gradient(135deg, var(--surface), var(--surface-3))" }}>
          <div className="empty-state-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)", marginBottom: ".3rem" }}>
              Tudo em dia
            </p>
            <p style={{ fontSize: ".86rem", color: "var(--text-muted)", maxWidth: 340, margin: "0 auto" }}>
              Todas as solicitacoes foram processadas.
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
                detailsHref={`/admin/solicitacoes/${s.id}`}
                actions={
                  <Link href={`/admin/solicitacoes/${s.id}`} className="btn btn-secondary" style={{ fontSize: ".82rem", flex: 1, justifyContent: "center" }}>
                    Analisar solicitacao
                  </Link>
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
