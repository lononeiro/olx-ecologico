"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Props { search: string; status: string; }

const STATUS_OPTIONS = [
  { value: "",          label: "Todos os status" },
  { value: "pendente",  label: "Pendente"         },
  { value: "aprovada",  label: "Aprovada"          },
  { value: "rejeitada", label: "Rejeitada"         },
];

export function AdminSolicitacoesFilters({ search, status }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  return (
    <div style={{ display: "flex", gap: ".65rem", flexWrap: "wrap", marginBottom: "1rem" }}>
      <form
        onSubmit={e => { e.preventDefault(); update("search", (e.currentTarget.elements.namedItem("search") as HTMLInputElement).value); }}
        style={{ flex: 1, minWidth: 200, display: "flex", gap: ".5rem" }}
      >
        <input
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Buscar por titulo, solicitante ou e-mail..."
          className="input-field"
          style={{ flex: 1, fontSize: ".875rem" }}
        />
        <button type="submit" className="btn btn-ghost" style={{ flexShrink: 0, fontSize: ".82rem" }}>Buscar</button>
      </form>

      <select
        value={status}
        onChange={e => update("status", e.target.value)}
        className="input-field"
        style={{ width: "auto", minWidth: 160, fontSize: ".875rem" }}
      >
        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
