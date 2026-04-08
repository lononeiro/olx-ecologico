export const STATUS_SOLICITACAO = ["pendente", "aprovada", "rejeitada"] as const;
export const STATUS_COLETA = [
  "aceita",
  "a_caminho",
  "em_coleta",
  "concluida",
  "cancelada",
] as const;

export type StatusSolicitacao = (typeof STATUS_SOLICITACAO)[number];
export type StatusColeta = (typeof STATUS_COLETA)[number];

export const STATUS_COLETA_LABEL: Record<string, string> = {
  aceita: "Aceita",
  a_caminho: "A Caminho",
  em_coleta: "Em Coleta",
  concluida: "Concluida",
  cancelada: "Cancelada",
};

export const STATUS_SOLICITACAO_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
};

export const STATUS_COLETA_COLOR: Record<string, string> = {
  aceita: "badge-blue",
  a_caminho: "badge-yellow",
  em_coleta: "badge-purple",
  concluida: "badge-green",
  cancelada: "badge-red",
};

export const STATUS_SOLICITACAO_COLOR: Record<string, string> = {
  pendente: "badge-yellow",
  aprovada: "badge-green",
  rejeitada: "badge-red",
};
