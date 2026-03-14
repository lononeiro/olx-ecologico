import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
        <p className="text-gray-500 mb-6">Página não encontrada.</p>
        <Link href="/" className="btn-primary">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
