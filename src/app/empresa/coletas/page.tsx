import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listarColetasDaEmpresa } from "@/services/coleta.service";
import { SolicitacaoCardVisual } from "@/components/cards/SolicitacaoCardVisual";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EmpresaColetasPage() {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);

  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) return <p>Empresa nao configurada.</p>;

  const coletas = await listarColetasDaEmpresa(company.id);

  return (
    <div className="page-enter">
      <div style={{ marginBottom: "2rem" }}>
        <p className="section-label">Empresa</p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.65rem)", fontWeight: 800, color: "var(--text)", letterSpacing: "-.4px" }}>
          Minhas Coletas
        </h1>
        <p style={{ fontSize: ".84rem", color: "var(--text-muted)", marginTop: ".3rem" }}>
          {coletas.length} coleta{coletas.length !== 1 ? "s" : ""} no total
        </p>
      </div>

      {coletas.length === 0 ? (
        <div className="card empty-state" style={{ background: "linear-gradient(135deg, var(--surface), var(--surface-3))" }}>
          <div className="empty-state-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--green-mid)" strokeWidth="1.5">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
              <rect x="9" y="11" width="14" height="10" rx="2"/>
              <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)", marginBottom: ".3rem" }}>
              Nenhuma coleta ainda
            </p>
            <p style={{ fontSize: ".86rem", color: "var(--text-muted)", maxWidth: 340, margin: "0 auto" }}>
              Aceite uma solicitação para iniciar sua primeira coleta.
            </p>
          </div>
          <Link href="/empresa/solicitacoes" className="btn btn-blue">
            Ver solicitações disponíveis
          </Link>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1.25rem",
        }}>
          {coletas.map((c, i) => (
            <div key={c.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <SolicitacaoCardVisual
                id={c.solicitacao.id}
                titulo={c.solicitacao.titulo}
                quantidade={c.solicitacao.quantidade}
                endereco={c.solicitacao.endereco}
                status={c.solicitacao.status}
                createdAt={c.solicitacao.createdAt}
                material={c.solicitacao.material}
                imagens={c.solicitacao.imagens}
                solicitanteNome={c.solicitacao.user.nome}
                coletaStatus={c.status}
                dataAceite={c.dataAceite}
                dataConclusao={c.dataConclusao ?? undefined}
                detailsHref={`/empresa/coletas/${c.id}`}
                actions={
                  <Link href={`/empresa/coletas/${c.id}`} className="btn btn-secondary" style={{ fontSize: ".82rem", flex: 1, justifyContent: "center" }}>
                    Gerenciar coleta
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
