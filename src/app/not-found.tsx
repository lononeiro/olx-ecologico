import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
      <div className="text-center">
        <div className="mb-4 text-6xl">404</div>
        <h1 className="mb-2 text-4xl font-bold text-gray-800 dark:text-zinc-100">Pagina nao encontrada</h1>
        <p className="mb-6 text-gray-500 dark:text-zinc-400">
          O conteudo que voce tentou abrir nao existe ou mudou de endereco.
        </p>
        <Link href="/" className="btn btn-primary">
          Voltar ao inicio
        </Link>
      </div>
    </div>
  );
}
