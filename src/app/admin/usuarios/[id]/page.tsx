import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { SolicitacaoBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { usuario: "Cidadao", admin: "Administrador", empresa: "Empresa" };

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ padding: ".85rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)" }}>
      <p style={{ fontSize: ".68rem", textTransform: "uppercase", letterSpacing: "1.4px", color: "var(--text-faint)", fontWeight: 700, marginBottom: ".3rem" }}>
        {label}
      </p>
      <p style={{ fontSize: ".9rem", color: "var(--text)", fontWeight: 600, lineHeight: 1.5 }}>
        {value ?? <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>Nao informado</span>}
      </p>
    </div>
  );
}

export default async function AdminUsuarioDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      company: true,
      solicitacoes: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { material: { select: { nome: true } } },
      },
      _count: { select: { solicitacoes: true, mensagensEnviadas: true } },
    },
  });

  if (!user) notFound();

  const statCards = [
    { label: "Solicitacoes",  value: user._count.solicitacoes,      color: "var(--blue)"  },
    { label: "Mensagens",     value: user._count.mensagensEnviadas, color: "var(--green)" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <BackButton fallbackHref="/admin/usuarios" className="btn btn-ghost" style={{ fontSize: ".82rem" }}>
          ← Voltar
        </BackButton>
        <p style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: "1.6px", color: "var(--text-faint)", fontWeight: 700 }}>
          Usuario #{user.id}
        </p>
      </div>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: "1rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", flexWrap: "wrap" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, var(--green), var(--green-mid))",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "1.4rem", fontWeight: 700,
          }}>
            {user.nome[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", marginBottom: ".25rem" }}>
              {user.nome}
            </h1>
            <p style={{ fontSize: ".88rem", color: "var(--text-muted)", marginBottom: ".5rem" }}>{user.email}</p>
            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
              <span style={{
                fontSize: ".72rem", fontWeight: 700, padding: ".2rem .65rem", borderRadius: 50,
                background: "rgba(30,122,50,.1)", color: "var(--green-dark)", border: "1px solid rgba(30,122,50,.2)",
              }}>
                {ROLE_LABEL[user.role.nome] ?? user.role.nome}
              </span>
              <span style={{
                fontSize: ".72rem", fontWeight: 700, padding: ".2rem .65rem", borderRadius: 50,
                background: user.status === "ativo" ? "rgba(30,122,50,.08)" : "var(--red-light)",
                color: user.status === "ativo" ? "var(--green)" : "var(--red)",
                border: `1px solid ${user.status === "ativo" ? "rgba(30,122,50,.15)" : "rgba(184,50,40,.18)"}`,
              }}>
                {user.status === "ativo" ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
          {/* Mini stats */}
          <div style={{ display: "flex", gap: ".65rem" }}>
            {statCards.map(s => (
              <div key={s.label} style={{
                padding: ".65rem .9rem", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)", textAlign: "center", minWidth: 72,
              }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: ".68rem", color: "var(--text-faint)", marginTop: ".15rem" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="card" style={{ marginBottom: "1rem", padding: "1.25rem" }}>
        <p className="section-label" style={{ marginBottom: ".85rem" }}>Dados cadastrais</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: ".75rem" }}>
          <Field label="Telefone" value={user.telefone} />
          <Field label="Endereco" value={user.endereco} />
          <Field label="Cadastro em" value={new Date(user.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} />
          {user.company && <Field label="CNPJ" value={user.company.cnpj} />}
        </div>
      </div>

      {/* Solicitações history */}
      {user.solicitacoes.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
            <p className="section-label">Historico</p>
            <h2 style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--text)" }}>
              Ultimas solicitacoes
            </h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {["#", "Titulo", "Material", "Status", "Data"].map(h => (
                    <th key={h} style={{
                      padding: ".55rem 1rem", textAlign: "left",
                      fontSize: ".68rem", textTransform: "uppercase",
                      letterSpacing: "1px", color: "var(--text-faint)", fontWeight: 700,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {user.solicitacoes.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: i < user.solicitacoes.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: ".65rem 1rem", fontSize: ".78rem", color: "var(--text-faint)" }}>#{s.id}</td>
                    <td style={{ padding: ".65rem 1rem", fontSize: ".85rem", color: "var(--text)", fontWeight: 500, maxWidth: 200 }}>
                      <Link href={`/admin/solicitacoes/${s.id}`} style={{ color: "inherit", textDecoration: "none" }}
                        className="hover-underline">
                        {s.titulo}
                      </Link>
                    </td>
                    <td style={{ padding: ".65rem 1rem", fontSize: ".82rem", color: "var(--text-muted)" }}>{s.material.nome}</td>
                    <td style={{ padding: ".65rem 1rem" }}><SolicitacaoBadge status={s.status} /></td>
                    <td style={{ padding: ".65rem 1rem", fontSize: ".78rem", color: "var(--text-faint)", whiteSpace: "nowrap" }}>
                      {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {user._count.solicitacoes > 10 && (
            <div style={{ padding: ".75rem 1.25rem", borderTop: "1px solid var(--border)", textAlign: "center" }}>
              <Link href={`/admin/solicitacoes?search=${encodeURIComponent(user.email)}`}
                className="btn btn-ghost" style={{ fontSize: ".82rem" }}>
                Ver todas as {user._count.solicitacoes} solicitacoes →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
