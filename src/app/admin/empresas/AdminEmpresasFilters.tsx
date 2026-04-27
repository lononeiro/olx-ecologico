"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Props { search: string; }

export function AdminEmpresasFilters({ search }: Props) {
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
    <div style={{ display: "flex", gap: ".65rem", marginBottom: "1rem" }}>
      <form
        onSubmit={e => { e.preventDefault(); update("search", (e.currentTarget.elements.namedItem("search") as HTMLInputElement).value); }}
        style={{ flex: 1, display: "flex", gap: ".5rem" }}
      >
        <input
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Buscar por nome, e-mail ou CNPJ..."
          className="input-field"
          style={{ flex: 1, fontSize: ".875rem" }}
        />
        <button type="submit" className="btn btn-ghost" style={{ flexShrink: 0, fontSize: ".82rem" }}>Buscar</button>
      </form>
    </div>
  );
}
