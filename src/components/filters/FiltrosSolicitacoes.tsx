"use client";

import { useCallback, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface FiltrosSolicitacoesProps {
  statusAtual?: string;
  materialIdAtual?: string;
  dataInicioAtual?: string;
  dataFimAtual?: string;
  buscaAtual?: string;
  materiais: { id: number; nome: string }[];
  mostrarStatus?: boolean;
  mostrarBusca?: boolean;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "pendente", label: "Pendente" },
  { value: "aprovada", label: "Aprovada" },
  { value: "rejeitada", label: "Rejeitada" },
  { value: "cancelada", label: "Cancelada" },
];

export function FiltrosSolicitacoes({
  statusAtual = "",
  materialIdAtual = "",
  dataInicioAtual = "",
  dataFimAtual = "",
  buscaAtual = "",
  materiais,
  mostrarStatus = true,
  mostrarBusca = false,
}: FiltrosSolicitacoesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const handleBusca = (value: string) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update("q", value), 450);
  };

  const temFiltro = statusAtual || materialIdAtual || dataInicioAtual || dataFimAtual || buscaAtual;

  return (
    <div style={{
      display: "flex",
      gap: ".65rem",
      flexWrap: "wrap",
      alignItems: "center",
      marginBottom: "1rem",
      padding: ".75rem 1rem",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
    }}>
      {mostrarBusca && (
        <input
          type="search"
          defaultValue={buscaAtual}
          placeholder="Buscar por título ou endereço..."
          className="input-field"
          style={{ flex: 1, minWidth: 200, fontSize: ".875rem" }}
          onChange={(e) => handleBusca(e.target.value)}
        />
      )}

      {mostrarStatus && (
        <select
          value={statusAtual}
          onChange={(e) => update("status", e.target.value)}
          className="input-field"
          style={{ width: "auto", minWidth: 155, fontSize: ".875rem" }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      <select
        value={materialIdAtual}
        onChange={(e) => update("materialId", e.target.value)}
        className="input-field"
        style={{ width: "auto", minWidth: 155, fontSize: ".875rem" }}
      >
        <option value="">Todos os materiais</option>
        {materiais.map((m) => (
          <option key={m.id} value={String(m.id)}>{m.nome}</option>
        ))}
      </select>

      <input
        type="date"
        value={dataInicioAtual}
        onChange={(e) => update("dataInicio", e.target.value)}
        className="input-field"
        style={{ width: "auto", fontSize: ".875rem" }}
        aria-label="Data início"
      />

      <input
        type="date"
        value={dataFimAtual}
        onChange={(e) => update("dataFim", e.target.value)}
        className="input-field"
        style={{ width: "auto", fontSize: ".875rem" }}
        aria-label="Data fim"
      />

      {temFiltro && (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push(pathname)}
          style={{ fontSize: ".82rem", color: "var(--text-faint)", flexShrink: 0 }}
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
