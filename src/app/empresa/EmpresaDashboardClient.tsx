"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AceitarSolicitacaoButton } from "./solicitacoes/AceitarSolicitacaoButton";
import { Portal } from "@/components/ui/Portal";

type RequestStatus = "pendente" | "em_andamento" | "concluida";

export interface EmpresaDashboardData {
  empresaNome: string;
  cnpj: string;
  metrics: {
    novasSolicitacoes: number;
    emAndamento: number;
    concluidasMes: number;
    taxaConclusao: number;
    pendentesMais24h: number;
    cidadaosAtendidos: number;
    tiposMaterial: number;
    tempoMedioConclusao: string;
  };
  solicitacoes: {
    id: number;
    coletaId: number | null;
    titulo: string;
    descricao: string;
    quantidade: string;
    endereco: string;
    materialNome: string;
    solicitanteNome: string;
    status: RequestStatus;
    createdAt: string;
    dataPrevisaoColeta: string | null;
    detailHref: string;
    imagens: { id: number; url: string }[];
  }[];
  materiaisContagem: {
    material: string;
    total: number;
    color: string;
  }[];
  coletasPorStatus: {
    status: string;
    total: number;
    percent: number;
  }[];
  totalColetas: number;
  avaliacao: {
    media: number;
    total: number;
    distribuicao: Record<number, number>;
  };
}

const FILTERS: { value: "todas" | RequestStatus; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pendente", label: "Pendentes" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluídas" },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  concluida: { label: "Concluída", color: "#22C55E" },
  em_coleta: { label: "Em coleta", color: "#8B5CF6" },
  a_caminho: { label: "A caminho", color: "#6366F1" },
  aceita: { label: "Aceita", color: "#3B82F6" },
  cancelada: { label: "Cancelada", color: "#EF4444" },
};

export function EmpresaDashboardClient({ data }: { data: EmpresaDashboardData }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("todas");
  const [selectedDay, setSelectedDay] = useState(0);
  const [materiaisModalAberto, setMateriaisModalAberto] = useState(false);
  const today = new Date();
  const scheduledRequests = useMemo(
    () => data.solicitacoes.filter((item) => item.dataPrevisaoColeta),
    [data.solicitacoes]
  );
  const week = useMemo(() => buildCurrentWeek(scheduledRequests), [scheduledRequests]);

  const filteredRequests = useMemo(
    () =>
      data.solicitacoes
        .filter((item) => filter === "todas" || item.status === filter)
        .slice(0, 5),
    [data.solicitacoes, filter]
  );

  const scheduled = useMemo(
    () =>
      scheduledRequests
        .filter((item) => isSameDay(new Date(item.dataPrevisaoColeta!), week[selectedDay].date))
        .sort(
          (a, b) =>
            new Date(a.dataPrevisaoColeta!).getTime() - new Date(b.dataPrevisaoColeta!).getTime()
        ),
    [scheduledRequests, selectedDay, week]
  );
  const nextScheduled = useMemo(
    () =>
      scheduledRequests
        .filter((item) => new Date(item.dataPrevisaoColeta!).getTime() >= Date.now())
        .sort(
          (a, b) =>
            new Date(a.dataPrevisaoColeta!).getTime() - new Date(b.dataPrevisaoColeta!).getTime()
        )[0],
    [scheduledRequests]
  );
  const initials = data.empresaNome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="empresa-dashboard">
      <section className="empresa-page-topbar">
        <div>
          <h1>Bom dia, {data.empresaNome}</h1>
          <p>Aqui esta o resumo de hoje - {today.toLocaleDateString("pt-BR")}</p>
        </div>
        <div className="empresa-page-actions">
          <div className="empresa-avatar" aria-label={`Empresa ${data.empresaNome}`}>{initials}</div>
        </div>
      </section>

      {data.metrics.pendentesMais24h > 0 ? (
        <section className="empresa-alert">
          <div>
            <strong>Você tem {data.metrics.pendentesMais24h} {data.metrics.pendentesMais24h === 1 ? "solicitação" : "solicitações"} aguardando resposta há mais de 24h.</strong>
            <span>Responda logo para manter sua avaliação.</span>
          </div>
          <Link href="/empresa/solicitacoes">Ver solicitações -&gt;</Link>
        </section>
      ) : null}

      <section className="empresa-kpi-grid">
        <OperationalKpi icon={<IconInbox />} iconBg="#DBEAFE" iconColor="#1E40AF" label="Novas solicitações" value={data.metrics.novasSolicitacoes} trend={`↑ ${Math.min(3, data.metrics.novasSolicitacoes)} hoje`} />
        <OperationalKpi icon={<IconTruck />} iconBg="#FEF9C3" iconColor="#854D0E" label="Em andamento" value={data.metrics.emAndamento} trend={nextScheduled ? `próx: ${new Date(nextScheduled.dataPrevisaoColeta!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "sem previsão"} info />
        <OperationalKpi icon={<IconCheckCircle />} iconBg="#DCFCE7" iconColor="#166534" label="Concluídas este mês" value={data.metrics.concluidasMes} trend="↑ 12% vs mês ant" />
        <OperationalKpi icon={<IconBars />} iconBg="#F3E8FF" iconColor="#6B21A8" label="Taxa de conclusão" value={`${data.metrics.taxaConclusao}%`} trend="↑ 2pp vs mês ant" />
      </section>

      <section className="empresa-impact-grid">
        <ImpactCard icon={<IconUsers />} label="Cidadãos atendidos" value={data.metrics.cidadaosAtendidos.toLocaleString("pt-BR")} sublabel="moradores únicos" />
        <ImpactCard icon={<IconClock />} label="Tempo médio de conclusão" value={data.metrics.tempoMedioConclusao} sublabel="do aceite à conclusão" />
        <ImpactCard
          icon={<IconRecycle />}
          label="Tipos de material"
          value={String(data.metrics.tiposMaterial)}
          sublabel={data.metrics.tiposMaterial > 0 ? "clique para ver detalhes" : "categorias coletadas"}
          onClick={data.metrics.tiposMaterial > 0 ? () => setMateriaisModalAberto(true) : undefined}
        />
      </section>

      {materiaisModalAberto ? (
        <MateriaisModal
          materiais={data.materiaisContagem}
          onClose={() => setMateriaisModalAberto(false)}
        />
      ) : null}

      <section className="empresa-main-grid">
        <div className="empresa-panel">
          <div className="empresa-panel-header">
            <h2>Solicitações recentes</h2>
            <div className="empresa-panel-actions">
              <label className="sr-only" htmlFor="empresa-request-filter">Filtrar solicitações</label>
              <select id="empresa-request-filter" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
                {FILTERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <Link href="/empresa/solicitacoes">Ver todas -&gt;</Link>
            </div>
          </div>

          <div className="empresa-request-list">
            {filteredRequests.length === 0 ? (
              <EmptyRequests />
            ) : (
              filteredRequests.map((item) => <RequestRow key={`${item.status}-${item.id}-${item.coletaId ?? "new"}`} item={item} />)
            )}
          </div>
        </div>

        <div className="empresa-side-stack">
          <div className="empresa-panel">
            <div className="empresa-panel-header">
              <h2>Coletas por status</h2>
              <span className="status-panel-total">{data.totalColetas} no total</span>
            </div>
            <StatusDonut items={data.coletasPorStatus} total={data.totalColetas} />
          </div>

          <div className="empresa-panel">
            <h2>Avaliação e reputação</h2>
            {data.avaliacao.total === 0 ? (
              <p style={{ fontSize: ".875rem", color: "var(--text-faint)", marginTop: ".5rem" }}>
                Nenhuma avaliação recebida ainda.
              </p>
            ) : (
              <>
                <div className="rating-summary">
                  <div>
                    <strong><span>★</span> {data.avaliacao.media.toFixed(1)}</strong>
                    <p>de {data.avaliacao.total} avaliação{data.avaliacao.total === 1 ? "" : "ões"}</p>
                  </div>
                  <div>
                    <div className="rating-track">
                      <i style={{ width: `${Math.round((data.avaliacao.distribuicao[4] ?? 0 + (data.avaliacao.distribuicao[5] ?? 0)) / data.avaliacao.total * 100)}%` }} />
                    </div>
                    <p>
                      {data.avaliacao.total > 0
                        ? `${Math.round(((data.avaliacao.distribuicao[4] ?? 0) + (data.avaliacao.distribuicao[5] ?? 0)) / data.avaliacao.total * 100)}% Taxa de satisfação`
                        : "—"}
                    </p>
                  </div>
                </div>
                {([5, 4, 3, 2] as const).map((n) => (
                  <RatingRow
                    key={n}
                    stars={"★".repeat(n) + "☆".repeat(5 - n)}
                    percent={data.avaliacao.total > 0
                      ? Math.round(((data.avaliacao.distribuicao[n] ?? 0) / data.avaliacao.total) * 100)
                      : 0}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="empresa-panel empresa-calendar-panel">
        <div className="empresa-panel-header">
          <h2>Proximas coletas agendadas</h2>
          <div className="calendar-actions">
            <button type="button" aria-label="Semana anterior">← Semana anterior</button>
            <span>{formatWeekRange(week[0].date, week[6].date)}</span>
            <button type="button" aria-label="Proxima semana">Proxima semana →</button>
          </div>
        </div>

        <div className="week-calendar">
          {week.map((day, index) => (
            <button
              type="button"
              key={`${day.label}-${day.day}`}
              className={index === selectedDay ? "is-active" : ""}
              onClick={() => setSelectedDay(index)}
              aria-label={`Selecionar ${day.label} dia ${day.day}`}
            >
              <span>{day.label}</span>
              <strong>{day.day}</strong>
              <i>{Array.from({ length: Math.min(day.count, 4) }).map((_, dot) => <b key={dot} />)}</i>
              <em>{day.count > 0 ? day.count : "-"}</em>
            </button>
          ))}
        </div>

        <div className="scheduled-list">
          {scheduled.length === 0 ? (
            <p className="empty-schedule">Nenhuma coleta prevista para este dia.</p>
          ) : (
            scheduled.map((item, index) => (
              <Link href={item.detailHref} className="scheduled-row" key={`${item.id}-${index}`}>
                <strong>{new Date(item.dataPrevisaoColeta!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</strong>
                <span className="scheduled-icon"><IconRecycle /></span>
                <span>
                  <b>{item.titulo}</b>
                  <small>{item.endereco}</small>
                </span>
                <StatusPill status={item.status} />
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function buildCurrentWeek(items: EmpresaDashboardData["solicitacoes"]) {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  return ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"].map((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const count = items.filter((item) => isSameDay(new Date(item.dataPrevisaoColeta!), date)).length;
    return { label, day: date.getDate(), count, date };
  });
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatWeekRange(start: Date, end: Date) {
  const startLabel = start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const endLabel = end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  return `${startLabel} - ${endLabel}`;
}

function OperationalKpi({ icon, iconBg, iconColor, label, value, trend, info }: { icon: React.ReactNode; iconBg: string; iconColor: string; label: string; value: string | number; trend: string; info?: boolean }) {
  return (
    <article className="empresa-kpi-card">
      <span className="empresa-kpi-icon" style={{ background: iconBg, color: iconColor }}>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small className={info ? "" : "is-positive"}>{trend}</small>
    </article>
  );
}

function ImpactCard({ icon, label, value, sublabel, onClick }: { icon: React.ReactNode; label: string; value: string; sublabel: string; onClick?: () => void }) {
  const content = (
    <>
      {icon}
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{sublabel}</small>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="empresa-impact-card is-clickable" onClick={onClick}>
        {content}
      </button>
    );
  }

  return <article className="empresa-impact-card">{content}</article>;
}

function StatusDonut({
  items,
  total,
}: {
  items: EmpresaDashboardData["coletasPorStatus"];
  total: number;
}) {
  if (total === 0 || items.length === 0) {
    return (
      <div className="status-donut-empty">
        <IconCheckCircle />
        <p>Nenhuma coleta registrada ainda.</p>
        <span>Os status aparecerão aqui conforme você aceitar coletas.</span>
      </div>
    );
  }

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let acc = 0;
  const segments = items.map((item) => {
    const meta = STATUS_META[item.status] ?? { label: item.status, color: "#94A3B8" };
    const length = (item.total / total) * circumference;
    const segment = { ...item, ...meta, length, offset: acc };
    acc += length;
    return segment;
  });

  return (
    <div className="status-donut-wrap">
      <div className="status-donut-chart">
        <svg viewBox="0 0 140 140" role="img" aria-label="Distribuição de coletas por status">
          <g transform="rotate(-90 70 70)">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--surface-3)" strokeWidth="15" />
            {segments.map((segment) => (
              <circle
                key={segment.status}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="15"
                strokeLinecap="butt"
                strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                strokeDashoffset={-segment.offset}
              />
            ))}
          </g>
          <text x="70" y="64" textAnchor="middle" className="status-donut-value">{total}</text>
          <text x="70" y="82" textAnchor="middle" className="status-donut-caption">
            {total === 1 ? "coleta" : "coletas"}
          </text>
        </svg>
      </div>

      <ul className="status-legend">
        {segments.map((segment) => (
          <li key={segment.status}>
            <span className="status-legend-dot" style={{ background: segment.color }} />
            <span className="status-legend-label">{segment.label}</span>
            <strong>{segment.total}</strong>
            <em>{segment.percent}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MateriaisModal({
  materiais,
  onClose,
}: {
  materiais: EmpresaDashboardData["materiaisContagem"];
  onClose: () => void;
}) {
  const max = Math.max(1, ...materiais.map((item) => item.total));
  const totalSolicitacoes = materiais.reduce((sum, item) => sum + item.total, 0);

  return (
    <Portal>
      <style>{`
        @keyframes materiaisFadeIn { from { opacity: 0; transform: translateY(10px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes materiaisSlideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .materiais-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(15,23,42,.48); backdrop-filter: blur(10px); display: flex; align-items: flex-end; justify-content: center; }
        @media (min-width: 680px) { .materiais-overlay { align-items: center; padding: 20px; } }
        .materiais-painel { position: relative; z-index: 201; width: 100%; max-height: 92vh; background: linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%); border-radius: 26px 26px 0 0; border: 1px solid var(--border); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; overflow: hidden; animation: materiaisSlideUp .25s ease both; }
        @media (min-width: 680px) { .materiais-painel { width: min(560px, 94vw); border-radius: 26px; animation: materiaisFadeIn .22s ease both; } }
      `}</style>

      <div
        className="materiais-overlay"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="materiais-painel" role="dialog" aria-modal="true" aria-label="Solicitações por material">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1.35rem 1.4rem 1.2rem", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: ".72rem", textTransform: "uppercase", letterSpacing: "1.8px", color: "var(--text-faint)", fontWeight: 700, marginBottom: ".45rem" }}>
                Por material
              </p>
              <p style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--text)", lineHeight: 1.2 }}>
                Solicitações por material
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn-icon"
              style={{ width: 40, height: 40, borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-overlay)", color: "var(--text-muted)" }}
              aria-label="Fechar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.4rem 1.4rem" }}>
            <div style={{ display: "grid", gap: "1rem" }}>
              {materiais.map((item) => (
                <div key={item.material} style={{ display: "grid", gap: ".4rem" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: ".75rem" }}>
                    <span style={{ fontSize: ".9rem", fontWeight: 600, color: "var(--text)" }}>{item.material}</span>
                    <span style={{ fontSize: ".85rem", fontWeight: 700, color: "var(--text-muted)" }}>
                      {item.total} {item.total === 1 ? "solicitação" : "solicitações"}
                    </span>
                  </div>
                  <div style={{ height: 12, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.round((item.total / max) * 100)}%`, minWidth: 6, background: item.color, borderRadius: 999, transition: "width .3s ease" }} />
                  </div>
                </div>
              ))}
            </div>

            <p style={{ marginTop: "1.25rem", fontSize: ".82rem", color: "var(--text-faint)", textAlign: "center" }}>
              {totalSolicitacoes} {totalSolicitacoes === 1 ? "solicitação no total" : "solicitações no total"} · {materiais.length} {materiais.length === 1 ? "tipo de material" : "tipos de material"}
            </p>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function RequestRow({ item }: { item: EmpresaDashboardData["solicitacoes"][number] }) {
  return (
    <article className={`empresa-request-row ${item.status === "concluida" ? "is-done" : ""}`}>
      <span className="request-material-icon"><IconRecycle /></span>
      <div className="request-row-main">
        <div className="request-row-titleline">
          <h3>{item.titulo}</h3>
          <StatusPill status={item.status} />
        </div>
        <p>#{item.id} · {item.endereco}</p>
        <p className="request-row-meta"><IconPerson /> {item.solicitanteNome} · <IconCalendar /> {new Date(item.createdAt).toLocaleDateString("pt-BR")} · {new Date(item.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
        <div className="request-row-actions">
          {item.status === "pendente" ? (
            <AceitarSolicitacaoButton
              solicitacaoId={item.id}
              titulo={item.titulo}
              descricao={item.descricao}
              quantidade={item.quantidade}
              endereco={item.endereco}
              materialNome={item.materialNome}
              imagens={item.imagens}
            />
          ) : null}
          {item.status === "em_andamento" ? <Link className="empresa-row-outline" href={item.detailHref}>Registrar conclusão</Link> : null}
          <Link className="empresa-row-outline" href={item.detailHref}>Ver detalhes</Link>
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: RequestStatus }) {
  const label = status === "pendente" ? "Pendente" : status === "em_andamento" ? "Em andamento" : "Concluida";
  return <span className={`empresa-status empresa-status-${status}`} role="status">{label}</span>;
}

function RatingRow({ stars, percent }: { stars: string; percent: number }) {
  return (
    <div className="rating-row">
      <span>{stars}</span>
      <strong>{percent}%</strong>
      <div><i style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

function EmptyRequests() {
  return (
    <div className="empresa-empty-state">
      <IconInboxLarge />
      <strong>Nenhuma solicitação recente</strong>
      <p>Novas solicitações aparecerão aqui quando chegarem.</p>
    </div>
  );
}

function IconInbox() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.5Z" /></svg>; }
function IconTruck() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11v14" /><path d="M14 8h4l4 4v5h-8Z" /><circle cx="7" cy="17" r="2" /><circle cx="18" cy="17" r="2" /></svg>; }
function IconCheckCircle() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-5" /></svg>; }
function IconBars() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19V5" /><path d="M8 19v-7" /><path d="M13 19V9" /><path d="M18 19V4" /></svg>; }
function IconUsers() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function IconClock() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>; }
function IconRecycle() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7L7.2 9.5" /><path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7l-1.2-2.1" /><path d="m14 16-3 3 3 3" /><path d="M8.3 13.6 7.2 9.5 3.1 10.6" /></svg>; }
function IconPerson() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>; }
function IconCalendar() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>; }
function IconInboxLarge() { return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.8"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.5Z" /></svg>; }
