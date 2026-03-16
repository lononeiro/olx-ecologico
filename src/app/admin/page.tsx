import { listarSolicitacoesPendentes } from "@/services/solicitacao.service";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [pendentes, totalUsers, totalEmpresas, totalAprovadas] = await Promise.all([
    listarSolicitacoesPendentes(),
    prisma.user.count({ where: { role: { nome: "usuario" } } }),
    prisma.company.count(),
    prisma.solicitacaoColeta.count({ where: { aprovado: true } }),
  ]);

  return (
    <div>
      <div className="anim-fade-up" style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: ".8rem", color: "var(--text-faint)", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "1px", marginBottom: ".3rem" }}>
          Administração
        </p>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text)" }}>
          Painel de Controle
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "1rem", marginBottom: "2.5rem" }}>
        {[
          { value: pendentes.length, label: "Aguardando aprovação", color: "var(--yellow)",     delay: ".05s" },
          { value: totalAprovadas,   label: "Aprovadas no total",   color: "var(--green)",      delay: ".12s" },
          { value: totalUsers,       label: "Usuários cadastrados", color: "var(--blue)",        delay: ".19s" },
          { value: totalEmpresas,    label: "Empresas parceiras",   color: "var(--green-dark)",  delay: ".26s" },
        ].map(s => (
          <div key={s.label} className="card anim-fade-up" style={{ animationDelay: s.delay, padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: ".35rem" }}>
              {s.value}
            </div>
            <div style={{ fontSize: ".82rem", color: "var(--text-muted)", fontWeight: 500 }}>{s.label}</div>
            <div style={{
              height: 3, borderRadius: 999, marginTop: ".75rem",
              background: `linear-gradient(90deg, ${s.color}, transparent)`, opacity: .5,
            }}/>
          </div>
        ))}
      </div>

      {/* Pending list */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text)" }}>
          Solicitações pendentes
        </h2>
        {pendentes.length > 0 && (
          <Link href="/admin/solicitacoes" className="btn btn-ghost" style={{ fontSize: ".82rem" }}>
            Ver todas
          </Link>
        )}
      </div>

      {pendentes.length === 0 ? (
        <div className="card anim-fade-up" style={{ textAlign: "center", padding: "3.5rem 2rem" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", margin: "0 auto 1rem",
            background: "rgba(45,138,62,.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: ".35rem" }}>
            Nenhuma pendência
          </p>
          <p style={{ fontSize: ".85rem", color: "var(--text-muted)" }}>
            Todas as solicitações foram processadas.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {pendentes.slice(0, 6).map((s, i) => (
            <div key={s.id} className="card card-hover anim-fade-up" style={{ animationDelay: `${i * 0.06}s`, padding: "1.1rem 1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: "var(--yellow-light)", border: "1px solid rgba(212,134,10,.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: ".92rem", color: "var(--text)",
                    marginBottom: ".2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.titulo}
                  </p>
                  <p style={{ fontSize: ".8rem", color: "var(--text-muted)" }}>
                    {s.user.nome} · {s.material.nome} · {s.quantidade}
                  </p>
                </div>
                <Link href={`/admin/solicitacoes/${s.id}`} className="btn btn-secondary" style={{ fontSize: ".82rem", flexShrink: 0 }}>
                  Analisar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}