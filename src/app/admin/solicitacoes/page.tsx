import { listarSolicitacoesAdmin } from "@/services/solicitacao.service";
import { SolicitacaoCardVisual } from "@/components/cards/SolicitacaoCardVisual";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PRAZO_ANALISE_MS = 24 * 60 * 60 * 1000;

function getAdminBucket(s: {
  status: string;
  aprovado: boolean;
  createdAt: Date;
  coleta: { id: number } | null;
}) {
  if (s.status === "rejeitada") {
    return {
      title: "Rejeitada",
      description: "Solicitação encerrada pela administração.",
    };
  }

  if (s.status === "aprovada" && !s.coleta) {
    return {
      title: "Não aceita",
      description: "Aprovada, mas ainda sem aceite de empresa.",
    };
  }

  const expired = Date.now() - new Date(s.createdAt).getTime() > PRAZO_ANALISE_MS;
  if (s.status === "pendente" && !s.aprovado && expired) {
    return {
      title: "Fora do prazo",
      description: "Pendente há mais de 24 horas.",
    };
  }

  return {
    title: "Em acompanhamento",
    description: "Item monitorado pela administração.",
  };
}

export default async function AdminSolicitacoesPage() {
  const solicitacoes = await listarSolicitacoesAdmin();

  return (
    <div className="page-enter">
      <div style={{ marginBottom: "2rem" }}>
        <p className="section-label">Admin</p>
        <h1
          style={{
            fontSize: "clamp(1.3rem, 3vw, 1.65rem)",
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-.4px",
          }}
        >
          Fila operacional
        </h1>
        <p style={{ fontSize: ".84rem", color: "var(--text-muted)", marginTop: ".3rem" }}>
          {solicitacoes.length === 0
            ? "Nenhuma solicitação exige ação ou acompanhamento agora."
            : `${solicitacoes.length} solicitação${solicitacoes.length === 1 ? "" : "ões"} em acompanhamento: não aceitas, rejeitadas ou fora do prazo.`}
        </p>
      </div>

      {solicitacoes.length === 0 ? (
        <div className="card empty-state" style={{ background: "linear-gradient(135deg, var(--surface), var(--surface-3))" }}>
          <div className="empty-state-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)", marginBottom: ".3rem" }}>
              Tudo em dia
            </p>
            <p style={{ fontSize: ".86rem", color: "var(--text-muted)", maxWidth: 380, margin: "0 auto" }}>
              Não há solicitações rejeitadas, fora do prazo ou aguardando aceite de empresa.
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {solicitacoes.map((s, i) => {
            const bucket = getAdminBucket(s);

            return (
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
                    <div style={{ display: "grid", gap: ".55rem", width: "100%" }}>
                      <div
                        style={{
                          borderRadius: "12px",
                          padding: ".7rem .85rem",
                          background: "rgba(30,122,50,.08)",
                          border: "1px solid rgba(30,122,50,.12)",
                        }}
                      >
                        <p style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".12em", color: "var(--text-faint)", marginBottom: ".2rem" }}>
                          Situação
                        </p>
                        <p style={{ fontSize: ".9rem", fontWeight: 700, color: "var(--text)" }}>{bucket.title}</p>
                        <p style={{ fontSize: ".8rem", color: "var(--text-muted)", marginTop: ".2rem" }}>{bucket.description}</p>
                      </div>
                      <Link href={`/admin/solicitacoes/${s.id}`} className="btn btn-secondary" style={{ fontSize: ".82rem", flex: 1, justifyContent: "center" }}>
                        Ver detalhes
                      </Link>
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
