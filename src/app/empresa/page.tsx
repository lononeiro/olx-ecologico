import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listarColetasDaEmpresa } from "@/services/coleta.service";
import { SolicitacaoCardVisual } from "@/components/cards/SolicitacaoCardVisual";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EmpresaDashboardPage() {
  const session  = await getServerSession(authOptions);
  const userId   = Number((session!.user as any).id);
  const company  = await prisma.company.findUnique({ where: { userId } });
  if (!company) return <p>Empresa não configurada.</p>;

  const [coletas, disponiveis] = await Promise.all([
    listarColetasDaEmpresa(company.id),
    prisma.solicitacaoColeta.count({ where: { aprovado: true, status: "aprovada", coleta: null } }),
  ]);

  const ativas    = coletas.filter(c => !["concluida","cancelada"].includes(c.status)).length;
  const concluidas = coletas.filter(c => c.status === "concluida").length;

  return (
    <div>
      <div className="anim-fade-up" style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: ".8rem", color: "var(--text-faint)", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "1px", marginBottom: ".3rem" }}>
          Painel da empresa
        </p>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text)" }}>
          {session!.user!.name}
        </h1>
        <p style={{ fontSize: ".82rem", color: "var(--text-muted)", marginTop: ".2rem" }}>
          {company.cnpj}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {[
          { value: disponiveis, label: "Disponíveis",   color: "var(--blue)",    delay: ".05s" },
          { value: ativas,      label: "Em andamento",  color: "var(--yellow)",  delay: ".12s" },
          { value: concluidas,  label: "Concluídas",    color: "var(--green)",   delay: ".19s" },
          { value: coletas.length, label: "Total",      color: "var(--text)",    delay: ".26s" },
        ].map(s => (
          <div key={s.label} className="card anim-fade-up" style={{ animationDelay: s.delay, padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: ".35rem" }}>{s.value}</div>
            <div style={{ fontSize: ".82rem", color: "var(--text-muted)", fontWeight: 500 }}>{s.label}</div>
            <div style={{ height: 3, borderRadius: 999, marginTop: ".75rem", background: `linear-gradient(90deg, ${s.color}, transparent)`, opacity: .5 }}/>
          </div>
        ))}
      </div>

      {/* Disponíveis CTA */}
      {disponiveis > 0 && (
        <div className="anim-fade-up stagger-3" style={{
          background: "var(--blue-light)", border: "1px solid rgba(46,134,193,.2)",
          borderRadius: "var(--radius)", padding: "1.25rem 1.5rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "1rem", flexWrap: "wrap", marginBottom: "2rem",
        }}>
          <div>
            <p style={{ fontWeight: 600, color: "var(--blue)", marginBottom: ".2rem" }}>
              {disponiveis} {disponiveis === 1 ? "solicitação disponível" : "solicitações disponíveis"}
            </p>
            <p style={{ fontSize: ".85rem", color: "var(--text-muted)" }}>
              Novas coletas aguardando aceitação.
            </p>
          </div>
          <Link href="/empresa/solicitacoes" className="btn btn-blue">
            Ver disponíveis
          </Link>
        </div>
      )}

      {/* Recent coletas */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text)" }}>Coletas recentes</h2>
        {coletas.length > 5 && (
          <Link href="/empresa/coletas" className="btn btn-ghost" style={{ fontSize: ".82rem" }}>
            Ver todas
          </Link>
        )}
      </div>

      {coletas.length === 0 ? (
        <div className="card anim-fade-up" style={{ textAlign: "center", padding: "3.5rem 2rem" }}>
          <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: ".35rem" }}>Nenhuma coleta ainda</p>
          <p style={{ fontSize: ".85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
            Aceite uma solicitação para iniciar sua primeira coleta.
          </p>
          <Link href="/empresa/solicitacoes" className="btn btn-blue">Ver disponíveis</Link>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.1rem",
        }}>
          {coletas.slice(0, 6).map((c, i) => (
            <div key={c.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
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
                detailsHref={`/empresa/coletas/${c.id}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}