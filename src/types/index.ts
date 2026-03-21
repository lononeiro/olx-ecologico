import { User, Role, Company, SolicitacaoColeta, Coleta, Mensagem, MaterialTipo } from "@prisma/client";

export type UserWithRole = User & { role: Role };
export type UserWithCompany = User & { role: Role; company: Company | null };

export type SolicitacaoWithRelations = SolicitacaoColeta & {
  user: Pick<User, "id" | "nome" | "email">;
  material: MaterialTipo;
  imagens: { id: number; url: string }[];
  coleta: Coleta | null;
};

export type ColetaWithRelations = Coleta & {
  solicitacao: SolicitacaoWithRelations;
  company: Company & { user: Pick<User, "id" | "nome" | "email"> };
  mensagens: (Mensagem & {
    remetente: Pick<User, "id" | "nome">;
  })[];
};

export type StatusColeta = "aceita" | "a_caminho" | "em_coleta" | "concluida" | "cancelada";
export type StatusSolicitacao = "pendente" | "aprovada" | "rejeitada";

export const STATUS_COLETA_LABEL: Record<string, string> = {
  aceita:    "Aceita",
  a_caminho: "A Caminho",
  em_coleta: "Em Coleta",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const STATUS_SOLICITACAO_LABEL: Record<string, string> = {
  pendente:  "Pendente",
  aprovada:  "Aprovada",
  rejeitada: "Rejeitada",
};

export const STATUS_COLETA_COLOR: Record<string, string> = {
  aceita:    "badge-blue",
  a_caminho: "badge-yellow",
  em_coleta: "badge-purple",
  concluida: "badge-green",
  cancelada: "badge-red",
};

export const STATUS_SOLICITACAO_COLOR: Record<string, string> = {
  pendente:  "badge-yellow",
  aprovada:  "badge-green",
  rejeitada: "badge-red",
};