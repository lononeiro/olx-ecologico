import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <div className="text-6xl mb-4">♻️</div>
        <h1 className="text-4xl font-bold text-green-800 mb-3">ReciclaFácil</h1>
        <p className="text-gray-600 text-lg mb-10">
          Conectando cidadãos e empresas de reciclagem para um futuro mais sustentável.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login" className="btn-primary text-center py-3 px-8 text-base">
            Entrar
          </Link>
          <Link href="/register" className="btn-secondary text-center py-3 px-8 text-base">
            Criar conta
          </Link>
        </div>
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          {[
            { icon: "📦", title: "Solicite a Coleta", desc: "Cadastre seus materiais e aguarde a aprovação." },
            { icon: "✅", title: "Aprovação Ágil", desc: "Nosso time valida e aprova sua solicitação rapidamente." },
            { icon: "🚛", title: "Coleta Garantida", desc: "Empresas parceiras vêm até você retirar os materiais." },
          ].map((item) => (
            <div key={item.title} className="card">
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
