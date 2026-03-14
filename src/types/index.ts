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

export type StatusColeta =
  | "aceita"
  | "a_caminho"
  | "em_coleta"
  | "concluida"
  | "cancelada";

export type StatusSolicitacao = "pendente" | "aprovada" | "rejeitada";

export const STATUS_COLETA_LABEL: Record<string, string> = {
  aceita: "Aceita",
  a_caminho: "A Caminho",
  em_coleta: "Em Coleta",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const STATUS_SOLICITACAO_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
};

export const STATUS_COLETA_COLOR: Record<string, string> = {
  aceita: "bg-blue-100 text-blue-800",
  a_caminho: "bg-yellow-100 text-yellow-800",
  em_coleta: "bg-purple-100 text-purple-800",
  concluida: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
};

export const STATUS_SOLICITACAO_COLOR: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  aprovada: "bg-green-100 text-green-800",
  rejeitada: "bg-red-100 text-red-800",
};
