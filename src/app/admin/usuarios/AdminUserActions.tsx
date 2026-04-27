"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: number;
  currentStatus: string;
  userRole: string;
  solicitacoesCount: number;
}

export function AdminUserActions({ userId, currentStatus, userRole, solicitacoesCount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"status" | "delete" | null>(null);
  const [erro, setErro]       = useState("");

  const isAdmin = userRole === "admin";

  async function toggleStatus() {
    const newStatus = currentStatus === "ativo" ? "inativo" : "ativo";
    setLoading("status");
    setErro("");
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(null);
    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      setErro(data.error ?? "Erro ao atualizar");
    }
  }

  async function deleteUser() {
    if (!confirm("Excluir este usuario? Esta acao nao pode ser desfeita.")) return;
    setLoading("delete");
    setErro("");
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setLoading(null);
    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      setErro(data.error ?? "Erro ao excluir");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
      <div style={{ display: "flex", gap: ".35rem" }}>
        <button
          onClick={toggleStatus}
          disabled={loading !== null || isAdmin}
          className="btn btn-ghost"
          style={{ fontSize: ".74rem", padding: ".28rem .6rem" }}
          title={isAdmin ? "Nao e possivel alterar administradores" : undefined}
        >
          {loading === "status" ? "..." : currentStatus === "ativo" ? "Desativar" : "Ativar"}
        </button>
        {!isAdmin && solicitacoesCount === 0 && (
          <button
            onClick={deleteUser}
            disabled={loading !== null}
            className="btn btn-ghost"
            style={{ fontSize: ".74rem", padding: ".28rem .6rem", color: "var(--red)" }}
          >
            {loading === "delete" ? "..." : "Excluir"}
          </button>
        )}
      </div>
      {erro && <p style={{ fontSize: ".7rem", color: "var(--red)", lineHeight: 1.3 }}>{erro}</p>}
    </div>
  );
}
