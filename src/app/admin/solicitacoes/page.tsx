import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { SolicitacaoBadge, ColetaBadge } from "@/components/ui/StatusBadge";
import { AdminSolicitacoesFilters } from "./AdminSolicitacoesFilters";

export const dynamic = "force-dynamic";

const LIMIT = 20;

export default async function AdminSolicitacoesPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; status?: string };
}) {
  const page         = Math.max(1, Number(searchParams.page   ?? 1));
  const search       = searchParams.search ?? "";
  const statusFilter = searchParams.status ?? "";

  const where = {
    AND: [
      statusFilter ? { status: statusFilter } : {},
      search ? { OR: [
        { titulo: { contains: search, mode: "insensitive" as const } },
        { user: { nome:  { contains: search, mode: "insensitive" as const } } },
        { user: { email: { contains: search, mode: "insensitive" as const } } },
      ]} : {},
    ],
  };

  const [solicitacoes, total, counts] = await Promise.all([
    prisma.solicitacaoColeta.findMany({
      where,
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      orderBy: { createdAt: "desc" },
      include: {
        user:     { select: { id: true, nome: true, email: true } },
        material: { select: { nome: true } },
        coleta: {
          select: {
            id: true, status: true,
            company: { include: { user: { select: { nome: true } } } },
          },
        },
      },
    }),
    prisma.solicitacaoColeta.count({ where }),
    Promise.all([
      prisma.solicitacaoColeta.count({ where: { status: "pendente"  } }),
      prisma.solicitacaoColeta.count({ where: { status: "aprovada"  } }),
      prisma.solicitacaoColeta.count({ where: { status: "rejeitada" } }),
    ]),
  ]);

  const [totalPendentes, totalAprovadas, totalRejeitadas] = counts;
  const totalPages = Math.ceil(total / LIMIT);

  const quickFilters = [
    { label: "Todas",     value: "",          count: null },
    { label: "Pendentes", value: "pendente",  count: totalPendentes  },
    { label: "Aprovadas", value: "aprovada",  count: totalAprovadas  },
    { label: "Rejeitadas",value: "rejeitada", count: totalRejeitadas },
  ];

  return (
    <div>
      {/* Quick filter pills */}
      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {quickFilters.map(f => {
          const active = statusFilter === f.value;
          return (
            <Link
              key={f.value}
              href={`/admin/solicitacoes?status=${f.value}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: ".4rem",
                padding: ".35rem .85rem", borderRadius: 50, textDecoration: "none",
                fontSize: ".8rem", fontWeight: active ? 700 : 500,
                background: active ? "var(--green)" : "var(--surface)",
                color: active ? "#fff" : "var(--text-muted)",
                border: `1px solid ${active ? "var(--green)" : "var(--border)"}`,
                transition: "all .15s",
              }}
            >
              {f.label}
              {f.count !== null && (
                <span style={{
                  fontSize: ".68rem", fontWeight: 700,
                  background: active ? "rgba(255,255,255,.25)" : "var(--surface-2)",
                  color: active ? "#fff" : "var(--text-faint)",
                  padding: ".05rem .4rem", borderRadius: 50,
                }}>
                  {f.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <AdminSolicitacoesFilters search={search} status={statusFilter} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem" }}>
        <p style={{ fontSize: ".82rem", color: "var(--text-muted)" }}>
          {total === 0 ? "Nenhuma solicitacao encontrada" : `${total} solicitacao${total === 1 ? "" : "es"} encontrada${total === 1 ? "" : "s"}`}
        </p>
        {totalPages > 1 && (
          <p style={{ fontSize: ".82rem", color: "var(--text-faint)" }}>Pagina {page} de {totalPages}</p>
        )}
      </div>

      {solicitacoes.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5">
              <path d="M9 5h6M9 3h6a2 2 0 0 1 2 2v1H7V5a2 2 0 0 1 2-2ZM7 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <path d="M8 12h8M8 16h5"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: "var(--text)", marginBottom: ".25rem" }}>Nenhuma solicitacao</p>
            <p style={{ fontSize: ".85rem", color: "var(--text-muted)" }}>Tente ajustar os filtros.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {["#", "Titulo / Solicitante", "Material", "Status", "Empresa / Coleta", "Endereco", "Data", ""].map(h => (
                    <th key={h} style={{
                      padding: ".65rem 1rem", textAlign: "left",
                      fontSize: ".7rem", textTransform: "uppercase",
                      letterSpacing: "1px", color: "var(--text-faint)", fontWeight: 700, whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {solicitacoes.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: i < solicitacoes.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: ".7rem 1rem", fontSize: ".78rem", color: "var(--text-faint)", whiteSpace: "nowrap" }}>
                      #{s.id}
                    </td>
                    <td style={{ padding: ".7rem 1rem", minWidth: 190 }}>
                      <p style={{ fontWeight: 600, fontSize: ".875rem", color: "var(--text)", marginBottom: ".1rem", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.titulo}
                      </p>
                      <p style={{ fontSize: ".74rem", color: "var(--text-muted)" }}>{s.user.nome}</p>
                    </td>
                    <td style={{ padding: ".7rem 1rem", fontSize: ".82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {s.material.nome}
                    </td>
                    <td style={{ padding: ".7rem 1rem", whiteSpace: "nowrap" }}>
                      <SolicitacaoBadge status={s.status} />
                    </td>
                    <td style={{ padding: ".7rem 1rem", minWidth: 140 }}>
                      {s.coleta ? (
                        <div>
                          <p style={{ fontSize: ".78rem", color: "var(--text)", fontWeight: 500, marginBottom: ".15rem" }}>
                            {s.coleta.company.user.nome}
                          </p>
                          <ColetaBadge status={s.coleta.status} />
                        </div>
                      ) : (
                        <span style={{ fontSize: ".78rem", color: "var(--text-faint)" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: ".7rem 1rem", fontSize: ".78rem", color: "var(--text-muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.endereco}
                    </td>
                    <td style={{ padding: ".7rem 1rem", fontSize: ".76rem", color: "var(--text-faint)", whiteSpace: "nowrap" }}>
                      {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ padding: ".7rem 1rem" }}>
                      <Link
                        href={`/admin/solicitacoes/${s.id}`}
                        className="btn btn-ghost"
                        style={{ fontSize: ".74rem", padding: ".28rem .6rem", whiteSpace: "nowrap" }}
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: ".5rem", marginTop: "1.25rem" }}>
          {page > 1 && (
            <Link
              href={`/admin/solicitacoes?page=${page - 1}&status=${statusFilter}&search=${search}`}
              className="btn btn-ghost" style={{ fontSize: ".82rem" }}
            >
              ← Anterior
            </Link>
          )}
          <span style={{ padding: ".45rem 1rem", borderRadius: "var(--radius-xs)", background: "var(--surface-2)", fontSize: ".82rem", color: "var(--text-muted)", fontWeight: 600 }}>
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/solicitacoes?page=${page + 1}&status=${statusFilter}&search=${search}`}
              className="btn btn-ghost" style={{ fontSize: ".82rem" }}
            >
              Proxima →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
