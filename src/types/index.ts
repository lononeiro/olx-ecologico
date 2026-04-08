import { User, Role, Company, SolicitacaoColeta, Coleta, Mensagem, MaterialTipo } from "@prisma/client";
import {
  STATUS_COLETA_COLOR,
  STATUS_COLETA_LABEL,
  STATUS_SOLICITACAO_COLOR,
  STATUS_SOLICITACAO_LABEL,
  type StatusColeta,
  type StatusSolicitacao,
} from "@shared";

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

export type { StatusColeta, StatusSolicitacao };

export {
  STATUS_COLETA_COLOR,
  STATUS_COLETA_LABEL,
  STATUS_SOLICITACAO_COLOR,
  STATUS_SOLICITACAO_LABEL,
};
