import { STATUS_COLETA_COLOR, STATUS_COLETA_LABEL, STATUS_SOLICITACAO_COLOR, STATUS_SOLICITACAO_LABEL } from "@/types";

export function SolicitacaoBadge({ status }: { status: string }) {
  const color = STATUS_SOLICITACAO_COLOR[status] ?? "bg-gray-100 text-gray-700";
  const label = STATUS_SOLICITACAO_LABEL[status] ?? status;
  return <span className={`badge ${color}`}>{label}</span>;
}

export function ColetaBadge({ status }: { status: string }) {
  const color = STATUS_COLETA_COLOR[status] ?? "bg-gray-100 text-gray-700";
  const label = STATUS_COLETA_LABEL[status] ?? status;
  return <span className={`badge ${color}`}>{label}</span>;
}