"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

interface Props {
  search: string;
  status: string;
  materialId: string;
  dataInicio: string;
  dataFim: string;
  materiais: { id: number; nome: string }[];
}

const STATUS_OPTIONS = [
  { value: "",          label: "Todos os status" },
  { value: "pendente",  label: "Pendente"         },
  { value: "aprovada",  label: "Aprovada"          },
  { value: "rejeitada", label: "Rejeitada"         },
  { value: "cancelada", label: "Cancelada"         },
];

export function AdminSolicitacoesFilters({ search, status, materialId, dataInicio, dataFim, materiais }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const debounceRef  = useRef<ReturnType<typeof setTimeout>>();

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  const handleSearch = (value: string) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update("search", value), 450);
  };

  return (
    <div style={{ display: "flex", gap: ".65rem", flexWrap: "wrap", marginBottom: "1rem" }}>
      <input
        type="search"
        defaultValue={search}
        placeholder="Buscar por título..."
        className="input-field"
        style={{ flex: 1, minWidth: 200, fontSize: ".875rem" }}
        onChange={(e) => handleSearch(e.target.value)}
      />

      <select
        value={status}
        onChange={e => update("status", e.target.value)}
        className="input-field"
        style={{ width: "auto", minWidth: 155, fontSize: ".875rem" }}
      >
        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select
        value={materialId}
        onChange={e => update("materialId", e.target.value)}
        className="input-field"
        style={{ width: "auto", minWidth: 155, fontSize: ".875rem" }}
      >
        <option value="">Todos os materiais</option>
        {materiais.map(m => <option key={m.id} value={String(m.id)}>{m.nome}</option>)}
      </select>

      <input
        type="date"
        value={dataInicio}
        onChange={e => update("dataInicio", e.target.value)}
        className="input-field"
        style={{ width: "auto", fontSize: ".875rem" }}
        aria-label="Data início"
      />

      <input
        type="date"
        value={dataFim}
        onChange={e => update("dataFim", e.target.value)}
        className="input-field"
        style={{ width: "auto", fontSize: ".875rem" }}
        aria-label="Data fim"
      />

      {(search || status || materialId || dataInicio || dataFim) && (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push(pathname)}
          style={{ fontSize: ".82rem", color: "var(--text-faint)" }}
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
