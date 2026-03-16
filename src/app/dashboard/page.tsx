import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarSolicitacoesDoUsuario } from "@/services/solicitacao.service";
import { SolicitacaoCard } from "@/components/cards/SolicitacaoCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

function StatCard({ value, label, color, delay }: { value: number; label: string; color: string; delay: string }) {
  return (
    <div className="card anim-fade-up" style={{ animationDelay: delay, padding: "1.25rem 1.5rem" }}>
      <div style={{ fontSize: "2rem", fontWeight: 700, color, lineHeight: 1, marginBottom: ".35rem" }}>
        {value}
      </div>
      <div style={{ fontSize: ".82rem", color: "var(--text-muted)", fontWeight: 500 }}>{label}</div>
      <div style={{
        height: 3, borderRadius: 999, marginTop: ".75rem",
        background: `linear-gradient(90deg, ${color}, transparent)`,
        opacity: .5,
        animation: "barFill .8s cubic-bezier(.4,0,.2,1) both",
        animationDelay: delay,
      }}/>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);
  const solicitacoes = await listarSolicitacoesDoUsuario(userId);

  const stats = {
    total:     solicitacoes.length,
    pendentes: solicitacoes.filter(s => s.status === "pendente").length,
    emColeta:  solicitacoes.filter(s => s.coleta).length,
    concluidas:solicitacoes.filter(s => s.coleta?.status === "concluida").length,
  };

  const primeiroNome = session!.user!.name?.split(" ")[0];

  return (
    <div>
      {/* Page header */}
      <div className="anim-fade-up" style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        flexWrap: "wrap", gap: "1rem", marginBottom: "2rem",
      }}>
        <div>
          <p style={{ fontSize: ".82rem", color: "var(--text-faint)", fontWeight: 500,
            textTransform: "uppercase", letterSpacing: "1px", marginBottom: ".3rem" }}>
            Painel
          </p>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>
            Bom dia, {primeiroNome}
          </h1>
        </div>
        <Link href="/dashboard/solicitacoes/nova" className="btn btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          Nova Solicitação
        </Link>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "1rem", marginBottom: "2.5rem",
      }}>
        <StatCard value={stats.total}      label="Solicitações"    color="var(--text)"       delay=".05s" />
        <StatCard value={stats.pendentes}  label="Aguardando"      color="var(--yellow)"     delay=".12s" />
        <StatCard value={stats.emColeta}   label="Em andamento"    color="var(--blue)"       delay=".19s" />
        <StatCard value={stats.concluidas} label="Concluídas"      color="var(--green)"      delay=".26s" />
      </div>

      {/* List */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text)" }}>
          Solicitações recentes
        </h2>
        {solicitacoes.length > 5 && (
          <Link href="/dashboard/solicitacoes" className="btn btn-ghost" style={{ fontSize: ".82rem" }}>
            Ver todas ({solicitacoes.length})
          </Link>
        )}
      </div>

      {solicitacoes.length === 0 ? (
        <div className="card anim-fade-up" style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "linear-gradient(135deg, var(--surface), var(--surface-2))",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "var(--surface-2)", border: "2px dashed var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          </div>
          <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: ".4rem" }}>
            Nenhuma solicitação ainda
          </p>
          <p style={{ fontSize: ".88rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Crie sua primeira solicitação de coleta agora.
          </p>
          <Link href="/dashboard/solicitacoes/nova" className="btn btn-primary">
            Criar solicitação
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {solicitacoes.slice(0, 5).map((s, i) => (
            <div key={s.id} style={{ animationDelay: `${i * 0.07}s` }}>
              <SolicitacaoCard
                solicitacao={s as any}
                href={`/dashboard/solicitacoes/${s.id}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}