"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface MaterialTipo {
  id: number;
  nome: string;
}

export default function NovaSolicitacaoPage() {
  const router = useRouter();
  const [materiais, setMateriais] = useState<MaterialTipo[]>([]);
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    quantidade: "",
    endereco: "",
    materialId: "",
    imagens: "",
  });
  const [erros, setErros] = useState<Record<string, string[]>>({});
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/materiais")
      .then((r) => r.json())
      .then(setMateriais);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setErros({});
    setLoading(true);

    // Processa URLs de imagens (separadas por vírgula ou nova linha)
    const imagens = form.imagens
      .split(/[\n,]/)
      .map((u) => u.trim())
      .filter(Boolean);

    const res = await fetch("/api/solicitacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        materialId: Number(form.materialId),
        imagens,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (typeof data.error === "object") setErros(data.error);
      else setErro(data.error ?? "Erro ao criar solicitação.");
      return;
    }

    router.push(`/dashboard/solicitacoes/${data.id}`);
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nova Solicitação de Coleta</h1>
        <p className="text-gray-500 text-sm mt-1">
          Preencha os dados do material que deseja reciclar.
        </p>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="input-field"
            placeholder="Ex: Papelão para reciclagem"
            {...field("titulo")}
          />
          {erros.titulo && (
            <p className="text-red-500 text-xs mt-1">{erros.titulo[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Material <span className="text-red-500">*</span>
          </label>
          <select required className="input-field" {...field("materialId")}>
            <option value="">Selecione...</option>
            {materiais.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
          {erros.materialId && (
            <p className="text-red-500 text-xs mt-1">{erros.materialId[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="input-field"
            placeholder="Ex: 5 sacos, ~10kg, 2 caixas"
            {...field("quantidade")}
          />
          {erros.quantidade && (
            <p className="text-red-500 text-xs mt-1">{erros.quantidade[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Endereço para coleta <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="input-field"
            placeholder="Rua, número, bairro, cidade"
            {...field("endereco")}
          />
          {erros.endereco && (
            <p className="text-red-500 text-xs mt-1">{erros.endereco[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            className="input-field"
            placeholder="Descreva o material, condições, informações relevantes..."
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
          {erros.descricao && (
            <p className="text-red-500 text-xs mt-1">{erros.descricao[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URLs de Imagens{" "}
            <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            rows={3}
            className="input-field"
            placeholder="Cole URLs de imagens, uma por linha ou separadas por vírgula"
            value={form.imagens}
            onChange={(e) => setForm({ ...form, imagens: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1">
            Ex: https://exemplo.com/foto.jpg
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Enviando..." : "Criar Solicitação"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
