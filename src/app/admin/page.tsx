import { listarSolicitacoesPendentes } from "@/services/solicitacao.service";
import { prisma } from "@/lib/prisma";
import { SolicitacaoCardVisual } from "@/components/cards/SolicitacaoCardVisual";
import Link from "next/link";

export const dynamic = "force-dynamic";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default async function AdminDashboardPage() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalUsuarios, totalEmpresas, totalSolicitacoes,
    solicitacoesPendentes, solicitacoesAprovadas, solicitacoesRejeitadas,
    coletasAceitas, coletasConcluidas, coletasCanceladas,
    pendentes, materiaisAgg, empresasAgg, solicitacoesRecentes,
  ] = await Promise.all([
    prisma.user.count({ where: { role: { nome: "usuario" } } }),
    prisma.company.count(),
    prisma.solicitacaoColeta.count(),
    prisma.solicitacaoColeta.count({ where: { status: "pendente" } }),
    prisma.solicitacaoColeta.count({ where: { status: "aprovada" } }),
    prisma.solicitacaoColeta.count({ where: { status: "rejeitada" } }),
    prisma.coleta.count({ where: { status: "aceita" } }),
    prisma.coleta.count({ where: { status: "concluida" } }),
    prisma.coleta.count({ where: { status: "cancelada" } }),
    listarSolicitacoesPendentes(),
    prisma.solicitacaoColeta.groupBy({
      by: ["materialId"],
      _count: { _all: true },
      orderBy: { _count: { materialId: "desc" } },
      take: 5,
    }),
    prisma.coleta.groupBy({
      by: ["companyId"],
      _count: { _all: true },
      where: { status: "concluida" },
      orderBy: { _count: { companyId: "desc" } },
      take: 5,
    }),
    prisma.solicitacaoColeta.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
  ]);

  // Enrich materials
  const materialIds = materiaisAgg.map(m => m.materialId);
  const materiais = materialIds.length > 0
    ? await prisma.materialTipo.findMany({ where: { id: { in: materialIds } } })
    : [];
  const materiaisTop = materiaisAgg.map(m => ({
    nome: materiais.find(mat => mat.id === m.materialId)?.nome ?? "?",
    total: m._count._all,
  }));
  const maxMat = Math.max(...materiaisTop.map(m => m.total), 1);

  // Enrich companies
  const companyIds = empresasAgg.map(e => e.companyId);
  const companies = companyIds.length > 0
    ? await prisma.company.findMany({
        where: { id: { in: companyIds } },
        include: { user: { select: { nome: true } } },
      })
    : [];
  const empresasTop = empresasAgg.map(e => ({
    nome: companies.find(c => c.id === e.companyId)?.user.nome ?? "Empresa",
    total: e._count._all,
  }));

  // Monthly aggregation (robust key with year)
  const monthSlots: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthSlots.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_NAMES[d.getMonth()] });
  }
  const countByKey: Record<string, number> = Object.fromEntries(monthSlots.map(m => [m.key, 0]));
  for (const s of solicitacoesRecentes) {
    const d = new Date(s.createdAt);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (k in countByKey) countByKey[k]++;
  }
  const porMes = monthSlots.map(m => ({ mes: m.label, total: countByKey[m.key] }));
  const maxMes = Math.max(...porMes.map(m => m.total), 1);

  const coletaStatusData = [
    { label: "Aceitas",    value: coletasAceitas,    color: "var(--blue)"  },
    { label: "Concluidas", value: coletasConcluidas, color: "var(--green)" },
    { label: "Canceladas", value: coletasCanceladas, color: "var(--red)"   },
  ];
  const maxColeta = Math.max(...coletaStatusData.map(c => c.value), 1);

  const statCards = [
    { value: totalUsuarios,         label: "Usuarios cadastrados",  color: "var(--blue)",      icon: "👤" },
    { value: totalEmpresas,         label: "Empresas parceiras",    color: "var(--purple)",    icon: "🏭" },
    { value: totalSolicitacoes,     label: "Total de solicitacoes", color: "var(--text-muted)", icon: "📋" },
    { value: solicitacoesPendentes, label: "Aguardando aprovacao",  color: "var(--yellow)",    icon: "⏳" },
    { value: coletasConcluidas,     label: "Coletas concluidas",    color: "var(--green)",     icon: "✅" },
    { value: solicitacoesRejeitadas,label: "Solicitacoes rejeitadas",color: "var(--red)",      icon: "❌" },
  ];

  return (
    <div>
      {/* Stat cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
        gap: "1rem", marginBottom: "1.75rem",
      }}>
        {statCards.map((s, i) => (
          <div key={s.label} className="card anim-fade-up" style={{ animationDelay: `${i * 0.06}s`, padding: "1.1rem 1.2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".6rem" }}>
              <span style={{ fontSize: "1rem" }}>{s.icon}</span>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "block" }} />
            </div>
            <div style={{ fontSize: "1.9rem", fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: ".2rem" }}>
              {s.value}
            </div>
            <div style={{ fontSize: ".75rem", color: "var(--text-muted)", fontWeight: 500, lineHeight: 1.35 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        {/* Solicitações por mês */}
        <div className="card" style={{ padding: "1.4rem" }}>
          <p className="section-label">Ultimos 6 meses</p>
          <h2 style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--text)", marginBottom: "1.25rem" }}>
            Solicitacoes por mes
          </h2>
          <div style={{ display: "flex", gap: ".35rem", alignItems: "flex-end", height: 96 }}>
            {porMes.map(m => (
              <div key={m.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: ".3rem" }}>
                <span style={{ fontSize: ".6rem", color: "var(--text-faint)", fontWeight: 600, minHeight: 12 }}>
                  {m.total > 0 ? m.total : ""}
                </span>
                <div style={{
                  width: "100%", borderRadius: "4px 4px 0 0",
                  minHeight: 4,
                  height: `${Math.max(4, (m.total / maxMes) * 72)}px`,
                  background: "linear-gradient(180deg, var(--green-mid), var(--green))",
                }} />
                <span style={{ fontSize: ".62rem", color: "var(--text-muted)" }}>{m.mes}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coletas por status */}
        <div className="card" style={{ padding: "1.4rem" }}>
          <p className="section-label">Status atual</p>
          <h2 style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--text)", marginBottom: "1.25rem" }}>
            Coletas por status
          </h2>
          <div style={{ display: "flex", gap: ".75rem", alignItems: "flex-end", height: 96 }}>
            {coletaStatusData.map(item => (
              <div key={item.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: ".3rem" }}>
                <span style={{ fontSize: ".6rem", color: "var(--text-faint)", fontWeight: 600, minHeight: 12 }}>
                  {item.value > 0 ? item.value : ""}
                </span>
                <div style={{
                  width: "100%", borderRadius: "4px 4px 0 0",
                  minHeight: 4,
                  height: `${Math.max(4, (item.value / maxColeta) * 72)}px`,
                  background: item.color,
                  opacity: item.value === 0 ? 0.25 : 1,
                }} />
                <span style={{ fontSize: ".62rem", color: "var(--text-muted)", textAlign: "center" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Materials + Top companies */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        {/* Top materiais */}
        <div className="card" style={{ padding: "1.4rem" }}>
          <p className="section-label">Mais solicitados</p>
          <h2 style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--text)", marginBottom: "1.2rem" }}>
            Materiais em destaque
          </h2>
          {materiaisTop.length === 0 ? (
            <p style={{ fontSize: ".84rem", color: "var(--text-faint)" }}>Nenhum dado ainda.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: ".7rem" }}>
              {materiaisTop.map(m => (
                <div key={m.nome} style={{ display: "flex", alignItems: "center", gap: ".65rem" }}>
                  <span style={{ fontSize: ".78rem", color: "var(--text-muted)", width: 76, flexShrink: 0, textAlign: "right" }}>
                    {m.nome}
                  </span>
                  <div style={{ flex: 1, height: 7, background: "var(--surface-2)", borderRadius: 999 }}>
                    <div style={{
                      height: "100%", borderRadius: 999,
                      width: `${(m.total / maxMat) * 100}%`,
                      background: "linear-gradient(90deg, var(--green), var(--green-light))",
                    }} />
                  </div>
                  <span style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--text)", width: 22, textAlign: "right" }}>
                    {m.total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top empresas */}
        <div className="card" style={{ padding: "1.4rem" }}>
          <p className="section-label">Coletas concluidas</p>
          <h2 style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--text)", marginBottom: "1.2rem" }}>
            Empresas em destaque
          </h2>
          {empresasTop.length === 0 ? (
            <p style={{ fontSize: ".84rem", color: "var(--text-faint)" }}>Nenhuma coleta concluida ainda.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
              {empresasTop.map((e, i) => (
                <div key={e.nome + i} style={{
                  display: "flex", alignItems: "center", gap: ".65rem",
                  padding: ".5rem .65rem", borderRadius: "var(--radius-sm)",
                  background: i === 0 ? "rgba(30,122,50,.06)" : "transparent",
                  border: `1px solid ${i === 0 ? "rgba(30,122,50,.14)" : "transparent"}`,
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: i === 0 ? "var(--green)" : "var(--surface-2)",
                    color: i === 0 ? "#fff" : "var(--text-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: ".62rem", fontWeight: 700,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: ".84rem", color: "var(--text)", fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.nome}
                  </span>
                  <span style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--green)", flexShrink: 0 }}>
                    {e.total} {e.total === 1 ? "coleta" : "coletas"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
        {[
          { href: "/admin/solicitacoes", label: "Gerenciar solicitacoes", color: "var(--green)" },
          { href: "/admin/usuarios", label: "Gerenciar usuarios", color: "var(--blue)" },
          { href: "/admin/empresas", label: "Gerenciar empresas", color: "var(--purple)" },
        ].map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="btn btn-ghost"
            style={{ fontSize: ".82rem", borderColor: "var(--border)", gap: ".4rem" }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: link.color, display: "inline-block", flexShrink: 0 }} />
            {link.label}
          </Link>
        ))}
      </div>

      {/* Pending list */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: ".5rem" }}>
          Pendentes de aprovacao
          {solicitacoesPendentes > 0 && (
            <span style={{
              background: "var(--yellow-light)", color: "var(--yellow)",
              border: "1px solid rgba(196,122,6,.2)", borderRadius: 50,
              fontSize: ".7rem", fontWeight: 700, padding: ".1rem .55rem",
            }}>
              {solicitacoesPendentes}
            </span>
          )}
        </h2>
        {pendentes.length > 0 && (
          <Link href="/admin/solicitacoes" className="btn btn-ghost" style={{ fontSize: ".82rem" }}>
            Ver todas →
          </Link>
        )}
      </div>

      {pendentes.length === 0 ? (
        <div className="card empty-state" style={{ background: "linear-gradient(135deg, var(--surface), var(--surface-3))" }}>
          <div className="empty-state-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)", marginBottom: ".3rem" }}>Nenhuma pendencia</p>
            <p style={{ fontSize: ".85rem", color: "var(--text-muted)" }}>Todas as solicitacoes foram processadas.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.1rem" }}>
          {pendentes.slice(0, 6).map((s, i) => (
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
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
