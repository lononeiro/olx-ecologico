"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { RatingStars } from "@/components/ui/RatingStars";

export type AvaliacoesEmpresaData = {
  resumo: {
    media: number;
    totalAvaliacoes: number;
    totalFinalizadas: number;
    aguardandoAvaliacao: number;
    distribuicao: Record<number, number>;
  };
  coletas: {
    id: number;
    status: string;
    dataAceite: string;
    dataConclusao: string | null;
    solicitacao: {
      id: number;
      titulo: string;
      descricao: string;
      quantidade: string;
      endereco: string;
      materialNome: string;
      solicitanteNome: string;
    };
    avaliacao: {
      id: number;
      nota: number;
      comentario: string | null;
      createdAt: string;
      autorNome: string;
    } | null;
  }[];
};

type RatingFilter = "todas" | "5" | "4" | "3menos" | "comComentario" | "semComentario" | "pendentes";
type SortOption = "recentes" | "melhorNota" | "piorNota" | "antigas";

const FILTERS: { value: RatingFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "5", label: "5 estrelas" },
  { value: "4", label: "4 estrelas" },
  { value: "3menos", label: "3 ou menos" },
  { value: "comComentario", label: "Com comentario" },
  { value: "semComentario", label: "Sem comentario" },
  { value: "pendentes", label: "Aguardando avaliacao" },
];

const SORTS: { value: SortOption; label: string }[] = [
  { value: "recentes", label: "Mais recentes" },
  { value: "melhorNota", label: "Melhor nota" },
  { value: "piorNota", label: "Pior nota" },
  { value: "antigas", label: "Mais antigas" },
];

const PAGE_SIZE = 8;

export function AvaliacoesEmpresaClient({ data }: { data: AvaliacoesEmpresaData }) {
  const [filter, setFilter] = useState<RatingFilter>("todas");
  const [sort, setSort] = useState<SortOption>("recentes");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return data.coletas
      .filter((item) => {
        const avaliacao = item.avaliacao;
        if (filter === "todas") return true;
        if (filter === "pendentes") return !avaliacao;
        if (filter === "comComentario") return Boolean(avaliacao?.comentario?.trim());
        if (filter === "semComentario") return Boolean(avaliacao) && !avaliacao?.comentario?.trim();
        if (!avaliacao) return false;
        if (filter === "3menos") return avaliacao.nota <= 3;
        return avaliacao.nota === Number(filter);
      })
      .sort((a, b) => {
        const aDate = new Date(a.avaliacao?.createdAt ?? a.dataConclusao ?? a.dataAceite).getTime();
        const bDate = new Date(b.avaliacao?.createdAt ?? b.dataConclusao ?? b.dataAceite).getTime();
        const aNota = a.avaliacao?.nota ?? 0;
        const bNota = b.avaliacao?.nota ?? 0;

        if (sort === "melhorNota") return bNota - aNota || bDate - aDate;
        if (sort === "piorNota") return aNota - bNota || bDate - aDate;
        if (sort === "antigas") return aDate - bDate;
        return bDate - aDate;
      });
  }, [data.coletas, filter, sort]);

  useEffect(() => {
    setPage(1);
  }, [filter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const satisfaction =
    data.resumo.totalAvaliacoes > 0
      ? Math.round((((data.resumo.distribuicao[4] ?? 0) + (data.resumo.distribuicao[5] ?? 0)) / data.resumo.totalAvaliacoes) * 100)
      : 0;

  return (
    <div className="page-enter" style={{ display: "grid", gap: 18 }}>
      <section className="empresa-page-topbar">
        <div>
          <h1>Avaliacoes</h1>
          <p>Coletas finalizadas, notas recebidas e comentarios dos solicitantes.</p>
        </div>
        <Link href="/empresa/coletas" className="empresa-row-outline" style={{ padding: "8px 12px", borderRadius: 8 }}>
          Ver coletas
        </Link>
      </section>

      <section className="empresa-kpi-grid">
        <MetricCard label="Nota media" value={data.resumo.totalAvaliacoes > 0 ? data.resumo.media.toFixed(1) : "-"} detail={`${data.resumo.totalAvaliacoes} avaliacao${data.resumo.totalAvaliacoes === 1 ? "" : "es"}`} icon={<IconStar />} tone="#FEF3C7" color="#92400E" />
        <MetricCard label="Coletas finalizadas" value={data.resumo.totalFinalizadas} detail="aptas para avaliacao" icon={<IconCheck />} tone="#DCFCE7" color="#166534" />
        <MetricCard label="Satisfacao" value={`${satisfaction}%`} detail="notas 4 e 5" icon={<IconThumb />} tone="#DBEAFE" color="#1E40AF" />
        <MetricCard label="Aguardando nota" value={data.resumo.aguardandoAvaliacao} detail="coletas sem avaliacao" icon={<IconClock />} tone="#F3E8FF" color="#6B21A8" />
      </section>

      <section className="empresa-main-grid">
        <div className="empresa-panel" style={{ display: "grid", gap: 16 }}>
          <div className="empresa-panel-header" style={{ marginBottom: 0 }}>
            <div>
              <h2>Historico de avaliacoes</h2>
              <p style={{ color: "var(--color-gray-500)", fontSize: 12, marginTop: 4 }}>
                {filtered.length} coleta{filtered.length === 1 ? "" : "s"} encontrada{filtered.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="empresa-panel-actions" style={{ flexWrap: "wrap" }}>
              <label className="sr-only" htmlFor="rating-filter">Filtrar avaliacoes</label>
              <select id="rating-filter" value={filter} onChange={(event) => setFilter(event.target.value as RatingFilter)}>
                {FILTERS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>

              <label className="sr-only" htmlFor="rating-sort">Ordenar avaliacoes</label>
              <select id="rating-sort" value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>
                {SORTS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div style={{ display: "grid", gap: 12 }}>
                {paginated.map((item) => (
                  <ReviewCard key={item.id} item={item} />
                ))}
              </div>

              {filtered.length > PAGE_SIZE ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                  <span style={{ color: "var(--color-gray-500)", fontSize: 12 }}>
                    Mostrando {rangeStart}-{rangeEnd} de {filtered.length}
                  </span>
                  <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
                </div>
              ) : null}
            </>
          )}
        </div>

        <aside className="empresa-side-stack">
          <section className="empresa-panel">
            <h2>Distribuicao das notas</h2>
            <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
              {[5, 4, 3, 2, 1].map((nota) => {
                const count = data.resumo.distribuicao[nota] ?? 0;
                const percent = data.resumo.totalAvaliacoes > 0 ? Math.round((count / data.resumo.totalAvaliacoes) * 100) : 0;
                return (
                  <div key={nota} className="rating-row" style={{ gridTemplateColumns: "82px 34px minmax(0, 1fr)" }}>
                    <span>{nota} estrela{nota === 1 ? "" : "s"}</span>
                    <strong>{count}</strong>
                    <div><i style={{ width: `${percent}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="empresa-panel" style={{ display: "grid", gap: 12 }}>
            <h2>Comprovantes</h2>
            <div style={{
              border: "1px dashed var(--color-border)",
              borderRadius: 10,
              padding: 14,
              background: "var(--color-surface-alt)",
              color: "var(--color-gray-500)",
              fontSize: 13,
              lineHeight: 1.55,
            }}>
              A tela ja reserva esse ponto para comprovantes de coleta. Upload, visualizacao e validacao ficam para uma etapa futura.
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone,
  color,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
  tone: string;
  color: string;
}) {
  return (
    <article className="empresa-kpi-card">
      <span className="empresa-kpi-icon" style={{ background: tone, color }}>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function ReviewCard({ item }: { item: AvaliacoesEmpresaData["coletas"][number] }) {
  const avaliacao = item.avaliacao;
  const date = avaliacao?.createdAt ?? item.dataConclusao ?? item.dataAceite;

  return (
    <article
      style={{
        display: "grid",
        gap: 12,
        padding: 16,
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        background: "var(--color-surface)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h3 style={{ color: "var(--color-gray-900)", fontSize: 15, fontWeight: 600 }}>{item.solicitacao.titulo}</h3>
            <span className="empresa-status empresa-status-concluida">Finalizada</span>
            {!avaliacao ? <span className="empresa-status empresa-status-pendente">Aguardando avaliacao</span> : null}
          </div>
          <p style={{ color: "var(--color-gray-500)", fontSize: 12, marginTop: 4 }}>
            Coleta #{item.id} - {item.solicitacao.materialNome} - {item.solicitacao.quantidade}
          </p>
        </div>

        {avaliacao ? (
          <div style={{ display: "grid", justifyItems: "end", gap: 3 }}>
            <RatingStars mode="display" value={avaliacao.nota} size={18} />
            <span style={{ color: "var(--color-gray-500)", fontSize: 12 }}>
              {new Date(date).toLocaleDateString("pt-BR")}
            </span>
          </div>
        ) : null}
      </div>

      <div style={{
        borderRadius: 10,
        background: avaliacao ? "var(--color-surface-alt)" : "#FEF9C3",
        color: avaliacao ? "var(--color-gray-700)" : "#854D0E",
        padding: 12,
        fontSize: 13,
        lineHeight: 1.55,
      }}>
        {avaliacao ? (
          avaliacao.comentario?.trim() ? (
            <p>&quot;{avaliacao.comentario}&quot;</p>
          ) : (
            <p>O solicitante avaliou esta coleta, mas nao deixou comentario.</p>
          )
        ) : (
          <p>Esta coleta foi finalizada e ainda nao recebeu avaliacao do solicitante.</p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <Info label="Avaliador" value={avaliacao?.autorNome ?? item.solicitacao.solicitanteNome} />
        <Info label="Conclusao" value={item.dataConclusao ? new Date(item.dataConclusao).toLocaleDateString("pt-BR") : "Data nao informada"} />
        <Info label="Endereco" value={item.solicitacao.endereco} />
        <Info label="Comprovante" value="Previsto para etapa futura" />
      </div>

      <Link className="empresa-row-outline" href={`/empresa/coletas/${item.id}`} style={{ width: "fit-content", padding: "6px 12px", borderRadius: 8 }}>
        Ver detalhes
      </Link>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ color: "var(--color-gray-500)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</p>
      <p style={{ color: "var(--color-gray-900)", fontSize: 13, marginTop: 2 }}>{value}</p>
    </div>
  );
}

function getPageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("ellipsis");
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < total - 1) pages.push("ellipsis");
  pages.push(total);

  return pages;
}

function PageButton({
  children,
  onClick,
  disabled,
  active,
  ariaLabel,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      style={{
        minWidth: 34,
        height: 34,
        padding: "0 10px",
        borderRadius: 8,
        border: "1px solid var(--color-border)",
        background: active ? "var(--color-primary-600)" : "var(--color-surface)",
        color: active ? "#fff" : "var(--color-gray-700)",
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginação das avaliações"
      style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}
    >
      <PageButton ariaLabel="Página anterior" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ‹
      </PageButton>

      {getPageWindow(page, totalPages).map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} style={{ color: "var(--color-gray-500)", padding: "0 2px" }}>
            …
          </span>
        ) : (
          <PageButton
            key={item}
            ariaLabel={`Página ${item}`}
            active={item === page}
            onClick={() => onChange(item)}
          >
            {item}
          </PageButton>
        )
      )}

      <PageButton
        ariaLabel="Próxima página"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        ›
      </PageButton>
    </nav>
  );
}

function EmptyState() {
  return (
    <div className="empresa-empty-state">
      <IconStar />
      <strong>Nenhuma avaliacao encontrada</strong>
      <p>Ajuste os filtros ou aguarde novas coletas finalizadas receberem nota.</p>
    </div>
  );
}

function IconStar() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9 6.6 19.8l1-6.1-4.4-4.3 6.1-.9Z" /></svg>; }
function IconCheck() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-5" /></svg>; }
function IconThumb() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 11v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Z" /><path d="M7 11 12 2a3 3 0 0 1 3 3v4h4a2 2 0 0 1 2 2l-1 7a3 3 0 0 1-3 3H7" /></svg>; }
function IconClock() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>; }
