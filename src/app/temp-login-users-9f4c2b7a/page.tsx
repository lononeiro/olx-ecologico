import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TEMP_SECRET = process.env.TEMP_LOGIN_USERS_SECRET ?? "olx-ecologico-login-users";

export default async function TempLoginUsersPage({
  searchParams,
}: {
  searchParams: { secret?: string };
}) {
  if (searchParams.secret !== TEMP_SECRET) {
    notFound();
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      status: true,
      createdAt: true,
      role: { select: { nome: true } },
      company: { select: { cnpj: true } },
    },
    orderBy: [{ role: { nome: "asc" } }, { nome: "asc" }],
  });

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", padding: "2rem 1rem" }}>
      <section style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <p className="section-label">Temporário</p>
            <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 800, color: "var(--text)" }}>
              Usuários para login
            </h1>
            <p style={{ color: "var(--text-muted)", marginTop: ".35rem", fontSize: ".9rem" }}>
              Lista temporária para identificar contas existentes. Senhas e hashes não são exibidos.
            </p>
          </div>
          <Link href="/login" className="btn btn-primary">
            Ir para login
          </Link>
        </div>

        <div className="card" style={{ overflowX: "auto", background: "var(--surface)", border: "1px solid var(--border)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-faint)", fontSize: ".74rem", textTransform: "uppercase", letterSpacing: "1.4px" }}>
                <Th>ID</Th>
                <Th>Nome</Th>
                <Th>Email</Th>
                <Th>Perfil</Th>
                <Th>Status</Th>
                <Th>CNPJ</Th>
                <Th>Criado em</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <Td mono>{String(user.id)}</Td>
                  <Td>{user.nome}</Td>
                  <Td mono>{user.email}</Td>
                  <Td>{user.role.nome}</Td>
                  <Td>{user.status}</Td>
                  <Td mono>{user.company?.cnpj ?? "-"}</Td>
                  <Td>{new Date(user.createdAt).toLocaleString("pt-BR")}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: ".75rem .8rem", fontWeight: 800 }}>{children}</th>;
}

function Td({
  children,
  mono,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <td
      style={{
        padding: ".85rem .8rem",
        color: "var(--text)",
        fontSize: ".88rem",
        fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </td>
  );
}
