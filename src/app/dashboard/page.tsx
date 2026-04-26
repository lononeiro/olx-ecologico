import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { listarSolicitacoesDoUsuario } from "@/services/solicitacao.service";
import { SolicitacaoCard } from "@/components/cards/SolicitacaoCard";
import { MetricCard, PageSection, SurfaceCard } from "@/components/ui/dashboard-primitives";
import { SolicitacaoBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);
  const solicitacoes = await listarSolicitacoesDoUsuario(userId);

  const stats = {
    total: solicitacoes.length,
    pendentes: solicitacoes.filter((s) => s.status === "pendente").length,
    emAndamento: solicitacoes.filter(
      (s) => s.coleta && s.coleta.status !== "concluida" && s.coleta.status !== "cancelada"
    ).length,
    concluidas: solicitacoes.filter((s) => s.coleta?.status === "concluida").length,
  };

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const primeiroNome = session!.user!.name?.split(" ")[0];

  return (
    <div className="page-enter">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <p className="section-label" style={{ marginBottom: 6 }}>Painel do cidadao</p>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--color-gray-900)", lineHeight: 1.2 }}>
            {saudacao}, {primeiroNome}
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-gray-500)", marginTop: 4 }}>
            {stats.total === 0
              ? "Crie sua primeira solicitacao de coleta."
              : `Voce tem ${stats.pendentes} solicitacao${stats.pendentes === 1 ? "" : "oes"} aguardando aprovacao.`}
          </p>
        </div>
        <Link href="/dashboard/solicitacoes/nova" className="btn btn-primary" aria-label="Criar nova solicitacao">
          <IconPlus />
          Nova solicitacao
        </Link>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <MetricCard label="Solicitacoes" value={stats.total} description="Total de solicitacoes" />
        <MetricCard label="Pendentes" value={stats.pendentes} description="Aguardando aprovacao" accent="amber" />
        <MetricCard label="Em andamento" value={stats.emAndamento} description="Coletas ativas" accent="blue" />
        <MetricCard label="Concluidas" value={stats.concluidas} description="Coletas finalizadas" />
      </div>

      <div className="dashboard-overview-grid">
        <SurfaceCard className="chart-card">
          <PageSection title="Coletas por mes" description="Volume mensal das solicitacoes criadas" />
          <MonthlyLineChart items={solicitacoes} />
        </SurfaceCard>

        <SurfaceCard>
          <PageSection title="Solicitacoes recentes" description={`Ultimas ${Math.min(solicitacoes.length, 5)} movimentacoes`} />
          <div className="request-list">
            {solicitacoes.slice(0, 5).map((item) => (
              <Link key={item.id} href={`/dashboard/solicitacoes/${item.id}`} className="request-row" style={{ textDecoration: "none" }}>
                <span className="request-row-icon"><IconRecycle /></span>
                <span style={{ minWidth: 0 }}>
                  <span className="request-row-title">{item.titulo}</span>
                  <span className="request-row-copy" style={{ display: "block" }}>{item.material.nome} - {item.quantidade}</span>
                </span>
                <SolicitacaoBadge status={item.status} />
                <span className="request-row-date">{new Date(item.createdAt).toLocaleDateString("pt-BR")}</span>
              </Link>
            ))}
            {solicitacoes.length === 0 ? <p className="request-row-copy">Nenhuma solicitacao recente.</p> : null}
          </div>
        </SurfaceCard>
      </div>

      {stats.total === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon"><IconRecycle /></div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 18, color: "var(--color-gray-900)", marginBottom: 4 }}>
              Nenhuma solicitacao ainda
            </p>
            <p style={{ fontSize: 13, color: "var(--color-gray-500)", maxWidth: 360, margin: "0 auto" }}>
              Crie sua primeira solicitacao de coleta. Leva menos de 2 minutos.
            </p>
          </div>
          <Link href="/dashboard/solicitacoes/nova" className="btn btn-primary" aria-label="Criar primeira solicitacao">
            Criar primeira solicitacao
          </Link>
        </div>
      ) : (
        <>
          <PageSection
            title="Todas as solicitacoes"
            description={`${solicitacoes.length} registros no total`}
            action={
              solicitacoes.length > 5 ? (
                <Link href="/dashboard/solicitacoes" className="btn btn-secondary">
                  Ver todas
                </Link>
              ) : null
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {solicitacoes.slice(0, 5).map((s, i) => (
              <div key={s.id} className="anim-fade-up h-full" style={{ animationDelay: `${0.3 + i * 0.07}s` }}>
                <SolicitacaoCard solicitacao={s as any} href={`/dashboard/solicitacoes/${s.id}`} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MonthlyLineChart({ items }: { items: { createdAt: string | Date }[] }) {
  const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  const counts = labels.map((_, index) => items.filter((item) => new Date(item.createdAt).getMonth() === index).length);
  const max = Math.max(1, ...counts);
  const points = counts.map((count, index) => {
    const x = 44 + index * 78;
    const y = 150 - (count / max) * 104;
    return { x, y, count };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <svg viewBox="0 0 470 190" width="100%" height="190" role="img" aria-label="Grafico de coletas por mes">
      {[40, 75, 110, 145].map((y) => <line key={y} x1="36" x2="440" y1={y} y2={y} className="chart-grid" />)}
      <path d={path} className="chart-line" />
      {points.map((point, index) => (
        <g key={labels[index]}>
          <circle cx={point.x} cy={point.y} r="5" className="chart-point" />
          <text x={point.x} y="178" textAnchor="middle" className="chart-label">{labels[index]}</text>
          <text x={point.x} y={point.y - 12} textAnchor="middle" className="chart-label">{point.count}</text>
        </g>
      ))}
    </svg>
  );
}

function IconRecycle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7L7.2 9.5" />
      <path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7l-1.2-2.1" />
      <path d="m14 16-3 3 3 3" />
      <path d="M8.3 13.6 7.2 9.5 3.1 10.6" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
