"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "", email: "", senha: "", telefone: "", endereco: "",
    tipo: "usuario", cnpj: "", descricao: "",
  });
  const [erros, setErros] = useState<Record<string, string[]>>({});
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setErros({});
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (typeof data.error === "object") {
        setErros(data.error);
      } else {
        setErro(data.error ?? "Erro ao criar conta.");
      }
      return;
    }

    router.push("/login?registered=1");
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Criar conta</h2>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de conta</label>
          <select className="input-field" {...field("tipo")}>
            <option value="usuario">Cidadão / Usuário</option>
            <option value="empresa">Empresa de Reciclagem</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
          <input type="text" required className="input-field" {...field("nome")} />
          {erros.nome && <p className="text-red-500 text-xs mt-1">{erros.nome[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" required className="input-field" {...field("email")} />
          {erros.email && <p className="text-red-500 text-xs mt-1">{erros.email[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
          <input type="password" required className="input-field" {...field("senha")} />
          {erros.senha && <p className="text-red-500 text-xs mt-1">{erros.senha[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input type="text" className="input-field" {...field("telefone")} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
          <input type="text" className="input-field" {...field("endereco")} />
        </div>

        {form.tipo === "empresa" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <input type="text" required className="input-field" placeholder="00.000.000/0000-00" {...field("cnpj")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição da empresa</label>
              <textarea
                className="input-field"
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
          </>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Já tem conta?{" "}
        <Link href="/login" className="text-green-600 hover:underline font-medium">
          Entrar
        </Link>
      </p>
    </>
  );
}
