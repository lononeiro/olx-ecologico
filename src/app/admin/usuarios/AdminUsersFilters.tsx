"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Props {
  search: string;
  role: string;
  status: string;
}

export function AdminUsersFilters({ search, role, status }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
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
          placeholder="Buscar por nome ou e-mail..."
          className="input-field"
          style={{ flex: 1, fontSize: ".875rem" }}
        />
        <button type="submit" className="btn btn-ghost" style={{ flexShrink: 0, fontSize: ".82rem" }}>Buscar</button>
      </form>

      <select
        value={role}
        onChange={e => update("role", e.target.value)}
        className="input-field"
        style={{ width: "auto", minWidth: 140, fontSize: ".875rem" }}
      >
        <option value="">Todos os perfis</option>
        <option value="usuario">Cidadao</option>
        <option value="empresa">Empresa</option>
        <option value="admin">Administrador</option>
      </select>

      <select
        value={status}
        onChange={e => update("status", e.target.value)}
        className="input-field"
        style={{ width: "auto", minWidth: 130, fontSize: ".875rem" }}
      >
        <option value="">Todos os status</option>
        <option value="ativo">Ativo</option>
        <option value="inativo">Inativo</option>
      </select>
    </div>
  );
}
