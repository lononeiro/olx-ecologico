"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Material {
  id: number;
  nome: string;
  _count: { solicitacoes: number };
}

interface Props {
  initialMateriais: Material[];
}

const materialBadge = (nome: string) => {
  const v = nome.toLowerCase();
  if (v.includes("papel")) return "PA";
  if (v.includes("plast")) return "PL";
  if (v.includes("metal") || v.includes("alumin")) return "MT";
  if (v.includes("vidro")) return "VD";
  if (v.includes("eletr") || v.includes("e-lixo")) return "EL";
  if (v.includes("organ")) return "OR";
  if (v.includes("text")) return "TX";
  if (v.includes("oleo")) return "OL";
  if (v.includes("madeira")) return "MD";
  if (v.includes("borracha") || v.includes("pneu")) return "BR";
  return "EC";
};

export function AdminMateriaisClient({ initialMateriais }: Props) {
  const router = useRouter();
  const [materiais, setMateriais] = useState<Material[]>(initialMateriais);
  const [novoNome, setNovoNome] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addErro, setAddErro] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editErro, setEditErro] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErro, setDeleteErro] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddErro("");
    if (!novoNome.trim()) { setAddErro("Informe o nome do material"); return; }
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/materiais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setAddErro(data.error ?? "Erro ao adicionar"); return; }
      setMateriais(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNovoNome("");
      addInputRef.current?.focus();
      router.refresh();
    } catch {
      setAddErro("Erro de conexao. Tente novamente.");
    } finally {
      setAddLoading(false);
    }
  }

  function startEdit(m: Material) {
    setEditingId(m.id);
    setEditNome(m.nome);
    setEditErro("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNome("");
    setEditErro("");
  }

  async function handleEdit(id: number) {
    setEditErro("");
    if (!editNome.trim()) { setEditErro("Nome nao pode ser vazio"); return; }
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/materiais/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: editNome.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setEditErro(data.error ?? "Erro ao renomear"); return; }
      setMateriais(prev =>
        prev.map(m => m.id === id ? { ...m, nome: data.nome } : m)
          .sort((a, b) => a.nome.localeCompare(b.nome))
      );
      cancelEdit();
      router.refresh();
    } catch {
      setEditErro("Erro de conexao. Tente novamente.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(m: Material) {
    if (m._count.solicitacoes > 0) return;
    setDeleteErro("");
    setDeleteId(m.id);
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/materiais/${m.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setDeleteErro(data.error ?? "Erro ao excluir"); return; }
      setMateriais(prev => prev.filter(item => item.id !== m.id));
      router.refresh();
    } catch {
      setDeleteErro("Erro de conexao. Tente novamente.");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Add form */}
      <div className="card" style={{ marginBottom: "1.25rem", padding: "1.25rem" }}>
        <p className="section-label" style={{ marginBottom: ".6rem" }}>Novo material</p>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: ".65rem", flexWrap: "wrap" }}>
          <input
            ref={addInputRef}
            type="text"
            value={novoNome}
            onChange={e => { setNovoNome(e.target.value); setAddErro(""); }}
            placeholder="Ex: Papel e Papelao"
            className="input-field"
            style={{ flex: 1, minWidth: 200, fontSize: ".88rem" }}
            maxLength={80}
            disabled={addLoading}
          />
          <button type="submit" className="btn btn-primary" disabled={addLoading} style={{ flexShrink: 0, fontSize: ".82rem" }}>
            {addLoading ? "Adicionando..." : "+ Adicionar"}
          </button>
        </form>
        {addErro && (
          <p style={{ fontSize: ".8rem", color: "var(--red)", marginTop: ".5rem" }}>{addErro}</p>
        )}
      </div>

      {deleteErro && (
        <div className="card" style={{ marginBottom: "1rem", padding: ".85rem 1rem", background: "var(--red-light)", borderColor: "rgba(184,50,40,.18)", color: "var(--red)", fontSize: ".85rem" }}>
          {deleteErro}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p className="section-label">Tipos cadastrados</p>
            <h2 style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--text)" }}>
              {materiais.length} material{materiais.length !== 1 ? "is" : ""}
            </h2>
          </div>
        </div>

        {materiais.length === 0 ? (
          <div className="empty-state" style={{ padding: "3rem 2rem" }}>
            <p style={{ fontWeight: 700, color: "var(--text)", marginBottom: ".25rem" }}>Nenhum material cadastrado</p>
            <p style={{ fontSize: ".85rem", color: "var(--text-muted)" }}>Adicione o primeiro tipo acima.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {["Material", "Solicitacoes", "Acoes"].map(h => (
                    <th key={h} style={{ padding: ".55rem 1rem", textAlign: "left", fontSize: ".68rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-faint)", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materiais.map((m, i) => (
                  <tr key={m.id} style={{ borderBottom: i < materiais.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: ".7rem 1rem", minWidth: 260 }}>
                      {editingId === m.id ? (
                        <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
                          <input
                            autoFocus
                            type="text"
                            value={editNome}
                            onChange={e => { setEditNome(e.target.value); setEditErro(""); }}
                            className="input-field"
                            style={{ fontSize: ".85rem", padding: ".4rem .7rem", minWidth: 160 }}
                            maxLength={80}
                            disabled={editLoading}
                            onKeyDown={e => { if (e.key === "Escape") cancelEdit(); if (e.key === "Enter") { e.preventDefault(); handleEdit(m.id); } }}
                          />
                          <button onClick={() => handleEdit(m.id)} disabled={editLoading} className="btn btn-primary" style={{ fontSize: ".75rem", padding: ".3rem .65rem" }}>
                            {editLoading ? "..." : "Salvar"}
                          </button>
                          <button onClick={cancelEdit} disabled={editLoading} className="btn btn-ghost" style={{ fontSize: ".75rem", padding: ".3rem .65rem" }}>
                            Cancelar
                          </button>
                          {editErro && <span style={{ fontSize: ".78rem", color: "var(--red)" }}>{editErro}</span>}
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: ".65rem" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                            background: "linear-gradient(135deg, var(--green), var(--green-mid))",
                            color: "#fff", fontSize: ".65rem", fontWeight: 800, letterSpacing: ".5px",
                          }}>
                            {materialBadge(m.nome)}
                          </span>
                          <span style={{ fontSize: ".9rem", fontWeight: 600, color: "var(--text)" }}>{m.nome}</span>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: ".7rem 1rem", whiteSpace: "nowrap" }}>
                      <span style={{
                        fontSize: ".78rem", fontWeight: 700,
                        color: m._count.solicitacoes > 0 ? "var(--blue)" : "var(--text-faint)",
                      }}>
                        {m._count.solicitacoes} {m._count.solicitacoes === 1 ? "solicitacao" : "solicitacoes"}
                      </span>
                    </td>

                    <td style={{ padding: ".7rem 1rem", whiteSpace: "nowrap" }}>
                      {editingId !== m.id && (
                        <div style={{ display: "flex", gap: ".4rem" }}>
                          <button
                            onClick={() => startEdit(m)}
                            className="btn btn-ghost"
                            style={{ fontSize: ".74rem", padding: ".28rem .6rem" }}
                          >
                            Renomear
                          </button>
                          <button
                            onClick={() => handleDelete(m)}
                            disabled={m._count.solicitacoes > 0 || (deleteLoading && deleteId === m.id)}
                            className="btn btn-ghost"
                            title={m._count.solicitacoes > 0 ? "Nao e possivel excluir: ha solicitacoes vinculadas" : "Excluir material"}
                            style={{
                              fontSize: ".74rem", padding: ".28rem .6rem",
                              color: m._count.solicitacoes > 0 ? "var(--text-faint)" : "var(--red)",
                              borderColor: m._count.solicitacoes > 0 ? "var(--border)" : "rgba(184,50,40,.25)",
                              cursor: m._count.solicitacoes > 0 ? "not-allowed" : "pointer",
                              opacity: m._count.solicitacoes > 0 ? 0.5 : 1,
                            }}
                          >
                            {deleteLoading && deleteId === m.id ? "..." : "Excluir"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <p style={{ fontSize: ".75rem", color: "var(--text-faint)", marginTop: ".85rem", textAlign: "center" }}>
        Materiais vinculados a solicitacoes nao podem ser excluidos.
      </p>
    </div>
  );
}
