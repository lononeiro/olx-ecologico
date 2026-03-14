"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", senha: "" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.senha,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setErro("Email ou senha inválidos.");
      return;
    }

    // Redireciona para o dashboard — o middleware cuidará do redirecionamento por role
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Entrar na plataforma</h2>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            className="input-field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
          <input
            type="password"
            required
            className="input-field"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            placeholder="••••••"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Não tem conta?{" "}
        <Link href="/register" className="text-green-600 hover:underline font-medium">
          Cadastre-se
        </Link>
      </p>
    </>
  );
}
