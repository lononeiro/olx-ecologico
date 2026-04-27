import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { ColetaBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ padding: ".85rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)" }}>
      <p style={{ fontSize: ".68rem", textTransform: "uppercase", letterSpacing: "1.4px", color: "var(--text-faint)", fontWeight: 700, marginBottom: ".3rem" }}>
        {label}
      </p>
      <p style={{ fontSize: ".9rem", color: "var(--text)", fontWeight: 600, lineHeight: 1.5, wordBreak: "break-all" }}>
        {value ?? <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>Nao informado</span>}
      </p>
    </div>
  );
}

export default async function AdminEmpresaDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      user: true,
      coletas: {
        orderBy: { dataAceite: "desc" },
        take: 10,
        include: {
          solicitacao: {
            include: { material: { select: { nome: true } }, user: { select: { nome: true } } },
          },
        },
      },
      _count: { select: { coletas: true } },
    },
  });

  if (!company) notFound();

  const [coletasConcluidas, coletasCanceladas, coletasAtivas] = await Promise.all([
    prisma.coleta.count({ where: { companyId: id, status: "concluida" } }),
    prisma.coleta.count({ where: { companyId: id, status: "cancelada" } }),
    prisma.coleta.count({ where: { companyId: id, status: { in: ["aceita", "a_caminho", "em_coleta"] } } }),
  ]);

  const statCards = [
    { label: "Total coletas",   value: company._count.coletas, color: "var(--blue)"  },
    { label: "Concluidas",      value: coletasConcluidas,      color: "var(--green)" },
    { label: "Ativas",          value: coletasAtivas,          color: "var(--yellow)"},
    { label: "Canceladas",      value: coletasCanceladas,      color: "var(--red)"   },
  ];

  const isAtivo = company.user.status === "ativo";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <BackButton fallbackHref="/admin/empresas" className="btn btn-ghost" style={{ fontSize: ".82rem" }}>
          ← Voltar
        </BackButton>
        <p style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: "1.6px", color: "var(--text-faint)", fontWeight: 700 }}>
          Empresa #{company.id}
        </p>
      </div>

      {/* Profile */}
      <div className="card" style={{ marginBottom: "1rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", flexWrap: "wrap" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg, var(--blue), var(--blue-mid))",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "1.4rem", fontWeight: 700,
          }}>
            {company.user.nome[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", marginBottom: ".2rem" }}>
              {company.user.nome}
            </h1>
            <p style={{ fontSize: ".88rem", color: "var(--text-muted)", marginBottom: ".15rem" }}>{company.user.email}</p>
            <p style={{ fontSize: ".82rem", color: "var(--text-faint)", fontFamily: "monospace" }}>{company.cnpj}</p>
            <div style={{ marginTop: ".5rem" }}>
              <span style={{
                fontSize: ".72rem", fontWeight: 700, padding: ".2rem .65rem", borderRadius: 50,
                background: isAtivo ? "rgba(30,122,50,.08)" : "var(--red-light)",
                color: isAtivo ? "var(--green)" : "var(--red)",
                border: `1px solid ${isAtivo ? "rgba(30,122,50,.15)" : "rgba(184,50,40,.18)"}`,
              }}>
                {isAtivo ? "Ativa" : "Inativa"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            {statCards.map(s => (
              <div key={s.label} style={{
                padding: ".6rem .85rem", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)", textAlign: "center", minWidth: 64,
              }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: ".65rem", color: "var(--text-faint)", marginTop: ".15rem" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="card" style={{ marginBottom: "1rem", padding: "1.25rem" }}>
        <p className="section-label" style={{ marginBottom: ".85rem" }}>Dados da empresa</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: ".75rem" }}>
          <Field label="CNPJ" value={company.cnpj} />
          <Field label="Telefone" value={company.user.telefone} />
          <Field label="Cadastro em" value={new Date(company.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} />
          {company.descricao && (
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Descricao" value={company.descricao} />
            </div>
          )}
        </div>
      </div>

      {/* Coletas history */}
      {company.coletas.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
            <p className="section-label">Historico operacional</p>
            <h2 style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--text)" }}>Ultimas coletas</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {["#", "Solicitante", "Material", "Status coleta", "Aceita em"].map(h => (
                    <th key={h} style={{
                      padding: ".55rem 1rem", textAlign: "left",
                      fontSize: ".68rem", textTransform: "uppercase",
                      letterSpacing: "1px", color: "var(--text-faint)", fontWeight: 700, whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {company.coletas.map((coleta, i) => (
                  <tr key={coleta.id} style={{ borderBottom: i < company.coletas.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: ".65rem 1rem", fontSize: ".78rem", color: "var(--text-faint)" }}>#{coleta.id}</td>
                    <td style={{ padding: ".65rem 1rem", fontSize: ".85rem", color: "var(--text)", fontWeight: 500 }}>
                      {coleta.solicitacao.user.nome}
                    </td>
                    <td style={{ padding: ".65rem 1rem", fontSize: ".82rem", color: "var(--text-muted)" }}>
                      {coleta.solicitacao.material.nome}
                    </td>
                    <td style={{ padding: ".65rem 1rem" }}>
                      <ColetaBadge status={coleta.status} />
                    </td>
                    <td style={{ padding: ".65rem 1rem", fontSize: ".78rem", color: "var(--text-faint)", whiteSpace: "nowrap" }}>
                      {new Date(coleta.dataAceite).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {company._count.coletas > 10 && (
            <div style={{ padding: ".75rem 1.25rem", borderTop: "1px solid var(--border)", textAlign: "center" }}>
              <Link href={`/admin/solicitacoes?search=${encodeURIComponent(company.user.email)}`}
                className="btn btn-ghost" style={{ fontSize: ".82rem" }}>
                Ver todas as {company._count.coletas} coletas →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
