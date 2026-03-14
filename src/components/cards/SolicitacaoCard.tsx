import Link from "next/link";
import { SolicitacaoBadge, ColetaBadge } from "@/components/ui/StatusBadge";

interface Props {
  solicitacao: {
    id: number;
    titulo: string;
    quantidade: string;
    endereco: string;
    status: string;
    createdAt: string | Date;
    material: { nome: string };
    imagens: { id: number; url: string }[];
    coleta?: { status: string } | null;
  };
  href?: string;
  actions?: React.ReactNode;
}

export function SolicitacaoCard({ solicitacao: s, href, actions }: Props) {
  const wrapper = href ? Link : "div";
  const WrapperTag = href ? Link : "div";

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {href ? (
              <Link href={href} className="font-semibold text-gray-800 hover:text-green-700 truncate">
                {s.titulo}
              </Link>
            ) : (
              <span className="font-semibold text-gray-800 truncate">{s.titulo}</span>
            )}
            <SolicitacaoBadge status={s.status} />
            {s.coleta && <ColetaBadge status={s.coleta.status} />}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
            <span>📦 {s.material.nome}</span>
            <span>⚖️ {s.quantidade}</span>
            <span className="truncate">📍 {s.endereco}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(s.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "short", year: "numeric"
            })}
          </p>
        </div>
        {s.imagens[0] && (
          <img
            src={s.imagens[0].url}
            alt="imagem"
            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
          />
        )}
      </div>
      {actions && <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">{actions}</div>}
    </div>
  );
}
