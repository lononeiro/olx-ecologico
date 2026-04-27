import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AdminUsersFilters } from "./AdminUsersFilters";
import { AdminUserActions } from "./AdminUserActions";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { usuario: "Cidadao", admin: "Administrador", empresa: "Empresa" };
const LIMIT = 15;

function StatusPill({ status }: { status: string }) {
  const isAtivo = status === "ativo";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: ".3rem",
      fontSize: ".72rem", fontWeight: 700, padding: ".2rem .6rem",
      borderRadius: 50,
      background: isAtivo ? "rgba(30,122,50,.1)" : "var(--red-light)",
      color: isAtivo ? "var(--green-dark)" : "var(--red)",
      border: `1px solid ${isAtivo ? "rgba(30,122,50,.2)" : "rgba(184,50,40,.18)"}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
      {isAtivo ? "Ativo" : "Inativo"}
    </span>
  );
}

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; role?: string; status?: string };
}) {
  const page         = Math.max(1, Number(searchParams.page   ?? 1));
  const search       = searchParams.search ?? "";
  const roleFilter   = searchParams.role   ?? "";
  const statusFilter = searchParams.status ?? "";

  const where = {
    AND: [
      search ? { OR: [
        { nome:  { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ]} : {},
      roleFilter   ? { role:   { nome: roleFilter   } } : {},
      statusFilter ? { status: statusFilter           } : {},
    ],
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, nome: true, email: true, telefone: true, status: true, createdAt: true,
        role:    { select: { nome: true } },
        company: { select: { id: true } },
        _count:  { select: { solicitacoes: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <AdminUsersFilters search={search} role={roleFilter} status={statusFilter} />

      {/* Summary */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem" }}>
        <p style={{ fontSize: ".82rem", color: "var(--text-muted)" }}>
          {total === 0 ? "Nenhum usuario encontrado" : `${total} usuario${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"}`}
        </p>
        {totalPages > 1 && (
          <p style={{ fontSize: ".82rem", color: "var(--text-faint)" }}>
            Pagina {page} de {totalPages}
          </p>
        )}
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: "var(--text)", marginBottom: ".25rem" }}>Nenhum usuario</p>
            <p style={{ fontSize: ".85rem", color: "var(--text-muted)" }}>Tente ajustar os filtros de busca.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {["Nome / Email", "Telefone", "Perfil", "Status", "Solicitacoes", "Cadastro", "Acoes"].map(h => (
                    <th key={h} style={{
                      padding: ".65rem 1rem", textAlign: "left",
                      fontSize: ".7rem", textTransform: "uppercase",
                      letterSpacing: "1px", color: "var(--text-faint)", fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user.id} style={{
                    borderBottom: i < users.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background .15s",
                  }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: ".75rem 1rem", minWidth: 200 }}>
                      <p style={{ fontWeight: 600, fontSize: ".875rem", color: "var(--text)", marginBottom: ".1rem" }}>
                        {user.nome}
                      </p>
                      <p style={{ fontSize: ".75rem", color: "var(--text-muted)" }}>{user.email}</p>
                    </td>
                    <td style={{ padding: ".75rem 1rem", fontSize: ".83rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {user.telefone ?? <span style={{ color: "var(--text-faint)" }}>—</span>}
                    </td>
                    <td style={{ padding: ".75rem 1rem", whiteSpace: "nowrap" }}>
                      <span style={{
                        fontSize: ".72rem", fontWeight: 700,
                        color: user.role.nome === "admin" ? "var(--purple)" : user.role.nome === "empresa" ? "var(--blue)" : "var(--text-muted)",
                      }}>
                        {ROLE_LABEL[user.role.nome] ?? user.role.nome}
                      </span>
                    </td>
                    <td style={{ padding: ".75rem 1rem" }}>
                      <StatusPill status={user.status} />
                    </td>
                    <td style={{ padding: ".75rem 1rem", fontSize: ".83rem", color: "var(--text-muted)", textAlign: "center" }}>
                      {user._count.solicitacoes}
                    </td>
                    <td style={{ padding: ".75rem 1rem", fontSize: ".78rem", color: "var(--text-faint)", whiteSpace: "nowrap" }}>
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ padding: ".75rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: ".4rem", flexWrap: "wrap" }}>
                        <Link
                          href={`/admin/usuarios/${user.id}`}
                          className="btn btn-ghost"
                          style={{ fontSize: ".74rem", padding: ".28rem .6rem" }}
                        >
                          Ver
                        </Link>
                        <AdminUserActions
                          userId={user.id}
                          currentStatus={user.status}
                          userRole={user.role.nome}
                          solicitacoesCount={user._count.solicitacoes}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: ".5rem", marginTop: "1.25rem" }}>
          {page > 1 && (
            <Link
              href={`/admin/usuarios?page=${page - 1}&search=${search}&role=${roleFilter}&status=${statusFilter}`}
              className="btn btn-ghost"
              style={{ fontSize: ".82rem" }}
            >
              ← Anterior
            </Link>
          )}
          <span style={{
            padding: ".45rem 1rem", borderRadius: "var(--radius-xs)",
            background: "var(--surface-2)", fontSize: ".82rem",
            color: "var(--text-muted)", fontWeight: 600,
          }}>
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/usuarios?page=${page + 1}&search=${search}&role=${roleFilter}&status=${statusFilter}`}
              className="btn btn-ghost"
              style={{ fontSize: ".82rem" }}
            >
              Proxima →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
