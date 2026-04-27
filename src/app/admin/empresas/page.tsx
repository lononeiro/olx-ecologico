import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AdminEmpresasFilters } from "./AdminEmpresasFilters";
import { AdminEmpresaActions } from "./AdminEmpresaActions";

export const dynamic = "force-dynamic";

const LIMIT = 15;

function StatusPill({ status }: { status: string }) {
  const isAtivo = status === "ativo";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: ".3rem",
      fontSize: ".72rem", fontWeight: 700, padding: ".2rem .6rem", borderRadius: 50,
      background: isAtivo ? "rgba(30,122,50,.1)" : "var(--red-light)",
      color: isAtivo ? "var(--green-dark)" : "var(--red)",
      border: `1px solid ${isAtivo ? "rgba(30,122,50,.2)" : "rgba(184,50,40,.18)"}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
      {isAtivo ? "Ativa" : "Inativa"}
    </span>
  );
}

export default async function AdminEmpresasPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const page   = Math.max(1, Number(searchParams.page ?? 1));
  const search = searchParams.search ?? "";

  const where = search ? {
    OR: [
      { user: { nome:  { contains: search, mode: "insensitive" as const } } },
      { user: { email: { contains: search, mode: "insensitive" as const } } },
      { cnpj: { contains: search, mode: "insensitive" as const } },
    ],
  } : {};

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      orderBy: { createdAt: "desc" },
      include: {
        user:   { select: { id: true, nome: true, email: true, status: true } },
        _count: { select: { coletas: true } },
      },
    }),
    prisma.company.count({ where }),
  ]);

  const companyIds = companies.map(c => c.id);
  const concluidasAgg = companyIds.length > 0
    ? await prisma.coleta.groupBy({
        by: ["companyId"],
        _count: { _all: true },
        where: { companyId: { in: companyIds }, status: "concluida" },
      })
    : [];

  const enriched = companies.map(c => ({
    ...c,
    coletasConcluidas: concluidasAgg.find(a => a.companyId === c.id)?._count._all ?? 0,
  }));

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <AdminEmpresasFilters search={search} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem" }}>
        <p style={{ fontSize: ".82rem", color: "var(--text-muted)" }}>
          {total === 0 ? "Nenhuma empresa encontrada" : `${total} empresa${total === 1 ? "" : "s"} encontrada${total === 1 ? "" : "s"}`}
        </p>
        {totalPages > 1 && (
          <p style={{ fontSize: ".82rem", color: "var(--text-faint)" }}>
            Pagina {page} de {totalPages}
          </p>
        )}
      </div>

      {enriched.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 3v18M3 9h6M3 15h6M13 7h5M13 12h5M13 17h5"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: "var(--text)", marginBottom: ".25rem" }}>Nenhuma empresa</p>
            <p style={{ fontSize: ".85rem", color: "var(--text-muted)" }}>Tente ajustar a busca.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {["Responsavel / Email", "CNPJ", "Status", "Coletas (total)", "Concluidas", "Cadastro", "Acoes"].map(h => (
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
                {enriched.map((company, i) => (
                  <tr key={company.id} style={{ borderBottom: i < enriched.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: ".75rem 1rem", minWidth: 200 }}>
                      <p style={{ fontWeight: 600, fontSize: ".875rem", color: "var(--text)", marginBottom: ".1rem" }}>
                        {company.user.nome}
                      </p>
                      <p style={{ fontSize: ".75rem", color: "var(--text-muted)" }}>{company.user.email}</p>
                    </td>
                    <td style={{ padding: ".75rem 1rem", fontSize: ".82rem", color: "var(--text-muted)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                      {company.cnpj}
                    </td>
                    <td style={{ padding: ".75rem 1rem" }}>
                      <StatusPill status={company.user.status} />
                    </td>
                    <td style={{ padding: ".75rem 1rem", fontSize: ".85rem", color: "var(--text-muted)", textAlign: "center" }}>
                      {company._count.coletas}
                    </td>
                    <td style={{ padding: ".75rem 1rem", fontSize: ".85rem", textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: "var(--green)" }}>{company.coletasConcluidas}</span>
                    </td>
                    <td style={{ padding: ".75rem 1rem", fontSize: ".78rem", color: "var(--text-faint)", whiteSpace: "nowrap" }}>
                      {new Date(company.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ padding: ".75rem 1rem" }}>
                      <div style={{ display: "flex", gap: ".35rem", alignItems: "center" }}>
                        <Link
                          href={`/admin/empresas/${company.id}`}
                          className="btn btn-ghost"
                          style={{ fontSize: ".74rem", padding: ".28rem .6rem" }}
                        >
                          Ver
                        </Link>
                        <AdminEmpresaActions
                          companyId={company.id}
                          currentStatus={company.user.status}
                        />
                      </div>
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
            <Link href={`/admin/empresas?page=${page - 1}&search=${search}`} className="btn btn-ghost" style={{ fontSize: ".82rem" }}>
              ← Anterior
            </Link>
          )}
          <span style={{ padding: ".45rem 1rem", borderRadius: "var(--radius-xs)", background: "var(--surface-2)", fontSize: ".82rem", color: "var(--text-muted)", fontWeight: 600 }}>
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/empresas?page=${page + 1}&search=${search}`} className="btn btn-ghost" style={{ fontSize: ".82rem" }}>
              Proxima →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
