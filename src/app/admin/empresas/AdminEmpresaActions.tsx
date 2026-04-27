"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  companyId: number;
  currentStatus: string;
}

export function AdminEmpresaActions({ companyId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState("");

  async function toggleStatus() {
    const newStatus = currentStatus === "ativo" ? "inativo" : "ativo";
    setLoading(true);
    setErro("");
    const res = await fetch(`/api/admin/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      setErro(data.error ?? "Erro ao atualizar");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
      <button
        onClick={toggleStatus}
        disabled={loading}
        className="btn btn-ghost"
        style={{ fontSize: ".74rem", padding: ".28rem .6rem" }}
      >
        {loading ? "..." : currentStatus === "ativo" ? "Desativar" : "Ativar"}
      </button>
      {erro && <p style={{ fontSize: ".7rem", color: "var(--red)", lineHeight: 1.3 }}>{erro}</p>}
    </div>
  );
}
