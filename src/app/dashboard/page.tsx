import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarSolicitacoesDoUsuario } from "@/services/solicitacao.service";
import { SolicitacaoCard } from "@/components/cards/SolicitacaoCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface StatCardProps {
  value: number;
  label: string;
  sublabel?: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
  delay: string;
}

function StatCard({ value, label, sublabel, color, bg, icon, delay }: StatCardProps) {
  return (
    <div className="card anim-fade-up" style={{
      animationDelay: delay,
      padding: "1.25rem 1.4rem",
      display: "flex", flexDirection: "column", gap: ".75rem",
      position: "relative", overflow: "hidden",
    }}>
      {/* BG glow */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 80, height: 80, borderRadius: "50%",
        background: bg, opacity: .5, pointerEvents: "none",
      }} />

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: bg, border: `1.5px solid ${color}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color,
        }}>
          {icon}
        </div>
        <span style={{
          fontSize: "2rem", fontWeight: 800,
          color, lineHeight: 1, letterSpacing: "-1px",
        }}>
          {value}
        </span>
      </div>

      <div>
        <div style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>{label}</div>
        {sublabel && <div style={{ fontSize: ".72rem", color: "var(--text-faint)", marginTop: ".15rem" }}>{sublabel}</div>}
      </div>

      <div style={{
        height: 3, borderRadius: 999,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        opacity: .4,
        animation: "barFill .9s var(--ease) both",
        animationDelay: delay,
      }} />
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);
  const solicitacoes = await listarSolicitacoesDoUsuario(userId);

  const stats = {
    total:      solicitacoes.length,
    pendentes:  solicitacoes.filter(s => s.status === "pendente").length,
    emAndamento: solicitacoes.filter(s => s.coleta && s.coleta.status !== "concluida" && s.coleta.status !== "cancelada").length,
    concluidas: solicitacoes.filter(s => s.coleta?.status === "concluida").length,
  };

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const primeiroNome = session!.user!.name?.split(" ")[0];

  return (
    <div className="page-enter">
      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        flexWrap: "wrap", gap: "1rem", marginBottom: "2rem",
      }}>
        <div>
          <p className="section-label" style={{ marginBottom: ".4rem" }}>Painel do Cidadão</p>
          <h1 style={{
            fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
            fontWeight: 800, color: "var(--text)",
            lineHeight: 1.2, letterSpacing: "-.4px",
          }}>
            {saudacao}, {primeiroNome} 👋
          </h1>
          <p style={{ fontSize: ".86rem", color: "var(--text-muted)", marginTop: ".3rem" }}>
            {stats.total === 0
              ? "Crie sua primeira solicitação de coleta."
              : `Você tem ${stats.pendentes} solicitaç${stats.pendentes === 1 ? "ão" : "ões"} aguardando aprovação.`}
          </p>
        </div>
        <Link href="/dashboard/solicitacoes/nova" className="btn btn-primary" style={{ gap: ".5rem" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova Solicitação
        </Link>
      </div>

      {/* ── Stats ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "1rem", marginBottom: "2.5rem",
      }}>
        <StatCard
          value={stats.total}
          label="Total"
          sublabel="todas as solicitações"
          color="var(--text)"
          bg="var(--surface-2)"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
          delay=".05s"
        />
        <StatCard
          value={stats.pendentes}
          label="Aguardando"
          sublabel="análise do admin"
          color="var(--yellow)"
          bg="var(--yellow-light)"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          delay=".12s"
        />
        <StatCard
          value={stats.emAndamento}
          label="Em andamento"
          sublabel="coletas ativas"
          color="var(--blue)"
          bg="var(--blue-light)"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>}
          delay=".19s"
        />
        <StatCard
          value={stats.concluidas}
          label="Concluídas"
          sublabel="coletas finalizadas"
          color="var(--green)"
          bg="var(--surface-2)"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          delay=".26s"
        />
      </div>

      {/* ── Quick action (if empty) ── */}
      {stats.total === 0 ? (
        <div className="card anim-fade-up stagger-3 empty-state" style={{
          background: "linear-gradient(135deg, var(--surface), var(--surface-3))",
        }}>
          <div className="empty-state-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--green-mid)" strokeWidth="1.5">
              <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
              <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/>
              <path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/>
              <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/>
              <path d="m13.378 9.633 4.096 1.098 1.097-4.096"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)", marginBottom: ".3rem" }}>
              Nenhuma solicitação ainda
            </p>
            <p style={{ fontSize: ".87rem", color: "var(--text-muted)", maxWidth: 360, margin: "0 auto" }}>
              Crie sua primeira solicitação de coleta. Leva menos de 2 minutos!
            </p>
          </div>
          <Link href="/dashboard/solicitacoes/nova" className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Criar primeira solicitação
          </Link>
        </div>
      ) : (
        <>
          {/* ── List header ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "1rem",
          }}>
            <div>
              <h2 style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--text)" }}>
                Solicitações recentes
              </h2>
              <p style={{ fontSize: ".78rem", color: "var(--text-faint)", marginTop: ".1rem" }}>
                Últimas {Math.min(solicitacoes.length, 5)} de {solicitacoes.length}
              </p>
            </div>
            {solicitacoes.length > 5 && (
              <Link href="/dashboard/solicitacoes" className="btn btn-ghost" style={{ fontSize: ".8rem", gap: ".35rem" }}>
                Ver todas
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {solicitacoes.slice(0, 5).map((s, i) => (
              <div key={s.id} className="anim-fade-up h-full" style={{ animationDelay: `${.3 + i * 0.07}s` }}>
                <SolicitacaoCard
                  solicitacao={s as any}
                  href={`/dashboard/solicitacoes/${s.id}`}
                />
              </div>
            ))}
          </div>

          {solicitacoes.length > 5 && (
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <Link href="/dashboard/solicitacoes" className="btn btn-secondary" style={{ fontSize: ".85rem" }}>
                Ver todas as {solicitacoes.length} solicitações
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
