"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AceitarSolicitacaoButton } from "./solicitacoes/AceitarSolicitacaoButton";

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
    materialColetadoKg: number;
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
  materiais: {
    material: string;
    kg: number;
    percent: number;
    color: string;
  }[];
}

const FILTERS: { value: "todas" | RequestStatus; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pendente", label: "Pendentes" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluidas" },
];

export function EmpresaDashboardClient({ data }: { data: EmpresaDashboardData }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("todas");
  const [materialPeriod, setMaterialPeriod] = useState("mes");
  const [selectedDay, setSelectedDay] = useState(0);
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
          <button type="button" className="empresa-bell" aria-label="Notificacoes da empresa">
            <IconBell />
            {data.metrics.novasSolicitacoes > 0 ? <span>{data.metrics.novasSolicitacoes}</span> : null}
          </button>
          <div className="empresa-avatar" aria-label={`Empresa ${data.empresaNome}`}>{initials}</div>
        </div>
      </section>

      {data.metrics.pendentesMais24h > 0 ? (
        <section className="empresa-alert">
          <div>
            <strong>Voce tem {data.metrics.pendentesMais24h} solicitacao{data.metrics.pendentesMais24h === 1 ? "" : "oes"} aguardando resposta ha mais de 24h.</strong>
            <span>Responda logo para manter sua avaliacao.</span>
          </div>
          <Link href="/empresa/solicitacoes">Ver solicitacoes -&gt;</Link>
        </section>
      ) : null}

      <section className="empresa-kpi-grid">
        <OperationalKpi icon={<IconInbox />} iconBg="#DBEAFE" iconColor="#1E40AF" label="Novas solicitacoes" value={data.metrics.novasSolicitacoes} trend={`↑ ${Math.min(3, data.metrics.novasSolicitacoes)} hoje`} />
        <OperationalKpi icon={<IconTruck />} iconBg="#FEF9C3" iconColor="#854D0E" label="Em andamento" value={data.metrics.emAndamento} trend={nextScheduled ? `prox: ${new Date(nextScheduled.dataPrevisaoColeta!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "sem previsao"} info />
        <OperationalKpi icon={<IconCheckCircle />} iconBg="#DCFCE7" iconColor="#166534" label="Concluidas este mes" value={data.metrics.concluidasMes} trend="↑ 12% vs mes ant" />
        <OperationalKpi icon={<IconBars />} iconBg="#F3E8FF" iconColor="#6B21A8" label="Taxa de conclusao" value={`${data.metrics.taxaConclusao}%`} trend="↑ 2pp vs mes ant" />
      </section>

      <section className="empresa-impact-grid">
        <ImpactCard label="Material coletado" value={`${data.metrics.materialColetadoKg.toLocaleString("pt-BR")} kg`} sublabel="este mes" />
        <ImpactCard label="CO2 evitado" value={`${Math.round(data.metrics.materialColetadoKg * 0.5).toLocaleString("pt-BR")} kg`} sublabel="emissoes evitadas" />
        <ImpactCard label="Arvores equivalentes" value={String(Math.max(1, Math.round(data.metrics.materialColetadoKg / 25)))} sublabel="arvores preservadas" />
      </section>

      <section className="empresa-main-grid">
        <div className="empresa-panel">
          <div className="empresa-panel-header">
            <h2>Solicitacoes recentes</h2>
            <div className="empresa-panel-actions">
              <label className="sr-only" htmlFor="empresa-request-filter">Filtrar solicitacoes</label>
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
              <h2>Desempenho por material</h2>
              <label className="sr-only" htmlFor="empresa-material-period">Periodo</label>
              <select id="empresa-material-period" value={materialPeriod} onChange={(event) => setMaterialPeriod(event.target.value)}>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mes</option>
                <option value="ano">Este ano</option>
              </select>
            </div>
            <div className="material-bars">
              {data.materiais.map((item) => (
                <div className="material-bar-row" key={item.material}>
                  <span>{item.material}</span>
                  <div className="material-bar-track"><i style={{ width: `${item.percent}%`, background: item.color }} /></div>
                  <strong>{item.kg} kg</strong>
                  <em>{item.percent}%</em>
                </div>
              ))}
            </div>
          </div>

          <div className="empresa-panel">
            <h2>Avaliacao e reputacao</h2>
            <div className="rating-summary">
              <div>
                <strong><span>★</span> 4.8</strong>
                <p>de 127 avaliacoes</p>
              </div>
              <div>
                <div className="rating-track"><i style={{ width: "96%" }} /></div>
                <p>96% Taxa de satisfacao</p>
              </div>
            </div>
            <RatingRow stars="★★★★★" percent={68} />
            <RatingRow stars="★★★★☆" percent={24} />
            <RatingRow stars="★★★☆☆" percent={6} />
            <RatingRow stars="★★☆☆☆" percent={2} />
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

function ImpactCard({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <article className="empresa-impact-card">
      <IconLeaf />
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{sublabel}</small>
    </article>
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
              solicitanteNome={item.solicitanteNome}
              imagens={item.imagens}
            />
          ) : null}
          {item.status === "em_andamento" ? <Link className="empresa-row-outline" href={item.detailHref}>Registrar conclusao</Link> : null}
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
      <strong>Nenhuma solicitacao recente</strong>
      <p>Novas solicitacoes aparecerao aqui quando chegarem.</p>
    </div>
  );
}

function IconBell() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>; }
function IconInbox() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.5Z" /></svg>; }
function IconTruck() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11v14" /><path d="M14 8h4l4 4v5h-8Z" /><circle cx="7" cy="17" r="2" /><circle cx="18" cy="17" r="2" /></svg>; }
function IconCheckCircle() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-5" /></svg>; }
function IconBars() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19V5" /><path d="M8 19v-7" /><path d="M13 19V9" /><path d="M18 19V4" /></svg>; }
function IconLeaf() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20A7 7 0 0 1 4 13c0-6 7-9 16-9 0 9-3 16-9 16Z" /><path d="M4 13c4 0 8-1 12-5" /></svg>; }
function IconRecycle() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7L7.2 9.5" /><path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7l-1.2-2.1" /><path d="m14 16-3 3 3 3" /><path d="M8.3 13.6 7.2 9.5 3.1 10.6" /></svg>; }
function IconPerson() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>; }
function IconCalendar() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>; }
function IconInboxLarge() { return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.8"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.5Z" /></svg>; }
